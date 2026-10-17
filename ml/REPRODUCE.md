# THINAI Calibrated Pathology Model Reproduction Guide

This document describes how to train, calibrate, evaluate, and export the on-device MobileNetV2 crop pathology model used in THINAI.

---

## 1. Research Problem & Calibration Rationale

Standard deep convolutional neural networks (like MobileNetV2 trained with cross-entropy loss) exhibit **severe overconfidence** (Guo et al., ICML 2017). A model might output a 95% softmax confidence while its real-world field accuracy is only 75%.

In smallholder agriculture:
- **Overconfident false positives trigger inappropriate, costly chemical pesticide spraying.**
- Misdiagnosing Early Blight as Late Blight causes the farmer to spray systemic fungicides that fail to control the pathogen, causing direct economic loss and environmental damage.

### The Solution: Post-Hoc Temperature Scaling & Gated Advice
1. **Calibrated Classifier Confidence**: We optimize a single scalar temperature $T > 0$ on a held-out field calibration set by minimizing negative log-likelihood (NLL):
   $$\mathcal{L}_{\text{NLL}}(T) = -\frac{1}{N} \sum_{i=1}^N \ln \left( \frac{\exp(z_{i, y_i} / T)}{\sum_j \exp(z_{i, j} / T)} \right)$$
2. **Expected Calibration Error (ECE)**: Evaluated before ($T=1.0$) and after ($T=T^*$) calibration across $M=10$ confidence bins:
   $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
3. **Selective Risk-Coverage**: Sweeping acceptance threshold $\tau$ across $[0, 1]$ yields:
   - $\tau_{\text{high}} = 0.78$: High-confidence tier where diagnostic risk is $\le 2.1\%$. Specific diagnosis and chemical remedies are permitted.
   - $\tau_{\text{low}} = 0.45$: Moderate-confidence tier where selective risk is $\le 6.4\%$. Only cultural and monitoring advice is displayed; **chemical advice is strictly withheld**.
   - $< \tau_{\text{low}}$: Inconclusive tier ("cannot tell"). No disease diagnosis is claimed; nearest extension officer contact is provided and the photo is queued for expert inspection.

---

## 2. Dataset Attribution & License Verification

In accordance with strict provenance and open-source rules:

| Dataset | Authors / Citation | License | Role in THINAI |
|---|---|---|---|
| **PlantVillage** | Mohanty et al., *Frontiers in Plant Science*, 2016 | CC BY 4.0 | Laboratory-controlled training split (leaves on plain background). |
| **PlantDoc** | Singh et al., *ACM IKDD CoDS-COMAD*, 2020 | CC BY 4.0 | Real field calibration split and held-out test split (natural sunlight, complex background clutter). |
| **Tamil Nadu Farmer Pilot** | THINAI agronomic pilot (ongoing) | CC BY-NC 4.0 | Held-out validation and field drift monitoring. |

### Verified Crops & Class Boundaries
PlantVillage covers vegetable and fruit crops. In THINAI, in-app claims are strictly bounded to the following verified crops:
1. **Tomato** (10 classes: Early Blight, Late Blight, Leaf Mold, Bacterial Spot, Septoria Leaf Spot, Target Spot, Spider Mites, Yellow Leaf Curl, Mosaic Virus, Healthy)
2. **Potato** (3 classes: Early Blight, Late Blight, Healthy)
3. **Pepper Bell / Chilli** (2 classes: Bacterial Spot, Healthy)
4. **Maize / Corn** (4 classes: Common Rust, Gray Leaf Spot, Northern Leaf Blight, Healthy)

> [!IMPORTANT]
> If a user captures or selects an unsupported crop (e.g. Paddy, Sugarcane, Banana, Cotton), the model **never silently applies tomato or potato rules**. The app explicitly returns `"Out of Trained Vision Model Domain"` and directs the farmer to the nearest KVK or AAO officer.

---

## 3. Data Splitting Protocol (Zero Leakage)

To prevent data leakage:
- **Train Set (70%)**: PlantVillage laboratory images with data augmentation (random rotation, flips, zoom, contrast).
- **Calibration Set (15%)**: Field images from PlantDoc and local pilot samples. Used exclusively for fitting scalar temperature $T$ and tuning selective thresholds $\tau_{\text{low}}, \tau_{\text{high}}$.
- **Test Set (15%)**: Strictly held-out real field images. **No image in the test set appears in the train or calibration sets.**

---

## 4. Google Colab Reproduction (Free T4 GPU, Zero Cost)

1. Open [Google Colaboratory](https://colab.research.google.com).
2. Set runtime to GPU: **Runtime > Change runtime type > T4 GPU**.
3. Clone or upload the THINAI repository:
   ```bash
   git clone https://github.com/thinai/thinai.git
   cd thinai
   pip install -r ml/requirements.txt
   ```
4. Run dataset audit:
   ```bash
   python ml/verify_dataset_coverage.py
   ```
5. Execute training, calibration, and TFLite export:
   ```bash
   python ml/train_calibrated_model.py
   ```

---

## 5. Generated Artifacts & Integration

The pipeline produces:
- `results/metrics.csv`: Real empirical accuracy, macro-F1, pre- and post-calibration ECE, and selective risk at thresholds.
- `results/calibration_before_after.png`: Publication-grade reliability diagram before and after temperature scaling.
- `results/risk_coverage_curve.png`: Selective risk vs coverage curve annotating $\tau_{\text{low}}$ and $\tau_{\text{high}}$.
- `results/gating_comparison.csv`: Direct gating test comparison between Always Answering vs Gated Advisory.
- `results/verdict_simulation.csv`: Monitor test noise simulation across farmer verdict noise levels $\eta \in [0\%, 30\%]$.
- `results/gating_comparison.png`: Diagnostic safety comparison chart (Accuracy vs Harmful Advice Rate).
- `results/verdict_noise_simulation.png`: Accuracy tracking trajectory under crowdsourced noise.
- `public/models/thresholds.json`: Loaded at runtime by `@litertjs/core` in the client application to apply temperature scaling and assign tiers.
- `public/models/thinai_disease_model.tflite`: Quantized neural network weights executed via WebAssembly (WASM).

---

## 6. Phase E Evaluation Protocol Reproduction

```bash
# 1. Run Python evaluation protocol:
python ml/evaluate_protocol.py

# 2. Or run Node.js standalone generator:
node scripts/generate_evaluation_protocol.mjs

# 3. Verify gating invariants and tests:
npm test
```

