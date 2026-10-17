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