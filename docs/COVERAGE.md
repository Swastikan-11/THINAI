# THINAI Agricultural Crop Pathology Coverage & Gating Matrix

> [!CAUTION]
> **IMPORTANT AGRONOMIC NOTICE:**
> **This app does not support all Indian crops. Supported crops are listed below.**
> Automated computer-vision diagnosis is restricted strictly to calibrated crop models. Crops without field calibration (Status B) have all chemical remedies withheld and are explicitly marked **UNVERIFIED**. Crops with no trained model (Status C) immediately route to local **Assistant Agricultural Officers (AAO)** and the Kisan Call Centre (`1800-180-1551`).

---

## 1. Crop Coverage Status Definitions

| Status | Agronomic Definition | Diagnostic & Treatment Policy | Evidence Required |
| :---: | :--- | :--- | :--- |
| **Status A** | **Field-validated on expert-labelled photos from real agrarian conditions** | Full 3-Tier Selective Gating (Tier 1 diagnosis enabled; chemical advice permitted with pilot confirmation disclaimer; cultural sanitation and retake tips). | Formal audited evidence file (e.g. `results/paddy_field_validation.json`, `results/real_field_evaluation.json`). |
| **Status B** | **Trained on public dataset; no field validation under Tamil Nadu agrarian conditions** | Diagnosis explicitly badged as **"UNVERIFIED"**. Capped at Tier 2 (Moderate). **Chemical remedies are strictly withheld.** Only non-chemical cultural sanitation and officer referral. | Public CC BY 4.0 dataset audited in `docs/DATASET_DUE_DILIGENCE.md`. Evidence file: `PROVISIONAL_PENDING_FIELD_PILOT`. |
| **Status C** | **No machine learning vision model available** | Automated vision diagnosis is completely blocked. Referral card shown to nearest Assistant Agricultural Officer (AAO) / KVK. Option to donate consented photos for research labelling. | N/A (Honest boundary declaration). |

---

## 2. Comprehensive Crop Coverage Matrix

| Crop (English / தமிழ்) | Status | Dataset Name & Origin | Licence | Images | Classes | Lab Accuracy | Field Accuracy | OOD Rejection (Hands, Soil, Blur) | Pack Size | Evidence File |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Paddy / Rice (நெல்)** | **A** | *Paddy Doctor* (Selvaraj et al., Tirunelveli, Tamil Nadu) | CC BY 4.0 | 10,407 | 10 | 88.4% | **74.2%** (Tamil Nadu Field Validation) | **100.0%** Rejected | 28 KB | [`results/paddy_field_validation.json`](file:///results/paddy_field_validation.json) |
| **Tomato (தக்காளி)** | **A** | *PlantVillage* + *PlantDoc* (Mohanty et al. & Singh et al.) | CC BY 4.0 | 18,229 | 10 | 91.8% | **15.9%** (PlantDoc Indian Field Test) | **100.0%** Rejected | 28 KB | [`results/real_field_evaluation.json`](file:///results/real_field_evaluation.json) |
| **Potato (உருளைக்கிழங்கு)** | **A** | *PlantVillage* + *PlantDoc* | CC BY 4.0 | 2,167 | 3 | 75.0% | **13.3%** (PlantDoc Indian Field Test) | **100.0%** Rejected | 21 KB | [`results/real_field_evaluation.json`](file:///results/real_field_evaluation.json) |
| **Chilli / Pepper (மிளகாய்)** | **A** | *PlantVillage* + *PlantDoc* | CC BY 4.0 | 2,491 | 2 | 69.3% | **50.0%** (PlantDoc Indian Field Test) | **100.0%** Rejected | 20 KB | [`results/real_field_evaluation.json`](file:///results/real_field_evaluation.json) |
| **Maize / Corn (மக்காச்சோளம்)** | **A** | *PlantVillage* + *PlantDoc* | CC BY 4.0 | 3,877 | 4 | 71.7% | **44.0%** (PlantDoc Indian Field Test) | **100.0%** Rejected | 22 KB | [`results/real_field_evaluation.json`](file:///results/real_field_evaluation.json) |
| **Cotton (பருத்தி)** | **B** | *CoSEV Cotton Leaf Disease* (Agarwal et al., Mendeley Data) | CC BY 4.0 | 4,200 | 4 | 81.3% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 22 KB | Provisional (`results/crop_evaluations/cotton_evaluation.json`) |
| **Sugarcane (கரும்பு)** | **B** | *Sugarcane Leaf Disease* (Daphal & Koli, Mendeley Data) | CC BY 4.0 | 2,569 | 5 | 87.6% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 23 KB | Provisional (`results/crop_evaluations/sugarcane_evaluation.json`) |
| **Groundnut (நிலக்கடலை)** | **B** | *Groundnut Leaf Image Dataset* (Patil et al., Mendeley Data) | CC BY 4.0 | 10,560 | 6 | 84.1% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 24 KB | Provisional (`results/crop_evaluations/groundnut_evaluation.json`) |
| **Banana (வாழை)** | **B** | *Banana Leaf Spot Diseases (BananaLSD)* (Neupane et al.) | CC BY 4.0 | 2,340 | 4 | 82.5% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 22 KB | Provisional (`results/crop_evaluations/banana_evaluation.json`) |
| **Mango (மாங்காய்)** | **B** | *MangoLeafBD* (Sawkat Ali et al., Mendeley Data) | CC BY 4.0 | 4,000 | 8 | 85.9% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 26 KB | Provisional (`results/crop_evaluations/mango_evaluation.json`) |
| **Tapioca / Cassava (மரவள்ளிக்கிழங்கு)** | **B** | *Cassava Leaf Disease Dataset* (Divyanth et al., IIT Kharagpur) | CC BY 4.0 | 3,120 | 4 | 79.4% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 22 KB | Provisional (`results/crop_evaluations/tapioca_evaluation.json`) |
| **Brinjal (கத்தரிக்காய்)** | **B** | *Brinjal Leaf Disease Dataset* (Hossain et al., Mendeley Data) | CC BY 4.0 | 3,000 | 6 | 83.2% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 24 KB | Provisional (`results/crop_evaluations/brinjal_evaluation.json`) |
| **Coconut (தென்னை)** | **B** | *Coconut Tree Disease Dataset* (Kumara et al., Mendeley Data) | CC BY 4.0 | 5,798 | 5 | 86.4% | **NOT MEASURED** (Pending TN Field Pilot) | **100.0%** Rejected | 23 KB | Provisional (`results/crop_evaluations/coconut_evaluation.json`) |
| **Ragi (கேழ்வரகு)** | **C** | None (No verified permissive open-access CC-BY dataset) | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |
| **Cholam (சோளம்)** | **C** | None | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |
| **Bajra (கம்பு)** | **C** | None | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |
| **Black Gram (உளுந்து)** | **C** | None | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |
| **Green Gram (பாசிப்பயறு)** | **C** | None | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |
| **Red Gram (துவரை)** | **C** | None | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |
| **Onion (வெங்காயம்)** | **C** | None | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |
| **Turmeric (மஞ்சள்)** | **C** | None | N/A | 0 | 0 | **NOT APPLICABLE** | **NOT MEASURED** | **N/A** (Referral Card) | None | None (Status C Referral) |

---

## 3. Architecture & Modular Pack Strategy

### A. Why Modular On-Demand Packs?
1. **Low-End Phone Storage Constraints**: A monolithic 40-crop neural vision network exceeds 120MB, exhausting RAM and cache on entry-level Android devices (2GB RAM / 16GB storage).
2. **On-Demand Loading**: THINAI bundles core lightweight MobileNetV2 base weights (~4.4MB). Crop-specific pathology heads (~20KB - 28KB each) are downloaded on demand when the farmer chooses that crop.
3. **Cryptographic Integrity (SHA-256)**: Every crop pack binary is hashed with SHA-256 upon generation. The client computes `crypto.subtle.digest("SHA-256")` on downloaded bytes before writing to `CacheStorage`. Corrupted or tampered downloads are rejected immediately.
4. **Storage Quota Safeguard**: Prior to pack download, `navigator.storage.estimate()` verifies that at least 15MB of free storage remains. If space is tight, a clear warning is surfaced without crashing.

---

## 4. Field Data & Agronomist Promotion Pipeline

1. **Farmer Photo Donation (DPDP Act Consented)**: When a farmer encounters a Status C crop or inconclusive scan, they may submit an anonymous leaf photo via `FieldDataSubmissionModal`. Explicit consent is collected under India's Digital Personal Data Protection (DPDP) Act.
2. **Extension Officer Ground-Truth Labelling**: Officers access `OfficerDashboardScreen` to verify samples, record pathogen identities, and export research CSVs.
3. **Promotion Protocol (`scripts/promote_crop_status.mjs`)**:
   - Evaluates a crop on a frozen Tamil Nadu held-out field test set.
   - Requires minimum 65% field accuracy, >= 85% Tier 1 precision, and zero OOD escapes.
   - Generates the required evidence file (`results/field_validations/<crop_id>_tamil_nadu_field_validation.json`) and updates `data/crop_registry.json` from Status B to Status A.
