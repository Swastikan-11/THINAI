# THINAI Product Overview, Personas & User Journeys

**Document Target**: Product Specification & Operational Workflows  
**Context**: Evaluated on commit `861aaca` (`C:\Users\cswas\Documents\THINAI`)  
**Evidence Files**: `docs/FEATURE_MATRIX.md`, `src/app/App.tsx`, `docs/screenshots/`  

---

## 1. Product Mission & Name Etymology

### 1.1 The Meaning of "THINAI" (திணை)
In classical Tamil Sangam literature (சங்க இலக்கியம்), *Thinai* (திணை) denotes an integrated ecological and socio-cultural biome—a holistic landscape where human livelihood, soil characteristics, seasonal climate, and flora exist in equilibrium:
* **Kurinji (குறிஞ்சி)**: Montane and hilly tracts.
* **Mullai (முல்லை)**: Pastoral woodlands and scrub forests.
* **Marutham (மருதம்)**: Fertile agrarian plains and river deltas.
* **Neithal (நெய்தல்)**: Coastal and marine tracts.
* **Palai (பாலை)**: Arid, parched drought lands.

As a technical backronym, **THINAI** stands for **Technology for Holistic Intelligent Nurturing of Agricultural Intelligence**. The project's stated mission is to provide resilient, uncalibrated-risk-aware decision intelligence to smallholder agrarian communities where internet connectivity is intermittent, farmgate crop prices fluctuate, and climatic extremes (monsoon delays, flash droughts, deluge) make deterministic point-recommendations fragile.

---

## 2. Target User Personas

1. **Tamil Nadu Smallholder Farmer (Primary End-User)**:
   * **Profile**: Operates landholdings between 1.0 and 5.0 acres in agrarian belts such as the Cauvery Delta (Thanjavur, Tiruvarur) or Western Agro-Climatic Zone (Coimbatore, Tiruppur, Erode).
   * **Constraints**: Intermittent 2G/4G cellular coverage in fields; lower literacy or non-English preference; operates low-to-mid-tier Android smartphones (e.g., Android 10–14, 2–4 GB RAM); sensitive to capital losses from misapplied pesticides.
   * **Needs**: Instant offline crop health screening, local weather wash-off alerts (to avoid spraying chemicals before rain), transparent wholesale mandi benchmarks, and simple input accounting.
2. **Assistant Agricultural Officer / Extension Officer (AAO / KVK Specialist)**:
   * **Profile**: Field officer employed by the Tamil Nadu Department of Agriculture and Farmers Welfare or Krishi Vigyan Kendra (KVK).
   * **Role**: Reviews uncertain/ambiguous disease scans flagged by the model (Tier 3), inspects localized pest outbreaks, and provides authoritative agronomic intervention.
   * **Needs**: Extension triage dashboard, filterable scan gallery with farmer-reported symptoms and location, ability to record ground-truth diagnoses (`/expert_labels`).
3. **System Administrator / Academic Researcher**:
   * **Profile**: Academic lead at Sri Ramakrishna Engineering College (SREC) or technical coordinator.
   * **Role**: Monitors system health, reviews field misclassification rates, manages crop pack weights, and maintains Firestore role-based access rules.

---

## 3. Step-by-Step User Journeys & Concrete Screens

### Journey 1: First Run & Language Choice
* **Workflow**: The farmer launches the application. On cold start, the app loads `index.html` and checks `localStorage.getItem("thinai_selected_language")`. If unset, it prompts the farmer with a multilingual selector offering English and the 22 Eighth Schedule languages.
* **Layout Adaptation**: If an RTL language (Urdu `ur`, Kashmiri `ks`, Sindhi `sd`) is chosen, the document root dynamically sets `<html dir="rtl">`, flipping navigation chevrons, search bars, and drawer directions.
* **Screenshot**: `docs/screenshots/g7_flow1_first_run.png`, `docs/screenshots/g7_flow8_lang_menu.png`, `docs/screenshots/multilingual/home_ta_360x800.png`.

### Journey 2: Registration & Login
* **Workflow**: The user enters phone number or email credentials. Firebase Authentication manages authentication state. In development/testing environments, demo credentials are conditionally rendered (`import.meta.env.DEV`).
* **Offline Handling**: If network is disconnected during login, the screen displays a persistent offline banner: *"Network required for cloud authentication. Connect to internet or continue with local cached session."*
* **Screenshot**: `docs/screenshots/g7_flow2_login.png`.

### Journey 3: Crop Selection
* **Workflow**: The farmer navigates to the Crop Doctor (`/?screen=doctor`). Before opening the camera or selecting an image, the user MUST pick their target crop from an interactive icon grid (Tomato, Potato, Chilli/Pepper, Corn/Maize, Paddy, Cotton, etc.).
* **Boundary Enforcement**: This step prevents dangerous cross-crop misclassification (e.g., misclassifying a rice leaf as tomato early blight).
* **Screenshot**: `docs/screenshots/g7_flow3_crop_selection.png`.

### Journey 4: Image Capture & Preprocessing
* **Workflow**: The user clicks `[ 📷 TAKE PHOTO ]` or `[ 🖼️ UPLOAD FROM GALLERY ]`. On native Android, Capacitor Camera API launches the rear camera intent. On web, standard HTML file input triggers.
* **Preprocessing Pipeline**: The selected image is loaded onto an HTML5 Canvas, centered and scaled to $224 \times 224$ pixels, and converted to an RGB Float32 buffer of shape `[1, 224, 224, 3]`.

### Journey 5: Model Inference & Calibration
* **Workflow**: `src/services/litertInferenceService.ts` compiles `public/models/thinai_disease_model.tflite` via Google LiteRT.js WebAssembly. The model outputs raw logits across 39 classes.
* **Post-Hoc Temperature Scaling**: Logits are scaled by temperature $T^* = 1.28$ (derived from laboratory validation NLL minimization) to produce calibrated posterior probabilities:
  $$P_{\text{calibrated}}(c_i) = \frac{\exp(z_i / 1.28)}{\sum_j \exp(z_j / 1.28)}$$

### Journey 6: Three-Tier Confidence Gating & Diagnosis Result
* **Workflow**: The calibrated top confidence $P_{\max}$ is evaluated against pre-registered thresholds $\tau_{\text{high}} = 0.78$ and $\tau_{\text{low}} = 0.45$:
  * **Tier 1 (Confident, $P_{\max} \ge 0.78$)**: Confirmed diagnosis. Displays symptoms, cultural management, and chemical remedies. **CRITICAL INVARIANT**: Because Gate G4 fails (field accuracy = 25.60%), Tier 1 is disabled in code (`IS_G4_FIELD_VALIDATED = false`), automatically demoting Tier 1 outputs to Tier 2 cultural advice only.
  * **Tier 2 (Moderate, $0.45 \le P_{\max} < 0.78$)**: Possible disease diagnosis. Emits ONLY cultural/organic management. Chemical pesticide advice is explicitly withheld with warning: *"Chemical fungicide/pesticide withheld due to diagnostic uncertainty (Tier 2)."* Tips for retaking the photo are shown.
  * **Tier 3 (Inconclusive, $P_{\max} < 0.45$)**: The system states *"Cannot Tell / உறுதிப்படுத்த முடியவில்லை"*. Zero disease claims are made. The photo is saved locally in IndexedDB and queued for Extension Officer review.
* **Screenshot**: `docs/screenshots/g7_flow4_scan_result.png`, `docs/screenshots/multilingual/doctor_ta_360x800.png`.

### Journey 7: Scan History & Local Verification
* **Workflow**: Every scan is stored in Dexie.js IndexedDB (`src/services/db.ts`). Farmers can view past scans, compare symptom progressions, and record whether the advice helped via crowdsourced feedback buttons.
* **Screenshot**: `docs/screenshots/feature1_scan_history.png`, `docs/screenshots/g7_flow5_history.png`.

### Journey 8: Weather & Spray Advisory
* **Workflow**: Home screen fetches 7-day agro-meteorological forecast from Open-Meteo API using GPS coordinates.
* **Agronomic Spray Guard**: The system calculates wind speed, precipitation probability, and 48-hour rainfall accumulation. If rain probability $\ge 40\%$ or 48h rainfall $\ge 5.0\text{ mm}$, the UI displays an amber wash-off warning: *"High wash-off risk: do not spray foliar chemicals within 24 hours of expected rain."*
* **Screenshot**: `docs/screenshots/feature3_weather_rules.png`.

### Journey 9: Mandi Market Prices
* **Workflow**: Farmers view commodity modal prices for their district (e.g., Coimbatore, Thanjavur) based on Agmarknet (data.gov.in) feeds.
* **Transparency Guard**: If the government API key is unconfigured or the network request fails, the app strictly displays *"Benchmark Price"* with the last known date stamp. Zero synthetic or fabricated prices are shown.
* **Screenshot**: `docs/screenshots/feature4_market_prices.png`.

### Journey 10: Community & Machinery Services
* **Workflow**: Farmers can browse peer discussions or search for farm machinery rental (tractors, combine harvesters).
* **Zero Dummy Data Guard**: If local database contains no community posts, an honest empty state is rendered: *"No discussions yet in this district. Be the first to share an agronomic update."*
* **Screenshot**: `docs/screenshots/feature6_clean_navigation.png`.

### Journey 11: Agronomic AI Assistant
* **Workflow**: The farmer enters a query or taps a common prompt (e.g., *"How to control leaf curl virus in chilli?"*).
* **Retrieval Guard**: Answers are retrieved strictly from an offline curated knowledge base sourced from TNAU Agritech Portal and ICAR Crop Protection Guides. If no verified entry matches, the assistant replies: *"I do not have verified extension guidance for this specific query. Please consult your local Assistant Agricultural Officer (AAO)."*
* **Screenshot**: `docs/screenshots/feature2_ai_assistant.png`.

### Journey 12: Extension Officer Dashboard
* **Workflow**: An authenticated officer (`/officers` role in Firestore) opens `/?screen=officer` to view pending Tier 3 inconclusive scans from their jurisdiction, review uploaded thumbnails, and submit ground-truth labels (`/expert_labels`).

### Journey 13: Farm Records & Input Tracker
* **Workflow**: Farmers record plot boundaries, crop varieties, sowing dates, and input expenditures (fertilizers, seeds, labor). All records persist in Dexie tables (`plots`, `crops`, `expenses`).
* **Screenshot**: `docs/screenshots/feature5_farm_records.png`.

---

## 4. Transparent Unavailable / Failure State Behaviors

| Event / Condition | What the Farmer Sees in UI | System State & Safety Guarantee |
| :--- | :--- | :--- |
| **Complete Offline (No Internet)** | Top banner: *"Offline Mode - Local Farm Profile Active"*. Sync icon shows count of queued items. | All core features (disease scan, local history, farm records, offline assistant, fertilizer calculator) continue functioning from IndexedDB and Service Worker cache. |
| **Unsupported Crop Selected** | Screen displays: *"Selected crop is outside active vision pathology classes. Photo saved for extension officer inspection."* | Zero disease claims made; no synthetic chemical advice emitted. |
| **Non-Leaf Image Captured (Hands, Soil, Plastic)** | Model predicts `Background_without_leaves` or top crop probability mass $< 0.40$. UI states: *"Non-Foliage Detected / Crop Mismatch. Please take a clear close-up of a crop leaf."* | full rejected to Tier 3 Inconclusive. |
| **Unreviewed Language Active** | In any of the 22 non-English languages, remedy recommendations display in English accompanied by a notice: *"This advice is shown in English until a language expert has checked the translation. Ask your extension officer if unsure."* | Prevents dangerous chemical mistranslation (e.g. confusing insecticide with herbicide or misquoting chemical dilution ratios). |
| **Market Mandi API Offline** | Card title: *"Live Mandi Price Unavailable"*. Subtext: *"Showing benchmark price from historical Agmarknet records as of [Date]."* | No pseudo-random or fabricated pricing curves. |
| **Interrupted Scan / Low Storage** | If browser IndexedDB throws `QuotaExceededError`, UI logs emergency cache purge notice, drops transient cached thumbnails, and retains critical transaction records. | Graceful recovery without application crash (`tests/reconnect_sync.test.ts`). |
