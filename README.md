# THINAI (Technology for Holistic Intelligent Nurturing of Agricultural Intelligence)

> **AI Agronomy Operating System for Smallholder Farmers in Tamil Nadu**  
> Final Year Computer Science & Engineering Capstone Project  
> Stack: React 18, TypeScript, Tailwind CSS, Vite, Capacitor Android, Electron Windows, Dexie (IndexedDB), Firebase Spark (Zero-Cost Tier)  
> Supported Languages: English & Tamil (தமிழ்) — strictly routed through `t(key, lang)`

---

## 1. Executive Summary & Core Architectural Novelty

Smallholder farmers in Tamil Nadu face severe crop disease losses and frequently misapply chemical fungicides/pesticides based on uncalibrated mobile apps or diagnostic guesses. 

THINAI implements an empirically audited framework: **"Confidence-Gated Advisory with Farmer-Verdict Field Monitoring"**.

### Core Pillars:
1. **Calibrated Classifier Confidence**: Standard deep neural networks produce overconfident probabilities under distribution shifts. We apply post-hoc Temperature Scaling ($T^* = 1.28$) fitted on a held-out calibration split containing Indian agricultural field imagery.
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

## 2. System Status Matrix: What Works vs. What Does Not Work

### What Works:
- **On-Device Disease Vision Inference**: Google LiteRT.js (`@litertjs/core`) with WebAssembly (`wasm`) running MobileNetV2 `.tflite` directly in-browser, Android WebView, and Electron.
- **Pre-Diagnosis Crop Selection & OOD Rejection**: Interactive crop selector (Tomato, Potato, Pepper, Paddy, Cotton, Corn) with mass gating ($<0.40$ rejected to Tier 3). Verified by `tests/ood_safety.test.ts` (100% rejection of hands, soil, non-target leaves, packaging, and blur).
- **Offline-First Farm Records**: Dexie IndexedDB storage for farm plots, crops, sowing dates, spray logs, and expense tracking. Automatically queues mutations when offline and flushes idempotently on reconnect.
- **Curated Knowledge Assistant**: Vector retrieval over sourced TNAU and ICAR publications. Queries outside verified agricultural scope return: *"I don't have verified information; ask your extension officer"*.
- **Live Weather & Spray/Irrigation Rules**: Open-Meteo live API integration evaluating rain wash-off, wind drift ($>20\text{ km/h}$), and temperature ($>35^\circ\text{C}$), with cached age indicator.
- **Market Intelligence**: Live Agmarknet mandi auction feed via `data.gov.in` API with statutory MSP benchmark comparisons and honest `PRICE_UNAVAILABLE` fallback.
- **Android Target (API 28+)**: Native Capacitor Android build, fully verified on Android 16 (API 36) with camera, gallery pick, offline mode, rotation, and 5,000-event monkey stress testing without crash.
- **Desktop Distribution (Windows x64)**: Native Electron desktop application with NSIS installer.

### What Does Not Work & Known Limitations:
- **Model Crop Domain**: The calibrated vision model covers **Pepper, Potato, and Tomato**. Crops outside this scope display *"Expert Advice Suggested — Out of Trained Vision Model Domain"* and are never silently processed through incorrect neural weights.
- **Farmer Verdicts are Weak Labels**: Crowd-sourced verdicts are weak labels subject to farmer misidentification, not ground-truth laboratory verification.
- **Threaded WASM in WebView & Electron**: WebAssembly Threads (`SharedArrayBuffer` / `Atomics`) are disabled in Android WebView and Electron local `file://` protocol due to browser security policies requiring `crossOriginIsolated: true` (COOP/COEP headers). The engine automatically falls back to single-threaded WebAssembly execution.
- **Desktop Camera Bridge**: On Windows desktop, native mobile Capacitor camera plugins are absent; the application automatically falls back to standard HTML5 `<input type="file" accept="image/*">`.
- **Windows Code Signing**: The Windows NSIS installer is **unsigned** (no Authenticode certificate configured) and will trigger a Microsoft Defender SmartScreen warning (*"Windows protected your PC — Unknown publisher"*).
- **Auto-Update**: Auto-updater is not configured for desktop builds; updates must be installed manually.
- **Live Agmarknet Key**: Live mandi prices require an official `data.gov.in` API key configured in `.env`. When absent or offline, the interface transparently displays `PRICE_UNAVAILABLE`.

---

## 3. Verified Release Deliverables

| Platform | Artifact Name | Format | Size | Cryptographic SHA-256 Checksum | Provenance / Build Method |
|---|---|---|---|---|---|
| **Android** | `THINAI-app-release-apk` (`app-release.apk`) | APK (v2 Signed) | 24,974,716 bytes | `1143c24b9ccb30dd95b110d22bd92c678571e16110f221304ab00b75531e2a98` | GitHub Actions CI Run `#39423016062` |
| **Windows** | `THINAI Setup 0.0.1.exe` | NSIS Installer (Unsigned) | 179,429,818 bytes | `1fd5f6a056bd91ffc50897f79f7cdec57ce36ee0051f1410311d974422a78a88` | Electron Builder v26.18.0 |

---

## 4. Setup, Installation & Developer Instructions

### Prerequisites
- Node.js v20+ or v24+
- npm v10+
- Android Studio (for native Android builds or emulator execution)

### 1. Web Application Setup
```bash
# Clone the repository
git clone https://github.com/Swastikan-11/THINAI.git
cd THINAI

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

### 2. Automated Test Execution
```bash
# TypeScript compiler validation
npx tsc --noEmit

# Unit & regression test suite (Vitest)
npx vitest run

# End-to-end and stress test suite (Playwright)
npx playwright test

# Firestore emulator security rules suite
npm test
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

### 4. Windows Desktop Packaging
```bash
# Package and build NSIS Windows installer
npm run dist:win
```
The resulting executable is generated in `dist-electron/THINAI Setup 0.0.1.exe`.

---

## 5. Third-Party Licenses & Attributions

THINAI strictly integrates code and dependencies licensed under **MIT** or **Apache-2.0**. Full details and copyright notices are maintained in [`THIRD_PARTY_LICENSES.md`](file:///c:/Users/cswas/Documents/THINAI/THIRD_PARTY_LICENSES.md).

| Project | License | Purpose / Module |
|---|---|---|
| **Electron** | MIT | Native Windows desktop wrapper |
| **electron-builder** | MIT | Packaging and NSIS installer generation |
| **Google LiteRT** (`@litertjs/core`) | Apache-2.0 | In-browser/on-device neural network WASM runtime |
| **Dexie.js** | Apache-2.0 | Offline-first IndexedDB storage and mutation queue |
| **Capacitor** | MIT | Cross-platform native Android runtime and camera bridge |
| **Lucide Icons** | ISC / MIT | Visual iconography for agricultural interfaces |
| **Tailwind CSS** | MIT | Responsive design and utility-first styling |

---

## 6. Dead Code & Pruned Routes Policy

All features, routes, and fabricated data structures permanently deleted or gated from production builds are logged with grep proof in [`REMOVED.md`](file:///c:/Users/cswas/Documents/THINAI/REMOVED.md).
