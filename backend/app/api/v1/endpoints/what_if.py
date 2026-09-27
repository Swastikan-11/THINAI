from fastapi import APIRouter, Depends
from app.core.security import get_current_user_claims
from app.schemas import WhatIfRequest, WhatIfResponse
from app.services.what_if_service import simulate_what_if_scenario

router = APIRouter()

@router.post("/simulate", response_model=WhatIfResponse)
def simulate_scenario(
    req: WhatIfRequest,
    claims: dict = Depends(get_current_user_claims)
):
    """
    Evaluates dynamic what-if parameter perturbations (rainfall delta, temperature, costs)
    and reports ARFI shift, profit impact, and action stability.
    """
    result = simulate_what_if_scenario(
        rainfall_delta_percent=req.rainfall_delta_percent,
        temperature_delta_celsius=req.temperature_delta_celsius,
        soil_moisture_override=req.soil_moisture_override,
        market_price_delta_percent=req.market_price_delta_percent,
        input_cost_delta_percent=req.input_cost_delta_percent
    )
    return result
