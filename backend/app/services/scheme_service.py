import datetime
from typing import List, Dict, Any

SCHEMES_REGISTRY = [
    {
        "id": "pm-kisan",
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "authority": "Ministry of Agriculture & Farmers Welfare, Govt of India",
        "state": "All India",
        "benefits": "Direct income transfer of ₹6,000 per year in 3 equal installments into verified bank accounts.",
        "official_url": "https://pmkisan.gov.in",
        "max_landholding_acres": None,
        "eligible_crops": ["All Crops"],
        "eligibility_reasons": ["Small and marginal farmer families with landholding"],
        "last_verified_at": "2026-09-01T00:00:00Z"
    },
    {
        "id": "pmfby",
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "authority": "Govt of India / State Agriculture Dept",
        "state": "All India",
        "benefits": "Comprehensive yield loss and localized weather calamity crop insurance. Low premium (2% Kharif, 1.5% Rabi).",
        "official_url": "https://pmfby.gov.in",
        "max_landholding_acres": None,
        "eligible_crops": ["Paddy", "Wheat", "Maize", "Cotton", "Pulses", "Oilseeds"],
        "eligibility_reasons": ["Notification for notified crops in notified insurance units"],
        "last_verified_at": "2026-09-01T00:00:00Z"
    },
    {
        "id": "kcc",
        "name": "Kisan Credit Card (KCC) Scheme",
        "authority": "National Bank for Agriculture & Rural Development (NABARD)",
        "state": "All India",
        "benefits": "Concessional short-term crop loans up to ₹3,00,000 at effective 4% interest per annum with prompt repayment incentive.",
        "official_url": "https://www.nabard.org",
        "max_landholding_acres": None,
        "eligible_crops": ["All Crops"],
        "eligibility_reasons": ["Owner-cultivators, tenant farmers, and oral lessees"],
        "last_verified_at": "2026-09-01T00:00:00Z"
    },
    {
        "id": "pm-kusum",
        "name": "PM-KUSUM Solar Pump Scheme",
        "authority": "Ministry of New and Renewable Energy (MNRE)",
        "state": "All India",
        "benefits": "Up to 60% capital subsidy to install standalone off-grid solar agricultural pumps (3HP to 7.5HP).",
        "official_url": "https://pmkusum.mnre.gov.in",
        "max_landholding_acres": None,
        "eligible_crops": ["All Crops"],
        "eligibility_reasons": ["Farmers with borewell/open well irrigation connection"],
        "last_verified_at": "2026-09-01T00:00:00Z"
    },
    {
        "id": "tn-micro-irrigation",
        "name": "Tamil Nadu Micro Irrigation Subsidy Scheme (TNMIS)",
        "authority": "Department of Horticulture and Plantation Crops, Tamil Nadu",
        "state": "Tamil Nadu",
        "benefits": "100% subsidy for small/marginal farmers (< 5 acres) and 75% for large farmers for drip/sprinkler installation.",
        "official_url": "https://tnhorticulture.tn.gov.in",
        "max_landholding_acres": 5.0,
        "eligible_crops": ["Vegetables", "Paddy (SRI)", "Sugarcane", "Banana", "Cotton"],
        "eligibility_reasons": ["Resident farmer in Tamil Nadu with assured irrigation source"],
        "last_verified_at": "2026-09-01T00:00:00Z"
    },
    {
        "id": "soil-health-card",
        "name": "National Soil Health Card Scheme",
        "authority": "Ministry of Agriculture & Farmers Welfare",
        "state": "All India",
        "benefits": "Free cycle-wise testing of 12 soil nutrient parameters (N, P, K, pH, EC, OC, Zn, Fe, Cu, Mn, B, S) with dosage recommendations.",
        "official_url": "https://soilhealth.dac.gov.in",
        "max_landholding_acres": None,
        "eligible_crops": ["All Crops"],
        "eligibility_reasons": ["All agricultural landholdings across rural blocks"],
        "last_verified_at": "2026-09-01T00:00:00Z"
    }
]

def evaluate_scheme_eligibility(
    farm_size_acres: float = 2.0,
    crop: str = "Paddy",
    state: str = "Tamil Nadu"
) -> List[Dict[str, Any]]:
    results = []
    for s in SCHEMES_REGISTRY:
        reasons = list(s["eligibility_reasons"])
        
        # State match check
        if s["state"] != "All India" and s["state"].lower() != state.lower():
            continue

        # Landholding check
        if s["max_landholding_acres"] is not None and farm_size_acres <= s["max_landholding_acres"]:
            reasons.append(f"Farm size ({farm_size_acres} acres) qualifies within {s['max_landholding_acres']}-acre ceiling")

        results.append({
            "id": s["id"],
            "name": s["name"],
            "authority": s["authority"],
            "state": s["state"],
            "benefits": s["benefits"],
            "official_url": s["official_url"],
            "eligibility_status": "Potentially Eligible", # Mandatory Phase 14 requirement
            "eligibility_reasons": reasons,
            "last_verified_at": s["last_verified_at"]
        })

    return results

def get_active_schemes(state: str = "Tamil Nadu", farm_size: float = 2.0) -> List[Dict[str, Any]]:
    return evaluate_scheme_eligibility(farm_size_acres=farm_size, state=state)

