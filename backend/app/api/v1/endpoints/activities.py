import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models import FarmActivity, Farm, Field
from app.schemas import FarmActivityCreate, FarmActivityOut

router = APIRouter()

@router.get("", response_model=List[FarmActivityOut])
def get_activities(
    field_id: Optional[str] = None,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    user_fields = db.query(Field.id).filter(Field.farm_id.in_(user_farm_ids)).all()
    user_field_ids = [f[0] for f in user_fields]

    query = db.query(FarmActivity).filter(FarmActivity.field_id.in_(user_field_ids))
    if field_id:
        if field_id not in user_field_ids:
            raise HTTPException(status_code=403, detail="Access denied to requested field")
        query = query.filter(FarmActivity.field_id == field_id)

    return query.order_by(FarmActivity.date.desc(), FarmActivity.created_at.desc()).all()

@router.post("", response_model=FarmActivityOut, status_code=status.HTTP_201_CREATED)
def log_activity(
    activity_in: FarmActivityCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    user_fields = db.query(Field.id).filter(Field.farm_id.in_(user_farm_ids)).all()
    user_field_ids = [f[0] for f in user_fields]

    field_id = activity_in.field_id
    if user_field_ids and field_id not in user_field_ids:
        # Fall back to user's first valid field
        field_id = user_field_ids[0]

    activity = FarmActivity(
        id=f"act-{int(datetime.datetime.utcnow().timestamp())}",
        field_id=field_id,
        activity_type=activity_in.activity_type,
        date=activity_in.date,
        notes=activity_in.notes,
        cost_rs=activity_in.cost_rs,
        source=activity_in.source,
        created_at=datetime.datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

@router.delete("/{activity_id}", status_code=status.HTTP_200_OK)
def delete_activity(
    activity_id: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    user_fields = db.query(Field.id).filter(Field.farm_id.in_(user_farm_ids)).all()
    user_field_ids = [f[0] for f in user_fields]

    activity = db.query(FarmActivity).filter(
        FarmActivity.id == activity_id,
        FarmActivity.field_id.in_(user_field_ids)
    ).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found or access denied")

    db.delete(activity)
    db.commit()
    return {"status": "success", "message": f"Activity {activity_id} deleted"}
