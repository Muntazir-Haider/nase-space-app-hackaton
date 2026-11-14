from typing import List, Dict
from dateutil import parser as date_parser
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.sync_engine import queue_offline_transaction
from backend.app.models.entities import (
    AstronautProfile,
    Mission,
    DeteriorationAlert,
    HealthObservation,
    PersonalBaseline,
    IndicatorDefinition,
    EnvironmentalTelemetry,
    MissionEvent,
)
from backend.app.schemas.schemas import (
    AstronautProfileCreate,
    AstronautProfileOut,
    AstronautSummaryOut,
    AstronautTimelineResponse,
    TimelineBaselineInfo,
    TimelinePoint,
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

@router.get("/{astronaut_id}/timeline", response_model=AstronautTimelineResponse)
def get_astronaut_timeline(astronaut_id: str, db: Session = Depends(get_db)):
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found.",
        )

    # 1. Fetch Baselines
    target_keys = ["RESTING_HEART_RATE", "SLEEP_DURATION", "HEART_RATE_RECOVERY_1MIN"]
    baselines_map: Dict[str, TimelineBaselineInfo] = {}
    for key in target_keys:
        ind = db.query(IndicatorDefinition).filter_by(indicator_key=key).first()
        if ind:
            b = (
                db.query(PersonalBaseline)
                .filter(PersonalBaseline.astronaut_id == astronaut_id, PersonalBaseline.indicator_id == ind.id)
                .order_by(PersonalBaseline.version.desc())
                .first()
            )
            if b:
                baselines_map[key] = TimelineBaselineInfo(
                    mean=round(b.mean, 2),
                    std_dev=round(b.std_dev, 2),
                    status=b.status,
                )

    # 2. Fetch all valid health observations
    observations = (
        db.query(HealthObservation)
        .filter(
            HealthObservation.astronaut_id == astronaut_id,
            HealthObservation.quality_status.in_(["VALID", "STALE"]),
        )
        .order_by(HealthObservation.observation_time.asc())
        .all()
    )

    # 3. Fetch mission events & environmental telemetry
    events = db.query(MissionEvent).filter(MissionEvent.astronaut_id == astronaut_id).all()
    env_readings = (
        db.query(EnvironmentalTelemetry)
        .filter(EnvironmentalTelemetry.mission_id == astro.mission_id)
        .order_by(EnvironmentalTelemetry.timestamp.asc())
        .all()
    )

    # 4. Group observations by date (YYYY-MM-DD)
    grouped: Dict[str, Dict[str, Any]] = {}

    for obs in observations:
        dt_str = obs.observation_time[:10]  # Date portion YYYY-MM-DD
        if dt_str not in grouped:
            grouped[dt_str] = {
                "date": dt_str,
                "timestamp": obs.observation_time,
                "rhr_value": None,
                "rhr_z_score": None,
                "sleep_value": None,
                "sleep_z_score": None,
                "hrr_value": None,
                "hrr_z_score": None,
                "cabin_co2_ppm": None,
                "radiation_usv": None,
                "mission_events": [],
            }
        
        ind_key = obs.indicator_def.indicator_key if obs.indicator_def else ""
        if ind_key == "RESTING_HEART_RATE":
            grouped[dt_str]["rhr_value"] = round(obs.value, 1)
            b = baselines_map.get("RESTING_HEART_RATE")
            if b and b.std_dev > 0:
                grouped[dt_str]["rhr_z_score"] = round((obs.value - b.mean) / b.std_dev, 2)
        elif ind_key == "SLEEP_DURATION":
            grouped[dt_str]["sleep_value"] = round(obs.value, 2)
            b = baselines_map.get("SLEEP_DURATION")
            if b and b.std_dev > 0:
                grouped[dt_str]["sleep_z_score"] = round((obs.value - b.mean) / b.std_dev, 2)
        elif ind_key == "HEART_RATE_RECOVERY_1MIN":
            grouped[dt_str]["hrr_value"] = round(obs.value, 1)
            b = baselines_map.get("HEART_RATE_RECOVERY_1MIN")
            if b and b.std_dev > 0:
                grouped[dt_str]["hrr_z_score"] = round((obs.value - b.mean) / b.std_dev, 2)

    # 5. Attach Environmental Readings
    for env in env_readings:
        dt_str = env.timestamp[:10]
        if dt_str in grouped:
            if env.parameter_name == "CABIN_CO2_PPM":
                grouped[dt_str]["cabin_co2_ppm"] = round(env.value, 1)
            elif env.parameter_name == "AMBIENT_RADIATION_USV":
                grouped[dt_str]["radiation_usv"] = round(env.value, 1)

    # 6. Attach Mission Events
    for ev in events:
        start_date = ev.start_time[:10]
        end_date = ev.end_time[:10]
        for dt_str in grouped.keys():
            if start_date <= dt_str <= end_date:
                desc = f"{ev.title} ({ev.workload_intensity})"
                if desc not in grouped[dt_str]["mission_events"]:
                    grouped[dt_str]["mission_events"].append(desc)

    points = [TimelinePoint(**v) for v in sorted(grouped.values(), key=lambda x: x["date"])]

    return AstronautTimelineResponse(
        astronaut_id=astro.id,
        callsign=astro.callsign,
        full_name=astro.full_name,
        window_days=len(points),
        baselines=baselines_map,
        timeline_points=points,
    )


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

    # Queue profile registration to offline store-and-forward queue
    queue_offline_transaction(
        db=db,
        transaction_type="ASTRONAUT_PROFILE_CREATE",
        entity_table="astronaut_profiles",
        entity_id=astro.id,
        payload={
            "mission_id": astro.mission_id,
            "callsign": astro.callsign,
            "full_name": astro.full_name,
            "flight_role": astro.flight_role,
            "medical_clearance_status": astro.medical_clearance_status,
        },
    )

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
