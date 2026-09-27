from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user_claims
from app.schemas import EconomicsOut
from app.services.economics_service import calculate_farm_economics

router = APIRouter()

@router.get("/{field_id}", response_model=EconomicsOut)
def get_field_economics(
    field_id: str,
    crop: str = Query("Paddy (Rice)"),
    area_acres: float = Query(2.0),
    claims: dict = Depends(get_current_user_claims)
):
    """
    Computes cost of cultivation, expected revenue, break-even price per quintal,
    and downside climate/market risk.
    """
    return calculate_farm_economics(field_id=field_id, crop=crop, area_acres=area_acres)
