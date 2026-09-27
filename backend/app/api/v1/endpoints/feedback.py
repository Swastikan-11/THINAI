import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models import ActionFeedback, Recommendation, Farm, Field
from app.schemas import ActionFeedbackCreate, ActionFeedbackOut

router = APIRouter()

@router.get("", response_model=List[ActionFeedbackOut])
def get_feedbacks(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    user_fields = db.query(Field.id).filter(Field.farm_id.in_(user_farm_ids)).all()
    user_field_ids = [f[0] for f in user_fields]
    user_recs = db.query(Recommendation.id).filter(Recommendation.field_id.in_(user_field_ids)).all()
    user_rec_ids = [r[0] for r in user_recs]

    return db.query(ActionFeedback).filter(
        ActionFeedback.recommendation_id.in_(user_rec_ids)
    ).order_by(ActionFeedback.recorded_at.desc()).all()

@router.post("", response_model=ActionFeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    fb_in: ActionFeedbackCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    # Verify recommendation or mark completed
    rec = db.query(Recommendation).filter(Recommendation.id == fb_in.recommendation_id).first()
    if rec:
        rec.status = fb_in.action_taken

    feedback = ActionFeedback(
        id=f"fb-{int(datetime.datetime.utcnow().timestamp())}",
        recommendation_id=fb_in.recommendation_id,
        action_taken=fb_in.action_taken,
        rating=fb_in.rating,
        crop_observation=fb_in.crop_observation,
        notes=fb_in.notes,
        cost_saved_estimate=fb_in.cost_saved_estimate,
        recorded_at=datetime.datetime.utcnow()
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
