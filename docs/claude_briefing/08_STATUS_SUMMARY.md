# THINAI Project Health & Readiness Summary

**Document Target**: Executive Technical Verdict, Operational Risks & Deployment Readiness  
**Context**: Evaluated on commit `861aaca` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `READINESS_CRITERIA.md`, `evidence/`, `BUGS.md`, `PILOT_PROTOCOL.md`  

---

## 1. Single Verdict Line

Pasted verbatim from `node scripts/verify_gates.mjs --sha 5c74517`:

```text
THINAI IS NOT READY - failing gates: G4, G10.
```

*(Evaluated against clean HEAD `861aaca` without `--sha`, the script outputs: `THINAI IS NOT READY - failing gates: G1, G2, G3, G4, G5, G6, G7, G8, G9, G10.` due to uncommitted working-tree modifications and stale evidence SHA).*

---

## 2. What Genuinely Works (Supported by Test Evidence)

1. **On-Device Neural Model Execution**:
   * MobileNetV2 executes offline via Google LiteRT.js WebAssembly (`public/models/thinai_disease_model.tflite`, 4.39 MB). Inference completes in ~523ms on Android 16 API 36 emulator.
2. **Out-of-Domain Safety Filtering**:
   * Evaluated across 134 non-leaf images in `tests/ood_safety.test.ts`: **all out-of-domain images (hands, soil, plastic, blur) are rejected to Tier 3 Inconclusive**.
3. **Three-Tier Safety Invariant Enforced**:
   * Evaluated in 200 random input trials in `tests/gating_engine.test.ts`: **Zero chemical advice is emitted in Tier 2 or Tier 3**. Because Gate G4 fails, Tier 1 is disabled in code (`IS_G4_FIELD_VALIDATED = false`), automatically suppressing automated chemical recommendations.
4. **Offline Relational Accounting & Sync**:
   * Complete local CRUD operations for plots, crops, and expenses persist in Dexie.js IndexedDB. Service worker loads DOM in 6ms offline (`e2e/offline_scenarios.spec.ts`). FIFO queue flushes idempotently with Last-Write-Wins conflict resolution (`tests/reconnect_sync.test.ts`).
5. **Real-Time Agro-Meteorology & Spray Guard**:
   * Live Open-Meteo API integration verified with 135ms latency. Wash-off alert triggers whenever precipitation probability $\ge 40\%$ or 48h rainfall $\ge 5\text{ mm}$ (`tests/weather_spray_irrigation.test.ts`).
6. **23-Language Multilingual Shell & Typography**:
   * Bundled 125-key schemas across English and all 22 Eighth Schedule Indian languages. Native fonts and RTL direction rules for Urdu, Kashmiri, and Sindhi verified in `tests/multilingual_parity.test.ts`.
7. **Android Native Release APK Signing**:
   * Production release APK (`docs/ci_release_apk/app-release.apk`) signed with production v2 certificate (`CN=THINAI Production Release`, SHA-256 `5a5b2ea2cbe3e4ab7c6dff0267b3e2b78115836419c367965915fcb50a201cc4`). Completed 5,000-event monkey stress test on Android 16 emulator with 0 fatal crashes and 0 ANRs (`docs/monkey_ci_release_output.txt`).
8. **Backend FastAPI & ARFI Microservice**:
   * 16/16 backend tests pass with pytest (`test_auth_and_sync.py`, `test_e2e_live.py`). Scenarios simulate rainfall shocks, heatwaves, and price swings with consensus probability calibration.

---

## 3. What Does Not Work or Is Not Validated

1. **Uncontrolled Field Photography Accuracy (Collapse to 25.60%)**:
   * MobileNetV2 trained on laboratory PlantVillage fails when tested on real Indian field photography (Singh et al. 2020), achieving only $25.60\%$ top-1 accuracy (95% Wilson CI: [18.66%, 34.02%]) and severe miscalibration (ECE = $0.4049$).
2. **Pilot Protocol Threshold Sign-Off**:
   * Gating thresholds $\tau_{\text{high}} = 0.78$ and $\tau_{\text{low}} = 0.45$ remain marked `PROPOSED-BY-AGENT` and have not been approved by the project owner in `PILOT_PROTOCOL.md` (Gate G10 FAIL).
3. **Physical Android Hardware Execution**:
   * No physical smartphone logs exist in repository. Testing is confined to an Android 16 API 36 emulator.
4. **Human Agronomic Translation Review**:
   * All 22 non-English language dictionaries are machine-drafts (`locales/status.json`). No human agronomist has reviewed non-English text.
5. **Chemical Remedy Sign-Off**:
   * All 11 remedy entries in `src/services/litertInferenceService.ts` are marked `UNVERIFIED` with empty reviewer names.
6. **Current Working Tree Cleanliness**:
   * Uncommitted modifications in `src/app/App.tsx` and `AuthScreens.tsx` introduce 11 TypeScript compiler errors and fail 7 Vitest regression suites.

---

## 4. Top 10 Ranked Operational & Technical Risks

| Rank | Risk Description | Empirical Evidence | Proposed Remediation |
| :---: | :--- | :--- | :--- |
| **1** | **Field Diagnostic Misclassification** | PlantDoc benchmark accuracy = 25.60% ($N=125$, `evidence/G4.json`). Severe background clutter sensitivity. | Fine-tune MobileNetV2 on field datasets (PlantDoc + Paddy Doctor); enforce crop-specific background masking; keep Tier 1 disabled. |
| **2** | **Working Tree Dirty / Compilation Broken** | `tsc --noEmit` returns 11 errors on current working tree; 7 Vitest suites fail. | Clean working tree by reverting or re-aligning modified `App.tsx` to restore passing test state. |
| **3** | **Unsigned Desktop SmartScreen Barrier** | Windows NSIS installer (`THINAI Setup 0.0.1.exe`) lacks an Authenticode EV certificate. | Obtain commercial EV code signing certificate or document SmartScreen bypass instructions for academic evaluators. |
| **4** | **Machine Translation Drift in Chemical Advice** | All 22 non-English locales are `MACHINE-DRAFT` (`locales/status.json`). Mistranslations could recommend dangerous dosages. | Enforce Remedy Safety Guard: retain English fallback for all chemical dosages until native agronomists sign off. |
| **5** | **SMS Authentication Quota Depletion** | Firebase Spark tier permits only 10 SMS verification messages per day. | Restrict public pilot to Email/Password and Google OAuth; use pre-configured test phone numbers for demonstrations. |
| **6** | **Unapproved Pilot Gating Thresholds** | Thresholds $\tau_{\text{high}}$ and $\tau_{\text{low}}$ unapproved by owner (`PILOT_PROTOCOL.md`, `evidence/G10.json`). | Project owner must review ROC risk-coverage curves and commit signed approval of threshold parameters. |
| **7** | **Physical Device Hardware Unknowns** | Testing limited to API 36 x86_64 emulator (`evidence/G7.json`). Camera intent and GPU delegate untested on low-end MediaTek/Snapdragon chipsets. | Execute release APK on a physical Android device (e.g. Redmi 9A / Samsung Galaxy M12) and commit ADB logcat. |
| **8** | **High-Severity npm Vulnerabilities** | `npm audit` reports 7 high-severity vulnerabilities in `@grpc/grpc-js`, `react-router`, and `vite`. | Run targeted dependency updates (`npm update @grpc/grpc-js`) and verify test suite compatibility. |
| **9** | **Firestore Read Quota Exhaustion** | Free Spark tier capped at 50,000 reads/day. Unbounded queries could exhaust quota. | Enforce pagination with `limit(25)` and local Dexie query caching (`PILOT_PROTOCOL.md:7.2`). |
| **10**| **Agmarknet Mandi API Reliability** | data.gov.in API experiences intermittent gateway timeouts and requires registered API keys. | Retain transparent "Benchmark Price" fallback; disclose data age clearly to farmers. |

---

## 5. Dependencies on the Project Owner

The following items cannot be resolved by an automated agent and require direct action from the repository owner:
1. **Decision on Gate Change Proposal**: Formally approve or reject G11, G12, and G13 in `docs/GATE_CHANGE_PROPOSAL.md`.
2. **Pilot Threshold Approval**: Review and sign off on $\tau_{\text{high}} = 0.78$ and $\tau_{\text{low}} = 0.45$ in `PILOT_PROTOCOL.md` to resolve Gate G10.
3. **Physical Android Test Log**: Install `docs/ci_release_apk/app-release.apk` on a physical Android smartphone, execute a disease scan, and commit the ADB logcat output.
4. **Agronomist Engagement**: Partner with a certified agronomist (e.g., from TNAU Coimbatore or ICAR KVK) to inspect and sign off on the 11 disease remedy handlers.
5. **Working Tree Clean-Up**: Decide whether to commit or revert the working-tree modifications in `src/app/App.tsx`.

---

## 6. Free-Tier Cloud Limits That Could Block a Field Pilot

* **Firebase Spark Authentication**: Capped at **10 SMS verifications per day**. If 11 farmers attempt phone login in one day, authentication will fail.
* **Cloud Firestore Reads**: Capped at **50,000 reads per day**. If 100 farmers fetch data continuously, the database locks until midnight Pacific Time.
* **Cloud Firestore Storage**: Capped at **1 GiB**. Uploading full-resolution 5 MB photos would crash the quota within 200 scans (mitigated by client compression to $\le 30\text{ KB}$).
* **Open-Meteo API**: Free non-commercial tier permits up to **10,000 daily API calls** (sufficient for pilot cohorts $< 500$ users).
* **Agmarknet API**: data.gov.in requires a registered developer API key; requests fail without an active key.

---

## 7. Deployment Readiness Assessment

| Deployment Target | Readiness Verdict | Key Blocking Reasons & Required Actions |
| :--- | :---: | :--- |
| **(a) College Demonstration (Academic Evaluation)** | **YES (with caveats)** | **Ready for demonstration**. On-device LiteRT WASM executes offline; Android 16 emulator and Windows desktop builds function; Open-Meteo live weather and Dexie farm records are functional. Demonstrator must explain that field accuracy is low and chemical remedies are disabled for safety. |
| **(b) Supervised Field Pilot (with Extension Officer)** | **PARTIAL / BLOCKED** | **Blocked by Gates G4 and G10**. Cannot be deployed for unsupervised farmer decision-making. Can be run ONLY as an observational shadow study where an Assistant Agricultural Officer (AAO) accompanies every farmer, all chemical outputs remain disabled, and the app is used solely for symptom recording. |
| **(c) Public Unrestricted Release (Google Play Store)** | **NO / REJECTED** | **Strictly blocked**. Field accuracy is 25.60%; 22 languages are machine-drafts; chemical remedies lack agronomist signature; no commercial EV code signing certificate; Google Play Console account unpurchased; Gate G4 failing. Releasing in this state violates agricultural safety standards. |
