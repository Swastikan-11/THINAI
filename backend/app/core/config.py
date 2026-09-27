import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "THINAI Agricultural Decision-Support API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "False").lower() == "true"
    
    # Database (Defaults to local SQLite for out-of-the-box local dev, supports PostgreSQL via env)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./thinai.db"
    )
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "thinai-agri-prod")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    
    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "capacitor://localhost",
        "http://localhost",
        "https://thinai.app"
    ]
    
    # ARFI Weights Configuration (Configurable & Documented - Phase 8 requirement)
    ARFI_WEIGHT_DATA_RELIABILITY: float = 0.20
    ARFI_WEIGHT_MODEL_AGREEMENT: float = 0.20
    ARFI_WEIGHT_PREDICTION_UNCERTAINTY: float = 0.15
    ARFI_WEIGHT_SCENARIO_SENSITIVITY: float = 0.15
    ARFI_WEIGHT_STRESS_ROBUSTNESS: float = 0.15
    ARFI_WEIGHT_DECISION_RISK: float = 0.15

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
