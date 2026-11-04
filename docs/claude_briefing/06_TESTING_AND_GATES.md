# THINAI Quality Gates, Verification Evidence & Bug Registry

**Document Target**: Verification Scorecard, Automated Test Counts, Android/Desktop Artifacts & Defect Log  
**Context**: Evaluated on commit `861aaca` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `READINESS_CRITERIA.md`, `scripts/verify_gates.mjs`, `evidence/G*.json`, `BUGS.md`, `docs/GATE_CHANGE_PROPOSAL.md`  

---

## 1. Verbatim Output of `node scripts/verify_gates.mjs`

### 1.1 Evaluated on Tested HEAD (`861aaca`)
```text
THINAI IS NOT READY - failing gates: G1, G2, G3, G4, G5, G6, G7, G8, G9, G10.
```
*(Explanation: `verify_gates.mjs` requires exact commit SHA matching in `evidence/*.json`. Because evidence files were sealed at commit `5c74517`, checking without `--sha` against HEAD `861aaca` triggers stale SHA failure across all 10 gates).*

### 1.2 Evaluated at Evidence Commit `5c74517` (`node scripts/verify_gates.mjs --sha 5c74517`)
```text
THINAI IS NOT READY - failing gates: G4, G10.
```

---

## 2. Gates G1 through G10: Exact Definitions & Current Results

Definitions transcribed exactly from `READINESS_CRITERIA.md`:

| Gate ID | Gate Name | Measurable Pass Threshold | Result | Concrete Evidence File & Key Metrics |
| :---: | :--- | :--- | :---: | :--- |
| **G1** | **Code Quality & Build** | `tsc --noEmit` exits 0; production Vite bundle builds without errors. | **PASS** | `evidence/G1.json`: Exit code 0, 0 errors, build completed in 4.79s, bundle size 2,162.62 kB (gzip 553.42 kB). *(Note: Uncommitted working-tree edits in App.tsx currently cause tsc failure; clean commit 5c74517 passes).* |
| **G2** | **Automated Test Suites** | All unit, E2E, and security rule suites pass without regression. | **PASS** | `evidence/G2.json`: Vitest passed 25 suites (137 tests), 0 failed; Firestore emulator passed 23 assertions, 0 failed. |
| **G3** | **Dataset Provenance & Leakage Proof** | Cryptographic hash check proving no image overlap between calibration and held-out test splits; distinct separation of lab vs. field data. | **PASS** | `evidence/G3.json`: dHash perceptual deduplication check; 134 OOD images evaluated; full OOD rejection rate to Tier 3. |
| **G4** | **Field ML Performance & Calibration** | Empirical accuracy, macro-F1, and ECE measured on real field images; simulation parameters not used as field findings. | **FAIL** | `evidence/G4.json`: Evaluated on 125 PlantDoc field photos: Empirical Accuracy = **25.60%** (95% Wilson CI: [18.66%, 34.02%]), Macro-F1 = 0.2177, ECE = **0.4049** ($T^*=1.28$). Pilot thresholds unapproved by owner. |
| **G5** | **Selective Gating & Safety Invariants** | Zero chemical remedy emitted in Tiers 2 and 3; all Tier 1 remedies cited with official TNAU/ICAR document and exact dilution dosage. | **PASS** | `evidence/G5.json`: 200 random input trials in `tests/gating_engine.test.ts` emitted 0 chemical advice in Tier 2/3; full OOD rejected; Tier 1 disabled while G4 fails; unverified remedy disclaimer enforced. |
| **G6** | **Offline Capability & Sync** | App shell loads in Airplane mode from Service Worker; on-device inference runs locally; FIFO queue flushes with Last-Write-Wins conflict resolution. | **PASS** | `evidence/G6.json`: 12 offline matrix tests passed; 7 reconnect sync tests passed; FIFO order verified; LWW conflict resolution verified; emergency cache eviction on QuotaExceededError verified. |
| **G7** | **Mobile Native & Android 16 on Target** | Signed APK executed on physical Android 16 device or API 36 emulator with recorded logcat and feature run. | **PASS** | `evidence/G7.json`: Android 16 (API 36) Google APIs x86_64 emulator booted; CI release APK installed; 5,000-event monkey stress test completed with 0 fatal crashes, 0 ANRs (`docs/monkey_ci_release_output.txt`). |
| **G8** | **Live Network Services & Transparent Fallbacks** | Live weather API verified; live market fallback transparently labeled; live Gemini authenticated or marked heuristic; ARFI deployment honest. | **PASS** | `evidence/G8.json`: Open-Meteo live API latency 135ms; Agmarknet fallback labeled "Benchmark Price"; assistant curated retrieval verified; unverified query refusal tested. |
| **G9** | **Security, Keystore & Zero Committed Secrets** | Compromised keystores purged; release passwords externalized to CI secrets; zero `.env` files in git history; Firestore security rules pass; CI APK signed with non-debug certificate. | **PASS** | `evidence/G9.json`: CI release APK signed with production certificate (`CN=THINAI Production Release`, SHA-256 `5a5b2ea2cbe3e4ab7c6dff0267b3e2b78115836419c367965915fcb50a201cc4`); 23/23 emulator rules pass; compromised key `d774219` retired. |
| **G10** | **Field Pilot Protocol & Extension Dashboard** | Pre-registered field pilot protocol; dual-agronomist ground truth; pilot threshold values signed off by project owner. | **FAIL** | `evidence/G10.json`: Pilot protocol pre-registered in `PILOT_PROTOCOL.md`, but threshold parameters (`tau_high`, `tau_low`) are marked PROPOSED-BY-AGENT and have not been formally approved or signed off by owner. |

---

## 3. Pending Gate Architecture Change Proposal (`docs/GATE_CHANGE_PROPOSAL.md`)

To avoid altering the historical definitions of G1–G10, the repository proposes adding three **Extended Release Dimensions**:
* **G11 (Desktop Packaging - Windows x64)**: Clean NSIS installer build (`dist-electron/THINAI Setup 0.0.1.exe`, 179.4 MB); launches offline without remote dependency; unsigned status documented.
* **G12 (Multilingual Architecture & RTL)**: 23 languages bundled; native scripts; RTL layout for Urdu, Kashmiri, Sindhi; remedy safety invariant (English fallback for unreviewed languages); error report modal.
* **G13 (Crop Coverage Registry & Packs)**: Official registry tracking 21 crops; modular pack generation; chemical remedies withheld for Status B and C crops.
* **Status**: Awaiting repository owner approval (`[ ] APPROVE / [ ] REJECT`).

---

## 4. Comprehensive Test Counts & Execution Summary

### 4.1 TypeScript & Build
* `npx tsc --noEmit`: 0 errors at commit `5c74517`. *(Current working tree has 11 uncommitted TypeScript errors in `src/app/App.tsx`)*.
* Production Web Bundle (`npm run build`): Completed in 4.79s. Bundle: `dist/assets/index-yiSHkH0w.js` (2,162.62 kB raw, 553.42 kB gzip).

### 4.2 Vitest Unit & Regression Suites (`npx vitest run`)
At verified commit `5c74517` / `bef9ab5`:
* **Total Suites**: 25 passed (25)
* **Total Tests**: 137 passed (137), 0 failed
* **Detailed Breakdown**:
  1. `tests/gating_engine.test.ts` (8 tests) — Gating logic & Tier 1 G4 safety disabling
  2. `tests/calibration_maths.test.ts` (8 tests) — Temperature scaling & ECE computation
  3. `tests/crop_coverage_phase2b.test.ts` (10 tests) — Crop registry & packs
  4. `tests/farm_records_dexie.test.ts` (9 tests) — Dexie relational tables
  5. `tests/reconnect_sync.test.ts` (7 tests) — Offline sync, FIFO & LWW
  6. `tests/diagnosis_history_library.test.ts` (8 tests) — Disease catalog & history
  7. `tests/dead_routes_pruned.test.ts` (4 tests) — Pruned prototype dead routes
  8. `tests/weather_spray_irrigation.test.ts` (10 tests) — Open-Meteo wash-off rules
  9. `tests/market_agmarknet.test.ts` (8 tests) — Agmarknet mandi provenance
  10. `tests/multilingual_parity.test.ts` (6 tests) — 23-language schema symmetry & RTL
  11. `tests/ai_assistant_retrieval.test.ts` (9 tests) — Curated TNAU/ICAR retrieval
  12. `tests/i18n_parity.test.ts` (6 tests) — Key symmetry
  13. `tests/ood_safety.test.ts` (2 tests) — full rejection of non-leaf photos
  14. `tests/wilson_interval.test.ts` (4 tests) — Analytical Wilson score intervals
  15. `tests/officer_dashboard.test.ts` (4 tests) — Extension officer collection & triage
  16. `tests/auth_a11y_regression.test.ts` (3 tests) — Auth contrast & tap targets
  17. `tests/header_a11y_regression.test.ts` (5 tests) — Header accessibility & labels
  18. `tests/weather_card_a11y_regression.test.ts` (3 tests) — Weather card WCAG contrast
  19. `tests/modal_a11y_regression.test.ts` (2 tests) — Modal close touch targets ($\ge 44\text{ px}$)
  20. `tests/bkhdr_market_a11y_regression.test.ts` (2 tests) — Heading hierarchy
  21. `tests/community_posts_regression.test.ts` (2 tests) — Honest empty state
  22. `tests/fertilizer_calculator_regression.test.ts` (2 tests) — Acreage input clamping
  23. `tests/farm_records_validation_regression.test.ts` (2 tests) — Positive numeric validation
  24. `tests/main_landmark_regression.test.ts` (1 test) — Semantic `<main>` landmark
  25. `tests/offline_matrix.test.ts` (12 tests) — Offline service matrix

*(On the current uncommitted working tree with modified `src/app/App.tsx`, 18 suites pass and 7 fail due to reverted accessibility attributes).*

### 4.3 Real Firestore Emulator Security Rules
* Command: `node scripts/test_firestore_rules.mjs`
* Results: **23 assertions passed (23)**, 0 failed.

### 4.4 Backend FastAPI & ARFI Tests
* Command: `pytest backend/app/tests`
* Results: **16 passed in 17.40s** (0 failed). Tests include user auth, farm plot CRUD, market feed, ARFI stress testing, and closed-loop feedback.

### 4.5 Playwright E2E Tests (`npx playwright test`)
* Field Evaluation (`e2e/field_evaluation.spec.ts`): 125 field images evaluated.
* Offline Scenarios (`e2e/offline_scenarios.spec.ts`): O4-1 through O4-5 pass (DOM loads in 6ms offline).

---

## 5. Android Emulator & Physical Device Status

* **Android Emulator (TESTED & PASS)**:
  * Device: Android 16.0 (API 36) Google APIs x86_64 Emulator via Windows Hypervisor Platform (WHPX).
  * AVD Name: `THINAI_API_36`.
  * Installation: Clean install of release APK (`docs/ci_release_apk/app-release.apk`).
  * Monkey Stress Test: 5,000 UI events injected at 300ms throttle.
  * Dropped Events: `keys=0, pointers=0, trackballs=0, flips=10, rotations=0`.
  * Crashes / ANRs: **0 fatal exceptions, 0 Application Not Responding (ANRs)**. Log recorded in `docs/logcat_ci_release_monkey_g7.log` (16.2 MB) and output in `docs/monkey_ci_release_output.txt`.
  * Functional Flows Executed (12/12): First run, login, crop selection, pushed gallery scan, history view, airplane mode scan, reconnect sync, language menu, landscape rotation, background/resume, kill/restart, 5k monkey.
* **Physical Smartphone Hardware**:
  * **Status: NOT TESTED**. No real physical phone execution logs exist in repository. Awaiting owner hardware logs.

---

## 6. Android Release Signing Status (`apksigner`)

Verified directly on `docs/ci_release_apk/app-release.apk` (SHA-256: `4BB7C6DFBE26A3B514FA91CE29AB20511D6369BD5D43F7200A29C07A9223E691`):
* **Signer Scheme**: Android APK Signature Scheme v2 (Verified = true).
* **Certificate Subject DN**:
  `CN=THINAI Production Release, OU=Agronomy Mobile Engineering, O=THINAI Open Source Initiative, L=Coimbatore, ST=Tamil Nadu, C=IN`
* **Certificate SHA-256 Fingerprint**:
  `5a5b2ea2cbe3e4ab7c6dff0267b3e2b78115836419c367965915fcb50a201cc4`
* **Keystore Ownership**: SWASTIKAN C (`swastikan.2401246@srec.ac.in`).
* **Backup Location**: `C:\Users\cswas\.thinai_keys\thinai-prod-release.keystore`.
* **Compromised Historical Key**: Key committed in historical commit `d774219` has been permanently retired and never signed any distributed release APK.

---

## 7. Windows Desktop Packaging Status

* **Installer Artifact**: `dist-electron/THINAI Setup 0.0.1.exe`.
* **File Size**: `179,429,818 bytes` (~$171.1\text{ MB}$).
* **Binary SHA-256**: `1FD5F6A056BD91FFC50897F79F7CDEC57CE36EE0051F1410311D974422A78A88`.
* **Execution Status**: Launches offline on Windows 10/11 x64, compiles WASM model, renders UI shell (`docs/screenshots/windows_exe_launch.png`).
* **Signing Status**: **Unsigned** (no commercial Authenticode EV certificate; Windows SmartScreen displays unknown publisher alert).

---

## 8. Defect Registry (Open & Fixed Bugs)

Audited from `BUGS.md`:

| Bug ID | Severity | Summary | Fixed In Commit | Test Verification |
| :--- | :---: | :--- | :---: | :--- |
| **BUG-01** | Medium | Auth password toggle lacked `aria-label` and $<44\text{px}$ target | `0ecde6d` | `tests/auth_a11y_regression.test.ts` |
| **BUG-02** | Medium | Auth divider text had 2.41:1 contrast (WCAG AA failure) | `0ecde6d` | `tests/auth_a11y_regression.test.ts` |
| **BUG-03** | Medium | Modal close buttons lacked `aria-label` and $<44\text{px}$ target | `9a87aac` | `tests/modal_a11y_regression.test.ts` |
| **BUG-04** | High | Fertilizer calculator accepted negative/zero acreage | `2b40c27` | `tests/fertilizer_calculator_regression.test.ts` |
| **BUG-05** | Low | Screen router content lacked semantic `<main>` landmark | `dee270b` | `tests/main_landmark_regression.test.ts` |
| **BUG-06** | High | Farm records accepted negative plot area and expense amounts | `bdd3baa` | `tests/farm_records_validation_regression.test.ts` |
| **BUG-07** | High | Community screen rendered hardcoded dummy sample posts | `8b3eea0` | `tests/community_posts_regression.test.ts` |
| **BUG-08** | Medium | Header notification bell button lacked `aria-label` and $<44\text{px}$ target | `7c016ae` | `tests/header_a11y_regression.test.ts` |
| **BUG-09** | Medium | Weather card text had 2.7:1 contrast; refresh button $<44\text{px}$ | `855dc20` | `tests/weather_card_a11y_regression.test.ts` |
| **BUG-10** | Medium | Market back button lacked `aria-label`; heading skipped level | `783cbb5` | `tests/bkhdr_market_a11y_regression.test.ts` |
| **BUG-011**| P0 (Blocker)| Out-of-domain images silently mapped to tomato/potato classes | `254dac6` | `tests/ood_safety.test.ts` (full rejected) |
| **BUG-015**| P2 (Medium)| Base64 thumbnail inflation exceeded Firestore string limit | `254dac6` | Capped at $\le 45\text{ KB}$ binary ($\le 60\text{ KB}$ base64) |
| **BUG-016**| P1 (High) | Double pixel normalization collapsed Float32 buffer to $-1.0$ | `254dac6` | Raw $[0, 255]$ fed to graph internal `preprocess_input` |
| **BUG-OPEN-1**| **P1 (High)** | **Working tree dirty**: Uncommitted modifications in `src/app/App.tsx` and `AuthScreens.tsx` break tsc compilation and fail 7 vitest suites. | **OPEN** | Requires git restore or clean commit to restore passing test state. |
| **BUG-OPEN-2**| **P0 (Blocker)**| **Field accuracy collapse**: MobileNetV2 achieves 25.60% accuracy on field photography (G4 FAIL). | **OPEN** | Documented in `docs/MODEL_IMPROVEMENT_PLAN.md`; Tier 1 disabled. |
| **BUG-OPEN-3**| **P1 (High)** | **Pilot thresholds unapproved**: $\tau_{\text{high}}$ and $\tau_{\text{low}}$ unapproved by owner (G10 FAIL). | **OPEN** | Documented in `PILOT_PROTOCOL.md`. |

---

## 9. Comprehensive NOT TESTED List

1. **Physical Android Hardware**: Zero execution logs or recordings on physical smartphones. All mobile tests executed on Android 16 API 36 Google APIs x86_64 emulator.
2. **Native Human Agronomic Review of 22 Scheduled Indian Languages**: All 22 non-English language dictionaries are machine-drafts; human agronomist review is unperformed.
3. **Multi-User Production Concurrency on Firebase Spark**: Concurrency and read quotas tested on local Firestore emulator; simultaneous multi-officer field usage has not been run against live Firebase Spark production quotas.
4. **Longitudinal Smallholder Farm Economic Trials**: Zero seasonal harvest trials measuring yield difference or chemical cost reduction.
5. **iOS / Apple Device Execution**: No iOS build or testing has been performed.
