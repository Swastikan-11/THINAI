import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user_claims
from app.models import DiseaseScan, Farm, Field
from app.schemas import DiseaseScanOut

router = APIRouter()

class DiseaseScanCreate(BaseModel):
    field_id: Optional[str] = None
    disease_name: str
    scientific_name: Optional[str] = None
    confidence: float
    severity: str = "Low"
    is_reliable: bool = True
    rejection_reason: Optional[str] = None
    foliage_ratio: float = 0.0
    lesion_area_ratio: float = 0.0
    immediate_action: Optional[str] = None
    model_version: str = "DiseaseNet-v1.3"

@router.get("/history", response_model=List[DiseaseScanOut])
def get_disease_scan_history(
    field_id: Optional[str] = None,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
    user_farm_ids = [f[0] for f in user_farms]
    user_fields = db.query(Field.id).filter(Field.farm_id.in_(user_farm_ids)).all()
    user_field_ids = [f[0] for f in user_fields]

    query = db.query(DiseaseScan).filter(DiseaseScan.field_id.in_(user_field_ids))
    if field_id:
        if field_id not in user_field_ids:
            raise HTTPException(status_code=403, detail="Access denied to requested field")
        query = query.filter(DiseaseScan.field_id == field_id)

    return query.order_by(DiseaseScan.scanned_at.desc()).limit(50).all()

@router.post("/scan", response_model=DiseaseScanOut, status_code=status.HTTP_201_CREATED)
def record_disease_scan(
    scan_in: DiseaseScanCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    uid = claims.get("uid")
    # Resolve field ID if not provided: pick user's first field or create default
    field_id = scan_in.field_id
    if not field_id:
        user_farms = db.query(Farm.id).filter(Farm.user_id == uid).all()
        user_farm_ids = [f[0] for f in user_farms]
        field = db.query(Field).filter(Field.farm_id.in_(user_farm_ids)).first()
        if field:
            field_id = field.id
        else:
            # Fallback placeholder field ID for independent scans
            field_id = f"field-default-{uid[:8]}"

    scan = DiseaseScan(
        id=f"scan-{int(datetime.datetime.utcnow().timestamp())}",
        field_id=field_id,
        disease_name=scan_in.disease_name,
        scientific_name=scan_in.scientific_name,
        confidence=scan_in.confidence,
        severity=scan_in.severity,
        is_reliable=scan_in.is_reliable,
        rejection_reason=scan_in.rejection_reason,
        foliage_ratio=scan_in.foliage_ratio,
        lesion_area_ratio=scan_in.lesion_area_ratio,
        immediate_action=scan_in.immediate_action,
        model_version=scan_in.model_version,
        scanned_at=datetime.datetime.utcnow()
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan
