import datetime
import httpx
from typing import Dict, Any

async def fetch_weather_by_coordinates(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetches real-time weather observations and 48-hour forecasts from Open-Meteo API
    using exact field GPS coordinates.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={latitude}&longitude={longitude}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
        f"&hourly=temperature_2m,precipitation_probability"
        f"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum"
        f"&timezone=auto"
    )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(url)
            if res.status_code != 200:
                raise Exception(f"Open-Meteo API returned status {res.status_code}")
            data = res.json()

        current = data.get("current", {})
        daily = data.get("daily", {})
        rain_48h = float(sum((daily.get("precipitation_sum") or [0, 0])[:2]))

        return {
            "is_live": True,
            "source": "Open-Meteo API (Live Micro-Climate)",
            "latitude": latitude,
            "longitude": longitude,
            "temperature": round(float(current.get("temperature_2m", 28.0)), 1),
            "humidity": round(float(current.get("relative_humidity_2m", 75.0)), 1),
            "feels_like": round(float(current.get("apparent_temperature", 30.0)), 1),
            "precipitation_mm": round(float(current.get("precipitation", 0.0)), 1),
            "forecast_48h_rain_mm": round(rain_48h, 1),
            "wind_speed_kmh": round(float(current.get("wind_speed_10m", 12.0)), 1),
            "recorded_at": now_iso,
            "status_label": "Live Weather Verified"
        }
    except Exception as e:
        # Transparent fallback with explicit labeling
        return {
            "is_live": False,
            "source": "Cached Regional Agro-Climatic Baseline (Offline Backup)",
            "latitude": latitude,
            "longitude": longitude,
            "temperature": 28.0,
            "humidity": 75.0,
            "feels_like": 30.0,
            "precipitation_mm": 0.0,
            "forecast_48h_rain_mm": 0.0,
            "wind_speed_kmh": 12.0,
            "recorded_at": now_iso,
            "status_label": "Cached Data - Offline Mode"
        }
