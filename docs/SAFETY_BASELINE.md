# THINAI Safety Baseline

**Established**: 2026-11-24  
**Commit**: `296baff` (baseline before safety-advisory upgrades)  
**Branch**: `thinai-safety-advisory-upgrades`

---

## 1. Purpose

This document records the safety mechanisms present in THINAI at the time
this upgrade branch was created. Every mechanism listed here MUST remain
functional (or be replaced by a stricter equivalent) after all phases are
complete. Removing or weakening any mechanism without explicit owner
approval is a blocking defect.

---

## 2. Safety Mechanisms Inventory

### 2.1 Chemical Advice Global Block

| Item | Detail |
|---|---|
| **Flag** | `IS_G4_FIELD_VALIDATED = false` |
| **File** | `src/services/litertInferenceService.ts` |
| **Effect** | When `false`, `getConfidenceGatedTier()` caps all results at `TIER_2_MODERATE` maximum, regardless of calibrated confidence. No scan can reach `TIER_1_CONFIDENT`. |
| **Result** | Chemical treatment arrays are ALWAYS stripped by `gateChemicalAdvice()` and `assignTierRemedies()`. Users see: "Chemical fungicide/pesticide withheld due to diagnostic uncertainty (Tier 2)." |
| **Status** | ACTIVE and TESTED (`tests/gating_engine.test.ts`) |

### 2.2 Three-Tier Confidence Gating

| Tier | Threshold | Advice Allowed |
|---|---|---|
| TIER_1_CONFIDENT | calibratedConfidence ≥ τ_high (0.78) | Specific diagnosis + organic + chemical |
| TIER_2_MODERATE | τ_low (0.45) ≤ conf < τ_high | Possible diagnosis, organic/cultural ONLY |
| TIER_3_INCONCLUSIVE | conf < τ_low | No diagnosis claims. Officer referral. |

**Note**: Because `IS_G4_FIELD_VALIDATED = false`, TIER_1 is currently
unreachable. All results land in TIER_2 or TIER_3.

### 2.3 Crop Boundary Enforcement

| Item | Detail |
|---|---|
| **Supported crops** | `COVERED_MODEL_CROPS = ["Tomato", "Potato", "Pepper", "Corn", "Maize"]` |
| **File** | `src/services/litertInferenceService.ts` |
| **Behaviour** | If the farmer's selected crop is not in `COVERED_MODEL_CROPS`, inference returns `source: "UNSUPPORTED_CROP"`, `tier: "TIER_3_INCONCLUSIVE"`, with officer referral message. |
| **Status** | ACTIVE and TESTED (`tests/crop_coverage_phase2b.test.ts`) |

### 2.4 Farmer Verdict Safety Label

| Item | Detail |
|---|---|
| **File** | `src/services/verdictService.ts` |
| **Notice** | `"Farmer verdicts are crowd-sourced field observations and serve as noisy weak labels. Farmers may mistake physiological nutrient deficiencies for fungal leaf spots or vice versa. Therefore, verdict-based metrics estimate deployment trends, not ground-truth laboratory accuracy."` |
| **Policy** | Verdicts are stored and aggregated for statistical monitoring. They are NEVER used as training labels for the model. |
| **Status** | ACTIVE |

### 2.5 Temperature Scaling Calibration

| Item | Detail |
|---|---|
| **Temperature** | T = 1.28 (derived from PlantVillage lab validation set) |
| **Status** | `PROVISIONAL (Derived from laboratory PlantVillage validation set)` |
| **File** | `public/models/thresholds.json` |
| **Effect** | Softmax probabilities are rescaled to reduce overconfidence. |
| **Status** | ACTIVE and TESTED (`tests/calibration_maths.test.ts`) |

### 2.6 Officer Referral Path

| Item | Detail |
|---|---|
| **Trigger** | TIER_3 results, unsupported crops |
| **Message** | "Photo saved for agricultural officer verification. Contact nearest Extension Officer (AAO) or KVK helpline." |
| **Officer dashboard** | `OfficerDashboardScreen.tsx` with Firestore queries, expert label submission |
| **File** | `src/services/officerService.ts` |
| **Status** | ACTIVE and TESTED (`tests/officer_dashboard.test.ts`) |

### 2.7 OOD (Out-of-Domain) Rejection

| Item | Detail |
|---|---|
| **Categories tested** | Paddy, Cotton, Other Leaves, Hands, Soil, Packaging, Blurry Photos |
| **Result** | 100% TIER_3 rejection on synthetic OOD test data |
| **File** | `tests/ood_safety.test.ts` |
| **Limitation** | Tests use synthetic/mocked data, not real model inference |
| **Status** | ACTIVE (synthetic test only) |

### 2.8 Privacy Protections

| Item | Detail |
|---|---|
| **Phone consent** | `officerService.ts`: phone is `undefined` unless `phoneConsent === true` |
| **Photo consent** | `FieldDiagnosisRecord.photoConsent` field checked before showing thumbnail |
| **GPS** | Not uploaded; district/village strings only |
| **Status** | PARTIAL (consent fields exist but no consent UI flow) |

---

## 3. Known Limitations at Baseline

1. **Lab-only accuracy**: Model trained on PlantVillage lab images. Lab accuracy ~94%.
   On PlantDoc field images (N=125), accuracy is ~25.6%, ECE ~0.40.
2. **No field validation**: `IS_G4_FIELD_VALIDATED = false`. No crop-disease pair
   has been validated on real Tamil Nadu field data.
3. **Crop coverage is narrow**: Only 5 crops (Tomato, Potato, Pepper, Corn, Maize)
   have model support. The other 20+ Tamil Nadu crops get officer referral.
4. **Threshold source**: τ_high=0.78, τ_low=0.45, T=1.28 are all derived from
   lab data, not from a held-out field calibration set.
5. **ECE is high on field data**: 0.40 (40%) on PlantDoc. The model is poorly
   calibrated for real-world images.
6. **Language safety**: No distinction between human-verified and machine-drafted
   translations for safety-critical content (pesticide doses, PPE instructions).
7. **No consent UI**: Consent fields exist in data models but there is no user-facing
   consent flow for photo/location sharing.
8. **Officer dashboard is basic**: No priority scoring, no image review, no audit log.

---

## 4. Test Baseline

| Suite | Files | Tests | Status |
|---|---|---|---|
| `npx tsc --noEmit` | — | — | ✅ 0 errors |
| `npx vitest run` | 25 | 137 | ✅ All passing |

### Key Safety Tests
- `gating_engine.test.ts` (8 tests): Tier assignment, chemical blocking
- `calibration_maths.test.ts` (8 tests): Temperature scaling, ECE computation
- `ood_safety.test.ts` (2 tests): OOD category rejection
- `crop_coverage_phase2b.test.ts` (10 tests): Crop boundary enforcement
- `officer_dashboard.test.ts` (4 tests): Officer service integration
- `wilson_interval.test.ts` (4 tests): Statistical interval computation

---

## 5. Upgrade Contract

The safety-advisory upgrade (Phases 1–10) MUST:

- [ ] Preserve or strengthen every mechanism in Section 2
- [ ] Not enable automatic pesticide/chemical recommendations for any
      crop-disease pair that lacks field validation
- [ ] Not treat farmer yes/no feedback as ground-truth disease labels
- [ ] Not claim weather data confirms disease
- [ ] Not remove officer referral for uncertain cases
- [ ] Not fabricate accuracy, validation, or research results
- [ ] Not upload raw photos or GPS without explicit consent
- [ ] Keep all existing tests passing (137 baseline tests)
- [ ] Add new tests for every safety-critical feature

---

## 6. Architecture Decisions for Upgrade

1. **New features as separate files** — not added inline to the 3021-line App.tsx.
   New services go in `src/services/`, new components in `src/app/components/`,
   new data in `src/data/`, new config in `src/config/`.
2. **Dexie schema increment** — new tables added in version 5.
3. **Registry-driven** — crop evidence, language review, symptom questions, and
   spray rules all stored as JSON data files, not hardcoded in components.
4. **Offline-first** — all new features degrade safely when offline.
5. **Firebase Spark limits** — no cloud functions, no paid storage, query limits preserved.
