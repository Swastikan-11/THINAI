# THINAI Release Candidate — Feature & Screen Matrix (Step 3)

**Specification Date:** October 2026  
**Applicable Build:** Multilingual Release Candidate (English + 22 Scheduled Indian Languages)  
**Strict Standing Rule:** Zero fabricated fallback numbers, zero synthetic chart points, zero dummy listings. Where real data is unavailable, honest "Data unavailable" or empty states are displayed.

---

## 1. Screen & Navigation Matrix

| Screen ID | Screen Name / Purpose | Primary Route / View | Offline Support | Data Source | Empty / Unavailable State Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `splash` | Application initial boot & profile resolution | Launch route | **YES** | LocalStorage / IndexedDB | Instant transition to login or home |
| `login` | Farmer & Extension Officer authentication | `/?screen=login` | **PARTIAL** | Firebase Auth | Displays clean offline warning with guidance to connect |
| `register` | Farmer account registration & credentials creation | `/?screen=register` | **NO** | Firebase Auth + Firestore | Network required badge; validates input fields locally |
| `onboarding` | 5-step farm setup (district, soil, acreage, crop, irrigation) | `/?screen=onboarding` | **YES** | IndexedDB Dexie `profiles` | Offline queue with pending sync badge |
| `home` | Primary farm dashboard: weather, spray rule, decision, ARFI | `/?screen=home` | **YES** | Open-Meteo, Dexie, Heuristic Engine | Last cached forecast with age; spray advice disabled without weather |
| `doctor` | 3-step plant disease diagnosis with crop gating & on-device WASM | `/?screen=doctor` | **YES** | On-Device LiteRT (MobileNetV2 WASM) | Clear rejection for OOD crops; Tier 1/2/3 honest confidence scores |
| `disease` | Disease diagnosis detail view with verified remedies & citations | `/?screen=disease` | **YES** | Curated TNAU/ICAR remedy database | Unreviewed languages show English remedies with expert review notice |
| `library` | Pest and disease reference directory with bilingual search | `/?screen=library` | **YES** | Bundled offline agronomic catalog | "No matching pests or diseases found" with query reset |
| `calculator` | NPK fertilizer nutrient requirement calculator | `/?screen=calculator` | **YES** | Deterministic TNAU crop calculation rules | Validates non-negative inputs; defaults to 0kg with validation notice |
| `whatif` | Agro-climatic resilience stress-testing lab | `/?screen=whatif` | **YES** | Deterministic fragility simulation model | Displays calculated fragility indices across parameter ranges |
| `schemes` | Central & Tamil Nadu state agricultural welfare schemes | `/?screen=schemes` | **YES** | Bundled verified government schemes directory | Category filters with clear empty state if no schemes match |
| `services` | Custom hiring centers, machinery board, extension AAO contacts | `/?screen=services` | **YES** | Local directory + Firestore equipment listings | Honest empty equipment list with "List Your Equipment" prompt |
| `ai` | Agronomic assistant with verified citations (TNAU/ICAR/CIBRC) | `/?screen=ai` | **YES** | Bundled curated agronomic vector database | Strict fallback: "I don't have verified information; ask extension officer" |
| `market` | Agmarknet wholesale mandi prices with timestamp & provenance | `/?screen=market` | **PARTIAL** | data.gov.in Agmarknet API | "Price Unavailable" state with provenance note; ZERO fake numbers |
| `records` | Farm record keeping: plots, crops, sowing, spray logs, expenses | `/?screen=records` | **YES** | 100% Offline-First IndexedDB Dexie | Empty tables with prominent "+ Add Plot" / "+ Log Spray" buttons |
| `profile` | Farmer farm parameters, district selection, advisory language | `/?screen=profile` | **YES** | LocalStorage + Dexie `profiles` | Preserves last saved settings offline |
| `officer` | Extension officer verification triage, ground-truth label submission | `/?screen=officer` | **PARTIAL** | Cloud Firestore `/diagnoses`, `/expert_labels` | Honest empty state in production when offline; DEV sample fallback |
| `fieldAccuracy` | Empirical model accuracy monitor, confusion matrix, Wilson CIs | `/?screen=accuracy` | **YES** | Local verdict log + Dexie store | Enforces "Not enough data" barrier (<10 samples); shows Wilson intervals |

---

## 2. Interactive Modals & Overlays

| Modal / Overlay Component | Trigger / Purpose | Offline Support | Backing Store | Safety & Integrity Invariants |
| :--- | :--- | :--- | :--- | :--- |
| `LanguageDropdown` | Language selector in auth & settings | **YES** | LocalStorage `thinai_selected_language` | All 23 languages; sets `dir="rtl"` for Urdu, Kashmiri, Sindhi |
| `LanguageModal` | Bottom sheet accessible language chooser | **YES** | LocalStorage + App state | Filterable search across native names, English names, scripts |
| `TranslationErrorReportModal` | Community reporting of translation errors | **YES** | Local Dexie `feedbacks` + Firestore | Queues offline with sync flag; saves suggested corrections |
| `FeedbackModal` | Post-action agronomic feedback | **YES** | Local Dexie `feedbacks` + Firestore | Stores farmer rating (1-5) and observation for adaptive engine |
| `PendingSyncModal` | Inspects queued offline transactions | **YES** | Dexie `syncQueue` & `feedbacks` | Displays count and allows manual sync trigger upon reconnection |
| `ARFIDrawer` | Agricultural Resilience & Fragility breakdown | **YES** | Heuristic simulation engine | Explicit disclaimer: "Heuristic Index (not trained on yield data)" |

---

## 3. Core Background Services

| Service Name | Source Path | Primary Role | Offline Handling |
| :--- | :--- | :--- | :--- |
| `i18n` | `src/services/i18n.ts` | 23-language translation, RTL management, safe remedies gating | 100% offline via bundled locale JSON files |
| `diseaseDetectionService` | `src/services/diseaseDetectionService.ts` | Orchestrates on-device vision inference, crop gating, tier assignment | Full offline operation using WebAssembly MobileNetV2 |
| `litertInferenceService` | `src/services/litertInferenceService.ts` | Low-level LiteRT / TensorFlow Lite WASM execution & temperature scaling | Zero cloud dependencies; on-device inference |
| `cropPackService` | `src/services/cropPackService.ts` | Manages downloadable crop models with SHA-256 integrity verification | Verifies cryptographic hashes before installation; checks disk quota |
| `weatherService` | `src/services/weatherService.ts` | Open-Meteo live API integration, spray rules, irrigation triggers | Caches forecast with exact age display; refuses spray greenlight if stale |
| `marketService` | `src/services/marketService.ts` | Agmarknet mandi market rates via data.gov.in API | Honest "Price Unavailable" state; zero synthetic price generators |
| `aiAssistantService` | `src/services/aiAssistantService.ts` | Curated agricultural Q&A retrieval with TNAU/ICAR citations | Offline local keyword-indexed knowledge base; strict unknown fallback |
| `feedbackService` | `src/services/feedbackService.ts` | Logs farmer action feedback & adaptive weights | Persisted in Dexie with background sync |
| `verdictService` | `src/services/verdictService.ts` | Records farmer crowdsourced diagnosis verdicts & Wilson intervals | Local calculation; enforces weak label provenance |
| `officerService` | `src/services/officerService.ts` | Officer ground-truth submission & CSV export | Sanitized CSV generation; officer-only security rules |
| `db` | `src/services/db.ts` | Dexie IndexedDB client managing local relational offline storage | Built-in offline database with transactional ACID guarantees |
| `syncService` | `src/services/syncService.ts` | Idempotent bidirectional synchronization engine | Deduplicated replay queue; handles exponential backoff |
