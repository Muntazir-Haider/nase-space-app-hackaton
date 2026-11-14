from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import DataQualityAuditLog, IndicatorDefinition, AstronautProfile
from backend.app.schemas.schemas import DataQualityAuditLogOut, IndicatorDefinitionOut
from backend.app.services.data_quality import detect_missing_data_gaps

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

@router.get("/gaps")
def get_missing_data_gaps(
    astronaut_id: str = Query(..., description="UUID or ID of target astronaut"),
    days: int = Query(7, ge=1, le=30, description="Observation calendar lookback window in days"),
    db: Session = Depends(get_db),
):
    """
    Acceptance Test 4:
    Detects skipped observation days across core daily indicators.
    Returns explicit missing data gap records rather than assuming nominal health.
    """
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found.",
        )
    
    gaps = detect_missing_data_gaps(db, astronaut_id=astronaut_id, days=days)
    return {
        "astronaut_id": astronaut_id,
        "window_days": days,
        "missing_gaps_count": len(gaps),
        "gaps": gaps,
    }
