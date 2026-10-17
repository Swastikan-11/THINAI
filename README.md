# THINAI (Technology for Holistic Intelligent Nurturing of Agricultural Intelligence)

> **Tamil Nadu Agricultural Assistant** — Final Year Computer Science & Engineering Capstone Project.
> Built with React 18, TypeScript, Tailwind CSS, Vite, Capacitor Android, Dexie (IndexedDB), and Firebase Spark.

---

## 1. System Architecture & Truthful Modeling Declarations

THINAI operates under strict **Truthfulness & Provenance Rules**:
1. **Zero Fabrication**: No simulated or fabricated numbers. If real data is absent, the system displays an honest "Price Unavailable" or "Limited Guidance" status.
2. **ARFI Resilience Index**:
   > [!IMPORTANT]
   > The **Agricultural Recommendation Fragility Index (ARFI)** and the **What-If Simulation Lab** are **heuristic sensitivity indices** and are **NOT trained on historical harvest yield datasets**.
   > They calculate mathematical sensitivity across microclimatic and economic perturbations using calibrated weights defined in [`src/config/arfiConfig.ts`](file:///c:/Users/cswas/Documents/THINAI/src/config/arfiConfig.ts).
3. **Crop Coverage**:
   - Calibrated agronomic rule engine currently covers **Paddy (Rice) / நெல்**.
   - For all other crops, the engine displays an honest fallback: *"Limited guidance for this crop. Specific agronomic rules are under active development."* It never silently defaults to paddy rules.
4. **Soil Moisture**:
   - Replaced static values with real farmer input via 3 choices: **Dry (~25%)**, **Just Right / Optimal (~55%)**, and **Wet / Saturated (~85%)**, persisted per farm plot.
5. **Weather & Microclimate**:
   - Live real-time forecasts via **Open-Meteo API** using device GPS coordinates or Tamil Nadu district centroids, backed by offline Dexie cache.
6. **Mandi Market Prices**:
   - Sourced from official GoI Minimum Support Price (MSP) benchmarks and Agmarknet APMC feeds. If no price is reported for the chosen crop and district, it explicitly displays *"Price unavailable for this crop/mandi"*.
7. **Local Equipment Board**:
   - Local equipment rental listings with zero brokerage. Moving to shared Firestore backend in Phase 2.

---

## 2. Running Locally

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Production build
npm run build
```

---

## 3. Bilingual Support
THINAI is strictly bilingual: **English** and **Tamil (தமிழ்)**. Every user-visible string routes through `t(key, lang)`.

---

## 4. Backend Architecture & Zero-Cost Cloud Deployment
- **Primary Shared Cloud Backend**: **Firebase Spark Tier (Free Plan)**
  - Zero deployment cost and zero server maintenance.
  - **Cloud Firestore**: Stores shared collections including Local Equipment Board (`equipment_listings`), Farmer Feedback (`feedbacks`), Diagnosis Confirmations (`diagnosis_confirmations`), and Community posts (`community_posts`).
  - **Security Rules**: Strictly enforced via [`firestore.rules`](file:///c:/Users/cswas/Documents/THINAI/firestore.rules). Authenticated access, document ownership verification, field validation, size limits, and phone privacy consent.
  - **Offline-First Resilience**: Dexie.js (IndexedDB) acts as the local offline cache. Any mutations made offline are written to the `syncQueue` and automatically synced to Firestore when network connectivity resumes.
- **FastAPI Backend (`/backend`)**:
  - **OPTIONAL**: The FastAPI Python backend is purely optional and intended for local development or workstation experiments. It is **not deployed** to any cloud server, maintaining zero cost. All core functionality runs entirely client-side and via Firebase Spark.

---

## 5. Confidence-Gated Advisory with Farmer-Verdict Field Monitoring

> [!NOTE]
> **Research Novelty Status**: This is a **proposed approach evaluated on a small pilot**, not claimed as proven or unique in literature. It investigates whether post-hoc temperature scaling and farmer crowdsourced verification can prevent harmful chemical over-application and track calibration drift under field distribution shift in Tamil Nadu smallholdings.

The system consists of three complementary components:

### 1. Calibrated Classifier Confidence
- **Runtime Engine**: Google LiteRT.js (`@litertjs/core`) executing MobileNetV2 `.tflite` models directly on-device via WebAssembly (`wasm`) with zero cloud latency and zero inference cost.
- **Trained Domain & Crop Coverage**:
  - Validated on open-access benchmark imagery covering **Tomato**, **Potato**, and **Pepper (Bell)**, augmented with verified field photos.
  - Crops outside this calibrated set display an honest *"Limited guidance for this crop"* banner and never infer spurious pathology.
- **Post-Hoc Temperature Scaling**:
  - Softmax outputs are scaled by an empirical temperature parameter ($T^* = 1.28$, derived on held-out calibration split) reducing overconfidence: $z'_i = z_i / T^*$.
  - Post-calibration Expected Calibration Error (ECE) is reduced from **8.12%** to **2.63%**.

### 2. Tiered Selective Advisory (Strict Chemical Safety Gating)
- **Tier 1 — Confident Diagnosis ($\text{conf} \ge \tau_{\text{high}} = 0.78$)**:
  - Displays specific pathology diagnosis, pathogen etiology, and verified chemical and bio-rational remedies.
- **Tier 2 — Moderate Uncertainty ($\tau_{\text{low}} = 0.45 \le \text{conf} < \tau_{\text{high}}$)**:
  - Displays *"Possible diagnosis, not sure"* alongside leaf retake guidelines and agronomic cultural practices (field aeration, drainage).
  - **Strict Chemical Prohibition**: Chemical product names and dosage recommendations are categorically withheld to protect farmer expenditure and prevent chemical over-spraying. Verified via automated property tests across 200 random inputs.
- **Tier 3 — Inconclusive ($\text{conf} < \tau_{\text{low}} = 0.45$)**:
  - Displays *"Cannot tell with confidence"*. No disease diagnosis claimed, no chemical recommendations, offers direct one-tap dialing to the local Agricultural Extension Officer (AAO) / Kisan Helpline (`1800-180-1551`), and saves the photo locally for expert review.
- **Proposed Evaluation Metric — Harmful Advice Rate ($\text{HAR}$)**:
  - We propose $\text{HAR}$ as the fraction of diagnostic results that are **confident but incorrect** ($\hat{p} \ge \tau_{\text{high}} \;\land\; \hat{Y} \ne Y$), triggering an erroneous chemical spray recommendation.
  - On the held-out field benchmark set, confidence gating achieves an **84.7% relative reduction in harmful chemical recommendations** (dropping HAR from 12.40% to 1.90% overall; see [`results/README.md`](file:///c:/Users/cswas/Documents/THINAI/results/README.md) for full empirical tables).

### 3. Farmer-Verdict Field Monitoring & Calibration Drift Detection
- **Active Learning Verdict Loop**:
  - Following each diagnostic result, farmers provide a 3-button verification: **Yes** (Accurate) / **No** (Incorrect) / **Not sure**, plus an optional *"What is it really?"* candidate pick-list.
  - Records cryptographic image hash (SHA-256), predicted class, calibrated confidence, tier, verdict, model version, and timestamp into local Dexie IndexedDB (`verdicts` table), synced to Cloud Firestore under strict ownership security rules (`users write only their own records`).
- **Noisy Weak Labels & Wilson 95% Confidence Intervals**:
  - **Important Notice**: Farmer verdicts are treated strictly as **noisy weak labels** subject to field misidentification noise.
  - **Minimum Sample Guard**: The system strictly withholds field accuracy figures whenever a class has fewer than **10 verdicts** (`MIN_VERDICTS_FOR_ESTIMATE = 10`), displaying *"Not enough field data"* instead of presenting unreliable percentages from small sample sizes.
  - Class-wise accuracies are bounded with **Wilson Score 95% Confidence Intervals**:
    $$p_{\text{center}} = \frac{p + \frac{z^2}{2n}}{1 + \frac{z^2}{n}}, \quad \text{margin} = \frac{z \sqrt{\frac{p(1-p)}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$
- **Calibration Drift Flag**:
  - The Field Accuracy screen reconstructs an empirical reliability diagram from farmer verdicts and tracks empirical ECE against the baseline calibration ECE ($2.63\%$).
  - If field ECE rises by $\ge 5\%$ ($\Delta \text{ECE} \ge 0.05$), an alert flag is raised notifying researchers and extension staff of distribution drift. All rejected verdicts (`verdict == "NO"`) are queued as active learning retraining candidates.

---

## 6. UI/UX Architecture: Plantix + Uzhavan Fusion (Phase 4)
- **Bottom Navigation (4 Tabs)**:
  1. `Home (My Farm)`: 1-tap `[ EN | தமிழ் ]` toggle, horizontal crop chips, Open-Meteo Weather & Spray Advisory banner (`evaluateSpraySafety()`), 3-step Plant Doctor card, and Yes/No Retraining Confirmation prompt.
  2. `Community`: Tamil Nadu farmers discussion forum, Web Speech read-aloud (`SpeechSynthesisUtterance`), and Dexie offline queueing with Firestore sync.
  3. `Services`: 8-service large icon grid (Custom Hiring Centres, Soil Testing Labs, Mandi Prices, WRD Water Reservoirs, PMFBY Crop Insurance, Schemes, Pest Alert, Fertiliser Calculator).
  4. `You (Profile)`: Real farm profile editing, password update modal, and complete Dexie/Firebase account deletion.

---

## 7. Automated Testing & Verification (Phase 8)
THINAI includes a comprehensive 18-point automated test suite running natively via Node.js:

```bash
# Run automated verification suite
npm test

# Run TypeScript strict check
npx tsc --noEmit

# Run production build
npm run build
```

---

## 8. Android Packaging & Capacitor Build (Phase 9)
```bash
# 1. Build web production bundle
npm run build

# 2. Sync web bundle & TFLite models to Capacitor Android
npx cap sync android

# 3. Open in Android Studio or compile APK via Gradle
cd android
./gradlew assembleDebug
# Generated APK: android/app/build/outputs/apk/debug/app-debug.apk
```
- **Application ID / Package**: `com.thinai.agriapp`
- **Essential Permissions**: `CAMERA`, `ACCESS_FINE_LOCATION`, `INTERNET`
- **Hardware Acceleration**: Enabled for LiteRT WASM model execution on device.