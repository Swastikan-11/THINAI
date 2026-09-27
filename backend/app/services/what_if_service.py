from typing import Dict, Any, Optional
from app.services.arfi_service import evaluate_arfi

def simulate_what_if_scenario(
    nitrogen: float = 80.0,
    phosphorus: float = 45.0,
    potassium: float = 40.0,
    base_temp: float = 24.0,
    base_humidity: float = 82.0,
    base_ph: float = 6.5,
    base_rainfall: float = 230.0,
    rainfall_delta_percent: float = 0.0,
    temperature_delta_celsius: float = 0.0,
    soil_moisture_override: Optional[float] = None,
    market_price_delta_percent: float = 0.0,
    input_cost_delta_percent: float = 0.0
) -> Dict[str, Any]:
    """
    Evaluates dynamic what-if parameter modifications against ARFI and profit metrics.
    """
    # 1. Base ARFI Assessment
    base_eval = evaluate_arfi(
        nitrogen, phosphorus, potassium, base_temp, base_humidity, base_ph, base_rainfall
    )
    original_crop = base_eval["primary_crop"]
    arfi_before = base_eval["fragility_score"]

    # 2. Apply Perturbations
    mod_rainfall = max(10.0, base_rainfall * (1.0 + (rainfall_delta_percent / 100.0)))
    mod_temp = base_temp + temperature_delta_celsius
    mod_humidity = base_humidity
    if soil_moisture_override is not None:
        # Moisture impacts effective humidity & root saturation
        mod_humidity = min(100.0, max(20.0, soil_moisture_override * 1.15))

    # 3. Modified ARFI Assessment
    mod_eval = evaluate_arfi(
        nitrogen, phosphorus, potassium, mod_temp, mod_humidity, base_ph, mod_rainfall
    )
    modified_crop = mod_eval["primary_crop"]
    arfi_after = mod_eval["fragility_score"]

    # 4. Economic Impact Projection
    # Baseline expected revenue per acre ~ ₹68,000 for Paddy
    base_revenue = 68000.0
    base_cost = 24000.0
    base_net_profit = base_revenue - base_cost

    mod_revenue = base_revenue * (1.0 + (market_price_delta_percent / 100.0))
    # Rainfall deficits below -20% reduce yield by ~12%
    if rainfall_delta_percent < -20.0:
        mod_revenue *= 0.88

    mod_cost = base_cost * (1.0 + (input_cost_delta_percent / 100.0))
    mod_net_profit = mod_revenue - mod_cost
    profit_impact = round(float(mod_net_profit - base_net_profit), 2)

    # 5. Recommendation Shift Analysis
    changed = (original_crop != modified_crop)
    if changed:
        reason = (
            f"Due to the simulated parameter shifts (Rainfall {rainfall_delta_percent:+.0f}%, "
            f"Temp {temperature_delta_celsius:+.1f}°C), {modified_crop} demonstrates superior agronomic "
            f"resilience over {original_crop}."
        )
    else:
        if abs(arfi_after - arfi_before) > 0.15:
            reason = (
                f"{original_crop} remains the primary candidate, but its decision fragility "
                f"shifted from {arfi_before:.2f} to {arfi_after:.2f} due to environmental stress."
            )
        else:
            reason = f"{original_crop} recommendation remains stable under these tested tolerances."

    risk_summary = (
        f"ARFI changed by {(arfi_after - arfi_before):+.2f}. "
        f"Simulated profit change: ₹{profit_impact:+.0f}/acre. "
        f"Status: {mod_eval['fragility_label']}."
    )

    return {
        "original_crop": original_crop,
        "modified_crop": modified_crop,
        "arfi_before": arfi_before,
        "arfi_after": arfi_after,
        "fragility_status": mod_eval["fragility_label"],
        "profit_impact_rs": profit_impact,
        "risk_impact_summary": risk_summary,
        "recommendation_changed": changed,
        "reason_changed": reason,
        "modified_parameters": {
            "rainfall_mm": round(mod_rainfall, 1),
            "temperature_c": round(mod_temp, 1),
            "humidity_percent": round(mod_humidity, 1),
            "market_price_shift": f"{market_price_delta_percent:+.0f}%",
            "input_cost_shift": f"{input_cost_delta_percent:+.0f}%"
        }
    }
