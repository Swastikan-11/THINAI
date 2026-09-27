from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, farms, fields, recommendations, what_if,
    weather, market, schemes, economics, disease,
    activities, feedback, sync
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(farms.router, prefix="/farms", tags=["Farms"])
api_router.include_router(fields.router, prefix="/fields", tags=["Fields"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations & ARFI"])
api_router.include_router(what_if.router, prefix="/what-if", tags=["What-If Simulation"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather Intelligence"])
api_router.include_router(market.router, prefix="/market", tags=["Market Intelligence"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Government Schemes"])
api_router.include_router(economics.router, prefix="/economics", tags=["Farm Economics"])
api_router.include_router(disease.router, prefix="/disease", tags=["Disease Diagnostics"])
api_router.include_router(activities.router, prefix="/activities", tags=["Farm Activities & Diary"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Action Feedback"])
api_router.include_router(sync.router, prefix="/sync", tags=["Offline Sync Engine"])
