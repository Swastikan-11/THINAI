import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models import Farm, Field, Recommendation, RecommendationEvidence, ARFIAssessment, StressScenario
from app.schemas import RecommendationOut
from app.services.decision_service import generate_field_recommendation_and_arfi

router = APIRouter()

@router.get("", response_model=List[RecommendationOut])
def get_recommendations(
    field_id: Optional[str] = None,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    user_fields = db.query(Field.id).filter(Field.farm_id.in_(user_farm_ids)).all()
    user_field_ids = [f[0] for f in user_fields]

    query = db.query(Recommendation).filter(Recommendation.field_id.in_(user_field_ids))
    if field_id:
        if field_id not in user_field_ids:
            raise HTTPException(status_code=403, detail="Access denied to requested field recommendations")
        query = query.filter(Recommendation.field_id == field_id)

    return query.order_by(Recommendation.created_at.desc()).all()

@router.post("/generate", response_model=RecommendationOut)
def generate_recommendation_for_field(
    field_id: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    field = db.query(Field).filter(Field.id == field_id, Field.farm_id.in_(user_farm_ids)).first()
    
    # If field does not exist yet (e.g. initial setup), check or allow default
    crop = field.current_crop if field else "Paddy (Rice)"
    crop_stage = field.crop_stage if field else "Tillering Stage"
    soil_type = field.soil_type if field else "Clay Loam"
    lat = field.latitude if (field and field.latitude) else 11.0168
    lon = field.longitude if (field and field.longitude) else 76.9558

    pipeline_result = generate_field_recommendation_and_arfi(
        field_id=field_id,
        crop=crop,
        crop_stage=crop_stage,
        soil_type=soil_type,
        soil_moisture=68.0,
        latitude=lat,
        longitude=lon
    )

    rec_id = pipeline_result["id"]
    rec = Recommendation(
        id=rec_id,
        field_id=field_id,
        title=pipeline_result["title"],
        action=pipeline_result["action"],
        category=pipeline_result["category"],
        priority=pipeline_result["priority"],
        recommended_time=pipeline_result["recommended_time"],
        why=pipeline_result["why"],
        risk_averted=pipeline_result["risk_averted"],
        alternative_action=pipeline_result["alternative_action"],
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(rec)

    ev_data = pipeline_result["evidence"]
    ev = RecommendationEvidence(
        id=f"ev-{rec_id}",
        recommendation_id=rec_id,
        soil_saturation_index=ev_data["soil_saturation_index"],
        precipitation_forecast_mm=ev_data["precipitation_forecast_mm"],
        crop_stage=ev_data["crop_stage"],
        model_agreement_ratio=ev_data["model_agreement_ratio"],
        expected_savings_rs=ev_data["expected_savings_rs"],
        rules_triggered=ev_data["rules_triggered"],
        model_version=ev_data["model_version"],
        generated_at=datetime.datetime.utcnow()
    )
    db.add(ev)

    arfi_data = pipeline_result["arfi_assessment"]
    arfi_id = arfi_data["id"]
    arfi = ARFIAssessment(
        id=arfi_id,
        recommendation_id=rec_id,
        fragility_score=arfi_data["fragility_score"],
        fragility_label=arfi_data["fragility_label"],
        data_reliability_score=arfi_data["data_reliability_score"],
        model_agreement_score=arfi_data["model_agreement_score"],
        uncertainty_score=arfi_data["uncertainty_score"],
        scenario_sensitivity_score=arfi_data["scenario_sensitivity_score"],
        stress_robustness_score=arfi_data["stress_robustness_score"],
        decision_risk_score=arfi_data["decision_risk_score"],
        assessment_summary=arfi_data["assessment_summary"],
        calculated_at=datetime.datetime.utcnow()
    )
    db.add(arfi)

    for sc in arfi_data.get("stress_scenarios", []):
        stress_rec = StressScenario(
            id=f"stress-{int(datetime.datetime.utcnow().timestamp())}-{sc['scenario_name'][:5]}",
            arfi_id=arfi_id,
            scenario_name=sc["scenario_name"],
            rainfall_delta_percent=sc["rainfall_delta_percent"],
            temp_delta_celsius=sc["temp_delta_celsius"],
            market_price_delta_percent=sc["market_price_delta_percent"],
            input_cost_delta_percent=sc["input_cost_delta_percent"],
            crop_rank_change=sc["crop_rank_change"],
            fragility_status=sc["fragility_status"]
        )
        db.add(stress_rec)

    db.commit()
    db.refresh(rec)
    return rec
