from typing import Dict, Any, List
from app.core.config import settings
from app.ml.inference import predict_crop_suitability

def calculate_data_reliability(
    has_gps: bool = True,
    soil_tested_recently: bool = True,
    is_live_weather: bool = True
) -> float:
    score = 0.50
    if has_gps:
        score += 0.20
    if soil_tested_recently:
        score += 0.15
    if is_live_weather:
        score += 0.15
    return min(1.0, score)

def evaluate_arfi(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
    has_gps: bool = True,
    is_live_weather: bool = True,
    soil_tested: bool = True
) -> Dict[str, Any]:
    """
    Computes the Agricultural Recommendation Fragility Index (ARFI).
    ARFI is a multi-dimensional reliability metric evaluating how fragile
    or resilient an agricultural decision is under real-world uncertainty.
    """
    # 1. Base ML Prediction
    base_pred = predict_crop_suitability(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall)
    primary_crop = base_pred["primary_crop"]
    model_agreement = base_pred["model_agreement"]
    prediction_uncertainty = base_pred["uncertainty"]

    # 2. Data Reliability Score (0.0 to 1.0)
    data_reliability = calculate_data_reliability(has_gps, soil_tested, is_live_weather)

    # 3. Controlled Scenario Stress Testing (Phase 9)
    stress_results = run_agricultural_stress_scenarios(
        nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, primary_crop
    )
    
    scenario_sensitivity = stress_results["sensitivity_score"]
    stress_robustness = stress_results["robustness_score"]

    # 4. Decision Risk Score (heuristic risk based on crop investment intensity)
    high_input_crops = ["Sugarcane", "Banana", "Tomato", "Cotton"]
    decision_risk = 0.35 if primary_crop in high_input_crops else 0.18

    # 5. Weighted ARFI Calculation (Centrally Documented & Configurable)
    w_dr = settings.ARFI_WEIGHT_DATA_RELIABILITY
    w_ma = settings.ARFI_WEIGHT_MODEL_AGREEMENT
    w_pu = settings.ARFI_WEIGHT_PREDICTION_UNCERTAINTY
    w_ss = settings.ARFI_WEIGHT_SCENARIO_SENSITIVITY
    w_sr = settings.ARFI_WEIGHT_STRESS_ROBUSTNESS
    w_rk = settings.ARFI_WEIGHT_DECISION_RISK

    arfi_raw = (
        w_dr * (1.0 - data_reliability) +
        w_ma * (1.0 - model_agreement) +
        w_pu * prediction_uncertainty +
        w_ss * scenario_sensitivity +
        w_sr * (1.0 - stress_robustness) +
        w_rk * decision_risk
    )

    arfi_score = round(float(min(1.0, max(0.0, arfi_raw))), 4)

    # Categorize Fragility
    if arfi_score <= 0.30:
        fragility_label = "Stable / Low Fragility"
        summary = (
            f"The recommendation for {primary_crop} is highly stable and resilient. "
            f"High model agreement ({model_agreement * 100:.0f}%) and low stress sensitivity confirm high decision safety."
        )
    elif arfi_score <= 0.55:
        fragility_label = "Moderate Fragility"
        summary = (
            f"The recommendation for {primary_crop} is moderately fragile. "
            f"It remains viable under normal conditions but displays sensitivity to severe rainfall deficits or market fluctuations."
        )
    else:
        fragility_label = "Highly Fragile"
        summary = (
            f"The recommendation for {primary_crop} is highly fragile under current input uncertainty and adverse stress simulations. "
            f"Alternative robust crop consideration is advised."
        )

    return {
        "primary_crop": primary_crop,
        "fragility_score": arfi_score,
        "fragility_label": fragility_label,
        "components": {
            "data_reliability": round(float(data_reliability), 4),
            "model_agreement": round(float(model_agreement), 4),
            "prediction_uncertainty": round(float(prediction_uncertainty), 4),
            "scenario_sensitivity": round(float(scenario_sensitivity), 4),
            "stress_robustness": round(float(stress_robustness), 4),
            "decision_risk": round(float(decision_risk), 4)
        },
        "weights": {
            "w_data_reliability": w_dr,
            "w_model_agreement": w_ma,
            "w_prediction_uncertainty": w_pu,
            "w_scenario_sensitivity": w_ss,
            "w_stress_robustness": w_sr,
            "w_decision_risk": w_rk
        },
        "base_prediction": base_pred,
        "stress_scenarios": stress_results["scenarios"],
        "robust_alternative": stress_results.get("robust_alternative"),
        "assessment_summary": summary
    }

def run_agricultural_stress_scenarios(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
    primary_crop: str
) -> Dict[str, Any]:
    """
    Executes controlled stress testing scenarios per Phase 9 specification.
    """
    scenarios = [
        {"name": "Rainfall Deficit (-10%)", "r_mult": 0.90, "t_add": 0.0},
        {"name": "Severe Drought (-25%)", "r_mult": 0.75, "t_add": 0.5},
        {"name": "Extreme Drought (-35%)", "r_mult": 0.65, "t_add": 1.0},
        {"name": "Heatwave (+2°C)", "r_mult": 1.0, "t_add": 2.0},
        {"name": "Extreme Heat (+3.5°C)", "r_mult": 0.95, "t_add": 3.5},
        {"name": "Precipitation Spike (+30%)", "r_mult": 1.30, "t_add": -0.5}
    ]

    scenario_outputs = []
    flips = 0
    total_prob_drop = 0.0
    alternative_candidates = {}

    for sc in scenarios:
        r_mod = max(10.0, rainfall * sc["r_mult"])
        t_mod = temperature + sc["t_add"]

        pred = predict_crop_suitability(nitrogen, phosphorus, potassium, t_mod, humidity, ph, r_mod, top_k=2)
        sim_top = pred["primary_crop"]
        sim_top_prob = pred["top_candidates"][0]["probability"]

        is_flipped = (sim_top != primary_crop)
        if is_flipped:
            flips += 1
            alternative_candidates[sim_top] = alternative_candidates.get(sim_top, 0) + 1

        scenario_outputs.append({
            "scenario_name": sc["name"],
            "simulated_rainfall": round(r_mod, 1),
            "simulated_temperature": round(t_mod, 1),
            "top_recommended_crop": sim_top,
            "suitability_probability": sim_top_prob,
            "retained_original_crop": not is_flipped,
            "status": "STABLE" if not is_flipped else "SENSITIVE"
        })

    # Sensitivity: proportion of scenarios where recommendation flipped
    sensitivity = round(float(flips / len(scenarios)), 4)
    robustness = round(float(1.0 - sensitivity), 4)

    # Determine robust alternative if any
    robust_alt = None
    if alternative_candidates:
        robust_alt = max(alternative_candidates, key=alternative_candidates.get)

    return {
        "sensitivity_score": sensitivity,
        "robustness_score": robustness,
        "scenarios": scenario_outputs,
        "robust_alternative": robust_alt
    }
