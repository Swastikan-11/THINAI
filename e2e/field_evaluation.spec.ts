import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const MANIFEST_PATH = path.resolve("data/held_out_field_test/manifest.json");
const OUTPUT_RESULTS_PATH = path.resolve("results/real_field_evaluation.json");

test.describe("Real Held-Out Field Test Evaluation (Gate G4 Audit)", () => {
  test("Evaluates empirical accuracy, macro-F1, ECE, and confusion matrix on 128 real field images", async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for 128 neural model evaluations

    expect(fs.existsSync(MANIFEST_PATH)).toBeTruthy();
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    expect(manifest.length).toBeGreaterThanOrEqual(100);

    page.on('console', msg => {
      console.log(`[Browser ${msg.type().toUpperCase()}]:`, msg.text());
    });

    // Navigate to initialize app and LiteRT WASM model
    await page.goto("/?screen=doctor");
    await page.waitForTimeout(2000);

    // Warm up the LiteRT WASM runtime
    const warmup = await page.evaluate(async () => {
      const bench = (window as any).__THINAI_BENCHMARK__;
      return await bench.measureInference();
    });
    console.log(`[Field Eval] LiteRT Warmup Inference: ${warmup.durationMs}ms, source: ${warmup.result?.source}`, warmup.result);

    const predictions: Array<{
      image_id: string;
      crop: string;
      ground_truth_class: string;
      predicted_class: string;
      raw_confidence: number;
      calibrated_confidence: number;
      tier: string;
      is_correct: boolean;
    }> = [];

    console.log(`[Field Eval] Running inference on ${manifest.length} held-out real field images...`);

    // Run inference sequentially on each field image
    for (let i = 0; i < manifest.length; i++) {
      const item = manifest[i];
      const imagePath = path.resolve("data/held_out_field_test", item.relative_path);
      const imageBuffer = fs.readFileSync(imagePath);
      const ext = path.extname(imagePath).toLowerCase().replace(".", "") || "jpeg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      const base64DataUrl = `data:${mime};base64,${imageBuffer.toString("base64")}`;

      const evalResult: any = await page.evaluate(
        async ({ url, crop }) => {
          const bench = (window as any).__THINAI_BENCHMARK__;
          return await bench.evaluateImageBase64(url, crop);
        },
        { url: base64DataUrl, crop: item.crop }
      );

      if (!evalResult) {
        console.warn(`  [Field Eval] Skipping unrenderable image: ${item.image_id} (${item.relative_path})`);
        continue;
      }

      // Best matching predicted class
      let predictedClass = "Unknown";
      if (evalResult.allProbabilities && evalResult.allProbabilities.length > 0) {
        predictedClass = evalResult.allProbabilities[0].label;
      }

      if (i < 5) {
        console.log(`  [Debug Image ${i + 1}] GT: "${item.ground_truth_class}" | Pred: "${predictedClass}" | Source: ${evalResult.source} | Tier: ${evalResult.tier}`);
      }

      // Check correctness (exact match)
      const isCorrect = predictedClass === item.ground_truth_class;

      predictions.push({
        image_id: item.image_id,
        crop: item.crop,
        ground_truth_class: item.ground_truth_class,
        predicted_class: predictedClass,
        raw_confidence: evalResult.rawConfidence || 0,
        calibrated_confidence: evalResult.calibratedConfidence || 0,
        tier: evalResult.tier || "TIER_3_INCONCLUSIVE",
        is_correct: isCorrect
      });

      if ((i + 1) % 25 === 0 || i === manifest.length - 1) {
        console.log(`  Processed [${i + 1}/${manifest.length}] field images...`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mathematical Evaluation: Accuracy, Macro-F1, ECE, Confusion Matrix
    // ─────────────────────────────────────────────────────────────────────────
    const totalSamples = predictions.length;
    const correctCount = predictions.filter((p) => p.is_correct).length;
    const overallAccuracy = correctCount / totalSamples;

    // Unique classes in ground truth
    const uniqueClasses = Array.from(new Set(predictions.map((p) => p.ground_truth_class))).sort();
    const uniqueCrops = Array.from(new Set(predictions.map((p) => p.crop))).sort();

    // Per-Crop Metrics
    const cropMetrics: Record<string, { total: number; correct: number; accuracy: number }> = {};
    for (const crop of uniqueCrops) {
      const subset = predictions.filter((p) => p.crop === crop);
      const cCorrect = subset.filter((p) => p.is_correct).length;
      cropMetrics[crop] = {
        total: subset.length,
        correct: cCorrect,
        accuracy: cCorrect / subset.length
      };
    }

    // Per-Class Metrics (Precision, Recall, F1)
    const classMetrics: Record<
      string,
      { support: number; tp: number; fp: number; fn: number; precision: number; recall: number; f1: number }
    > = {};

    for (const cls of uniqueClasses) {
      const tp = predictions.filter((p) => p.ground_truth_class === cls && p.predicted_class === cls).length;
      const fp = predictions.filter((p) => p.ground_truth_class !== cls && p.predicted_class === cls).length;
      const fn = predictions.filter((p) => p.ground_truth_class === cls && p.predicted_class !== cls).length;
      const support = predictions.filter((p) => p.ground_truth_class === cls).length;

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      classMetrics[cls] = { support, tp, fp, fn, precision, recall, f1 };
    }

    const macroF1 =
      uniqueClasses.reduce((sum, cls) => sum + classMetrics[cls].f1, 0) / uniqueClasses.length;

    // Expected Calibration Error (ECE) across 10 bins
    const numBins = 10;
    let ece = 0;
    const binSize = 1.0 / numBins;
    for (let b = 0; b < numBins; b++) {
      const binLower = b * binSize;
      const binUpper = (b + 1) * binSize;
      const inBin = predictions.filter((p) => {
        const conf01 = p.calibrated_confidence > 1.0 ? p.calibrated_confidence / 100 : p.calibrated_confidence;
        return conf01 > binLower && conf01 <= binUpper;
      });
      if (inBin.length > 0) {
        const binAcc = inBin.filter((p) => p.is_correct).length / inBin.length;
        const binConf = inBin.reduce((s, p) => {
          const conf01 = p.calibrated_confidence > 1.0 ? p.calibrated_confidence / 100 : p.calibrated_confidence;
          return s + conf01;
        }, 0) / inBin.length;
        ece += (inBin.length / totalSamples) * Math.abs(binAcc - binConf);
      }
    }

    // Construct Confusion Matrix
    const confusionMatrix: Record<string, Record<string, number>> = {};
    for (const trueCls of uniqueClasses) {
      confusionMatrix[trueCls] = {};
      for (const predCls of uniqueClasses) {
        confusionMatrix[trueCls][predCls] = 0;
      }
    }
    for (const p of predictions) {
      if (confusionMatrix[p.ground_truth_class] && confusionMatrix[p.ground_truth_class][p.predicted_class] !== undefined) {
        confusionMatrix[p.ground_truth_class][p.predicted_class]++;
      }
    }

    const report = {
      evaluation_date: new Date().toISOString(),
      dataset_name: "PlantDoc (Singh et al., ACM CoDS-COMAD 2020) - Indian Agrarian Field Conditions",
      license: "CC BY 4.0",
      total_field_samples: totalSamples,
      overall_accuracy: Number(overallAccuracy.toFixed(4)),
      macro_f1: Number(macroF1.toFixed(4)),
      expected_calibration_error_ece: Number(ece.toFixed(4)),
      per_crop_metrics: cropMetrics,
      per_class_metrics: classMetrics,
      confusion_matrix: confusionMatrix
    };

    fs.writeFileSync(OUTPUT_RESULTS_PATH, JSON.stringify(report, null, 2));
    console.log("\n=================================================");
    console.log("📊 REAL HELD-OUT FIELD TEST BENCHMARK RESULTS");
    console.log("=================================================");
    console.log(`Total Samples Evaluated: ${totalSamples}`);
    console.log(`Real Empirical Field Accuracy: ${(overallAccuracy * 100).toFixed(2)}%`);
    console.log(`Real Empirical Macro-F1: ${(macroF1 * 100).toFixed(2)}%`);
    console.log(`Real Field ECE (Post-Calibration T=1.28): ${(ece * 100).toFixed(2)}%`);
    console.log("\nPer-Crop Accuracy Breakdown:");
    for (const [crop, data] of Object.entries(cropMetrics)) {
      console.log(`  - ${crop.padEnd(10)}: ${(data.accuracy * 100).toFixed(2)}% (${data.correct}/${data.total})`);
    }

    expect(totalSamples).toBeGreaterThanOrEqual(100);
  });
});
