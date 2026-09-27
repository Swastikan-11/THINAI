import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # Firebase UID
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False, default="Farmer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    farms = relationship("Farm", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    scans = relationship("DiseaseScan", back_populates="user", cascade="all, delete-orphan")

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    state = Column(String, default="Tamil Nadu")
    district = Column(String, default="Coimbatore")
    village = Column(String, nullable=True)
    preferred_language = Column(String, default="English")
    experience_years = Column(Integer, default=5)
    kcc_holder = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    total_area_acres = Column(Float, default=2.0)
    district = Column(String, default="Coimbatore")
    state = Column(String, default="Tamil Nadu")
    ownership_type = Column(String, default="Owned")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

class Field(Base):
    __tablename__ = "fields"

    id = Column(String, primary_key=True, index=True)
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    area_acres = Column(Float, default=1.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    soil_type = Column(String, default="Clay Loam")
    irrigation_type = Column(String, default="Canal + Borewell")
    current_crop = Column(String, default="Paddy (Rice)")
    crop_variety = Column(String, default="Ponni (CO 51)")
    sowing_date = Column(String, nullable=True)
    crop_stage = Column(String, default="Tillering Stage")
    previous_crops = Column(String, default="Black Gram")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="fields")
    soil_observations = relationship("SoilObservation", back_populates="field", cascade="all, delete-orphan")
    crop_cycles = relationship("CropCycle", back_populates="field", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="field", cascade="all, delete-orphan")
    activities = relationship("FarmActivity", back_populates="field", cascade="all, delete-orphan")
    economics = relationship("FarmEconomics", back_populates="field", uselist=False, cascade="all, delete-orphan")

class SoilObservation(Base):
    __tablename__ = "soil_observations"

    id = Column(String, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    ph = Column(Float, default=6.8)
    nitrogen_kg_ha = Column(Float, default=42.0)
    phosphorus_kg_ha = Column(Float, default=18.5)
    potassium_kg_ha = Column(Float, default=145.0)
    organic_carbon_percent = Column(Float, default=0.55)
    moisture_percent = Column(Float, default=68.0)
    tested_at = Column(DateTime, default=datetime.datetime.utcnow)

    field = relationship("Field", back_populates="soil_observations")

class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id = Column(String, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    sowing_date = Column(DateTime, nullable=True)
    harvest_date = Column(DateTime, nullable=True)
    target_yield_q_acre = Column(Float, default=24.0)
    actual_yield_q_acre = Column(Float, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, HARVESTED, FAILED

    field = relationship("Field", back_populates="crop_cycles")

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(String, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    precipitation_mm = Column(Float, default=0.0)
    forecast_48h_rain_mm = Column(Float, default=0.0)
    wind_speed_kmh = Column(Float, default=0.0)
    source = Column(String, default="Open-Meteo API")
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

class MarketObservation(Base):
    __tablename__ = "market_observations"

    id = Column(String, primary_key=True, index=True)
    commodity = Column(String, nullable=False)
    market_name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    modal_price_rs_q = Column(Float, nullable=False)
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    source = Column(String, default="APMC Mandi Feed")
    is_benchmark = Column(Boolean, default=True)
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    action = Column(Text, nullable=False)
    category = Column(String, default="Irrigation") # Irrigation, Fertilizer, Pest, Disease, Market
    priority = Column(String, default="High") # High, Medium, Low
    recommended_time = Column(String, nullable=False)
    why = Column(Text, nullable=False)
    risk_averted = Column(Text, nullable=False)
    alternative_action = Column(Text, nullable=False)
    status = Column(String, default="PENDING") # PENDING, ACCEPTED, REJECTED, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    field = relationship("Field", back_populates="recommendations")
    evidence = relationship("RecommendationEvidence", back_populates="recommendation", uselist=False, cascade="all, delete-orphan")
    arfi_assessment = relationship("ARFIAssessment", back_populates="recommendation", uselist=False, cascade="all, delete-orphan")
    feedbacks = relationship("ActionFeedback", back_populates="recommendation", cascade="all, delete-orphan")

class RecommendationEvidence(Base):
    __tablename__ = "recommendation_evidence"

    id = Column(String, primary_key=True, index=True)
    recommendation_id = Column(String, ForeignKey("recommendations.id", ondelete="CASCADE"), unique=True, nullable=False)
    soil_saturation_index = Column(Float, default=68.0)
    precipitation_forecast_mm = Column(Float, default=85.0)
    crop_stage = Column(String, default="Tillering Stage")
    model_agreement_ratio = Column(String, default="3/3 Ensemble Models")
    expected_savings_rs = Column(Float, default=1200.0)
    rules_triggered = Column(JSON, default=list)
    model_version = Column(String, default="THINAI-Core-v2.1")
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="evidence")

class ARFIAssessment(Base):
    __tablename__ = "arfi_assessments"

    id = Column(String, primary_key=True, index=True)
    recommendation_id = Column(String, ForeignKey("recommendations.id", ondelete="CASCADE"), unique=True, nullable=False)
    fragility_score = Column(Float, nullable=False) # 0.0 (Extremely Robust) to 1.0 (Highly Fragile)
    fragility_label = Column(String, nullable=False) # "Stable / Low Fragility", "Moderate Fragility", "Highly Fragile"
    data_reliability_score = Column(Float, default=0.88)
    model_agreement_score = Column(Float, default=0.92)
    uncertainty_score = Column(Float, default=0.12)
    scenario_sensitivity_score = Column(Float, default=0.18)
    stress_robustness_score = Column(Float, default=0.85)
    decision_risk_score = Column(Float, default=0.20)
    assessment_summary = Column(Text, nullable=False)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="arfi_assessment")
    stress_scenarios = relationship("StressScenario", back_populates="arfi_assessment", cascade="all, delete-orphan")

class StressScenario(Base):
    __tablename__ = "stress_scenarios"

    id = Column(String, primary_key=True, index=True)
    arfi_assessment_id = Column(String, ForeignKey("arfi_assessments.id", ondelete="CASCADE"), nullable=False)
    scenario_name = Column(String, nullable=False) # e.g. "Rainfall -20%", "Temp +2C", "Market -15%"
    rainfall_delta_percent = Column(Float, default=0.0)
    temp_delta_celsius = Column(Float, default=0.0)
    market_price_delta_percent = Column(Float, default=0.0)
    input_cost_delta_percent = Column(Float, default=0.0)
    crop_rank_change = Column(Integer, default=0)
    fragility_status = Column(String, default="STABLE") # STABLE, SENSITIVE, CRITICAL

    arfi_assessment = relationship("ARFIAssessment", back_populates="stress_scenarios")

class DiseaseScan(Base):
    __tablename__ = "disease_scans"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    field_id = Column(String, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String, nullable=True)
    disease_name = Column(String, nullable=False)
    scientific_name = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    severity = Column(String, default="Low")
    is_reliable = Column(Boolean, default=True)
    rejection_reason = Column(String, nullable=True)
    foliage_ratio = Column(Float, default=0.0)
    lesion_area_ratio = Column(Float, default=0.0)
    immediate_action = Column(Text, nullable=True)
    model_version = Column(String, default="PlantVillage-CV-v2.0")
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="scans")

class FarmActivity(Base):
    __tablename__ = "farm_activities"

    id = Column(String, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String, nullable=False) # Irrigation, Sowing, Fertilizing, Spraying, Harvesting
    date = Column(String, nullable=False)
    notes = Column(Text, nullable=False)
    cost_rs = Column(Float, nullable=True)
    source = Column(String, default="MANUAL") # MANUAL, THINAI_RECOMMENDATION
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    field = relationship("Field", back_populates="activities")

class ActionFeedback(Base):
    __tablename__ = "action_feedbacks"

    id = Column(String, primary_key=True, index=True)
    recommendation_id = Column(String, ForeignKey("recommendations.id", ondelete="CASCADE"), nullable=False)
    action_taken = Column(String, default="COMPLETED") # COMPLETED, SKIPPED, IN_PROGRESS
    rating = Column(Integer, default=5)
    crop_observation = Column(String, default="Improved") # Improved, Normal, Degraded
    notes = Column(Text, nullable=True)
    cost_saved_estimate = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="feedbacks")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="WEATHER_ALERT") # WEATHER_ALERT, IRRIGATION, DISEASE_RISK, MARKET
    priority = Column(String, default="HIGH")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Scheme(Base):
    __tablename__ = "government_schemes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    authority = Column(String, nullable=False)
    state = Column(String, default="All India")
    eligibility_criteria = Column(JSON, default=dict)
    benefits = Column(Text, nullable=False)
    official_url = Column(String, nullable=False)
    last_verified_at = Column(DateTime, default=datetime.datetime.utcnow)

class FarmEconomics(Base):
    __tablename__ = "farm_economics"

    id = Column(String, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id", ondelete="CASCADE"), unique=True, nullable=False)
    seed_cost_acre = Column(Float, default=1200.0)
    fertilizer_cost_acre = Column(Float, default=3400.0)
    pesticide_cost_acre = Column(Float, default=1800.0)
    labour_cost_acre = Column(Float, default=6500.0)
    irrigation_cost_acre = Column(Float, default=2200.0)
    machinery_cost_acre = Column(Float, default=2800.0)
    expected_yield_q_acre = Column(Float, default=24.0)
    expected_price_rs_q = Column(Float, default=2840.0)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    field = relationship("Field", back_populates="economics")
