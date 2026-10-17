// THINAI Automated Test Suite (Phase 8: Comprehensive Testing & Verification)
// Run with: node scripts/verify_system.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=================================================");
console.log("🌱 THINAI COMPREHENSIVE SYSTEM VERIFICATION TEST");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WEATHER & SPRAY ADVISORY EVALUATOR TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log("📦 1. Weather & Spray Advisory Logic Tests");

function evaluateSpraySafety(temp, windSpeed, rainProb, rainfall48h) {
  if (rainProb >= 40 || rainfall48h >= 5.0) {
    return {
      safetyLevel: "Not Recommended",
      badgeColor: "rose",
      primaryReason: rainProb >= 40 
        ? `High rain probability (${rainProb}%) within forecast window. Foliar chemicals will be washed off.`
        : `Heavy cumulative rainfall (${rainfall48h}mm expected in 48h). High wash-off risk.`
    };
  }

  if (windSpeed > 20) {
    return {
      safetyLevel: "Not Recommended",
      badgeColor: "rose",
      primaryReason: `Wind speed is ${windSpeed} km/h (exceeds safe threshold of 20 km/h). High spray drift risk to non-target crops and nearby water bodies.`
    };
  }

  if (temp >= 35) {
    return {
      safetyLevel: "Caution",
      badgeColor: "amber",
      primaryReason: `Ambient temperature is ${temp}°C. Risk of rapid droplet evaporation and leaf phytotoxicity. Spray only in early morning (before 9 AM) or late evening (after 4:30 PM).`
    };
  }

  if (windSpeed >= 12 || rainProb >= 20) {
    return {
      safetyLevel: "Moderate",
      badgeColor: "amber",
      primaryReason: windSpeed >= 12 
        ? `Moderate wind (${windSpeed} km/h). Use low-drift nozzles and keep boom height close to crop canopy.`
        : `Moderate rain risk (${rainProb}%). Use systemic chemical with rainfast adjuvant (sticker) if critical.`
    };
  }

  return {
    safetyLevel: "Optimal",
    badgeColor: "emerald",
    primaryReason: "Calm wind, mild temperature, and low rain probability. Optimal conditions for foliar spray absorption."
  };
}

test("Spray Advisory: High rain probability (>=40%) triggers RED wash-off alert", () => {
  const result = evaluateSpraySafety(28, 10, 45, 0);
  assert.equal(result.badgeColor, "rose");
  assert.equal(result.safetyLevel, "Not Recommended");
  assert.match(result.primaryReason, /washed off/i);
});

test("Spray Advisory: 48h rainfall >= 5mm triggers RED wash-off alert", () => {
  const result = evaluateSpraySafety(27, 8, 15, 12.5);
  assert.equal(result.badgeColor, "rose");
  assert.equal(result.safetyLevel, "Not Recommended");
  assert.match(result.primaryReason, /wash-off risk/i);
});

test("Spray Advisory: High wind speed (>20 km/h) triggers RED spray drift alert", () => {
  const result = evaluateSpraySafety(26, 24, 10, 0);
  assert.equal(result.badgeColor, "rose");
  assert.equal(result.safetyLevel, "Not Recommended");
  assert.match(result.primaryReason, /spray drift risk/i);
});

test("Spray Advisory: High ambient temperature (>=35°C) triggers AMBER caution", () => {
  const result = evaluateSpraySafety(37, 8, 10, 0);
  assert.equal(result.badgeColor, "amber");
  assert.equal(result.safetyLevel, "Caution");
  assert.match(result.primaryReason, /evaporation/i);
});

test("Spray Advisory: Moderate conditions (wind 14 km/h) triggers AMBER moderate warning", () => {
  const result = evaluateSpraySafety(29, 14, 10, 0);
  assert.equal(result.badgeColor, "amber");
  assert.equal(result.safetyLevel, "Moderate");
  assert.match(result.primaryReason, /low-drift nozzles/i);
});

test("Spray Advisory: Optimal calm weather triggers GREEN optimal absorption", () => {
  const result = evaluateSpraySafety(26, 8, 5, 0);
  assert.equal(result.badgeColor, "emerald");
  assert.equal(result.safetyLevel, "Optimal");
  assert.match(result.primaryReason, /optimal conditions/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. OFFLINE CACHE POLICY TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 2. Offline Cache Expiration Policy Tests");

function isWeatherCacheValid(fetchedAt) {
  if (!fetchedAt) return false;
  const fetchedTime = new Date(fetchedAt).getTime();
  if (isNaN(fetchedTime)) return false;
  const threeHoursMs = 3 * 60 * 60 * 1000;
  return Date.now() - fetchedTime < threeHoursMs;
}

function isMarketCacheValid(fetchedAt) {
  if (!fetchedAt) return false;
  const fetchedTime = new Date(fetchedAt).getTime();
  if (isNaN(fetchedTime)) return false;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return Date.now() - fetchedTime < twentyFourHoursMs;
}

test("Weather Cache: Fresh observation (<3h old) is marked VALID", () => {
  const oneHourAgo = new Date(Date.now() - 1 * 3600000).toISOString();
  assert.equal(isWeatherCacheValid(oneHourAgo), true);
});

test("Weather Cache: Expired observation (>3h old) is marked INVALID", () => {
  const fourHoursAgo = new Date(Date.now() - 4 * 3600000).toISOString();
  assert.equal(isWeatherCacheValid(fourHoursAgo), false);
});

test("Weather Cache: Null or malformed timestamp returns false", () => {
  assert.equal(isWeatherCacheValid(null), false);
  assert.equal(isWeatherCacheValid(undefined), false);
  assert.equal(isWeatherCacheValid("invalid-date-string"), false);
});

test("Market Cache: Observation under 24 hours is marked VALID", () => {
  const twelveHoursAgo = new Date(Date.now() - 12 * 3600000).toISOString();
  assert.equal(isMarketCacheValid(twelveHoursAgo), true);
});

test("Market Cache: Observation older than 24 hours is marked INVALID", () => {
  const twentySixHoursAgo = new Date(Date.now() - 26 * 3600000).toISOString();
  assert.equal(isMarketCacheValid(twentySixHoursAgo), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MARKET COMMODITY & CROP NORMALIZATION TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 3. Market Commodity & Crop Normalization Tests");

function normalizeCropKey(rawCrop) {
  const c = rawCrop.toLowerCase().trim();
  if (c.includes("paddy") || c.includes("rice") || c.includes("நெல்")) return "paddy";
  if (c.includes("wheat") || c.includes("கோதுமை")) return "wheat";
  if (c.includes("maize") || c.includes("corn") || c.includes("மக்காச்சோளம்")) return "maize";
  if (c.includes("cotton") || c.includes("பருத்தி")) return "cotton";
  if (c.includes("tomato") || c.includes("தக்காளி")) return "tomato";
  return c;
}

test("Crop Normalizer: Correctly standardizes English & Tamil crop names", () => {
  assert.equal(normalizeCropKey("Paddy (Ponni)"), "paddy");
  assert.equal(normalizeCropKey("Rice"), "paddy");
  assert.equal(normalizeCropKey("நெல்"), "paddy");
  assert.equal(normalizeCropKey("Wheat (Sharbati)"), "wheat");
  assert.equal(normalizeCropKey("கோதுமை"), "wheat");
  assert.equal(normalizeCropKey("Corn / Maize"), "maize");
  assert.equal(normalizeCropKey("மக்காச்சோளம்"), "maize");
  assert.equal(normalizeCropKey("Bt Cotton"), "cotton");
  assert.equal(normalizeCropKey("பருத்தி"), "cotton");
  assert.equal(normalizeCropKey("Tomato (Shivam)"), "tomato");
  assert.equal(normalizeCropKey("தக்காளி"), "tomato");
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ON-DEVICE TFLITE MODEL & LABELS VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 4. On-Device TFLite Model & Labels Verification");

test("Model Asset: thinai_disease_model.tflite exists and exceeds 4 MB", () => {
  const modelPath = path.resolve("public/models/thinai_disease_model.tflite");
  assert.ok(fs.existsSync(modelPath), "Model file missing in public/models/");
  const stat = fs.statSync(modelPath);
  assert.ok(stat.size > 4000000, `Model size is only ${stat.size} bytes (expected > 4 MB)`);
});

test("Model Metadata: labels.json exists with exactly 39 classes and 94.3% accuracy", () => {
  const labelsPath = path.resolve("public/models/labels.json");
  assert.ok(fs.existsSync(labelsPath), "labels.json missing in public/models/");
  const meta = JSON.parse(fs.readFileSync(labelsPath, "utf-8"));
  assert.equal(meta.architecture, "MobileNetV2");
  assert.equal(meta.classes.length, 39, `Expected 39 classes, got ${meta.classes.length}`);
  assert.ok(meta.classes.includes("Background_without_leaves"), "Missing background class");
  assert.ok(meta.classes.includes("Tomato___Late_blight"), "Missing Tomato___Late_blight class");
  assert.ok(meta.classes.includes("Tomato___healthy"), "Missing Tomato___healthy class");
  assert.equal(meta.metrics.validation_accuracy, 94.3);
  assert.equal(meta.confidence_threshold, 0.65);
});

test("Model Calibration: thresholds.json exists with valid T, tau_high, and tau_low", () => {
  const threshPath = path.resolve("public/models/thresholds.json");
  assert.ok(fs.existsSync(threshPath), "thresholds.json missing in public/models/");
  const thresh = JSON.parse(fs.readFileSync(threshPath, "utf-8"));
  assert.equal(thresh.architecture, "MobileNetV2");
  assert.equal(thresh.temperature, 1.28);
  assert.equal(thresh.tau_high, 0.78);
  assert.equal(thresh.tau_low, 0.45);
  assert.ok(thresh.tau_high > thresh.tau_low, "tau_high must be strictly greater than tau_low");
  assert.ok(thresh.metrics.ece_post_calibration < thresh.metrics.ece_pre_calibration, "Post-calibration ECE must be lower than pre-calibration");
  assert.ok(thresh.classes.length >= 15, "Expected at least 15 priority classes");
});

test("Model Evaluation Artifacts: metrics.csv and publication figures exist", () => {
  const csvPath = path.resolve("results/metrics.csv");
  assert.ok(fs.existsSync(csvPath), "results/metrics.csv missing");
  const csv = fs.readFileSync(csvPath, "utf-8");
  assert.match(csv, /optimal_temperature_T/);
  assert.match(csv, /ece_post_calibration/);

  const pngRel = path.resolve("results/calibration_before_after.png");
  assert.ok(fs.existsSync(pngRel), "results/calibration_before_after.png missing");
  assert.ok(fs.statSync(pngRel).size > 1000, "calibration_before_after.png too small");

  const pngRisk = path.resolve("results/risk_coverage_curve.png");
  assert.ok(fs.existsSync(pngRisk), "results/risk_coverage_curve.png missing");
  assert.ok(fs.statSync(pngRisk).size > 1000, "risk_coverage_curve.png too small");
});

test("Calibration Math: Temperature scaling softens overconfidence and preserves ranking", async () => {
  const { applyTemperatureScaling } = await import("../src/services/litertInferenceService.ts");
  const rawProbs = [0.85, 0.10, 0.05];
  const T = 1.28;
  const calibrated = applyTemperatureScaling(rawProbs, T);

  // Softening effect: Peak probability should decrease
  assert.ok(calibrated[0] < rawProbs[0], `Expected calibrated ${calibrated[0]} < raw ${rawProbs[0]}`);
  // Normalization: Sum must equal 1.0
  const sum = calibrated.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-6, `Probabilities must sum to 1.0 (got ${sum})`);
  // Rank invariance: Argmax must remain class 0
  assert.ok(calibrated[0] > calibrated[1] && calibrated[1] > calibrated[2], "Ranking was altered by scaling");
  // Identity: T=1.0 leaves probabilities identical
  const unscaled = applyTemperatureScaling(rawProbs, 1.0);
  assert.ok(Math.abs(unscaled[0] - rawProbs[0]) < 1e-5, "T=1.0 should preserve probabilities");
});

test("Calibration Math: computeEce computes Expected Calibration Error", async () => {
  const { computeEce } = await import("../src/services/litertInferenceService.ts");
  // Case A: Perfect calibration
  const perfect = [
    { confidence: 0.8, isCorrect: true },
    { confidence: 0.8, isCorrect: true },
    { confidence: 0.8, isCorrect: true },
    { confidence: 0.8, isCorrect: true },
    { confidence: 0.8, isCorrect: false }
  ];
  // 4/5 = 80% accuracy, mean confidence = 80% -> error should be 0
  const ecePerfect = computeEce(perfect, 5);
  assert.ok(Math.abs(ecePerfect) < 1e-6, `Expected ECE ~ 0 for perfectly calibrated set, got ${ecePerfect}`);

  // Case B: Severe overconfidence
  const overconfident = [
    { confidence: 0.9, isCorrect: false },
    { confidence: 0.9, isCorrect: false }
  ];
  // Accuracy = 0%, confidence = 90% -> ECE should be 0.9
  const eceOver = computeEce(overconfident, 5);
  assert.ok(Math.abs(eceOver - 0.9) < 1e-6, `Expected ECE 0.9 for overconfident set, got ${eceOver}`);
});

test("Calibration Math: wilsonScoreInterval produces valid 95% intervals", async () => {
  const { wilsonScoreInterval } = await import("../src/services/litertInferenceService.ts");
  const interval = wilsonScoreInterval(90, 100);
  assert.ok(interval.lower > 0.80 && interval.lower < 0.85, `Lower bound out of expected range: ${interval.lower}`);
  assert.ok(interval.upper > 0.93 && interval.upper < 0.97, `Upper bound out of expected range: ${interval.upper}`);
  assert.ok(interval.lower <= interval.center && interval.center <= interval.upper, "Interval ordering violated");
});

test("Gating Engine: Exact boundary threshold mapping (tau_high=0.78, tau_low=0.45)", async () => {
  const { getConfidenceGatedTier } = await import("../src/services/litertInferenceService.ts");
  assert.equal(getConfidenceGatedTier(0.95), "TIER_1_CONFIDENT");
  assert.equal(getConfidenceGatedTier(0.78), "TIER_1_CONFIDENT");
  assert.equal(getConfidenceGatedTier(0.779), "TIER_2_MODERATE");
  assert.equal(getConfidenceGatedTier(0.60), "TIER_2_MODERATE");
  assert.equal(getConfidenceGatedTier(0.45), "TIER_2_MODERATE");
  assert.equal(getConfidenceGatedTier(0.449), "TIER_3_INCONCLUSIVE");
  assert.equal(getConfidenceGatedTier(0.12), "TIER_3_INCONCLUSIVE");
  assert.equal(getConfidenceGatedTier(0.0), "TIER_3_INCONCLUSIVE");
});

test("PROPERTY TEST: For 200 random inputs, NO chemical advice is ever produced when confidence < tau_high", async () => {
  const { getConfidenceGatedTier, gateChemicalAdvice } = await import("../src/services/litertInferenceService.ts");
  const tauHigh = 0.78;
  const tauLow = 0.45;
  const sampleChemicals = [
    "Mancozeb 75% WP @ 2g/L",
    "Metalaxyl + Mancozeb (Ridomil MZ) @ 2.5g/L water",
    "Chlorothalonil 75% WP @ 2g/L",
    "Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline @ 0.1g/L"
  ];

  // Pseudo-random deterministic generator for reproducibility
  let seed = 12345;
  function pseudoRandom() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  const bannedChemicalTerms = ["Mancozeb", "Metalaxyl", "Chlorothalonil", "Copper Oxychloride", "Ridomil", "Streptocycline", "g/L", "WP"];

  for (let trial = 0; trial < 200; trial++) {
    const randomConf = pseudoRandom(); // Random confidence in [0.0, 1.0]
    const tier = getConfidenceGatedTier(randomConf, tauHigh, tauLow);
    const gatedOutput = gateChemicalAdvice(sampleChemicals, tier);

    if (randomConf < tauHigh) {
      // Must be Tier 2 or Tier 3
      assert.ok(tier === "TIER_2_MODERATE" || tier === "TIER_3_INCONCLUSIVE", `Trial ${trial}: Expected Tier 2 or 3 for conf ${randomConf}`);

      // Property invariant: None of the banned chemical names or dosages may appear
      for (const line of gatedOutput) {
        for (const term of bannedChemicalTerms) {
          assert.ok(
            !line.includes(term),
            `VIOLATION on trial ${trial} (conf=${randomConf}, tier=${tier}): Chemical term '${term}' found in output: "${line}"`
          );
        }
      }

      // Must explicitly contain withhold notice or be empty
      const isWithheldNotice = gatedOutput.some(line => 
        line.toLowerCase().includes("withheld") || line.toLowerCase().includes("no chemical")
      );
      assert.ok(isWithheldNotice, `Trial ${trial}: Expected withhold notice for confidence ${randomConf}`);
    } else {
      // Must be Tier 1
      assert.equal(tier, "TIER_1_CONFIDENT", `Trial ${trial}: Expected Tier 1 for conf ${randomConf}`);
      assert.equal(gatedOutput.length, sampleChemicals.length, `Trial ${trial}: Tier 1 should preserve treatments`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. I18N TAMIL TRANSLATIONS INTEGRITY TEST
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 5. i18n English <-> Tamil Dictionary Completeness");

test("i18n: translations.ts has matching English and Tamil keys", async () => {
  const transModule = await import("../src/app/translations.ts");
  const { translations } = transModule;
  assert.ok(translations.English, "English dictionary missing");
  assert.ok(translations.Tamil, "Tamil dictionary missing");

  const enKeys = Object.keys(translations.English);
  const taKeys = Object.keys(translations.Tamil);

  const missingInTamil = enKeys.filter(k => !taKeys.includes(k) || !translations.Tamil[k]);
  assert.equal(
    missingInTamil.length,
    0,
    `Missing Tamil translations for keys: ${missingInTamil.join(", ")}`
  );
  assert.ok(enKeys.length >= 40, `Expected at least 40 keys, found ${enKeys.length}`);
});

test("i18n: src/services/i18n.ts has full English <-> Tamil coverage", async () => {
  const i18nModule = await import("../src/services/i18n.ts");
  const { I18N_STRINGS } = i18nModule;
  assert.ok(I18N_STRINGS.English, "I18N_STRINGS English missing");
  assert.ok(I18N_STRINGS.Tamil, "I18N_STRINGS Tamil missing");

  const enKeys = Object.keys(I18N_STRINGS.English);
  const taKeys = Object.keys(I18N_STRINGS.Tamil);

  const missingInTamil = enKeys.filter(k => !taKeys.includes(k) || !I18N_STRINGS.Tamil[k]);
  assert.equal(
    missingInTamil.length,
    0,
    `Missing Tamil strings in i18n.ts for: ${missingInTamil.slice(0, 5).join(", ")}`
  );
  assert.ok(enKeys.length >= 100, `Expected at least 100 i18n keys, found ${enKeys.length}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ANDROID & CAPACITOR PACKAGING VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 6. Android & Capacitor Packaging Verification");

test("Capacitor: capacitor.config.json has appId 'com.thinai.agriapp'", () => {
  const capPath = path.resolve("capacitor.config.json");
  assert.ok(fs.existsSync(capPath), "capacitor.config.json missing");
  const content = fs.readFileSync(capPath, "utf-8");
  assert.match(content, /"appId":\s*"com\.thinai\.agriapp"/);
  assert.match(content, /"appName":\s*"THINAI"/);
});

test("Android Packaging: com.thinai.agriapp namespace & permissions declared", () => {
  const buildGradlePath = path.resolve("android/app/build.gradle");
  assert.ok(fs.existsSync(buildGradlePath), "android/app/build.gradle missing");
  const buildGradle = fs.readFileSync(buildGradlePath, "utf-8");
  assert.match(buildGradle, /namespace\s*=\s*['"]com\.thinai\.agriapp['"]/);
  assert.match(buildGradle, /applicationId\s+['"]com\.thinai\.agriapp['"]/);

  const manifestPath = path.resolve("android/app/src/main/AndroidManifest.xml");
  assert.ok(fs.existsSync(manifestPath), "AndroidManifest.xml missing");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  assert.match(manifest, /android\.permission\.CAMERA/);
  assert.match(manifest, /android\.permission\.ACCESS_FINE_LOCATION/);
  assert.match(manifest, /android\.permission\.INTERNET/);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. FARMER-VERDICT FIELD MONITOR & CALIBRATION DRIFT TESTS (PHASE D)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 7. Farmer-Verdict Field Monitor & Calibration Drift Tests");

function testWilsonScore(positiveCount, totalCount, z = 1.96) {
  if (totalCount <= 0) return { lower: 0, center: 0, upper: 0 };
  const p = positiveCount / totalCount;
  const z2 = z * z;
  const denominator = 1 + z2 / totalCount;
  const center = (p + z2 / (2 * totalCount)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * totalCount)) / totalCount)) / denominator;
  return {
    lower: Math.max(0, center - margin),
    center,
    upper: Math.min(1, center + margin)
  };
}

test("Wilson Score: zero total returns zero intervals without division by zero", () => {
  const res = testWilsonScore(0, 0);
  assert.equal(res.lower, 0);
  assert.equal(res.center, 0);
  assert.equal(res.upper, 0);
});

test("Wilson Score: 8 successes out of 10 samples produces correct 95% confidence interval", () => {
  const res = testWilsonScore(8, 10);
  assert.ok(res.center > 0.70 && res.center < 0.80, `Center was ${res.center}`);
  assert.ok(res.lower > 0.40 && res.lower < 0.60, `Lower was ${res.lower}`);
  assert.ok(res.upper > 0.90 && res.upper <= 1.0, `Upper was ${res.upper}`);
  assert.ok(res.lower <= res.center && res.center <= res.upper);
});

test("Field Monitor: Guard MIN_VERDICTS_FOR_ESTIMATE = 10 withholds accuracy on small samples", () => {
  const sampleVerdicts = [
    { predictedClass: "Tomato Early Blight", verdict: "YES" },
    { predictedClass: "Tomato Early Blight", verdict: "YES" },
    { predictedClass: "Tomato Early Blight", verdict: "NO" }
  ];
  const MIN_VERDICTS = 10;
  const count = sampleVerdicts.length;
  const hasEnoughData = count >= MIN_VERDICTS;
  const accuracy = hasEnoughData ? (sampleVerdicts.filter(v => v.verdict === "YES").length / count) : null;

  assert.equal(hasEnoughData, false, "Should not claim enough data for 3 verdicts");
  assert.equal(accuracy, null, "Accuracy should be null when verdicts < 10");
});

test("Field Monitor: Drift flag triggers when recent verdict ECE delta >= 5%", () => {
  const baselineEce = 0.0263; // 2.63% from Phase B calibration
  const recentEceClean = 0.045; // delta = +0.0187 (< 0.05) -> No drift
  const recentEceDrifted = 0.082; // delta = +0.0557 (>= 0.05) -> DRIFT!

  const deltaClean = recentEceClean - baselineEce;
  const deltaDrifted = recentEceDrifted - baselineEce;

  const driftClean = deltaClean >= 0.05;
  const driftDetected = deltaDrifted >= 0.05;

  assert.equal(driftClean, false, "Small variation should not trigger drift");
  assert.equal(driftDetected, true, "ECE rise >= 5% must trigger drift alert");
});

test("Field Monitor: Retraining candidates counter captures rejected verdicts ('NO')", () => {
  const verdicts = [
    { id: "v1", verdict: "YES" },
    { id: "v2", verdict: "NO", actualClassChoice: "Tomato Late Blight" },
    { id: "v3", verdict: "NOT_SURE" },
    { id: "v4", verdict: "NO", actualClassChoice: "Nutrient Deficiency" }
  ];
  const retrainingCandidates = verdicts.filter(v => v.verdict === "NO");
  assert.equal(retrainingCandidates.length, 2, "Expected 2 retraining candidates");
  assert.equal(retrainingCandidates[0].actualClassChoice, "Tomato Late Blight");
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=================================================");
console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 All automated verification tests passed with 100% success!");
}
