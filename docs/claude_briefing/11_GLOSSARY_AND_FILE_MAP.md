# THINAI Technical Glossary & Comprehensive File Map

**Document Target**: Definitive Terminology Glossary & Architectural Concept-to-File Index  
**Context**: Evaluated on commit `cde89aa` (`C:\Users\cswas\Documents\THINAI`)  

---

## 1. Technical Glossary

* **ARFI (Agricultural Recommendation Fragility Index)**:
  An analytical composite index ($\text{ARFI} \in [0, 1]$) synthesizing input telemetry reliability, ensemble consensus, normalized Shannon prediction entropy, multi-scenario stress sensitivity, and downside economic crop risk. Formulated in `ARFI.md` and implemented in `backend/app/services/arfi_service.py`.
* **Decision Tiers (Tier 1, Tier 2, Tier 3)**:
  * **Tier 1 (Confident, $P_{\max} \ge \tau_{\text{high}}$)**: High-confidence classification. Authorizes cultural and chemical remedies. (Currently disabled in code while Gate G4 fails).
  * **Tier 2 (Moderate, $\tau_{\text{low}} \le P_{\max} < \tau_{\text{high}}$)**: Moderate confidence. Emits cultural/organic management only; chemical pesticides are strictly withheld.
  * **Tier 3 (Inconclusive, $P_{\max} < \tau_{\text{low}}$)**: "Cannot Tell". Zero disease claims made. Photo is saved in local IndexedDB and queued for agricultural extension officer review.
* **Readiness Gates (G1–G10)**:
  Ten binary (PASS/FAIL) release criteria established in `READINESS_CRITERIA.md` covering code quality, test suites, data provenance, field ML accuracy, safety invariants, offline sync, Android native execution, live APIs, zero secrets, and pilot protocol registration.
* **Crop Pack Status (A, B, C)**:
  * **Status A**: Vision models trained on public data and field-validated on Indian/Tamil Nadu agricultural photography.
  * **Status B**: Vision models trained on public datasets without Tamil Nadu field validation; chemical advice withheld; capped at Tier 2.
  * **Status C**: No vision model available; immediate referral to Assistant Agricultural Officer (AAO) or Kisan Call Centre.
* **ECE (Expected Calibration Error)**:
  The weighted average difference between predicted model confidence and empirical accuracy across $M$ probability bins:
  $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \big| \text{acc}(B_m) - \text{conf}(B_m) \big|$$
  Calculated in `src/services/litertInferenceService.ts:168-198`.
* **Wilson Score Interval**:
  An asymmetric binomial confidence interval with statistical stability guarantees for small sample sizes ($N < 30$), avoiding standard normal approximation anomalies near $0$ or $1$. Implemented in `src/services/litertInferenceService.ts:200-211` with minimum sample guard $N \ge 10$.
* **LWW (Last-Write-Wins)**:
  A deterministic conflict resolution strategy for offline data synchronization: when local mutations collide with remote Firestore state, the mutation possessing the more recent ISO timestamp (`updatedAt`) takes precedence. Implemented in `src/services/syncService.ts`.
* **Out-of-Domain (OOD) Rejection**:
  Techniques ensuring the neural network does not classify non-foliage items (human hands, soil, plastic bags) or mismatched crop foliage into specific disease classes. Implemented via anchor class index 4 (`Background_without_leaves`) and crop prefix filtering in `litertInferenceService.ts`.
* **Harmful Advice Rate (HAR)**:
  The proportion of total diagnostic interactions where chemical pesticide recommendations are emitted for an incorrect disease class. Pre-registered safety ceiling is $\text{HAR} \le 2.10\%$ in `PILOT_PROTOCOL.md`.
* **Wash-Off Risk / Spray Guard**:
  An agro-meteorological rule blocking foliar chemical applications when precipitation probability $\ge 40\%$ or 48-hour forecasted rainfall $\ge 5.0\text{ mm}$, preventing chemical runoff into rural water bodies. Implemented in `src/services/weatherService.ts`.

---

## 2. Concept-to-File Implementation Map

| Architectural Concept / Feature | Primary Implementation File | Secondary / Supporting File | Test Suite or Evidence Artifact |
| :--- | :--- | :--- | :--- |
| **Neural Vision Model Inference** | `src/services/litertInferenceService.ts` | `public/models/thinai_disease_model.tflite` | `tests/gating_engine.test.ts`, `evidence/G4.json` |
| **Post-Hoc Temperature Scaling** | `src/services/litertInferenceService.ts:139-165` | `public/models/thresholds.json` | `tests/calibration_maths.test.ts` |
| **Three-Tier Confidence Gating** | `src/services/litertInferenceService.ts:219-304` | `src/app/components/CropDoctorScreen.tsx` | `tests/gating_engine.test.ts` (8/8 pass) |
| **Out-of-Domain (OOD) Rejection** | `src/services/litertInferenceService.ts:509-568` | `public/models/labels.json` | `tests/ood_safety.test.ts` (full rejected) |
| **Chemical Advice Withholding Guard** | `src/services/litertInferenceService.ts:243-257` | `src/services/i18n.ts` | `tests/gating_engine.test.ts` (200 trials pass) |
| **Crop Coverage Registry (21 Crops)** | `data/crop_registry.json` | `src/services/cropPackService.ts` | `tests/crop_coverage_phase2b.test.ts` (10/10 pass) |
| **IndexedDB Relational Tables** | `src/services/db.ts` | `src/app/components/FarmRecordsScreen.tsx` | `tests/farm_records_dexie.test.ts` (9/9 pass) |
| **Offline FIFO Queue & LWW Sync** | `src/services/syncService.ts` | `src/services/db.ts` | `tests/reconnect_sync.test.ts` (7/7 pass) |
| **Agro-Meteorology & Spray Guard** | `src/services/weatherService.ts` | `src/app/App.tsx` | `tests/weather_spray_irrigation.test.ts` (10/10 pass) |
| **Agmarknet Mandi Price Provenance** | `src/services/marketService.ts` | `src/app/App.tsx (MarketScreen component)` | `tests/market_agmarknet.test.ts` (8/8 pass) |
| **23-Language Multilingual Engine** | `src/services/i18n.ts` | `locales/*.json` (23 files) | `tests/multilingual_parity.test.ts` (6/6 pass) |
| **RTL Layout Adaptation (Urdu/Sindhi)**| `src/services/i18n.ts` | `public/fonts/fonts.css` | `e2e/multilingual_switch.spec.ts` |
| **Offline Curated Agronomic Assistant**| `src/services/aiAssistantService.ts` | `src/app/App.tsx (AIScreen component)` | `tests/ai_assistant_retrieval.test.ts` (9/9 pass) |
| **Extension Officer Triage Dashboard**| `src/app/components/OfficerDashboardScreen.tsx` | `src/services/officerService.ts` | `tests/officer_dashboard.test.ts` (4/4 pass) |
| **Firestore Security Rules & RBAC** | `firestore.rules` | `scripts/test_firestore_rules.mjs` | `node scripts/test_firestore_rules.mjs` (23/23 pass) |
| **DPDP Act Account Data Erasure** | `src/app/App.tsx (ProfileScreen component)` | `src/services/authService.ts` | `tests/auth_a11y_regression.test.ts` |
| **ARFI Stress Testing Engine (Backend)**| `backend/app/services/arfi_service.py` | `backend/app/api/v1/endpoints/recommendations.py` | `pytest backend/app/tests` (16/16 pass) |
| **Android Native Scaffolding & Gradle**| `android/app/build.gradle` | `capacitor.config.json` | `docs/logcat_ci_release_monkey_g7.log` (5k monkey) |
| **CI/CD APK Release Signing** | `.github/workflows/build-apk.yml` | `docs/ci_release_apk/app-release.apk` | `evidence/G9.json` (apksigner v2 verified) |
| **Windows Desktop Wrapper (Electron)** | `electron/main.cjs` | `package.json` | `dist-electron/THINAI Setup 0.0.1.exe` |
| **Pruned Prototype Dead Code** | `docs/REMOVED.md` | `src/app/App.tsx` | `tests/dead_routes_pruned.test.ts` (4/4 pass) |
| **Automated Gate Verification Script** | `scripts/verify_gates.mjs` | `evidence/G*.json` | `node scripts/verify_gates.mjs` |

