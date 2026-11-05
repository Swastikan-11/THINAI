# THINAI Project Health & Readiness Summary

**Document Target**: Executive Technical Verdict, Operational Risks & Deployment Readiness  
**Context**: Evaluated on single clean commit SHA on branch `main` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `READINESS_CRITERIA.md`, `evidence/G*.json`, `BUGS.md`, `PILOT_PROTOCOL.md`, `results/real_ood_benchmark.json`  

---

## 1. Single Verdict Line

Pasted verbatim from `node scripts/verify_gates.mjs` (executed without `--sha` overrides on single commit):

```text
THINAI IS NOT READY - failing gates: G4, G10.
```

*(Explanation: With working tree clean and all 10 evidence files re-sealed to the current commit SHA, all SHA validation checks pass natively. Gates G4 and G10 fail honestly on empirical metrics: G4 field accuracy is 25.60% vs. >=70% target, and G10 pilot thresholds are awaiting owner sign-off).*

---

## 2. What Genuinely Works (Supported by Test Evidence)

1. **On-Device Neural Model Execution**:
   * MobileNetV2 executes offline via Google LiteRT.js WebAssembly (`public/models/thinai_disease_model.tflite`, 4.39 MB). Inference completes in ~523ms on Android 16 API 36 emulator.
2. **Real-Image Out-of-Domain (OOD) Safety Filtering**:
   * Evaluated across **240 verified real photographs** (30 images per category with CC licenses and source attribution) from Wikimedia Commons across 8 categories (`results/real_ood_benchmark.json`):
     - **Paddy (Rice Leaf)**: 100.0% rejected to Tier 3 (0 chemical advice).
     - **Cotton (Cotton Leaf)**: 100.0% rejected to Tier 3 (0 chemical advice).
     - **Sugarcane (Foliage)**: 100.0% rejected to Tier 3 (0 chemical advice).
     - **Banana (Plant Foliage)**: 100.0% rejected to Tier 3 (0 chemical advice).
     - **Soil (Agricultural Ground Dirt)**: 93.3% rejected to Tier 3 (28/30 detected as `Background_without_leaves`).
     - **Packaging (Fertilizer Sacks / Plastic)**: 96.7% rejected to Tier 3 (27/30 detected as `Background_without_leaves`).
     - **Hands (Farmer Skin Tone / Palms)**: 76.7% rejected to Tier 3 (23/30 detected as `Background_without_leaves`).
     - **Other Leaves (Mango, Neem, Ficus)**: 66.7% rejected to Tier 3.
3. **Three-Tier Safety Invariant Enforced**:
   * Evaluated in 200 random numerical trials in `tests/gating_engine.test.ts`: **Zero chemical advice is emitted in Tier 2 or Tier 3**. Because Gate G4 fails, Tier 1 is disabled in code (`IS_G4_FIELD_VALIDATED = false`), automatically suppressing automated chemical recommendations across the entire application.
4. **Offline Relational Accounting & Sync**:
   * Complete local CRUD operations for plots, crops, and expenses persist in Dexie.js IndexedDB. Service worker loads DOM in 6ms offline (`e2e/offline_scenarios.spec.ts`). FIFO queue flushes idempotently with Last-Write-Wins conflict resolution (`tests/reconnect_sync.test.ts`).
5. **Real-Time Agro-Meteorology & Spray Guard**:
   * Live Open-Meteo API integration verified with 135ms latency. Wash-off alert triggers whenever precipitation probability $\ge 40\%$ or 48h rainfall $\ge 5\text{ mm}$ (`tests/weather_spray_irrigation.test.ts`).
6. **23-Language Multilingual Shell & Typography**:
   * Bundled 125-key schemas across English and all 22 Eighth Schedule Indian languages. Native fonts and RTL direction rules for Urdu, Kashmiri, and Sindhi verified in `tests/multilingual_parity.test.ts`.
7. **Android Native Release APK Signing & Sanitization**:
   * Production release APK signed with production v2 certificate (`CN=THINAI Production Release`, SHA-256 `5a5b2ea2cbe3e4ab7c6dff0267b3e2b78115836419c367965915fcb50a201cc4`). Completed 5,000-event monkey stress test on Android 16 emulator with 0 fatal crashes and 0 ANRs (`docs/monkey_ci_release_output.txt`). The large 25.2 MB binary has been removed from git tracking; `docs/ci_release_apk/README.md` documents SHA-256 `4BB7C6DFBE26A3B514FA91CE29AB20511D6369BD5D43F7200A29C07A9223E691` and download provenance.
8. **Backend FastAPI & ARFI Microservice**:
   * 16/16 backend tests pass with pytest (`test_auth_and_sync.py`, `test_e2e_live.py`). Scenarios simulate rainfall shocks, heatwaves, and price swings with consensus probability calibration.

---

## 3. What Does Not Work or Is Not Validated

1. **Uncontrolled Field Photography Accuracy (Collapse to 25.60%)**:
   * MobileNetV2 trained on laboratory PlantVillage fails when tested on real Indian field photography (Singh et al. 2020), achieving only $25.60\%$ top-1 accuracy (95% Wilson Score CI: `[18.76%, 33.90%]`, 32/125 correct) and severe miscalibration (ECE = $0.4049$).
2. **Pilot Protocol Threshold Sign-Off**:
   * In `PILOT_PROTOCOL.md`, Section 2.1 Acceptance Thresholds (min per-crop field accuracy, Wilson lower bound, max ECE, min labelled images, per-class sensitivity floor) are templated for owner sign-off and remain pending approval. Section 2.2 operational cut-offs ($\tau_{\text{high}}=0.78, \tau_{\text{low}}=0.45$) must be refitted on an independent held-out field calibration split once field miscalibration is addressed.
3. **Physical Android Hardware Execution**:
   * No physical smartphone logs exist in repository. Testing is confined to an Android 16 API 36 emulator.
4. **Human Agronomic Translation Review**:
   * All 22 non-English language dictionaries are machine-drafts (`locales/status.json`). No human agronomist has reviewed non-English text.
5. **Chemical Remedy Sign-Off**:
   * All 11 remedy entries in `src/services/litertInferenceService.ts` are marked `UNVERIFIED` with empty reviewer names.
6. **Candidate Dataset Status**:
   * Paddy Doctor (arXiv:2205.11108; `paddydoc.github.io`) is audited and registered in `data/crop_registry.json` as `CANDIDATE_ONLY` under CC BY 4.0; no training has taken place.

---

## 4. Top 10 Ranked Operational & Technical Risks

1. **Field Diagnostic Failure (Accuracy 25.60%, Wilson CI: 18.76% - 33.90%)**: The base neural model cannot be deployed in production for active disease advice until retrained and recalibrated on natural field imagery.
2. **High Empirical Miscalibration (Field ECE = 40.49%)**: The laboratory temperature parameter $T^*=1.28$ fails under domain shift, leading to severe overconfidence on field clutter.
3. **Overconfident OOD Escape on Non-Foliage Clutter**: While 100% of out-of-domain crops (Paddy, Cotton, Sugarcane, Banana) and >93% of bare soil/packaging are rejected, 6.7% of hands and 10% of other leaves escape to Tier 1 when background detection fails.
4. **Unreviewed Non-English Chemical Advice**: Safety warnings and dosages in 22 regional languages are machine-translated and unverified by agronomists.
5. **Unsigned Desktop Windows Binary**: The electron installer is unsigned, triggering Microsoft SmartScreen warnings.
6. **Firebase Spark Tier Daily SMS Limit**: Phone OTP authentication is limited to 10 SMS/day on Firebase Spark tier (marked UNVERIFIED in live production console).
7. **Pending Owner Governance Sign-Off**: Pilot acceptance thresholds remain pending repository owner sign-off in `PILOT_PROTOCOL.md`.
8. **Physical Device Performance Variance**: Inference was measured only on x86_64 emulator, not low-end Android hardware.
9. **Single Cloud Data Center Dependency**: Firestore and backend services lack automated multi-region failover.
10. **Storage Base64 Inflation Overhead**: 45 KB raw images expand to ~60 KB base64 strings in Firestore, operating near the 64 KiB soft property threshold.

