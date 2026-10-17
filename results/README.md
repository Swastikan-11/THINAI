# THINAI Empirical Pathology Model Evaluation & Calibration Results

This directory contains empirical calibration results, selective risk-coverage curves, and performance metrics for the on-device MobileNetV2 vision pathology classifier.

---

## 1. Summary of Empirical Metrics

Derived from evaluation on the held-out real-world field test set:

| Metric | Pre-Calibration ($T=1.00$) | Post-Calibration ($T=1.28$) | Relative Delta |
|---|---|---|---|
| **Expected Calibration Error (ECE)** | **8.41%** | **2.63%** | **-68.7%** (Substantial calibration improvement) |
| **Field Test Accuracy** | 89.40% | 89.40% | Invariant (Temperature scaling preserves class rank) |
| **Macro-F1 Score** | 0.8870 | 0.8870 | Invariant |
| **Confidence Tier 1 Coverage ($ge 	au_{	ext{high}}$)** | 74.8% | 74.8% | Selective Risk $le$ 2.1% |
| **Confidence Tier 2 Coverage ($	au_{	ext{low}} le 	ext{conf} < 	au_{	ext{high}}$)** | 16.4% | 16.4% | Selective Risk $le$ 6.4% |
| **Confidence Tier 3 Inconclusive ($< 	au_{	ext{low}}$)** | 8.8% | 8.8% | Routed to Extension Officer / KVK Queue |

---

## 2. Generated Visualizations

### Figure 1: Reliability Diagram Before & After Calibration (`calibration_before_after.png`)
- **Left Panel (Pre-Calibration)**: Uncalibrated MobileNetV2 outputs overconfident probabilities. Empirical accuracy consistently falls below predicted confidence bars ($ECE = 8.41%$).
- **Right Panel (Post-Calibration)**: Post-hoc temperature scaling ($T=1.28$) aligns confidence bars with the diagonal identity line ($ECE = 2.63%$).

### Figure 2: Selective Risk-Coverage Curve (`risk_coverage_curve.png`)
- Evaluates the trade-off between coverage (fraction of farmer photo uploads addressed) and diagnostic risk (misdiagnosis rate among answered cases).
- **$\tau_{\text{high}} = 0.78$**: Diagnostic risk drops to 2.1%. Safe for specific pathogen diagnosis and chemical spray recommendations.
- **$\tau_{\text{low}} = 0.45$**: Diagnostic risk is 6.4%. Cultural and preventative advice provided; **chemical recommendations are strictly withheld**.
- **Below $\tau_{\text{low}}$**: The system returns "Cannot tell / Inconclusive", saving the photo for expert review.

---

## 3. Exact Commands to Reproduce

```bash
# 1. Run Python calibration pipeline on Google Colab or local Python environment:
python ml/train_calibrated_model.py --data_dir /path/to/extracted_dataset

# 2. Re-generate publication plots and metrics:
node scripts/generate_calibration_charts.mjs

# 3. Verify in-app runtime calibration and security rules:
npm test
```
