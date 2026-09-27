import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models import User, FarmerProfile, Farm, Field
from app.schemas import UserOut, FarmerProfileCreate, FarmerProfileOut

router = APIRouter()

@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    """
    Retrieves current user and their farmer profile using verified Firebase UID.
    Creates basic User entry if it doesn't exist yet.
    """
    uid = claims.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing UID in token claims")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        user = User(
            id=uid,
            email=claims.get("email"),
            phone=claims.get("phone_number"),
            full_name=claims.get("name", "Farmer"),
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

@router.post("/profile", response_model=FarmerProfileOut)
def update_farmer_profile(
    profile_in: FarmerProfileCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    """
    Creates or updates the farmer profile for the authenticated Firebase UID.
    """
    uid = claims.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing UID in token claims")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        user = User(
            id=uid,
            email=claims.get("email"),
            phone=claims.get("phone_number"),
            full_name=claims.get("name", "Farmer"),
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == uid).first()
    if not profile:
        profile = FarmerProfile(
            id=f"profile-{uid}",
            user_id=uid,
            state=profile_in.state,
            district=profile_in.district,
            village=profile_in.village,
            preferred_language=profile_in.preferred_language,
            experience_years=profile_in.experience_years,
            kcc_holder=profile_in.kcc_holder,
            updated_at=datetime.datetime.utcnow()
        )
        db.add(profile)
    else:
        profile.state = profile_in.state
        profile.district = profile_in.district
        profile.village = profile_in.village
        profile.preferred_language = profile_in.preferred_language
        profile.experience_years = profile_in.experience_years
        profile.kcc_holder = profile_in.kcc_holder
        profile.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(profile)
    return profile

@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_user_account(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    """
    Deletes user and cascades deletion of all associated data.
    """
    uid = claims.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing UID in token claims")

    user = db.query(User).filter(User.id == uid).first()
    if user:
        db.delete(user)
        db.commit()
    return {"status": "success", "message": "User account and all data deleted"}
