# THINAI Dataset Due Diligence & Agronomic ML Expansion Guide (`DATASETS.md`)
**Version**: 1.0.0-SPRINT2  
**Target Domain**: Tamil Nadu Smallholder Agronomic Pathology (Paddy, Cotton, Tomato, Potato, Pepper)  
**Author**: THINAI Technical & Agronomic Audit Team  
**Date**: October 18, 2026  
**Commit SHA**: `be36cad8fbf793081e7d23d8cba9aee0ceec11f8`  

---

## 1. Candidate Dataset Due Diligence Audit

In accordance with strict provenance, licensing, and smallholder safety rules:
1. Every candidate dataset must have an unambiguous, permissive license allowing commercial and non-commercial adaptation (CC BY 4.0, MIT, or Apache 2.0).
2. Datasets under non-commercial restrictions (CC BY-NC) or unclear scraping origins are strictly disqualified.
3. Laboratory setups (plain white or gray backgrounds) must never be passed off as field data.
4. Models must never be trained on foreign agro-climatic data without local Tamil Nadu field validation.

### Candidate Evaluation Matrix

| Dataset Identifier | Primary Source / DOI | Total Images | Target Crop & Classes | Geographic Origin & Photographer | Background Type | License & Attribution Terms | Commercial Use Permitted | Audit Decision |
|---|---|:---:|---|---|---|---|:---:|:---:|
| **PlantVillage** | Mohanty et al., *Front. Plant Sci.*, 2016 ([DOI: 10.3389/fpls.2016.01419](https://doi.org/10.3389/fpls.2016.01419)) | 54,306 | 38 pathology classes across 14 crops + 1 background | Penn State University / EPFL researchers in greenhouse & laboratory settings | Plain uniform background (gray, black, white sheet) | CC BY 4.0 (Attribution required) | **YES** | **ACCEPTED FOR PRE-TRAINING / LAB BASELINE ONLY** (Uncalibrated on field photos). |
| **PlantDoc** | Singh et al., *ACM IKDD CoDS-COMAD*, 2020 ([DOI: 10.1145/3371158.3371196](https://doi.org/10.1145/3371158.3371196)) | 2,598 | 17 classes across 13 crops (Tomato, Potato, Pepper, Corn, etc.) | Crowdsourced Indian agricultural researchers & web curation | Real field background (natural sunlight, soil, weeds) | CC BY 4.0 / MIT | **YES** | **ACCEPTED FOR CALIBRATION PROTOCOL** (Field diversity, but small sample size per class). |
| **Dhan-Shomadhan** | Hossain et al., Mendeley Data V1, 2021 ([DOI: 10.17632/znsxdctwtt.1](https://doi.org/10.17632/znsxdctwtt.1)); arXiv:2309.07515 | 1,106 | Paddy (5 classes): Brown Spot, Leaf Scald, Rice Blast, Rice Tungro, Sheath Blight | Daffodil International University researchers, Dhaka & rural Bangladesh | **HYBRID**: Substantial portion on plain white paper backgrounds; remainder in field | CC BY 4.0 (Attribution required) | **YES** | **REJECTED FOR DIRECT IN-APP CLINICAL DEPLOYMENT**. Reason: White-sheet backgrounds confound field models; Bangladeshi cultivars differ from Tamil Nadu cultivars (CR 1009, ADT 45). |
| **SAR-CLD-2024** | Rahat et al., Mendeley Data, 2024 ([DOI: 10.17632/v6m225y2ty.1](https://doi.org/10.17632/v6m225y2ty.1)) | ~2,100 original (~7,000 augmented) | Cotton (4 classes): Healthy, Bacterial Blight, Cotton Leaf Curl Virus (CLCuV), Nutrient Deficiency | University agronomy researchers, Multan / South Asia | Real field background with foliage clutter | CC BY 4.0 | **YES** | **REJECTED FOR DIRECT IN-APP CLINICAL DEPLOYMENT**. Reason: CLCuV is a North Indian/Pakistani strain rare in Tamil Nadu; Southern cotton requires Alternaria and Grey Mildew monitoring. |
| **Local Tamil Nadu Field Photos** | In-repo / local storage | 0 | None currently staged in repository | Tamil Nadu agrarian tracts | N/A | Proprietary / CC BY 4.0 planned | **YES** | **INSUFFICIENT SAMPLE SIZE ($N=0$)**. Field collection protocol must be executed before training. |

---

## 2. Leakage Prevention & Partitioning Protocol

### 2.1 Group-Aware Splitting (Farm & Session Independence)
Standard pseudo-random splitting ($\text{train\_test\_split}$) introduces catastrophic data leakage in plant pathology models:
* If 15 photos of the same blighted tomato leaf or the same field row are split randomly between training and testing, the deep neural network memorizes background soil texture, lens vignetting, leaf shape, and ambient lighting rather than biological lesions.
* This inflates test accuracy by 15% to 30%, which collapses when deployed to a new farm.

**Strict Protocol Rules:**
1. **Never split at the image level.**
2. Split strictly at the **`farm_id`** or **`session_id`** level:
   - All photos captured at Farm $A$ on Date $X$ must reside entirely in either the Training, Calibration, or Test set.
   - The test set must consist of farms located in distinct taluks or blocks never seen during model training or temperature fitting.

### 2.2 Perceptual Hashing & Near-Duplicate Removal
Before computing splits or training weights:
1. Every candidate image must be normalized to grayscale $64 \times 64$ and evaluated using difference hashing (dHash) and discrete cosine transform perceptual hashing (pHash).
2. Any image pair exhibiting Hamming distance $\le 4$ bits is flagged as a near-duplicate (e.g. rapid camera burst shots of the same leaf).
3. Near-duplicates are pruned to leave exactly one representative exemplar per cluster.
4. A dedicated script ([`scripts/detect_leakage_hashes.mjs`](file:///c:/Users/cswas/Documents/THINAI/scripts/detect_leakage_hashes.mjs)) is committed to the repository to enforce this audit reproducibly.

---

## 3. Tamil Nadu Field Collection Protocol (Paddy & Cotton)

Because no adequate, verified field image collection for Tamil Nadu Paddy and Cotton exists in the repository, the following protocol must be executed before any neural network retraining:

### 3.1 Field Photography Guidelines
1. **Camera Settings**:
   - Modern smartphone camera (minimum 12 megapixels).
   - Macro/Standard lens; HDR set to Auto; flash strictly disabled.
2. **Lighting Conditions**:
   - Shoot exclusively during diffuse morning sunlight (8:00 AM – 10:30 AM) or late afternoon (3:30 PM – 5:30 PM).
   - Avoid harsh midday direct sunlight (causes white blowout on leaf surfaces) and rainy dusk (causes motion blur).
3. **Capture Angles (3-Photo Capture per Specimen)**:
   - **Photo A (Planar Lamina)**: 90-degree flat top-down view of the leaf filling 70% of the viewfinder.
   - **Photo B (Abaxial Underside)**: Underside view of the leaf lamina to inspect fungal sporulation, bacterial ooze, or insect egg masses.
   - **Photo C (Canopy Context)**: Whole-plant contextual shot showing distribution of lesions (lower vs. upper leaves, tiller base).
4. **Balanced Healthy Sampling**:
   - For every 4 diseased leaf specimens captured, agronomists must capture 1 confirmed healthy leaf from the same field plot to prevent background correlation bias.

### 3.2 Metadata & Data Governance
Every photo must be tagged with JSON metadata:
```json
{
  "specimen_id": "TN-THJ-2026-PADDY-042",
  "district": "Thanjavur",
  "block": "Kumbakonam",
  "crop": "Paddy (Rice)",
  "variety": "CR 1009 Sub 1",
  "growth_stage": "Panicle Initiation",
  "soil_type": "Clay Loam",
  "gps_lat": 10.9602,
  "gps_lon": 79.3845,
  "farmer_consent_dpdp": true,
  "collector_role": "Agricultural Extension Officer",
  "timestamp": "2026-11-04T09:15:00+05:30"
}
```

### 3.3 Expert Dual-Agronomist Ground Truth Validation
* Every collected field photo must be independently inspected and labeled by **at least two qualified agronomists** (holding a B.Sc./M.Sc. in Agriculture or Plant Pathology from TNAU / ICAR).
* **Consensus Rule**:
  - If Agronomist 1 and Agronomist 2 agree on the pathogen species, the image is admitted into the candidate pool.
  - If Agronomist 1 and Agronomist 2 disagree, a third senior plant pathologist adjudicates. If ambiguity remains, the image is tagged as `UNVERIFIED` and permanently excluded from Tier 1 training data.

### 3.4 Minimum Sample Size Threshold for Training
* **Hard Stop Rule**: Fine-tuning or model expansion for Paddy or Cotton **CANNOT START** until the following threshold is satisfied:
  $$\ge 200\text{ distinct field images per disease class from }\ge 10\text{ geographically separated farms across Tamil Nadu.}$$

---

## 4. Class Boundary Decisions & Tiered Clinical Remedies

### 4.1 Deployment Boundary Decision
* **PADDY (RICE)**: **KEEP IN TIER 3 (EXPERT REFERRAL ONLY). DO NOT TRAIN.**
  - Rationale: Dhan-Shomadhan consists predominantly of lab white-background images on Bangladeshi varieties. Retraining now would produce hazardous out-of-distribution errors in Tamil Nadu field conditions.
* **COTTON**: **KEEP IN TIER 3 (EXPERT REFERRAL ONLY). DO NOT TRAIN.**
  - Rationale: Available datasets lack coverage of Southern Indian cotton foliar diseases (Alternaria blight and Grey Mildew). Retraining is postponed until the Tamil Nadu collection protocol is completed.

### 4.2 Pre-Registered Verified Remedies for Future Sprint 2 Onboarding
When verified Tamil Nadu field data is obtained and the model satisfies Gate G4, the following official TNAU/ICAR remedies are pre-registered for onboarding:

#### 1. Paddy Blast (`Magnaporthe oryzae`)
* **Scientific Classification**: Fungal ascomycete affecting leaf blade, node, and neck.
* **Tier 1 Curative Chemical Remedy**:
  - Formulation: **Tricyclazole 75% WP @ 0.6 g/L water** or **Isoprothiolane 40% EC @ 1.5 mL/L water**.
  - Spray Timing: Apply at first appearance of spindle-shaped lesions during tillering or panicle emergence.
  - Authoritative Citation: *TNAU Agritech Portal: Crop Protection $\rightarrow$ Paddy Diseases $\rightarrow$ Blast*; ICAR-NRRI Cuttack Management Bulletin.
* **Tier 2 Cultural & Organic Remedy** (Chemical strictly withheld):
  - Cultural Action: Drain standing water; withhold top-dressed nitrogen fertilizer until lesions dry.
  - Organic Spray: Foliar spray of *Pseudomonas fluorescens* (liquid formulation) @ 2.5 mL/L or talc powder @ 10 g/L.

#### 2. Paddy Brown Spot (`Bipolaris oryzae` / `Cochliobolus miyabeanus`)
* **Scientific Classification**: Fungal pathogen causing dark oval/circular spots with yellow halos.
* **Tier 1 Curative Chemical Remedy**:
  - Formulation: **Mancozeb 75% WP @ 2.0 g/L water** or **Carbendazim 12% + Mancozeb 63% WP (SAAF) @ 2.0 g/L water**.
  - Authoritative Citation: *TNAU Crop Production Guide (Agriculture)*, Department of Agriculture, Government of Tamil Nadu.
* **Tier 2 Cultural & Organic Remedy** (Chemical strictly withheld):
  - Cultural Action: Apply potash (MOP) to balance nitrogen; clean field bunds.
  - Organic Spray: Spray fermented cow urine (10%) + neem oil (3%).

#### 3. Cotton Bacterial Blight (`Xanthomonas citri` pv. `malvacearum`)
* **Scientific Classification**: Angular leaf spot and black arm bacterium.
* **Tier 1 Curative Chemical Remedy**:
  - Formulation: **Copper Oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L** (100 ppm) in water.
  - Authoritative Citation: *TNAU Agritech Portal: Cotton $\rightarrow$ Diseases $\rightarrow$ Bacterial Blight*; ICAR-CICR Nagpur.
* **Tier 2 Cultural & Organic Remedy** (Chemical strictly withheld):
  - Cultural Action: Rogue out and burn heavily blighted stems; avoid furrow flood irrigation across infected rows.
  - Organic Spray: Foliar spray of fresh cow dung supernatant (20%) + *Pseudomonas fluorescens* @ 10 g/L.

---

## 5. In-App Architectural Invariants
Until the Tamil Nadu field collection protocol and retrained model pass Gates G3 and G4:
1. `src/services/litertInferenceService.ts` explicitly maps any paddy or cotton upload to `TIER_3_INCONCLUSIVE`.
2. The UI outputs: *"Out of Verified Model Scope: Paddy and Cotton pathology is queued for Agricultural Extension Officer inspection. Chemical recommendations are withheld."*
3. Zero chemical advice is emitted under any circumstances for Paddy or Cotton.
