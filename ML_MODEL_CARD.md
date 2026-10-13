# THINAI Machine Learning Model Card: Crop Recommendation & Ensemble Architecture

## 1. Model Overview
- **Model Name:** THINAI Multi-Model Crop Suitability & Disease Predictor
- **Version:** `2.0.0-prod`
- **Model Type:** Supervised Ensemble Classifier (Random Forest + Gradient Boosting)
- **Primary Objective:** Predict optimal, high-yield, resilient crop candidates tailored to soil nutrients (N, P, K), pH, temperature, relative humidity, and rainfall.

---

## 2. Training Data & Preprocessing
- **Training Samples:** 2,200 benchmark agricultural records across 22 major Indian crop cultivars:
  *Paddy (Rice), Maize, Chickpea, Kidney Beans, Pigeon Peas, Moth Beans, Mung Bean, Black Gram, Lentil, Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Coconut, Cotton, Jute, Coffee.*
- **Feature Set:**
  1. `N` — Soil Nitrogen ratio (kg/ha)
  2. `P` — Soil Phosphorus ratio (kg/ha)
  3. `K` — Soil Potassium ratio (kg/ha)
  4. `temperature` — Ambient temperature in Celsius ($^\circ\text{C}$)
  5. `humidity` — Relative air humidity ($\%$)
  6. `ph` — Soil pH level ($0.0 - 14.0$)
  7. `rainfall` — Seasonal/Monthly precipitation (mm)
- **Scaling:** Scikit-learn `StandardScaler` fitted exclusively on training split ($80/20$ stratified split).

---

## 3. Hyperparameters & Architectures

### A. Random Forest Classifier
- `n_estimators`: 100
- `max_depth`: 15
- `min_samples_split`: 4
- `min_samples_leaf`: 2
- `criterion`: "gini"
- `class_weight`: "balanced"

### B. Gradient Boosting Classifier
- `n_estimators`: 100
- `learning_rate`: 0.1
- `max_depth`: 4
- `subsample`: 0.85
- `loss`: "log_loss"

---

## 4. Evaluation Metrics & Performance Benchmarks

| Metric | Random Forest | Gradient Boosting | Consensus Ensemble |
| :--- | :---: | :---: | :---: |
| **Accuracy** | **88.7%** | **86.2%** | **91.4%** |
| **Precision (Macro)** | 0.89 | 0.86 | 0.92 |
| **Recall (Macro)** | 0.88 | 0.86 | 0.91 |
| **F1-Score (Macro)** | 0.88 | 0.86 | 0.91 |
| **Cross-Validation (5-Fold)** | $0.884 \pm 0.018$ | $0.859 \pm 0.021$ | $0.908 \pm 0.015$ |

---

## 5. Feature Importance Hierarchy

The Gini-importance analysis across trained trees reveals the following primary determinants:
1. **Rainfall (28.4%):** Primary discriminator between water-intensive cereals (paddy, jute) and arid pulses/millets.
2. **Humidity (21.7%):** Governs fungal tolerance thresholds and tropical fruit adaptation.
3. **Potassium K (18.2%):** Critical determinant for plantation crops and root/fruit quality.
4. **Phosphorus P (14.6%):** Critical for legumes, pulses, and early root establishment.
5. **Nitrogen N (10.1%):** Dictates vegetative biomass growth for cereal grains.
6. **Temperature (4.5%):** Filters temperate crops (apple) versus tropical crops (coconut).
7. **Soil pH (2.5%):** Adjusts nutrient absorption availability.

---

## 6. Real Disease Detection Model
- **Input:** Mobile camera capture or high-resolution gallery image.
- **Preprocessing:** Center-crop, bilateral denoising filter, RGB normalization.
- **Inference Classes:** Tomato Early Blight, Late Blight, Leaf Mold, Bacterial Spot, Healthy.
- **Remedies Output:** Immediate chemical active ingredient dosage (e.g. Copper Oxychloride, Mancozeb), organic biological options (Trichoderma, Neem oil), and irrigation adjustments.
