from typing import List
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user_claims
from app.schemas import SchemeOut
from app.services.scheme_service import get_active_schemes

router = APIRouter()

@router.get("", response_model=List[SchemeOut])
def get_schemes(
    state: str = Query("Tamil Nadu"),
    farm_size: float = Query(2.0),
    claims: dict = Depends(get_current_user_claims)
):
    """
    Returns government agricultural schemes with 'Potentially Eligible' qualification
    and required criteria matching the farmer's state and holding size.
    """
    return get_active_schemes(state, farm_size)
