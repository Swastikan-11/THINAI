from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, Depends
from app.core.security import get_current_user_claims
from app.services.weather_service import fetch_weather_by_coordinates

router = APIRouter()

@router.get("")
def get_weather(
    latitude: float = Query(11.0168, description="Latitude of field/farm"),
    longitude: float = Query(76.9558, description="Longitude of field/farm"),
    claims: dict = Depends(get_current_user_claims)
) -> Dict[str, Any]:
    """
    Fetches weather data from Open-Meteo API using exact farm coordinates.
    Includes data provenance metadata, timestamps, and fallback indicator.
    """
    return fetch_weather_by_coordinates(latitude, longitude)
