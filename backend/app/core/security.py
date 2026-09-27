import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import AuthenticationFailedException

security_bearer = HTTPBearer(auto_error=False)

# Initialize Firebase Admin SDK
_firebase_initialized = False

def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized with service account certificate")
        else:
            # Initialize with default application credentials or project ID
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            logger.info(f"Firebase Admin initialized with project ID: {settings.FIREBASE_PROJECT_ID}")
        _firebase_initialized = True
    except Exception as e:
        logger.warning(f"Firebase Admin initialization deferred / in mock mode: {e}")

try:
    init_firebase()
except Exception as e:
    logger.warning(f"Could not initialize Firebase Admin at startup: {e}")

async def get_current_user_claims(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> dict:
    """
    Verifies Firebase ID token from HTTP Authorization header.
    Returns decoded token dictionary with user claims (uid, email, phone, etc.).
    """
    if not auth_header or not auth_header.credentials:
        # In explicit DEMO_MODE or dev testing, allow test header if configured
        if settings.DEMO_MODE or settings.ENVIRONMENT == "development":
            return {
                "uid": "demo-farmer-arun-coimbatore",
                "email": "arun.farmer@thinai.in",
                "name": "Arun Kumar",
                "phone_number": "+919876543210",
                "is_demo": True
            }
        raise AuthenticationFailedException("Authorization header missing")

    token = auth_header.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        # Allow demo tokens during prototype evaluation if DEMO_MODE is true
        if settings.DEMO_MODE and token.startswith("demo-token-"):
            return {
                "uid": token.replace("demo-token-", "user-"),
                "email": "demo@thinai.in",
                "name": "Evaluation Farmer",
                "is_demo": True
            }
        raise AuthenticationFailedException(f"Invalid authentication token: {str(e)}")
