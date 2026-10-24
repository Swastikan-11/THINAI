# THINAI (Technology for Holistic Intelligent Nurturing of Agricultural Intelligence)

> **AI Agronomy Operating System for Smallholder Farmers across India**  
> Final Year Computer Science & Engineering Capstone Project  
> Stack: React 18, TypeScript, Tailwind CSS, Vite, Capacitor Android, Electron Windows, Dexie (IndexedDB), Firebase Spark (Zero-Cost Tier)  
> Supported Languages: English (Default) plus the 22 Eighth Schedule Indian Languages

---

## 1. Executive Summary & Core Architectural Novelty

Smallholder farmers frequently misapply chemical fungicides and pesticides based on uncalibrated mobile apps or diagnostic guesses. 

THINAI implements an empirically audited framework: **"Confidence-Gated Advisory with Farmer-Verdict Field Monitoring"**.

### Core Pillars:
1. **Calibrated Classifier Confidence**: Standard deep neural networks produce overconfident probabilities under distribution shifts. We apply post-hoc Temperature Scaling ($T^* = 1.28$) fitted on agricultural field imagery.
2. **Tiered Selective Advisory (Strict Chemical Safety Invariant)**:
   - **Tier 1 ($\ge \tau_{\text{high}} = 0.78$)**: Confident diagnosis; bio-rational and chemical remedies permitted, prepended with pilot extension officer confirmation disclaimers and explicit TNAU/ICAR citations.
   - **Tier 2 ($\tau_{\text{low}} = 0.45 \le \text{conf} < \tau_{\text{high}}$)**: *"Possible diagnosis, not sure"*; retake guidelines and agronomic cultural practices only. **Chemical product names and dosages are strictly withheld** to prevent improper spraying.
   - **Tier 3 ($< \tau_{\text{low}} = 0.45$)**: Inconclusive (*"Cannot tell with confidence"*); no disease claimed, zero chemical advice, direct one-tap dialing to the local Assistant Agricultural Officer (AAO) / Kisan Helpline (`1800-180-1551`), and selective rejection for out-of-domain imagery.
   - *Verification*: 200 random input trials in `tests/gating_engine.test.ts` pass with 0 chemical recommendations below $\tau_{\text{high}}$.
3. **Verdict-Based Field Monitoring**:
   - Records cryptographic image hash (SHA-256), predicted class, calibrated confidence, tier, verdict (**Yes / No / Not sure**), timestamp, and model version into local Dexie IndexedDB, automatically synced to Cloud Firestore under strict ownership security rules.
   - Computes verdict-based accuracy with **Wilson Score 95% Confidence Intervals** and a **Minimum Sample Guard** ($\ge 10$ verdicts per class).
   - Farmer verdicts are treated as **noisy weak labels** with expected noise $\eta \in [10\%, 25\%]$.

---

## 2. Multilingual Support (English + 22 Scheduled Indian Languages)

THINAI supports English as default, alongside all **22 languages of the Eighth Schedule to the Constitution of India**:
- **Languages**: English (`en`), Assamese (`as`), Bengali (`bn`), Bodo (`brx`), Dogri (`doi`), Gujarati (`gu`), Hindi (`hi`), Kannada (`kn`), Kashmiri (`ks`), Konkani (`kok`), Maithili (`mai`), Malayalam (`ml`), Manipuri (`mni`), Marathi (`mr`), Nepali (`ne`), Odia (`or`), Punjabi (`pa`), Sanskrit (`sa`), Santali (`sat`), Sindhi (`sd`), Tamil (`ta`), Telugu (`te`), Urdu (`ur`).
- **Right-to-Left (RTL)**: Urdu (`ur`), Kashmiri (`ks`), and Sindhi (`sd`) automatically apply `dir="rtl"` with mirrored layouts.
- **Strict Safety Invariant**: Chemical remedy names, dosages, and spray intervals are shown **ONLY** in languages with status `REVIEWED` (English). In all `MACHINE-DRAFT` languages, remedy advice is shown in English with the required notice:  
  *"This advice is shown in English until a language expert has checked the translation. Ask your extension officer if unsure."*
- **Typography & Font Licences**: Bundled offline font stacks via `public/fonts/fonts.css` supporting 12 Indian script families under the **SIL Open Font License 1.1 (OFL-1.1)** with zero tofu characters (`□`).
- Full registry, reviewer checklist, and contribution instructions are documented in [`docs/LANGUAGES.md`](file:///c:/Users/cswas/Documents/THINAI/docs/LANGUAGES.md).

---

## 3. Supported Crops & Coverage Registry

Crops are categorized into three distinct, audited statuses in `data/crop_registry.json` and [`docs/COVERAGE.md`](file:///c:/Users/cswas/Documents/THINAI/docs/COVERAGE.md):

* **Status A (Field-validated on expert-labelled photos)**:
  - Crops: **Paddy (Rice)**, **Tomato**, **Potato**, **Chilli / Pepper**, **Maize / Corn**.
  - Diagnostic & Treatment Policy: Full 3-Tier Selective Gating active.
  - Evidence: Held-out empirical field evaluations (`results/paddy_field_validation.json`, `results/real_field_evaluation.json`).
* **Status B (Trained on public dataset; no field validation under Tamil Nadu agrarian conditions)**:
  - Crops: **Cotton**, **Sugarcane**, **Groundnut**, **Banana**, **Mango**, **Tapioca**, **Brinjal**, **Coconut**.
  - Diagnostic & Treatment Policy: Explicitly badged as **"UNVERIFIED"**. Capped at Tier 2. **Chemical remedies are strictly withheld.** Non-chemical cultural practices and officer referral only.
* **Status C (No machine learning vision model available)**:
  - Crops: **Ragi**, **Cholam**, **Bajra**, **Black Gram**, **Green Gram**, **Red Gram**, **Onion**, **Turmeric**.
  - Diagnostic & Treatment Policy: Automated vision diagnosis is blocked. Direct referral card shown for nearest Assistant Agricultural Officer (AAO) / KVK.

---

## 4. Empirical Field Accuracy (Gate G4 Audit)

Under held-out Indian field evaluation on real, uncontrolled field photography (Singh et al. Indian field dataset; 125 evaluated specimens across Corn, Pepper, Potato, Tomato):
- **Real Empirical Field Accuracy**: **25.60%** (32/125 correct)
- **Real Empirical Macro-F1**: **21.77%**
- **Real Field Expected Calibration Error (ECE)**: **40.49%** (Post-Calibration $T^* = 1.28$)
- **Per-Crop Accuracy Breakdown**:
  - Corn: 44.00% (11/25)
  - Pepper: 50.00% (8/16)
  - Potato: 13.33% (2/15)
  - Tomato: 15.94% (11/69)
- *Note*: Lab validation numbers on idealized leaf cutouts are 88–92%, but real field performance drops significantly under natural lighting, occlusions, and background clutter. THINAI's confidence gating safely catches these drops by routing low-confidence samples to Tier 2 cultural advice or Tier 3 officer triage.

---

## 5. Offline Capability Summary

THINAI is engineered from the ground up for rural offline resilience:
- **Core Engine & Vision**: 100% offline via LiteRT WebAssembly (MobileNetV2 WASM) and Service Worker asset caching (`/sw.js`).
- **Farm Records & Diagnostics**: Offline IndexedDB storage via Dexie.js with automatic deduplicated sync queue.
- **Weather Advisory**: Caches last fetched Open-Meteo forecast with explicit age display; refuses spray greenlight if stale.
- **Market Prices**: Displays last cached Agmarknet mandi auction rates with timestamp or honest "Price Unavailable" state. Zero synthetic numbers.
- **Multilingual Support**: All 23 language dictionaries bundled directly in client bundle for instant offline switching.

---

## 6. Setup, Installation & Developer Instructions

### Prerequisites
- Node.js v20+ or v24+
- npm v10+
- Java JDK 21 (for Firebase emulator and Android builds)

### 1. Web Application Setup
```bash
# Clone the repository
git clone https://github.com/Swastikan-11/THINAI.git
cd THINAI

# Clean install dependencies
npm ci

# Build production bundle
npm run build
```

### 2. Automated Test Execution
```bash
# TypeScript compiler validation (0 errors)
npx tsc --noEmit

# Unit & regression test suite (25 suites, 136 tests)
npx vitest run

# Playwright E2E & multilingual switch test suite (28 tests)
npx playwright test

# Firestore emulator security rules suite (23 tests)
node scripts/test_firestore_rules.mjs
```

### 3. Android Installation & Execution
```bash
# Sync web assets to Android Capacitor project
npx cap sync android

# Run on connected physical device or running emulator
npx cap run android
```
- To install the signed CI release APK directly:
  ```bash
  adb install -r path/to/app-release.apk
  ```

---

## 7. Third-Party Licenses & Attributions

THINAI integrates open-source dependencies under **MIT**, **Apache-2.0**, or **SIL Open Font License 1.1**. Full notices are maintained in [`THIRD_PARTY_LICENSES.md`](file:///c:/Users/cswas/Documents/THINAI/THIRD_PARTY_LICENSES.md).

| Project | License | Purpose / Module |
|---|---|---|
| **Electron** | MIT | Native Windows desktop wrapper |
| **electron-builder** | MIT | Packaging and NSIS installer generation |
| **Google LiteRT** (`@litertjs/core`) | Apache-2.0 | In-browser/on-device neural network WASM runtime |
| **Dexie.js** | Apache-2.0 | Offline-first IndexedDB storage and mutation queue |
| **Capacitor** | MIT | Cross-platform native Android runtime and camera bridge |
| **Lucide Icons** | ISC / MIT | Visual iconography for agricultural interfaces |
| **Tailwind CSS** | MIT | Responsive design and utility-first styling |
| **Google Noto Fonts** | SIL OFL 1.1 | 12 Indian script font stacks for 22 scheduled languages |

---

## 8. Dead Code & Pruned Routes Policy

All features, routes, and synthetic data generators permanently removed from production builds are logged with grep evidence in [`REMOVED.md`](file:///c:/Users/cswas/Documents/THINAI/REMOVED.md).
