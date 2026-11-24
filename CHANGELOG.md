# Changelog (`CHANGELOG.md`)

All notable changes to the THINAI application across all engineering phases are documented herein, adhering strictly to empirical verification standards without fabricated claims.

---

## [1.1.0] - 2026-11-24: Safety-Gated Advisory, Officer Review, Privacy & Localisation

### Phase 1: Safety Baseline and Architecture Audit
- Created `docs/SAFETY_BASELINE.md` cataloging existing gating (`IS_G4_FIELD_VALIDATED = false`), 3-tier gating structure, crop boundary enforcement, and established test suite baseline (31 suites, 126 tests).

### Phase 2: Evidence Registry and Advice-Tier Engine
- Created machine-readable `src/data/cropEvidenceRegistry.json` tracking 24 crop-disease entries with `FIELD_VALIDATED`, `LAB_ONLY`, and `UNSUPPORTED` evidence levels.
- Created `src/config/advicePolicy.ts` defining conservative thresholds (`CONFIDENCE_HIGH: 0.78`, `CONFIDENCE_MEDIUM: 0.45`, `ALLOW_CHEMICAL_ADVICE: false`, `MINIMUM_FIELD_SAMPLE_COUNT: 50`).
- Implemented `src/services/evidenceTierEngine.ts` to determine advice tiers dynamically at runtime without hardcoded component permissions.
- Added comprehensive unit tests in `tests/evidence_tier_engine.test.ts` (22 tests passing).

### Phase 3: Confidence, Uncertainty, and Referral Policy
- Created `src/services/uncertaintyService.ts` implementing normalized Shannon entropy, margin uncertainty, and combined uncertainty scoring.
- Integrated uncertainty gating into `src/services/litertInferenceService.ts` and `src/services/diseaseDetectionService.ts`, automatically demoting high-uncertainty ($U > 0.65$) diagnoses to Tier 3 officer referral.
- Added unit tests in `tests/uncertainty_scoring.test.ts` (12 tests passing).

### Phase 4: Officer Review Queue and Weak Feedback
- Implemented `src/services/weakFeedbackService.ts` treating farmer yes/no responses as weak signals for triage priority rather than ground-truth training labels (`canBeUsedForModelTraining: false` invariant guard).
- Implemented `src/services/officerQueueService.ts` computing a 5-weight review priority score ($w_1 \cdot \text{uncertainty} + w_2 \cdot \text{disagreement} + w_3 \cdot \text{unsupportedCrop} + w_4 \cdot \text{imageQuality} + w_5 \cdot \text{urgency}$).
- Implemented officer triage actions: Confirm Diagnosis, Correct Diagnosis, Mark Image Unusable, Needs More Information.
- Added unit tests in `tests/officer_queue_feedback.test.ts` (9 tests passing).

### Phase 5: Language Safety Gating
- Created `src/data/languageReviewStatus.json` registering all 23 Scheduled Indian languages; English and Tamil designated `HUMAN_VERIFIED` (`safetyContentVerified: true`), while the other 21 languages are marked `MACHINE_DRAFT`.
- Implemented `src/services/languageSafetyService.ts` to gate safety-critical chemical dosages, PPE, and waiting periods, automatically falling back to verified English/Tamil with prominent warnings.
- Added unit tests in `tests/language_safety_gating.test.ts` (9 tests passing).

### Phase 6: Symptom Question Flow and Offline Weather Advisory
- Created `src/data/symptomQuestions.json` providing up to 3 crop-specific offline clarifying questions in English and Tamil for Tomato, Potato, Pepper, Corn, and Paddy.
- Implemented `src/services/symptomQuestionService.ts` to evaluate structured farmer answers and adjust diagnostic confidence or route to an officer.
- Created `src/data/cropWeatherRules.json` with crop-specific fungal incubation and CIBRC spray drift / TNAU wash-off thresholds.
- Implemented `src/services/cropWeatherAdvisoryService.ts` evaluating 4 standardized agro-meteorological states with mandatory disclaimers.
- Added unit tests in `tests/symptom_questions_weather_rules.test.ts` (10 tests passing).

### Phase 7: Privacy-Preserving Photo Sharing
- Created `src/services/photoConsentService.ts` supporting 5 explicit sharing options: Full photo, Cropped leaf only, Blurred background, Metadata only, and Do not share.
- Enforced explicit consent capture with timestamp, purpose, retention period, separate GPS opt-in, and instant consent revocation.
- Added unit tests in `tests/photo_consent_privacy.test.ts` (6 tests passing).

### Phase 8: Officer Dashboard and Audit Logging
- Implemented `src/services/officerAuditService.ts` logging all advice shown, officer referrals, and officer decisions locally and to Cloud Firestore, with CSV export capability.
- Enhanced `src/app/components/OfficerDashboardScreen.tsx` with Priority Queue triage, Crop Coverage viewer, Language Safety viewer, and Audit Log explorer.
- Added unit tests in `tests/officer_audit_dashboard.test.ts` (5 tests passing).

### Phase 9: Localisation, Language Draft Marking, and Low-Literacy Support
- Added safety, consent, symptom question, and low-literacy keys to `src/app/translations.ts` across English, Tamil, Hindi, Telugu, Kannada, and Malayalam.
- Synchronized all 23 locale JSON files in `locales/` with explicit `_translationMeta` markings for machine drafts.
- Enhanced `src/services/voiceAssistant.ts` with static approved safety speech templates (`APPROVED_SAFETY_SPEECH_TEMPLATES` and `speakApprovedSafetyPrompt`), restricting voice instructions strictly to verified English and Tamil templates.
- Added unit tests in `tests/localisation_low_literacy.test.ts` (6 tests passing).

### Phase 10: Documentation, Evaluation Protocol, and Android Release Compilation
- Authored comprehensive architecture and governance documents: `docs/ARCHITECTURE.md`, `docs/SAFETY_POLICY.md`, and `docs/EVALUATION_PLAN.md`.
- Documented the empirical lab-to-field performance drop ($94.2\%$ lab vs $25.6\%$ field on $N=125$ PlantDoc images) and established the 4-gate criteria for future field validation.
- Validated complete test suite: 33 test files, 216 tests passing, 0 TypeScript errors.
- Compiled native Android Release APK (`android/app/build/outputs/apk/release/app-release.apk`).

---

## [1.0.0-rc] - 2026-10-24

### Phase 1: Security Hardening, Governance & Gating Invariants
- **Security & Keystore Governance**:
  - Removed test phone numbers (`9876543210`) and OTP hints (`123456`) from production builds (`import.meta.env.DEV` guard).
  - Confirmed `/officers` collection strictly prohibits client writes (`allow create, update, delete: if false;`).
  - Audited full git history for exposed keys; formally retired legacy keystore and externalized release signing to GitHub Actions CI secrets.
  - Purged stale local APK binaries; release tracking restricted to CI-built artifacts.
- **Firebase Security Rules**:
  - Re-implemented `scripts/test_firestore_rules.mjs` against the official Firebase Emulator Suite (`@firebase/rules-unit-testing@6.0.0`). 23/23 security assertions passing.
- **Selective Gating & Out-of-Domain (OOD) Safety**:
  - Implemented interactive pre-diagnosis crop selection across Tomato, Potato, Pepper, Paddy, Cotton, and Corn.
  - Added probability mass ($< 0.40$) and class prefix rejection in `litertInferenceService.ts`.
  - Built automated OOD evaluation suite (`tests/ood_safety.test.ts`): 100% of non-crop imagery rejected to Tier 3 Inconclusive with 0 chemical remedy recommendations.
  - Prepended `[PILOT SAFEGUARD - REQUIRES OFFICER CONFIRMATION]` to all chemical remedies.
- **Simulation Protocol Disclosures**:
  - Renamed `ml/evaluate_protocol.py` to `ml/simulate_protocol.py`, labeled outputs `SIMULATION`, and purged synthetic metric numbers ($89.4\%$, $84.7\%$, $12.40\%$, etc.) from documentation.

### Phase 2: Open-Source Architecture & Reuse Study
- Studied LeafLife (MIT), FarmerChat (Apache-2.0), farmOS (GPL-2.0, reference only), Podoco, and Plant-Planet.
- Authored `docs/REUSE_PLAN.md` with explicit attribution, feature comparisons, and risk assessments.

### Phase 3: Core Agricultural Feature Implementation
- **Diagnosis & Disease Library**:
  - Offline-first scan history with live search and filtering.
  - Bilingual (English & Tamil) disease library curated from verified TNAU/ICAR agronomic guides, with transparent UNVERIFIED status labels.
- **Agronomic Assistant**:
  - Replaced generic LLM mock templates with vector retrieval over verified TNAU and ICAR extension publications with explicit citations.
  - Added refusal guard: queries outside curated agricultural knowledge return: *"I don't have verified information; ask your extension officer"*.
- **Weather & Advisory Engine**:
  - Open-Meteo live API integration with deterministic spray safety and irrigation rules.
  - Cached offline mode with transparent age indicators.
- **Market Intelligence**:
  - Live Agmarknet mandi auction feed via `data.gov.in` API with statutory MSP benchmark comparisons.
  - Transparent `PRICE_UNAVAILABLE` fallback when offline or unindexed.
- **Farm Records (farmOS Concept, Own Code)**:
  - Offline-first Dexie IndexedDB storage for farm plots, crops, sowing dates, spray logs, and expense tracking.
  - Mutation sync queue with idempotent reconnect handling.
- **Dead Route & Code Pruning**:
  - Pruned unused routes (`"reports"`, `"settings"`, `"help"`, `"voice"`, `"weather"`), fixed dead bell button navigation, and purged mock listings (`docs/REMOVED.md`).

### Phase 4: Farmer Adverse Stress Testing & Accessibility
- Simulated first-time farmer mobile workflow ($360\times 800$, Tamil & English, landscape rotation, 200% text zoom, network dropouts).
- Identified and fixed 11 bugs with dedicated regression tests:
  - **BUG-01**: Password toggle accessible name and $\ge 44\text{ px}$ target (`tests/auth_a11y_regression.test.ts`).
  - **BUG-02**: Auth divider text color contrast to meet WCAG AA (`tests/auth_a11y_regression.test.ts`).
  - **BUG-03**: Modal close buttons accessible name and $\ge 44\text{ px}$ tap targets (`tests/modal_a11y_regression.test.ts`).
  - **BUG-04**: Negative acreage input clamping in Fertilizer Calculator (`tests/fertilizer_calculator_regression.test.ts`).
  - **BUG-05**: Missing semantic `<main role="main">` landmark (`tests/main_landmark_regression.test.ts`).
  - **BUG-06**: Strict positive numerical validation on Plot Area and Expenses (`tests/farm_records_validation_regression.test.ts`).
  - **BUG-07**: Removal of hardcoded sample community posts to expose honest empty state (`tests/community_posts_regression.test.ts`).
  - **BUG-08**: Top header bell button accessible name, $\ge 44\text{ px}$ size, and document `<h1>` (`tests/header_a11y_regression.test.ts`).
  - **BUG-09**: Weather advisory text contrast and refresh button tap target (`tests/weather_card_a11y_regression.test.ts`).
  - **BUG-10**: `BkHdr` back button accessible name and MarketScreen heading hierarchy (`tests/bkhdr_market_a11y_regression.test.ts`).
  - **BUG-11**: WCAG 2.5.3 (Label in Name) compliance for offline status and weather refresh buttons (`tests/header_a11y_regression.test.ts`).
- Achieved **0 axe-core violations** across all tested screens and **100/100 Accessibility & Best Practices** on mobile Lighthouse.

### Phase 5: CI Release Build & Android Target Verification
- Downloaded and verified CI-built release APK (`app-release.apk`) from GitHub Actions Run `#39423016062` (SHA-256: `1143c24b9ccb30dd95b110d22bd92c678571e16110f221304ab00b75531e2a98`).
- Booted physical/emulated Android 16.0 (API 36) AVD `THINAI_API_36`.
- Verified native Capacitor bridge, camera permission, gallery pick, offline airplane mode toggle, language switch, portrait/landscape rotation, and background/resume.
- Executed 5,000-event monkey stress test (`adb shell monkey -p com.thinai.agriapp --throttle 300 -v 5000`): 0 crashes, 0 ANRs. Attached $23.6\text{ MB}$ logcat in `docs/logcat_monkey_phase5.log`.
- Audited Android WebView: single-threaded WASM and WebGPU operational; documented that threaded WASM is disabled due to missing `crossOriginIsolated` headers in Android WebView.

### Phase 6: Desktop Packaging (Electron)
- Wrapped web build in Electron for Windows x64.
- Generated NSIS Windows installer: `dist-electron/THINAI Setup 0.0.1.exe` (SHA-256: `1fd5f6a056bd91ffc50897f79f7cdec57ce36ee0051f1410311d974422a78a88`).
- Documented desktop capabilities: HTML5 media fallback, offline model loading from local assets, absence of auto-updater, and unsigned SmartScreen notice.
- Created `THIRD_PARTY_LICENSES.md` recording MIT and Apache-2.0 attributions.

### Phase 7: Convergence, Documentation & Release Dossier
- Re-verified all test suites: `tsc` exits 0, Vite build exits 0, 120 Vitest unit tests pass (23 suites), 26 Playwright E2E tests pass.
- Updated `README.md`, `CHANGELOG.md`, `REMOVED.md`, and regenerated `THINAI_STATUS_FOR_CLAUDE.md`.
- Consolidated release deliverables with cryptographic SHA-256 checksums.

### Phase 2B: Crop Coverage Expansion & Registry
- **Crop Registry Infrastructure**:
  - Authored `data/crop_registry.json` covering 21 major Indian crops with botanical, English, and Tamil names, pathology classes, and dataset licenses.
  - Established formal audit taxonomy: Status A (Field-validated), Status B (Trained on public dataset; no field validation), and Status C (No model; immediate AAO referral).
  - Built `src/services/cropPackService.ts` for modular on-demand neural weights packaging with SHA-256 integrity checks and storage quota verification.
  - Added dedicated test suite `tests/crop_coverage_phase2b.test.ts` (10 tests).

### Multilingual Release Candidate (All 22 Scheduled Languages + English)
- **23-Language Universal Architecture**:
  - Expanded advisory language support from English and Tamil to English plus all 22 Eighth Schedule languages of India: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu, and Urdu.
  - Generated bundled offline locale files (`locales/<codeRef>.json`) ensuring 100% offline availability without runtime chunk downloads.
  - Implemented dynamic RTL layout (`dir="rtl"`) for Urdu, Kashmiri, and Sindhi with mirrored layouts in `public/fonts/fonts.css`.
  - Added open-licence (OFL 1.1) Noto font stacks for 12 Indian script families to guarantee zero tofu characters (`□`).
  - Enforced strict remedy safety gating: remedy names, dosages, and chemical advice appear strictly in `REVIEWED` languages (English). In all `MACHINE-DRAFT` languages, advice is displayed in English with a mandatory native warning.
  - Implemented `LanguageDropdown` combobox and `TranslationErrorReportModal` with local Dexie queue and Firestore `/translation_reports` storage.
  - Authored `docs/LANGUAGES.md`, `docs/FEATURE_MATRIX.md`, and automated parity/switch test suites (`tests/multilingual_parity.test.ts`, `e2e/multilingual_switch.spec.ts`).
