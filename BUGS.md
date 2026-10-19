# THINAI Bug Tracking & Verification Report (`BUGS.md`)
**Version**: 1.0.0-rc  
**Last Updated**: October 19, 2026  
**Methodology**: Rigorous triage by severity (P0 = Blocker, P1 = High, P2 = Medium, P3 = Low). All P0 and P1 defects must be fixed and re-verified via automated test suites prior to deployment. Never claim something works without running it.

---

## 1. Bug Registry & Resolution Matrix

| Bug ID | Severity | Module / Component | Steps to Reproduce | Expected Behavior | Actual Behavior | Resolution Status | Verified By |
|---|---|---|---|---|---|---|---|
| **BUG-001** | **P0 (Blocker)** | `syncService.ts` / Dexie | Execute Vitest runner in headless Node.js environment (`npx vitest run`). | Browser globals (`window`, `navigator`) are checked before binding listeners. | Crash with `ReferenceError: window is not defined` when importing syncService. | **FIXED** | Added `if (typeof window !== "undefined")` guards in `src/services/syncService.ts`. Re-tested with Vitest. |
| **BUG-002** | **P1 (High)** | `i18n.ts` / Translations | Run `tests/i18n_parity.test.ts`. Inspect parity between `I18N_STRINGS.English` and `I18N_STRINGS.Tamil`. | 100% key parity across English and Tamil translation dictionaries. | Keys `navDiary` and `navScan` existed in Tamil dictionary but were missing in English dictionary. | **FIXED** | Added `navDiary: "Farm Diary"` and `navScan: "Crop Scan"` to English dictionary in `src/services/i18n.ts`. |
| **BUG-003** | **P1 (High)** | `wilson_interval.test.ts` / Inference | Execute Wilson interval calculation test for $k=8, n=10, z=1.96$. | Mathematical formula $(p + z^2/(2n))/(1 + z^2/n)$ yields center = $0.7167$. | Hardcoded test assertion expected approximate 0.769, failing Vitest run. | **FIXED** | Updated test expectation to exact analytical center (0.7167) matching `calculateWilsonScore` and `wilsonScoreInterval`. |
| **BUG-004** | **P1 (High)** | `litertInferenceService.ts` / Gating | Import `assignTierRemedies` in `tests/gating_engine.test.ts`. | Gating engine exposes structured remedy constructor enforcing chemical withholding on Tier 2 & 3. | Function was unexported, causing Vitest module import failure. | **FIXED** | Implemented and exported `assignTierRemedies()` in `src/services/litertInferenceService.ts`. Verified across 200 random trials. |
| **BUG-005** | **P2 (Medium)** | `src/app/App.tsx` / Navigation | Direct URL navigation to child screens (e.g. `/?screen=fieldAccuracy`). | App mounts directly into requested child screen when session profile is present. | Initial mount briefly flashed home before session was verified in Dexie. | **FIXED** | Added `urlScreen` parameter preservation in `App.tsx` session listener. Verified via Playwright E2E suite. |
| **BUG-006** | **P2 (Medium)** | `Playwright E2E` / Selectors | Run Playwright test with generic text locators. | Playwright finds target action button cleanly. | Playwright strict-mode error triggered when multiple buttons shared partial names (e.g. Equipment vs Post Equipment). | **FIXED** | Updated E2E selectors to use `getByRole('button', { name: '...', exact: true })` and unique accessible names. |
| **BUG-007** | **P3 (Low)** | `marketService.ts` / Agmarknet | Navigate to Market Mandi screen without `VITE_DATA_GOV_IN_API_KEY`. | Transparent disclosure that prices are historical benchmark estimates. | Live price API request fails silently without informing farmer. | **FIXED / DOCUMENTED** | Added clear badge: "Benchmark Price (Not Live API)" with "as of" date stamp per Phase A rules. |
| **BUG-008** | **P2 (Medium)** | `android/app/build.gradle` / Keystore | Inspect `android/app/build.gradle` signingConfigs. | Release signing passwords loaded from Gradle properties or secure environment variables. | Self-signed demo keystore password (`thinai2026`) hardcoded in build file. | **FIXED** | Deleted tracked keystore from repo, added `*.jks` and `android/gradle.properties` to `.gitignore`, and refactored `build.gradle` to dynamically load signing parameters from `ANDROID_KEYSTORE_*` environment variables. Generated new production keystore outside repo. |
| **BUG-009** | **P0 (Blocker)** | `AuthScreens.tsx` / Security | Inspect login UI in production build. | Hardcoded test phone numbers and OTP hint text stripped from all production bundles. | Test phone number (`9876543210`) and OTP text (`123456`) displayed unconditionally in production UI. | **FIXED** | Wrapped demo credentials in `import.meta.env.DEV` condition. Confirmed no test UID in `/officers` collection (writes strictly denied). |
| **BUG-010** | **P1 (High)** | `test_firestore_rules.mjs` / Security | Run security rules test against real `firestore.rules`. | Test suite runs against official `@firebase/rules-unit-testing` and real Firestore Emulator Suite. | Script used custom mock client without validating actual `firestore.rules` syntax or behavior. | **FIXED** | Rewrote `scripts/test_firestore_rules.mjs` using `@firebase/rules-unit-testing@6.0.0` and Firestore Emulator Suite. 23/23 real rule assertions passing. |
| **BUG-011** | **P0 (Blocker)** | `CropDoctorScreen.tsx` / OOD Safety | Capture out-of-domain plant leaves (Paddy, Cotton, Mango, Neem) or non-leaf photos (Hands, Soil, Plastic). | Out-of-domain imagery rejected to Tier 3 Inconclusive with 0 chemical remedy recommendations. | Unselected or out-of-domain images silently mapped to highest-scoring tomato/potato class. | **FIXED** | Added pre-diagnosis interactive crop selector with icons; implemented probability mass ($< 0.40$) and class prefix rejection in `litertInferenceService.ts`. Verified in `tests/ood_safety.test.ts` (100% rejected to Tier 3). |
| **BUG-012** | **P1 (High)** | `litertInferenceService.ts` / Safety | Check emitted chemical remedies in Tier 1. | Chemical remedies require human agronomist verification and pilot confirmation warning. | Remedies displayed without pilot safety disclaimer or reviewer traceability. | **FIXED** | Prepended `[PILOT SAFEGUARD - REQUIRES OFFICER CONFIRMATION]` to all chemical advice, populated source document URLs/sections, product label claims, and set reviewer status to `UNVERIFIED`. |
| **BUG-013** | **P2 (Medium)** | `Workstation Root` / Artifacts | Check root directory for local stale APK files. | Only CI-built release artifacts tracked; local stale APKs removed. | Local stale binaries (`thinai-debug.apk`, `THINAI-release.apk`, `THINAI.apk`) remained on disk. | **FIXED** | Deleted all stale local APKs. Release binaries strictly downloaded from GitHub Actions CI Run #17. |
| **BUG-014** | **P2 (Medium)** | `src/services/i18n.ts` / Localization | Open language selection dropdown. | Only reviewed and verified language dictionaries presented to users. | Unreviewed languages (Hindi, Telugu, Kannada, Malayalam) exposed with incomplete coverage. | **FIXED** | Restricted `SUPPORTED_LANGUAGES` to English and Tamil. Segregated other languages into `UNREVIEWED_LANGUAGES` hidden from active selector. |
| **BUG-015** | **P2 (Medium)** | `firestore.rules` / Thumbnail Limits | Compare documented thumbnail limit (45 KB) against Firestore rule string length limit. | Documented limit and Firestore rule cap agree after accounting for base64 encoding inflation. | Rule checked `size <= 65536` characters while docs stated 64 KB raw binary (which inflates to 85 KB base64). | **FIXED** | Aligned limits: raw image capped at $\le 45\text{ KB}$ binary, inflating to $\le 60\text{ KB}$ base64 string, safely within Firestore's 65,536 character limit. |

---

## 2. Automated Test Verification Summary

### A. Vitest Suite (`npx vitest run`)
- **Total Test Files**: 8 passed (8)
- **Total Test Cases**: 49 passed (49)
- **Suite Breakdown**:
  1. `tests/ood_safety.test.ts`: 2 tests passing (Out-of-Domain selective rejection: Paddy, Cotton, Other leaves, Hands, Soil, Packaging, Blurry photos: 0.0% reach Tier 1/2, 100% rejected to Tier 3).
  2. `tests/gating_engine.test.ts`: 7 tests passing (Confidence threshold mapping, Tier 1/2/3 remedy distribution, 200-trial property-based test confirming zero chemical recommendations below $\tau_{\text{high}}$).
  3. `tests/calibration_maths.test.ts`: 8 tests passing (Temperature scaling softmax stability, temperature effect on entropy, ECE calculation, perceptual difference hashing dHash, Hamming distance).
  4. `tests/wilson_interval.test.ts`: 4 tests passing (Boundary conditions, analytical accuracy center = 0.7167, convergence to $p$ as $n \to \infty$).
  5. `tests/i18n_parity.test.ts`: 5 tests passing (EN/TA dictionary symmetry $\ge 100$ keys, non-empty translations, 4-tab terminology exact match, fallback safety).
  6. `tests/reconnect_sync.test.ts`: 7 tests passing (FIFO reconnect synchronization, LWW conflict resolution, storage quota recovery on QuotaExceededError).
  7. `tests/offline_matrix.test.ts`: 12 tests passing (Offline state matrix transitions, airplane mode cold start, mutation queue persistence).
  8. `tests/officer_dashboard.test.ts`: 4 tests passing (Extension officer privacy consent, weak verdict labels, CSV export sanitization, Spark thumbnail size cap).

### B. Playwright E2E Suite (`npx playwright test`)
- **Total Scenarios**: 11 passed (11) across 2 spec files
- **Browser**: Chromium Headless
- **Scenarios Verified**:
  1. `workflow.spec.ts`: Login & auth screens, Crop Doctor 3-step diagnosis strip, Field Monitor weak labels and Wilson intervals, Equipment Board phone sharing consent, offline queuing and restoration.
  2. `offline_scenarios.spec.ts`: O4-1 SW precache & local DOM execution (2-6ms), O4-2 offline sign-in guards, O4-3 offline core tools and rule banner, O4-4 mid-use network drop & reconnect FIFO sync, O4-5 throttled 3G latency (44ms render), O4-6 model load benchmark (198ms) and first inference (6ms).

### C. System & Security Rule Suites
- **System Verification (`scripts/verify_system.mjs`)**: 35/35 tests passing (Spray advisory weather rules, cache expiration policies, crop normalization, TFLite assets, drift alarms).
- **Firestore Security Rules Real Emulator Suite (`scripts/test_firestore_rules.mjs`)**: 23/23 tests passing against official Firebase Emulator Suite (Unauthenticated deny, equipment listing permissions, phone privacy consent, user profile immutability, officer RBAC, 65,536 char base64 thumbnail cap, expert ground truth labels).
- **Perceptual Hash Duplicate Audit (`scripts/detect_leakage_hashes.mjs`)**: 6 images scanned, 0 near-duplicate pairs detected. Real dataset download instructions documented in `DATASETS.md`.


---

## 3. Android Device Test Protocol & Verification Checklist

To verify hardware and native Capacitor bindings on physical Android devices (e.g. Samsung Galaxy, Redmi, OnePlus running Android 10-14):

| Native Feature | Test Scenario | Verification Procedure | Expected Result | Device Status |
|---|---|---|---|---|
| **Camera** | Rear leaf photography | Tap "Take Photo" in Crop Doctor $\to$ allow camera permission $\to$ autofocus on leaf blade at 10-15 cm. | Native camera viewfinder opens; captured image returns to canvas without memory leak or rotation inversion. | **VERIFIED** (Capacitor Camera plugin v8.2.4) |
| **GPS / Geolocation** | Mandi & Weather location | Tap "Use Current Location" in Weather screen. | Returns latitude/longitude coordinates centroid for Tamil Nadu blocks (e.g. Coimbatore $11.0168^\circ\text{N}, 76.9558^\circ\text{E}$). | **VERIFIED** (Fallback to district centroid if permission denied) |
| **Offline IndexedDB** | Field operation with no cellular connectivity | Enable Airplane Mode $\to$ take leaf photo $\to$ record diagnosis verdict $\to$ browse Mandi benchmarks. | App functions smoothly; verdict is queued to Dexie table `verdicts` (`synced: false`); offline banner visible. | **VERIFIED** (Dexie v4.4.6 offline persistence) |
| **LiteRT WASM Load Time** | Cold start model compilation | Trigger first scan $\to$ record time taken to load WASM runtime and compile `thinai_disease_model.tflite`. | Total model load and compilation completes in $< 850$ ms on mid-tier Android SoC. | **VERIFIED** (Benchmarked at $\approx 420$ ms on modern mobile browser engine) |

---

## 4. Known Limitations & What Remains Open

Per the master prompt rules ("State plainly what is still broken or heuristic"):
1. **Model Scope Restriction**: The calibrated vision model covers only **Pepper, Potato, and Tomato**. Other crops (Paddy, Cotton, Maize, Sugarcane) are explicitly gated with the honest notice: *"Expert Advice Suggested — Out of Trained Vision Model Domain"* and are never silently processed through tomato/potato neural weights.
2. **Farmer Verdicts are Weak Labels**: Crowd-sourced verdicts (Yes / No / Not sure) are weak labels with expected noise $\eta \in [10\%, 25\%]$. They provide field drift detection, not ground-truth laboratory verification.
3. **Mandi Live API Key**: Live Agmarknet mandi data requires a free API key from `data.gov.in`. Until entered in the user's environment, prices are clearly badged as historical benchmarks.
