import fs from 'fs';
import path from 'path';

// Analytical Wilson Score Interval matching src/services/verdictService.ts
export function wilsonScoreInterval(k, n, z = 1.96) {
  if (n === 0) return { center: 0, lower: 0, upper: 0 };
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denom;
  return {
    k,
    n,
    sampleAcc: p,
    center: Number(center.toFixed(4)),
    lower: Number(Math.max(0, center - margin).toFixed(4)),
    upper: Number(Math.min(1, center + margin).toFixed(4))
  };
}

const resultsPath = path.resolve('results/real_field_evaluation.json');
const evalData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('===============================================================');
console.log('🔬 FIELD ACCURACY, WILSON INTERVALS & CALIBRATION AUDIT');
console.log('===============================================================');

console.log('\n--- 1. Wilson 95% Score Confidence Intervals ---');
const totalSamples = evalData.total_field_samples; // 125
const totalCorrect = Math.round(evalData.overall_accuracy * totalSamples); // 32
const overallWilson = wilsonScoreInterval(totalCorrect, totalSamples);
console.log(`Overall: ${totalCorrect}/${totalSamples} (${(overallWilson.sampleAcc * 100).toFixed(2)}%) -> Wilson 95% CI: [${(overallWilson.lower * 100).toFixed(2)}%, ${(overallWilson.upper * 100).toFixed(2)}%]`);

const cropIntervals = {};
for (const [crop, data] of Object.entries(evalData.per_crop_metrics)) {
  const w = wilsonScoreInterval(data.correct, data.total);
  cropIntervals[crop] = w;
  console.log(`  - ${crop.padEnd(8)}: ${data.correct}/${data.total} (${(w.sampleAcc * 100).toFixed(2)}%) -> Wilson 95% CI: [${(w.lower * 100).toFixed(2)}%, ${(w.upper * 100).toFixed(2)}%]`);
}

console.log('\n--- 2. Per-Class Precision, Recall, F1 Breakdown ---');
for (const [cls, m] of Object.entries(evalData.per_class_metrics)) {
  console.log(`  * ${cls.padEnd(45)} | Support: ${String(m.support).padStart(2)} | TP: ${m.tp} | FP: ${m.fp} | FN: ${m.fn} | Prec: ${(m.precision * 100).toFixed(1)}% | Rec: ${(m.recall * 100).toFixed(1)}% | F1: ${(m.f1 * 100).toFixed(1)}%`);
}

console.log('\n--- 3. Reliability Diagram Bins (T* = 1.28) ---');
console.log(`Reported Field ECE: ${(evalData.expected_calibration_error_ece * 100).toFixed(2)}%`);
console.log('Origin of T*=1.28: Lab PlantVillage validation NLL minimization.');
console.log('Under field domain shift (uncontrolled background, illumination), severe overconfidence persists.');
