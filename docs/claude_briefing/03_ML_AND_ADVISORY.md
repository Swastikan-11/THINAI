# THINAI Machine Learning Models, Calibration & Agronomic Advisory Specifications

**Document Target**: Comprehensive ML Architecture, Calibration, Safety Invariants & Metric Traceability  
**Context**: Evaluated on commit `cde89aa` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `public/models/`, `data/crop_registry.json`, `src/services/litertInferenceService.ts`, `evidence/G4.json`, `results/real_field_evaluation.json`  

---

## 1. On-Device Neural Vision Model

### 1.1 Architecture & Specifications
* **Model Name**: THINAI MobileNetV2 Agricultural Pathology Classifier (`public/models/labels.json`).
* **Base Architecture**: MobileNetV2 with depthwise separable convolutions and inverted residual bottlenecks (`width_mult = 1.0`).
* **File Name & Path**: `public/models/thinai_disease_model.tflite`.
* **Binary File Size**: Exactly `4,605,452 bytes` (~$4.39\text{ MB}$).
* **Execution Framework**: Google LiteRT.js WebAssembly runtime (`@litertjs/core`, version `2.5.3`), executed in browser main thread or single-threaded WebAssembly worker (`litert_wasm_compat_internal.wasm`).
* **Input Tensor Shape**: `[1, 224, 224, 3]` (Batch size 1, Height 224, Width 224, Channels 3 - RGB).
* **Graph Preprocessing**: The model FlatBuffer contains an internal `tf.keras.applications.mobilenet_v2.preprocess_input` layer that normalizes raw float32 pixels from $[0, 255]$ into $[-1.0, 1.0]$. The client feeds raw RGB values without double-normalization (`src/services/litertInferenceService.ts:367-380`).

### 1.2 Full Output Class List (39 Classes)
Extracted directly from `public/models/labels.json`:
1. `Apple___Apple_scab`
2. `Apple___Black_rot`
3. `Apple___Cedar_apple_rust`
4. `Apple___healthy`
5. `Background_without_leaves` (Index 4: Out-of-Domain Non-Foliage Anchor)
6. `Blueberry___healthy`
7. `Cherry___Powdery_mildew`
8. `Cherry___healthy`
9. `Corn___Cercospora_leaf_spot Gray_leaf_spot`
10. `Corn___Common_rust`
11. `Corn___Northern_Leaf_Blight`
12. `Corn___healthy`
13. `Grape___Black_rot`
14. `Grape___Esca_(Black_Measles)`
15. `Grape___Leaf_blight_(Isariopsis_Leaf_Spot)`
16. `Grape___healthy`
17. `Orange___Haunglongbing_(Citrus_greening)`
18. `Peach___Bacterial_spot`
19. `Peach___healthy`
20. `Pepper,_bell___Bacterial_spot`
21. `Pepper,_bell___healthy`
22. `Potato___Early_blight`
23. `Potato___Late_blight`
24. `Potato___healthy`
25. `Raspberry___healthy`
26. `Soybean___healthy`
27. `Squash___Powdery_mildew`
28. `Strawberry___Leaf_scorch`
29. `Strawberry___healthy`
30. `Tomato___Bacterial_spot`
31. `Tomato___Early_blight`
32. `Tomato___Late_blight`
33. `Tomato___Leaf_Mold`
34. `Tomato___Septoria_leaf_spot`
35. `Tomato___Spider_mites Two-spotted_spider_mite`
36. `Tomato___Target_Spot`
37. `Tomato___Tomato_Yellow_Leaf_Curl_Virus`
38. `Tomato___Tomato_mosaic_virus`
39. `Tomato___healthy`

### 1.3 Training Provenance & Dataset Licenses
* **Training Dataset**: Public PlantVillage benchmark dataset (Hughes and Salathé 2015).
* **Dataset License**: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).
* **Laboratory Training Pipeline**: `ml/train_calibrated_model.py`. The base network was pre-trained on ImageNet and fine-tuned on 54,306 laboratory plant leaf images photographed against uniform neutral grey/black backgrounds under controlled studio illumination.

---

## 2. Model Calibration & Post-Hoc Temperature Scaling

* **Calibration Technique**: Post-Hoc Temperature Scaling (Guo et al. 2017).
* **Optimal Temperature Parameter**: $T^* = 1.28$ (`public/models/thresholds.json`).
* **Origin of Value**: Fitted by minimizing Negative Log-Likelihood (NLL) on the laboratory PlantVillage validation split (`ml/train_calibrated_model.py`).
* **Governance Status**: **PROVISIONAL-LAB / PROPOSED-BY-AGENT**. The repository owner has not yet approved or calibrated this value on native Tamil Nadu field data.
* **Mathematical Transformation**:
  $$\text{Logits: } z_i = \ln(\max(p_i, 10^{-12})), \quad P_{\text{calibrated}}(c_i) = \frac{\exp(z_i / T^*)}{\sum_j \exp(z_j / T^*)}$$
* **Calibration Metrics**:
  * **Lab Validation Pre-Calibration ECE**: $0.0841$ ($8.41\%$)
  * **Lab Validation Post-Calibration ECE**: $0.0263$ ($2.63\%$)
  * **Empirical Field Photography ECE (PlantDoc, $N=125$)**: **$0.4049$ ($40.49\%$)** — demonstrates severe calibration breakdown when transitioning from laboratory studio backgrounds to real field imagery.

---

## 3. Selective Gating & Risk Tiers

### 3.1 Threshold Definitions & Governance

| Tier Name | Calibrated Confidence Gate | Threshold Value | Intended Action | Governance Status |
| :--- | :---: | :---: | :--- | :---: |
| **Tier 1 (Confident)** | $P_{\max} \ge \tau_{\text{high}}$ | $\tau_{\text{high}} = 0.78$ ($78\%$) | Confirmed diagnosis; cultural and chemical remedies emitted | **PROPOSED-BY-AGENT (Awaiting Owner Approval)** |
| **Tier 2 (Moderate)** | $\tau_{\text{low}} \le P_{\max} < \tau_{\text{high}}$ | $\tau_{\text{low}} = 0.45$ ($45\%$) | Possible diagnosis; cultural advice only; **CHEMICALS WITHHELD** | **PROPOSED-BY-AGENT (Awaiting Owner Approval)** |
| **Tier 3 (Inconclusive)**| $P_{\max} < \tau_{\text{low}}$ | $< 0.45$ ($45\%$) | "Cannot Tell"; zero claims; photo queued for Extension Officer | **PROPOSED-BY-AGENT (Awaiting Owner Approval)** |

### 3.2 Gating Logic & Exact Code Path
The gating logic is enforced in `src/services/litertInferenceService.ts`:
* Line 219: `export const IS_G4_FIELD_VALIDATED = false;`
* Lines 221–238 (`getConfidenceGatedTier`): Evaluates calibrated confidence against thresholds. If `enforceG4Disabling` is true and `!IS_G4_FIELD_VALIDATED`, Tier 1 outputs are strictly suppressed and demoted to Tier 2.
* Lines 243–257 (`gateChemicalAdvice`): If tier is not `TIER_1_CONFIDENT`, chemical treatment arrays are stripped and replaced with advisory withhold warnings.
* Lines 265–304 (`assignTierRemedies`): Enforces that Tier 3 receives empty treatment arrays and emits retake tips.

---

## 4. Out-of-Domain (OOD) & Crop Boundary Rejection

To protect smallholder farmers from catastrophic input misapplication, `src/services/litertInferenceService.ts` implements multi-stage input filtering:
1. **Interactive Crop Pre-Selection**: The farmer must explicitly select their crop before running the scanner (`STATUS_A_CROPS`, `STATUS_B_CROPS`).
2. **Background Class Rejection**: If the top predicted class is `Background_without_leaves` (index 4), the scan is immediately classified as Tier 3 with label *"Non-Foliage Detected (Retake Recommended)"*.
3. **Crop Mismatch & Probability Mass Floor**:
   * Evaluates whether the predicted class name matches the selected crop prefix (e.g. `pepper`, `potato`, `tomato`, `corn`, `rice`).
   * Sums the total calibrated probability mass across all classes belonging to the selected crop.
   * If the top class does not match the chosen crop **OR** the sum of calibrated probabilities for that crop is $< 0.40$ (40%), the image is rejected to Tier 3 with:
     *"Crop Mismatch Detected: Selected [Crop], but model classified specimen as non-[Crop] foliage. Diagnosis rejected to prevent dangerous misapplication of agricultural inputs."*
4. **Benchmark Verification**: Tested in `tests/ood_safety.test.ts` across 134 out-of-domain images (human skin, soil, plastic fertilizer bags, out-of-focus blur, non-target leaves): **all non-target images rejected to Tier 3** (`evidence/G3.json`).

---

## 5. Crop Registry & Coverage System (`data/crop_registry.json`)

Crops are categorized into three operational statuses:
* **Status A**: Calibrated vision models available; field-validated on Indian/Tamil Nadu imagery.
* **Status B**: Trained on public dataset; no localized Tamil Nadu field validation; chemical remedies strictly withheld; capped at Tier 2.
* **Status C**: No vision model available; immediate referral to Assistant Agricultural Officer (AAO) or Kisan Call Centre.

### Comprehensive 21-Crop Registry Table

| Crop ID | Crop Name | Status | Public Dataset Used | Dataset License | Total Images | Classes | Model / Pack File |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `paddy` | Paddy (Rice) | **A** | Paddy Doctor (Selvaraj et al. 2022) | CC BY 4.0 | 10,407 | 12 | `public/models/crop_packs/paddy_mobilenetv2.json` |
| `tomato` | Tomato | **A** | PlantVillage + PlantDoc | CC BY-SA 4.0 | 18,229 | 12 | `public/models/thinai_disease_model.tflite` |
| `potato` | Potato | **A** | PlantVillage + PlantDoc | CC BY-SA 4.0 | 2,167 | 5 | `public/models/thinai_disease_model.tflite` |
| `chilli` | Chilli (Pepper Bell) | **A** | PlantVillage + PlantDoc | CC BY-SA 4.0 | 2,491 | 4 | `public/models/thinai_disease_model.tflite` |
| `maize` | Maize (Corn) | **A** | PlantVillage + PlantDoc | CC BY-SA 4.0 | 3,877 | 6 | `public/models/crop_packs/maize_mobilenetv2.json` |
| `cotton` | Cotton | **B** | Kaggle Cotton Disease Dataset | CC0 / Open | 4,200 | 6 | `public/models/crop_packs/cotton_mobilenetv2.json` |
| `sugarcane` | Sugarcane | **B** | Mendeley Sugarcane Dataset | CC BY 4.0 | 2,569 | 7 | `public/models/crop_packs/sugarcane_mobilenetv2.json` |
| `groundnut` | Groundnut (Peanut) | **B** | Mendeley Groundnut Leaf Pathology | CC BY 4.0 | 10,560 | 8 | `public/models/crop_packs/groundnut_mobilenetv2.json` |
| `banana` | Banana | **B** | Mendeley Banana Leaf Pathologies | CC BY 4.0 | 2,340 | 6 | `public/models/crop_packs/banana_mobilenetv2.json` |
| `mango` | Mango | **B** | Mendeley Mango Leaf Disease | CC BY 4.0 | 4,000 | 10 | `public/models/crop_packs/mango_mobilenetv2.json` |
| `tapioca` | Tapioca (Cassava) | **B** | Kaggle Cassava Leaf Disease | CC BY-SA 4.0 | 3,120 | 6 | `public/models/crop_packs/tapioca_mobilenetv2.json` |
| `brinjal` | Brinjal (Eggplant) | **B** | Mendeley Brinjal Leaf Disease | CC BY 4.0 | 3,000 | 8 | `public/models/crop_packs/brinjal_mobilenetv2.json` |
| `coconut` | Coconut | **B** | Mendeley Coconut Pest & Disease | CC BY 4.0 | 5,798 | 7 | `public/models/crop_packs/coconut_mobilenetv2.json` |
| `ragi` | Ragi (Finger Millet) | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |
| `cholam` | Cholam (Sorghum) | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |
| `bajra` | Bajra (Pearl Millet) | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |
| `black_gram`| Black Gram (Urad) | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |
| `green_gram`| Green Gram (Moong) | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |
| `red_gram` | Red Gram (Pigeonpea) | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |
| `onion` | Onion | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |
| `turmeric` | Turmeric | **C** | *(None verified)* | None | 0 | 0 | Expert Referral Only |

---

## 6. Remedy Knowledge Base Audit

Audited directly from `src/services/litertInferenceService.ts:777-967`:
* **Total Remedy Disease Handlers**: 11 entries (Healthy, Early Blight, Late Blight, Blast, Bacterial Spot, Septoria, Leaf Mold, Curl Virus, Mosaic Virus, Spider Mites, Default Fallback).
* **Officially VERIFIED Entries**: **0** (Zero). No agronomist has signed off on these entries in the repository.
* **UNVERIFIED Entries**: **11** (all active handlers).
* **Exact Label State**: Every entry contains:
  * `verificationStatus: "UNVERIFIED (Awaiting Agronomist Sign-Off)"`
  * `reviewerName: ""`
  * `reviewerDate: ""`
  * Citations to official portals: TNAU Agritech Portal (`agritech.tnau.ac.in`) and CIBRC chemical registration standards.

---

## 7. The Lab-to-Field Performance Gap (Empirical vs. Assumed)

### 7.1 Real Empirical Metrics (Ground Truth)
Measured on the held-out PlantDoc Indian agricultural field photography benchmark ($N=125$, Singh et al. 2020) via Playwright automated evaluation (`e2e/field_evaluation.spec.ts`, recorded in `evidence/G4.json` and `results/real_field_evaluation.json`):
* **Field Sample Size**: $N = 125$ real field images.
* **Empirical Top-1 Accuracy**: **$25.60\%$** (32 / 125 correct).
* **95% Wilson Score Confidence Interval**: **$[18.66\%, 34.02\%]$**.
* **Empirical Macro-F1 Score**: **$0.2177$** ($21.77\%$).
* **Expected Calibration Error (ECE)**: **$0.4049$** ($40.49\%$).
* **Empirical Harmful Advice Rate**: $0.00\%$ (achieved solely because chemical advice is withheld in code).

### 7.2 Plain Statement of the Lab-to-Field Gap
In laboratory conditions (PlantVillage images with cropped leaves on clean backgrounds), MobileNetV2 achieves $94.30\%$ accuracy and $0.0263$ ECE. However, when deployed on actual Indian agricultural photography with complex backgrounds (soil, weeds, shadows, varying daylight, multi-leaf overlap), performance collapses to **$25.60\%$ accuracy** and **$40.49\%$ ECE**. 

The model cannot distinguish complex background clutter from disease spots, causing confident false predictions. This empirical finding is why Gate G4 fails and why automated chemical prescription is disabled.

### 7.3 Inventory of Simulated / Assumed Numbers in Codebase

| Metric / Parameter | Value in Code | Where It Appears | Nature of Value (Simulation / Assumption) |
| :--- | :---: | :--- | :--- |
| **Crowdsourced Farmer Noise** | $\eta \in [10\%, 25\%]$ | `ml/evaluate_protocol.py` | Assumed simulation parameter modeling farmer error rate. |
| **Harmful Advice Rate Ceiling** | $\text{HAR}_{\max} = 2.50\%$ | `PILOT_PROTOCOL.md` | Policy goal assumption, not measured field outcome. |
| **Laboratory Temperature** | $T^* = 1.28$ | `thresholds.json`, `litertInferenceService.ts` | Fitted on laboratory PlantVillage data, assumed valid for field. |
| **High Gating Threshold** | $\tau_{\text{high}} = 0.78$ | `thresholds.json` | Proposed heuristic threshold, unapproved by owner. |
| **Low Gating Threshold** | $\tau_{\text{low}} = 0.45$ | `thresholds.json` | Proposed heuristic threshold, unapproved by owner. |
| **Daily Read Cost Estimate** | $500\text{ reads/day}$ | `PILOT_PROTOCOL.md` | Mathematical projection based on 5 officers checking 4x daily. |
| **Thumbnail Base64 Size** | $\approx 25\text{ KB}$ | `PILOT_PROTOCOL.md` | Empirical average based on $300\times 300$ JPEG compression. |
| **ARFI Soil Reliability Weights**| $0.50 + 0.20 + 0.15 + 0.15$ | `backend/app/services/arfi_service.py` | Analytical heuristic formulation, not empirically regression-fitted. |

