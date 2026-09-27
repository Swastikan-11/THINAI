import datetime
from typing import Dict, Any, List, Optional
from app.services.arfi_service import evaluate_arfi
from app.services.weather_service import fetch_weather_by_coordinates
from app.services.market_service import get_market_price_record

def generate_field_recommendation_and_arfi(
    field_id: str,
    crop: str = "Paddy (Rice)",
    crop_stage: str = "Tillering Stage",
    soil_type: str = "Clay Loam",
    soil_moisture: float = 68.0,
    latitude: float = 11.0168,
    longitude: float = 76.9558,
    weather_data: Optional[Dict[str, Any]] = None,
    recent_feedback: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Executes the full THINAI decision pipeline:
    Farm Profile + Soil + Field Weather + Market + ARFI Reliability + Evidence Generation.
    """
    # 1. Weather Inputs
    w = weather_data or {
        "temperature": 28.0,
        "humidity": 78.0,
        "forecast_48h_rain_mm": 88.0,
        "is_live": True
    }
    temp = float(w.get("temperature", 28.0))
    humidity = float(w.get("humidity", 78.0))
    rain_48h = float(w.get("forecast_48h_rain_mm", 88.0))

    # 2. Market Inputs
    market = get_market_price_record(crop)
    market_price = market["modal_price"]

    # 3. Soil Nutrients (Default / Recent Observation)
    N = 80.0
    P = 45.0
    K = 40.0
    pH = 6.5

    # 4. ARFI & ML Inference (Phases 7, 8, 9)
    arfi_result = evaluate_arfi(
        nitrogen=N,
        phosphorus=P,
        potassium=K,
        temperature=temp,
        humidity=humidity,
        ph=pH,
        rainfall=rain_48h * 2.5, # Normalized seasonal precipitation projection
        has_gps=True,
        is_live_weather=w.get("is_live", True),
        soil_tested=True
    )

    # 5. Core Agronomic Decision Logic & Feedback Adaptation
    # Inspect feedback history
    feedbacks = recent_feedback or []
    has_followed_irrigation_pause = any(
        f.get("recommendation_id") == "delay_irrigation_fungal" and f.get("action_taken") == "COMPLETED"
        for f in feedbacks
    )

    if (crop.lower().startswith("paddy") or crop.lower().startswith("rice")) and rain_48h > 35 and soil_moisture > 60:
        if not has_followed_irrigation_pause:
            rec_id = "delay_irrigation_fungal"
            title = "Delay Irrigation for 24-48 Hours"
            action = "Halt planned pump/canal irrigation immediately and unclog field bund drainage outlets."
            why = (
                f"Upcoming rainfall of {rain_48h:.0f}mm combined with existing {soil_moisture:.0f}% soil moisture "
                f"satisfies crop water demand. Excessive standing water in tillering restricts root aeration and triggers blast fungal spore proliferation."
            )
            when = "Re-check soil tomorrow morning before next scheduled watering."
            risk_averted = "Root zone oxygen starvation (hypoxia), tiller mortality, and blast (*Magnaporthe oryzae*) proliferation."
            alternative_action = "If field bunds are overflowing, open field spillways to limit standing water to a maximum depth of 3 cm."
            priority = "High"
            rules = ["RULE_PADDY_TILLERING_SATURATION", "RULE_HIGH_HUMIDITY_BLAST", "RULE_RAIN_AVOID_EXCESS_PUMPING"]
            savings = 1200.0
        else:
            rec_id = "post_rain_drainage_check"
            title = "Post-Rain Drainage & Foliar Bio-Control"
            action = "Clear bund exits to drain standing water down to 3-5cm and spray bio-agent Pseudomonas fluorescens."
            why = "You completed the irrigation pause. Excess standing water from recent rain must now be regulated to avoid sheath rot."
            when = "Within 12 hours after rainfall ceases (early morning)."
            risk_averted = "Stagnant water (>7cm) inhibits sunlight penetration to lower tillers and fosters bacterial sheath rot."
            alternative_action = "If field is completely submerged, pump surface water into farm pond or drainage ditch."
            priority = "High"
            rules = ["RULE_POST_RAIN_DRAINAGE_VERIFICATION", "RULE_FEEDBACK_ADAPTIVE_LOOP"]
            savings = 850.0
    else:
        rec_id = "general_phenology_scout"
        title = "Vegetative Canopy Scouting & Micro-Nutrient Watch"
        action = "Inspect tillers for uniform vegetative emergence and ensure balanced potassium levels."
        why = f"Current temperature ({temp}°C) and soil moisture ({soil_moisture}%) are favorable for vegetative development."
        when = "During morning hours (7 AM - 9 AM)."
        risk_averted = "Nascent pest borer damage and hidden micronutrient deficiencies."
        alternative_action = "Apply bio-fertilizer mycorrhiza or Panchagavya 3% as foliar spray."
        priority = "Medium"
        rules = ["RULE_ROUTINE_PHENOLOGY_MONITORING"]
        savings = 500.0

    evidence = {
        "soil_saturation_index": soil_moisture,
        "precipitation_forecast_mm": rain_48h,
        "crop_stage": crop_stage,
        "model_agreement_ratio": f"{int(arfi_result['components']['model_agreement'] * 100)}% Model Consensus",
        "expected_savings_rs": savings,
        "rules_triggered": rules,
        "model_version": arfi_result["base_prediction"]["model_version"],
        "generated_at": datetime.datetime.utcnow().isoformat()
    }

    return {
        "id": f"rec-{int(datetime.datetime.utcnow().timestamp())}",
        "field_id": field_id,
        "title": title,
        "action": action,
        "category": "Irrigation" if "irrigation" in title.lower() else "Disease",
        "priority": priority,
        "recommended_time": when,
        "why": why,
        "risk_averted": risk_averted,
        "alternative_action": alternative_action,
        "status": "PENDING",
        "created_at": datetime.datetime.utcnow().isoformat(),
        "evidence": evidence,
        "arfi_assessment": {
            "id": f"arfi-{int(datetime.datetime.utcnow().timestamp())}",
            "fragility_score": arfi_result["fragility_score"],
            "fragility_label": arfi_result["fragility_label"],
            "data_reliability_score": arfi_result["components"]["data_reliability"],
            "model_agreement_score": arfi_result["components"]["model_agreement"],
            "uncertainty_score": arfi_result["components"]["prediction_uncertainty"],
            "scenario_sensitivity_score": arfi_result["components"]["scenario_sensitivity"],
            "stress_robustness_score": arfi_result["components"]["stress_robustness"],
            "decision_risk_score": arfi_result["components"]["decision_risk"],
            "assessment_summary": arfi_result["assessment_summary"],
            "calculated_at": datetime.datetime.utcnow().isoformat(),
            "stress_scenarios": arfi_result["stress_scenarios"]
        }
    }
