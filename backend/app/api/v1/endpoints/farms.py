import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models import Farm, Field
from app.schemas import FarmCreate, FarmOut

router = APIRouter()

@router.get("", response_model=List[FarmOut])
def get_user_farms(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    return db.query(Farm).filter(Farm.user_id == uid).all()

@router.post("", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    farm_id = f"farm-{int(datetime.datetime.utcnow().timestamp())}"
    farm = Farm(
        id=farm_id,
        user_id=uid,
        name=farm_in.name,
        total_area_acres=farm_in.total_area_acres,
        district=farm_in.district,
        state=farm_in.state,
        ownership_type=farm_in.ownership_type,
        created_at=datetime.datetime.utcnow()
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(
    farm_id: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == uid).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")
    return farm

@router.put("/{farm_id}", response_model=FarmOut)
def update_farm(
    farm_id: str,
    farm_in: FarmCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == uid).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")
    
    farm.name = farm_in.name
    farm.total_area_acres = farm_in.total_area_acres
    farm.district = farm_in.district
    farm.state = farm_in.state
    farm.ownership_type = farm_in.ownership_type
    db.commit()
    db.refresh(farm)
    return farm

@router.delete("/{farm_id}", status_code=status.HTTP_200_OK)
def delete_farm(
    farm_id: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == uid).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")
    
    db.delete(farm)
    db.commit()
    return {"status": "success", "message": f"Farm {farm_id} deleted"}
