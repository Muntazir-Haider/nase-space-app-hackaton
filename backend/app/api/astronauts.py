from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import (
    AstronautProfile,
    Mission,
    DeteriorationAlert,
    HealthObservation,
)
from backend.app.schemas.schemas import (
    AstronautProfileCreate,
    AstronautProfileOut,
    AstronautSummaryOut,
    MissionCreate,
    MissionOut,
)

router = APIRouter(prefix="/astronauts", tags=["Astronauts"])
mission_router = APIRouter(prefix="/missions", tags=["Missions"])

@router.get("", response_model=List[AstronautSummaryOut])
def list_astronauts(db: Session = Depends(get_db)):
    profiles = db.query(AstronautProfile).all()
    summaries = []
    
    for astro in profiles:
        active_alerts = (
            db.query(DeteriorationAlert)
            .filter(
                DeteriorationAlert.astronaut_id == astro.id,
                DeteriorationAlert.lifecycle_status.in_(["NEW", "UNDER_REVIEW", "MONITORING"]),
            )
            .count()
        )
        
        last_obs = (
            db.query(HealthObservation)
            .filter(HealthObservation.astronaut_id == astro.id)
            .order_by(HealthObservation.observation_time.desc())
            .first()
        )
        
        status_indicator = "NOMINAL"
        if active_alerts > 0:
            status_indicator = "REVIEW_ALERT"
        elif astro.medical_clearance_status != "FULL_FLIGHT_CLEARANCE":
            status_indicator = "OBSERVATION"

        summaries.append(
            AstronautSummaryOut(
                id=astro.id,
                callsign=astro.callsign,
                full_name=astro.full_name,
                mission_code=astro.mission.mission_code if astro.mission else "UNASSIGNED",
                mission_role=astro.flight_role,
                medical_clearance_status=astro.medical_clearance_status,
                status_indicator=status_indicator,
                active_alert_count=active_alerts,
                last_reading_time=last_obs.observation_time if last_obs else None,
            )
        )
    return summaries

@router.get("/{astronaut_id}", response_model=AstronautProfileOut)
def get_astronaut(astronaut_id: str, db: Session = Depends(get_db)):
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found.",
        )
    return astro

@router.post("", response_model=AstronautProfileOut, status_code=status.HTTP_201_CREATED)
def create_astronaut(payload: AstronautProfileCreate, db: Session = Depends(get_db)):
    # Verify mission exists
    mission = db.query(Mission).filter(Mission.id == payload.mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mission ID '{payload.mission_id}' does not exist.",
        )
    
    # Check duplicate callsign
    existing = db.query(AstronautProfile).filter(AstronautProfile.callsign == payload.callsign).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Astronaut with callsign '{payload.callsign}' already exists.",
        )
        
    astro = AstronautProfile(
        mission_id=payload.mission_id,
        callsign=payload.callsign,
        full_name=payload.full_name,
        flight_role=payload.flight_role,
        medical_clearance_status=payload.medical_clearance_status,
    )
    db.add(astro)
    db.commit()
    db.refresh(astro)
    return astro

# --- Missions endpoints ---

@mission_router.get("", response_model=List[MissionOut])
def list_missions(db: Session = Depends(get_db)):
    return db.query(Mission).all()

@mission_router.post("", response_model=MissionOut, status_code=status.HTTP_201_CREATED)
def create_mission(payload: MissionCreate, db: Session = Depends(get_db)):
    existing = db.query(Mission).filter(Mission.mission_code == payload.mission_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mission code '{payload.mission_code}' already exists.",
        )
    mission = Mission(**payload.model_dump())
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission
