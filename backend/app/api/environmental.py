from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import EnvironmentalTelemetry, Mission
from backend.app.schemas.schemas import EnvironmentalTelemetryCreate, EnvironmentalTelemetryOut

router = APIRouter(prefix="/environmental", tags=["Environmental Habitat Telemetry"])

@router.post("", response_model=EnvironmentalTelemetryOut, status_code=status.HTTP_201_CREATED)
def record_environmental_telemetry(payload: EnvironmentalTelemetryCreate, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == payload.mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mission ID '{payload.mission_id}' not found.",
        )
    
    quality_status = "VALID"
    # Basic sanity checks (e.g. negative CO2 or negative pressure is invalid)
    if payload.value < 0:
        quality_status = "REJECTED"

    reading = EnvironmentalTelemetry(
        mission_id=payload.mission_id,
        parameter_name=payload.parameter_name,
        value=payload.value,
        unit=payload.unit,
        habitat_zone=payload.habitat_zone,
        timestamp=payload.timestamp,
        quality_status=quality_status,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading

@router.get("", response_model=List[EnvironmentalTelemetryOut])
def list_environmental_telemetry(
    mission_id: Optional[str] = Query(None),
    parameter_name: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(EnvironmentalTelemetry)
    if mission_id:
        query = query.filter(EnvironmentalTelemetry.mission_id == mission_id)
    if parameter_name:
        query = query.filter(EnvironmentalTelemetry.parameter_name == parameter_name)
    
    return query.order_by(EnvironmentalTelemetry.timestamp.desc()).limit(limit).all()
