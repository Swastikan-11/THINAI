import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import (
    AuthenticationFailedException,
    ResourceNotFoundException,
    ValidationException,
    ModelInferenceException
)
from app.db.base import init_db
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables
    logger.info("Initializing THINAI Database...")
    try:
        init_db()
        logger.info("THINAI Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
    yield
    # Shutdown
    logger.info("THINAI Backend shutting down")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Technology for Holistic Intelligent Nurturing of Agricultural Intelligence - Backend Decision Engine",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost",
    "capacitor://localhost",
    "https://localhost",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers
@app.exception_handler(AuthenticationFailedException)
async def auth_exception_handler(request: Request, exc: AuthenticationFailedException):
    return JSONResponse(status_code=401, content={"detail": exc.detail})

@app.exception_handler(ResourceNotFoundException)
async def not_found_exception_handler(request: Request, exc: ResourceNotFoundException):
    return JSONResponse(status_code=404, content={"detail": exc.detail})

@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    return JSONResponse(status_code=422, content={"detail": exc.detail})

@app.exception_handler(ModelInferenceException)
async def ml_exception_handler(request: Request, exc: ModelInferenceException):
    return JSONResponse(status_code=500, content={"detail": exc.detail})

# Health Check
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "THINAI API",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE
    }

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_STR)
