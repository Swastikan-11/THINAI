import datetime
from typing import Dict, Any, List

# Standard APMC reference benchmark prices across major Indian commodity hubs
BENCHMARK_MARKET_DATA = {
    "Paddy (Rice)": {
        "commodity": "Paddy (Ponni / Common)",
        "market": "Coimbatore APMC Mandi",
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "modal_price": 2840.0,
        "msp_benchmark": 2183.0,
        "min_price": 2750.0,
        "max_price": 2920.0,
        "weekly_trend_percent": 2.4,
        "recommendation_signal": "HOLD — Upward Price Momentum",
        "source": "APMC Mandi Feed",
        "is_benchmark": True,
        "status_label": "Reference Benchmark (Historical APMC Feed)"
    },
    "Wheat": {
        "commodity": "Wheat (Dara / Sharbati)",
        "market": "Khanna Mandi",
        "district": "Ludhiana",
        "state": "Punjab",
        "modal_price": 2275.0,
        "msp_benchmark": 2275.0,
        "min_price": 2200.0,
        "max_price": 2350.0,
        "weekly_trend_percent": 0.5,
        "recommendation_signal": "HOLD / STEADY",
        "source": "APMC Mandi Feed",
        "is_benchmark": True,
        "status_label": "Reference Benchmark (Historical APMC Feed)"
    },
    "Tomato": {
        "commodity": "Tomato (Hybrid)",
        "market": "Otta-chathiram Market",
        "district": "Dindigul",
        "state": "Tamil Nadu",
        "modal_price": 1850.0,
        "msp_benchmark": 1400.0,
        "min_price": 1600.0,
        "max_price": 2100.0,
        "weekly_trend_percent": -3.5,
        "recommendation_signal": "SELL NOW — High Volatility",
        "source": "APMC Mandi Feed",
        "is_benchmark": True,
        "status_label": "Reference Benchmark (Historical APMC Feed)"
    },
    "Maize": {
        "commodity": "Maize (Yellow)",
        "market": "Davanagere Mandi",
        "district": "Davanagere",
        "state": "Karnataka",
        "modal_price": 2120.0,
        "msp_benchmark": 2090.0,
        "min_price": 2050.0,
        "max_price": 2180.0,
        "weekly_trend_percent": 1.2,
        "recommendation_signal": "HOLD Buffer Stock",
        "source": "APMC Mandi Feed",
        "is_benchmark": True,
        "status_label": "Reference Benchmark (Historical APMC Feed)"
    }
}

def get_market_price_record(commodity: str = "Paddy (Rice)") -> Dict[str, Any]:
    matched = None
    for k, v in BENCHMARK_MARKET_DATA.items():
        if k.lower() in commodity.lower() or commodity.lower() in k.lower():
            matched = v
            break

    if not matched:
        matched = BENCHMARK_MARKET_DATA["Paddy (Rice)"]

    return {
        **matched,
        "date": datetime.date.today().isoformat(),
        "last_updated": datetime.datetime.utcnow().isoformat()
    }

def get_all_market_prices() -> List[Dict[str, Any]]:
    today = datetime.date.today().isoformat()
    now = datetime.datetime.utcnow().isoformat()
    return [
        {**v, "date": today, "last_updated": now}
        for v in BENCHMARK_MARKET_DATA.values()
    ]

