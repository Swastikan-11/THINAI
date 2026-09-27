from app.db.session import Base
from app.models import (
    User, FarmerProfile, Farm, Field, SoilObservation, CropCycle,
    WeatherObservation, MarketObservation, Recommendation,
    RecommendationEvidence, ARFIAssessment, StressScenario,
    DiseaseScan, FarmActivity, ActionFeedback, Notification,
    Scheme, FarmEconomics
)

def init_db():
    from app.db.session import engine
    Base.metadata.create_all(bind=engine)
