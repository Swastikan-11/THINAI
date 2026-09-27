import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ─── USER & PROFILE SCHEMAS ──────────────────────────────────────────────────
class FarmerProfileBase(BaseModel):
    state: str = "Tamil Nadu"
    district: str = "Coimbatore"
    village: Optional[str] = None
    preferred_language: str = "English"
    experience_years: int = 5
    kcc_holder: bool = False

class FarmerProfileCreate(FarmerProfileBase):
    pass

class FarmerProfileOut(FarmerProfileBase):
    id: str
    user_id: str
    updated_at: datetime.datetime
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: str = "Farmer"

class UserCreate(UserBase):
    id: str # Firebase UID

class UserOut(UserBase):
    id: str
    is_active: bool
    created_at: datetime.datetime
    profile: Optional[FarmerProfileOut] = None
    class Config:
        from_attributes = True

# ─── MULTI-FARM & MULTI-FIELD SCHEMAS (PHASE 5) ──────────────────────────────
class FieldBase(BaseModel):
    name: str
    area_acres: float = 1.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: str = "Clay Loam"
    irrigation_type: str = "Canal + Borewell"
    current_crop: str = "Paddy (Rice)"
    crop_variety: str = "Ponni (CO 51)"
    sowing_date: Optional[str] = None
    crop_stage: str = "Tillering Stage"
    previous_crops: str = "Black Gram"

class FieldCreate(FieldBase):
    pass

class FieldOut(FieldBase):
    id: str
    farm_id: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class FarmBase(BaseModel):
    name: str
    total_area_acres: float = 2.0
    district: str = "Coimbatore"
    state: str = "Tamil Nadu"
    ownership_type: str = "Owned"

class FarmCreate(FarmBase):
    pass

class FarmOut(FarmBase):
    id: str
    user_id: str
    created_at: datetime.datetime
    fields: List[FieldOut] = []
    class Config:
        from_attributes = True

# ─── RECOMMENDATION & EVIDENCE SCHEMAS (PHASE 22) ────────────────────────────
class EvidenceOut(BaseModel):
    soil_saturation_index: float
    precipitation_forecast_mm: float
    crop_stage: str
    model_agreement_ratio: str
    expected_savings_rs: float
    rules_triggered: List[str]
    model_version: str
    generated_at: datetime.datetime
    class Config:
        from_attributes = True

# ─── ARFI & STRESS TESTING SCHEMAS (PHASE 8 & 9) ─────────────────────────────
class StressScenarioOut(BaseModel):
    scenario_name: str
    rainfall_delta_percent: float
    temp_delta_celsius: float
    market_price_delta_percent: float
    input_cost_delta_percent: float
    crop_rank_change: int
    fragility_status: str
    class Config:
        from_attributes = True

class ARFIAssessmentOut(BaseModel):
    id: str
    fragility_score: float # 0.0 to 1.0
    fragility_label: str # "Stable / Low Fragility", "Moderate Fragility", "Highly Fragile"
    data_reliability_score: float
    model_agreement_score: float
    uncertainty_score: float
    scenario_sensitivity_score: float
    stress_robustness_score: float
    decision_risk_score: float
    assessment_summary: str
    calculated_at: datetime.datetime
    stress_scenarios: List[StressScenarioOut] = []
    class Config:
        from_attributes = True

class RecommendationOut(BaseModel):
    id: str
    field_id: str
    title: str
    action: str
    category: str
    priority: str
    recommended_time: str
    why: str
    risk_averted: str
    alternative_action: str
    status: str
    created_at: datetime.datetime
    evidence: Optional[EvidenceOut] = None
    arfi_assessment: Optional[ARFIAssessmentOut] = None
    class Config:
        from_attributes = True

# ─── WHAT-IF SIMULATION SCHEMAS (PHASE 10) ───────────────────────────────────
class WhatIfRequest(BaseModel):
    field_id: str
    rainfall_delta_percent: float = 0.0 # e.g. -20%
    temperature_delta_celsius: float = 0.0 # e.g. +2C
    soil_moisture_override: Optional[float] = None
    market_price_delta_percent: float = 0.0 # e.g. -15%
    input_cost_delta_percent: float = 0.0 # e.g. +10%

class WhatIfResponse(BaseModel):
    original_action: str
    modified_action: str
    arfi_before: float
    arfi_after: float
    fragility_status: str
    profit_impact_rs: float
    risk_impact_summary: str
    recommendation_changed: bool
    reason_changed: str

# ─── CROP RECOMMENDATION ML SCHEMAS (PHASE 7) ────────────────────────────────
class MLPredictionCandidate(BaseModel):
    crop: str
    probability: float
    suitability_score: float
    ranking: int

class CropMLRecommendationResponse(BaseModel):
    primary_crop: str
    top_candidates: List[MLPredictionCandidate]
    model_agreement: float
    uncertainty: float
    model_version: str
    evaluated_at: datetime.datetime

# ─── DISEASE SCAN SCHEMAS (PHASE 11) ─────────────────────────────────────────
class DiseaseScanOut(BaseModel):
    id: str
    disease_name: str
    scientific_name: Optional[str]
    confidence: float
    severity: str
    is_reliable: bool
    rejection_reason: Optional[str]
    foliage_ratio: float
    lesion_area_ratio: float
    immediate_action: Optional[str]
    model_version: str
    scanned_at: datetime.datetime
    class Config:
        from_attributes = True

# ─── FARM ECONOMICS SCHEMAS (PHASE 15) ───────────────────────────────────────
class EconomicsOut(BaseModel):
    field_id: str
    total_cost_acre: float
    expected_revenue_acre: float
    net_profit_acre: float
    break_even_price_q: float
    downside_risk_rs: float
    class Config:
        from_attributes = True

# ─── FARM TIMELINE & ACTIVITY SCHEMAS (PHASE 16) ─────────────────────────────
class FarmActivityCreate(BaseModel):
    field_id: str
    activity_type: str
    date: str
    notes: str
    cost_rs: Optional[float] = None
    source: str = "MANUAL"

class FarmActivityOut(FarmActivityCreate):
    id: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class TimelineItem(BaseModel):
    event_id: str
    event_type: str # SOWING, IRRIGATION, FERTILIZER, DISEASE_SCAN, RECOMMENDATION, FEEDBACK
    date: str
    title: str
    detail: str
    cost_rs: Optional[float] = None
    source: str

# ─── ACTION FEEDBACK SCHEMAS (PHASE 17) ──────────────────────────────────────
class ActionFeedbackCreate(BaseModel):
    recommendation_id: str
    action_taken: str = "COMPLETED"
    rating: int = 5
    crop_observation: str = "Improved"
    notes: Optional[str] = None
    cost_saved_estimate: Optional[float] = None

class ActionFeedbackOut(ActionFeedbackCreate):
    id: str
    recorded_at: datetime.datetime
    class Config:
        from_attributes = True

# ─── SCHEMES SCHEMAS (PHASE 14) ──────────────────────────────────────────────
class SchemeOut(BaseModel):
    id: str
    name: str
    authority: str
    state: str
    benefits: str
    official_url: str
    eligibility_status: str = "Potentially Eligible" # As mandated in Phase 14
    eligibility_reasons: List[str] = []
    last_verified_at: datetime.datetime
    class Config:
        from_attributes = True

# ─── OFFLINE SYNC SCHEMAS (PHASE 19) ─────────────────────────────────────────
class SyncMutation(BaseModel):
    entity: str # "activity", "feedback", "field", "disease_scan"
    action: str # "create", "update"
    client_id: str
    timestamp: str
    payload: Dict[str, Any]

class SyncRequest(BaseModel):
    last_sync_timestamp: Optional[str] = None
    mutations: List[SyncMutation] = []

class SyncResponse(BaseModel):
    synced_mutations_count: int
    server_timestamp: str
    conflicts_resolved: List[str] = []
