# THINAI OpenAPI REST Endpoint Specification

All endpoints are served under `/api/v1` and authenticated using Bearer JWT tokens verified against Firebase Authentication unless public.

---

## 1. Authentication & Farmer Profile (`/api/v1/auth`)

### `GET /api/v1/auth/me`
- **Description:** Retrieve currently authenticated farmer profile and account attributes.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "id": "usr_947ab",
    "firebase_uid": "fb_xyz123",
    "email": "farmer@thinai.org",
    "phone": "+919443312345",
    "full_name": "Murugan Velusamy",
    "profile": {
      "village": "Kinathukadavu",
      "district": "Coimbatore",
      "state": "Tamil Nadu",
      "preferred_language": "Tamil",
      "total_land_acres": 4.5
    }
  }
  ```

### `POST /api/v1/auth/profile`
- **Description:** Upsert or update extended farmer profile details.
- **Request Body:**
  ```json
  {
    "full_name": "Murugan Velusamy",
    "phone": "+919443312345",
    "village": "Kinathukadavu",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "preferred_language": "Tamil",
    "total_land_acres": 4.5
  }
  ```

### `DELETE /api/v1/auth/me`
- **Description:** Delete farmer account and cascade purge associated data.

---

## 2. Farms & Fields Management (`/api/v1/farms`, `/api/v1/fields`)

### `GET /api/v1/farms`
- **Description:** List all agricultural holdings associated with the user.

### `POST /api/v1/farms`
- **Description:** Register a new farm holding.

### `GET /api/v1/fields?farm_id={farm_id}`
- **Description:** List fields/plots belonging to a farm.

### `POST /api/v1/fields?farm_id={farm_id}`
- **Request Body:**
  ```json
  {
    "farm_id": "farm_101",
    "name": "North Field - Paddy",
    "area_acres": 2.5,
    "soil_type": "Clay Loam",
    "current_crop": "Paddy (Rice)",
    "crop_variety": "CO 51",
    "crop_stage": "Tillering Stage"
  }
  ```

---

## 3. Decision Engine & ARFI Core (`/api/v1/recommendations`, `/api/v1/what-if`)

### `POST /api/v1/recommendations/generate?field_id={field_id}`
- **Description:** Generate real-time Next Best Action, crop ML suitability candidates, and ARFI resilience score.
- **Response `200 OK`:**
  ```json
  {
    "id": "rec-101",
    "field_id": "field-01",
    "title": "Irrigation Management Alert",
    "action": "Delay flood irrigation by 48 hours; clear drainage channels.",
    "category": "Irrigation",
    "priority": "HIGH",
    "confidence": 92.5,
    "when": "Within 24 Hours",
    "why": "Heavy rainfall of 38mm forecast across next 48h.",
    "risk_averted": "Root suffocation and nitrogen fertilizer runoff.",
    "arfi_assessment": {
      "id": "arfi-101",
      "fragility_score": 0.28,
      "fragility_label": "Stable / Low Fragility",
      "data_reliability_score": 0.88,
      "model_agreement_score": 0.84,
      "uncertainty_score": 0.16,
      "scenario_sensitivity_score": 0.24,
      "stress_robustness_score": 0.82,
      "decision_risk_score": 0.19,
      "assessment_summary": "High algorithmic stability across weather perturbations.",
      "stress_scenarios": [
        {
          "scenario_name": "Severe Drought (-30% Rain, +2.5°C)",
          "rainfall_delta_percent": -30.0,
          "temp_delta_celsius": 2.5,
          "market_price_delta_percent": 0.0,
          "input_cost_delta_percent": 10.0,
          "crop_rank_change": 0,
          "fragility_status": "STABLE"
        }
      ]
    }
  }
  ```

### `POST /api/v1/what-if/simulate`
- **Description:** Interactive What-If simulation with parameter shocks.
- **Request Body:**
  ```json
  {
    "field_id": "field-01",
    "rainfall_delta_percent": -35.0,
    "temperature_delta_celsius": 3.0,
    "market_price_delta_percent": -15.0,
    "input_cost_delta_percent": 20.0
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "original_crop": "Paddy (Rice)",
    "modified_crop": "Pearl Millet (Bajra)",
    "arfi_before": 0.28,
    "arfi_after": 0.58,
    "fragility_status": "Moderate Fragility",
    "profit_impact_rs": -8400.0,
    "risk_impact_summary": "Monsoon deficit reduces paddy net margins; millet swap preserves stability.",
    "recommendation_changed": true,
    "reason_changed": "Severe moisture deficit detected. Drought-hardy C4 millet minimizes irrigation failure risks."
  }
  ```

---

## 4. Weather & Market Intelligence (`/api/v1/weather`, `/api/v1/market`)

### `GET /api/v1/weather?latitude={lat}&longitude={lon}`
- Fetches real-time temperature, precipitation, humidity, and 7-day agro-meteorological forecast from Open-Meteo.

### `GET /api/v1/market`
- Fetches real-time Mandi market commodity prices, price trends, and MSP benchmarks across Indian markets.

---

## 5. Government Schemes & Economics (`/api/v1/schemes`, `/api/v1/economics`)

### `GET /api/v1/schemes?state={state}&farm_size={size}`
- Filters central and state agricultural schemes (e.g., PM-KISAN, PMFBY, Tamil Nadu Micro Irrigation).

### `GET /api/v1/economics/{field_id}?crop={crop}&area_acres={area}`
- Generates budget breakdown (seeds, fertilizer, labor, irrigation, projected yield revenue, net margin).

---

## 6. Real Disease Detection (`/api/v1/disease`)

### `POST /api/v1/disease/scan`
- Preprocesses leaf image and returns disease class, confidence, severity, and chemical/biological remedies.

### `GET /api/v1/disease/history?field_id={field_id}`
- Retrieves past disease scans and treatment progression.

---

## 7. Farm Activities & Closed-Loop Feedback (`/api/v1/activities`, `/api/v1/feedback`)

### `POST /api/v1/activities`
- Records farming operations (sowing, spraying, irrigation, weeding, harvest).

### `POST /api/v1/feedback`
- Records action completion status, rating, crop condition observations, and cost savings to tune future prescriptions.

---

## 8. Two-Way Offline Synchronization (`/api/v1/sync`)

### `POST /api/v1/sync/push`
- Replays offline mutation events from client Dexie queue.

### `POST /api/v1/sync/pull`
- Fetches deltas modified on backend since `last_sync_timestamp`.

### `GET /api/v1/sync/status`
- Reports active pending mutations and cloud synchronization health.
