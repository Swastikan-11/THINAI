import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models import Farm, Field
from app.schemas import FieldCreate, FieldOut

router = APIRouter()

@router.get("", response_model=List[FieldOut])
def get_user_fields(
    farm_id: Optional[str] = None,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    # Verify user owns the farm if farm_id specified, or get all fields belonging to user's farms
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    
    query = db.query(Field).filter(Field.farm_id.in_(user_farm_ids))
    if farm_id:
        if farm_id not in user_farm_ids:
            raise HTTPException(status_code=403, detail="Access denied to requested farm fields")
        query = query.filter(Field.farm_id == farm_id)
        
    return query.all()

@router.post("", response_model=FieldOut, status_code=status.HTTP_201_CREATED)
def create_field(
    farm_id: str,
    field_in: FieldCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == uid).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or access denied")
        
    field_id = f"field-{int(datetime.datetime.utcnow().timestamp())}"
    field = Field(
        id=field_id,
        farm_id=farm_id,
        name=field_in.name,
        area_acres=field_in.area_acres,
        latitude=field_in.latitude,
        longitude=field_in.longitude,
        soil_type=field_in.soil_type,
        irrigation_type=field_in.irrigation_type,
        current_crop=field_in.current_crop,
        crop_variety=field_in.crop_variety,
        sowing_date=field_in.sowing_date,
        crop_stage=field_in.crop_stage,
        previous_crops=field_in.previous_crops,
        created_at=datetime.datetime.utcnow()
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

@router.get("/{field_id}", response_model=FieldOut)
def get_field(
    field_id: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    
    field = db.query(Field).filter(Field.id == field_id, Field.farm_id.in_(user_farm_ids)).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied")
    return field

@router.put("/{field_id}", response_model=FieldOut)
def update_field(
    field_id: str,
    field_in: FieldCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    
    field = db.query(Field).filter(Field.id == field_id, Field.farm_id.in_(user_farm_ids)).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied")
        
    field.name = field_in.name
    field.area_acres = field_in.area_acres
    field.latitude = field_in.latitude
    field.longitude = field_in.longitude
    field.soil_type = field_in.soil_type
    field.irrigation_type = field_in.irrigation_type
    field.current_crop = field_in.current_crop
    field.crop_variety = field_in.crop_variety
    field.sowing_date = field_in.sowing_date
    field.crop_stage = field_in.crop_stage
    field.previous_crops = field_in.previous_crops
    
    db.commit()
    db.refresh(field)
    return field

@router.delete("/{field_id}", status_code=status.HTTP_200_OK)
def delete_field(
    field_id: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    
    field = db.query(Field).filter(Field.id == field_id, Field.farm_id.in_(user_farm_ids)).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied")
        
    db.delete(field)
    db.commit()
    return {"status": "success", "message": f"Field {field_id} deleted"}
