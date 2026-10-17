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

## 5. MobileNetV2 Neural Vision Pathology (Phase 3)
- **Runtime Engine**: Google LiteRT.js (`@litertjs/core`) executing compiled `.tflite` models directly on-device via WebAssembly (`wasm`) without cloud inference latency or recurring API costs.
- **Trained Domain & Crop Coverage**:
  - The vision classifier covers **Tomato**, **Potato**, **Pepper Bell**, and **Maize (Corn)**.
  - Crops outside this calibrated set honestly trigger: *"photo saved, expert advice suggested"* and refer the farmer to the Assistant Agricultural Officer (AAO).
- **Confidence Threshold & Retake Advisory**:
  - Threshold set at **65%**. If model confidence falls below 65%, the system avoids misleading diagnoses and triggers *"not sure, retake photo"* with photo-quality tips (10-15 cm distance, daytime shade, single leaf, no soil background).
- **Heuristic Fallback Truthfulness**:
  - When the neural model flatbuffer is loading or unavailable, chromatic checks are explicitly labeled: *"basic colour check, low reliability"*.
- **Retraining Pipeline**:
  - Training pipeline script available in [`scripts/train_disease_model_colab.py`](file:///c:/Users/cswas/Documents/THINAI/scripts/train_disease_model_colab.py) for free Google Colab GPU training.
  - Farmer Yes/No confirmation verdicts are recorded to Cloud Firestore (`diagnosis_confirmations`) as ground truth for continuous model retraining.