from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import DataQualityAuditLog, IndicatorDefinition
from backend.app.schemas.schemas import DataQualityAuditLogOut, IndicatorDefinitionOut

router = APIRouter(prefix="/data-quality", tags=["Data Quality & Indicators"])

@router.get("/audit", response_model=List[DataQualityAuditLogOut])
def get_audit_log(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    logs = (
        db.query(DataQualityAuditLog)
        .order_by(DataQualityAuditLog.flagged_at.desc())
        .limit(limit)
        .all()
    )
    return logs

@router.get("/indicators", response_model=List[IndicatorDefinitionOut])
def get_indicators(db: Session = Depends(get_db)):
    indicators = db.query(IndicatorDefinition).all()
    return indicators
