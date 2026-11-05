# THINAI Project Knowledge Packet: Index & Overview

**Document Target**: External Auditor / Reviewer Knowledge Packet  
**Target Audience**: Claude (AI Reviewer without repository access or runtime execution capability)  
**Date Generated**: 2026-11-04  
**Tested Repository Head Commit**: `cde89aa930127fe1c7afa708aae4ed6d18a5af57` (`cde89aa`)  
**Verified Evidence Anchor Commit**: `5c74517053e7f66bb7818cdecc503918af7fc4a9` (`5c74517`)  
**Repository URL**: `https://github.com/Swastikan-11/THINAI.git`  
**Repository Visibility**: Public (`"private": false`)  
**Node.js Version**: `v24.21.0`  
**npm Version**: `11.19.0`  

---

## 1. One-Paragraph Plain Summary

THINAI (*Technology for Holistic Intelligent Nurturing of Agricultural Intelligence*, Tamil: திணை) is an offline-first agricultural decision-support application designed for smallholder farmers and agricultural extension officers in Tamil Nadu, India. It combines client-side computer vision disease diagnosis (running an on-device quantized MobileNetV2 model via Google LiteRT.js WebAssembly), agronomic weather and spray risk alerts (Open-Meteo API), benchmark wholesale market price tracking (Agmarknet), and local farm recordkeeping with IndexedDB offline queue synchronization (Dexie.js). Today, THINAI can execute offline on-device leaf disease inference across 38 PlantVillage classes, reject non-leaf or out-of-domain images, track local farm plots/expenses, and fetch real-time weather and spray advisory windows. However, it cannot safely prescribe chemical treatments in field conditions because empirical field evaluation on Indian farm photography (PlantDoc benchmark, $N=125$) achieves only 25.60% top-1 accuracy (95% Wilson CI: [18.66%, 34.02%]) and high miscalibration (ECE = 0.4049). Consequently, all chemical pesticide recommendations are gated off in code (`IS_G4_FIELD_VALIDATED = false`), all 11 disease remedy entries remain marked UNVERIFIED pending agronomist signature, all 22 non-English language translations are machine-drafts, and the system fails readiness gates G4 and G10.

---

## 2. Table of Contents & Dossier Map

| File Name | Title & Primary Scope | File Size / Character Count |
| :--- | :--- | :--- |
| `00_INDEX.md` | Table of contents, commit SHA, environment metadata, summary, unverified claims registry | Current file |
| `01_PRODUCT_AND_USERS.md` | Mission, Tamil naming etymology, user personas, end-to-end user journeys, screenshot references, failure states | ~18,000 chars |
| `02_ARCHITECTURE.md` | Exact dependency versions, Mermaid architecture diagram, scan data flow, directory map, offline sync queue, Firestore schema, environment variables, CI/CD pipeline | ~25,000 chars |
| `03_ML_AND_ADVISORY.md` | MobileNetV2 architecture, 39 classes, preprocessing, calibration, gating tiers, OOD rejection, 21-crop registry, remedy database status, empirical field metrics vs. simulations | ~26,000 chars |
| `04_FEATURES_STATUS.md` | Feature matrix: 18 features audited with online/offline behavior, data sources, test evidence, status (WORKING / PARTIAL / NOT BUILT / REMOVED) | ~24,000 chars |
| `05_LANGUAGES.md` | 23-language registry (Eighth Schedule), script families, RTL configuration, translation source, typography system, remedy safety invariant | ~16,000 chars |
| `06_TESTING_AND_GATES.md` | G1–G10 criteria, verbatim `verify_gates.mjs` output, test suite execution counts, Android 16 emulator monkey run, APK signing, bug registry, NOT TESTED list | ~26,000 chars |
| `07_SECURITY_PRIVACY_LEGAL.md` | Secrets history, gitleaks audit, npm audit advisories, authentication quotas, DPDP Act privacy safeguards, dataset licenses, third-party software licenses | ~21,000 chars |
| `08_STATUS_SUMMARY.md` | Project health assessment: verdict line, what genuinely works, what does not, 10 ranked risks, owner dependencies, free-tier limits, release readiness verdict | ~22,000 chars |
| `09_ROADMAP.md` | Phased roadmap (Upcoming 1–4w, Near-term 1–3m, Future 3–12m), labeled COMMITTED / PROPOSED / DEPENDS ON OWNER, priority action list | ~20,000 chars |
| `10_QUESTIONS_FOR_CLAUDE.md` | Strategic decisions requiring external architectural and agronomic judgment, with options and recommendations | ~15,000 chars |
| `11_GLOSSARY_AND_FILE_MAP.md` | Technical glossary (tiers, gates, crop status, ECE, Wilson score, LWW) and comprehensive concept-to-file mapping | ~16,000 chars |

---

## 3. Unverified Claims Registry

In compliance with standing instructions, every claim lacking verifiable proof in repository files, automated tests, or execution logs is cataloged here:

1. **Longitudinal Smallholder Economic Impact**: Any assertion that THINAI increases smallholder yield or reduces input expenditure in real Tamil Nadu farming seasons is UNVERIFIED. No longitudinal field trial has been conducted.
2. **Native Agronomic Review of 22 Scheduled Indian Languages**: Any claim that translations for Tamil (`ta`), Hindi (`hi`), Bengali (`bn`), or other regional languages are agronomy-approved is UNVERIFIED. All 22 non-English dictionaries are tagged `MACHINE-DRAFT` in `locales/status.json`.
3. **Physical Smartphone Native Performance**: Any claim that THINAI executes at native 60fps on physical low-end Android hardware is UNVERIFIED. Testing was performed on an Android 16 (API 36) Google APIs x86_64 emulator via WHPX; physical phone testing is recorded as `NOT TESTED` in `evidence/G7.json`.
4. **Agronomist Chemical Sign-Off**: Any claim of an officially endorsed chemical fungicide or insecticide prescription is UNVERIFIED. All 11 entries in `src/services/litertInferenceService.ts` and `src/services/diseaseDetectionService.ts` have `verificationStatus: "UNVERIFIED (Awaiting Agronomist Sign-Off)"` with empty `reviewerName`.
5. **ARFI Live Production Training on Crop Yields**: As stated in `ARFI.md` and `docs/FEATURE_MATRIX.md`, ARFI is an analytical heuristic stress-simulation metric; claims of training on empirical harvest loss data are UNVERIFIED.

