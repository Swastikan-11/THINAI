from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.core.security import get_current_user_claims
from app.services.market_service import get_all_market_prices, get_market_price_record

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
def get_market_prices(
    claims: dict = Depends(get_current_user_claims)
):
    """
    Returns verified APMC benchmark market prices with provenance notes and update timestamps.
    """
    return get_all_market_prices()

@router.get("/{commodity}", response_model=Dict[str, Any])
def get_commodity_price(
    commodity: str,
    claims: dict = Depends(get_current_user_claims)
):
    return get_market_price_record(commodity)
