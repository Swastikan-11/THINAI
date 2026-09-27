import os
import json
import joblib
import numpy as np
from typing import List, Dict, Any, Tuple

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

_rf_model = None
_gb_model = None
_scaler = None
_metadata = None

def get_ml_models():
    global _rf_model, _gb_model, _scaler, _metadata
    if _rf_model is None:
        _rf_model = joblib.load(os.path.join(MODELS_DIR, "random_forest.joblib"))
        _gb_model = joblib.load(os.path.join(MODELS_DIR, "gradient_boosting.joblib"))
        _scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.joblib"))
        with open(os.path.join(MODELS_DIR, "model_metadata.json"), "r") as f:
            _metadata = json.load(f)
    return _rf_model, _gb_model, _scaler, _metadata

def predict_crop_suitability(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
    top_k: int = 4
) -> Dict[str, Any]:
    """
    Executes real multi-model ML inference on agricultural parameters.
    Returns Top-K predictions, calibrated probabilities, model agreement, and prediction uncertainty.
    """
    rf, gb, scaler, meta = get_ml_models()
    classes = meta["classes"]

    # Preprocess
    features = np.array([[nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall]])
    scaled_features = scaler.transform(features)

    # 1. Random Forest Probabilities
    rf_probs = rf.predict_proba(scaled_features)[0]

    # 2. Gradient Boosting Probabilities
    gb_probs = gb.predict_proba(scaled_features)[0]

    # Ensemble mean probabilities
    ensemble_probs = (rf_probs + gb_probs) / 2.0

    # Top-K indices
    top_indices = np.argsort(ensemble_probs)[::-1][:top_k]

    # Calculate Model Agreement (Phase 8 requirement)
    rf_top1 = np.argmax(rf_probs)
    gb_top1 = np.argmax(gb_probs)
    rf_top3 = set(np.argsort(rf_probs)[::-1][:3])
    gb_top3 = set(np.argsort(gb_probs)[::-1][:3])

    if rf_top1 == gb_top1:
        agreement_score = 0.95
    else:
        overlap = len(rf_top3.intersection(gb_top3))
        agreement_score = 0.50 + (overlap * 0.15)

    # Calculate Prediction Uncertainty via Normalized Shannon Entropy
    # H = - sum(p * log(p)) / log(num_classes)
    p_safe = np.clip(ensemble_probs, 1e-12, 1.0)
    entropy = -np.sum(p_safe * np.log(p_safe))
    max_entropy = np.log(len(classes))
    normalized_uncertainty = round(float(entropy / max_entropy), 4)

    candidates = []
    for rank, idx in enumerate(top_indices, 1):
        candidates.append({
            "crop": classes[idx],
            "probability": round(float(ensemble_probs[idx]), 4),
            "suitability_score": round(float(ensemble_probs[idx] * 100), 2),
            "ranking": rank,
            "rf_prob": round(float(rf_probs[idx]), 4),
            "gb_prob": round(float(gb_probs[idx]), 4)
        })

    return {
        "primary_crop": candidates[0]["crop"],
        "top_candidates": candidates,
        "model_agreement": round(float(agreement_score), 4),
        "uncertainty": normalized_uncertainty,
        "model_version": meta["model_version"],
        "dataset_reference": meta["dataset"],
        "features_evaluated": {
            "N": nitrogen, "P": phosphorus, "K": potassium,
            "temp": temperature, "humidity": humidity, "pH": ph, "rainfall": rainfall
        }
    }
