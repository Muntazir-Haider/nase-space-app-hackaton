from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import (
    DeteriorationAlert,
    AlertEvidenceLink,
    AnalysisRun,
    AstronautProfile,
    CMOFollowup,
    ClinicalCountermeasure,
)
from backend.app.schemas.schemas import (
    DeteriorationAlertOut,
    AlertEvidenceDetailOut,
    AlertEvidenceItemOut,
    AlertStatusUpdate,
    AnalysisRunOut,
    ClinicalCountermeasureOut,
    CMOFollowupOut,
)
from backend.app.services.deterioration_engine import (
    run_fleet_deterioration_analysis,
    run_deterioration_analysis_for_astronaut,
)

router = APIRouter(prefix="/alerts", tags=["Deterioration Alerts & Evidence"])
runs_router = APIRouter(prefix="/analysis-runs", tags=["Analysis Execution Runs"])

@router.get("", response_model=List[DeteriorationAlertOut])
def list_alerts(
    astronaut_id: Optional[str] = Query(None),
    lifecycle_status: Optional[str] = Query(None),
    review_priority: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(DeteriorationAlert)
    if astronaut_id:
        query = query.filter(DeteriorationAlert.astronaut_id == astronaut_id)
    if lifecycle_status:
        query = query.filter(DeteriorationAlert.lifecycle_status == lifecycle_status)
    if review_priority:
        query = query.filter(DeteriorationAlert.review_priority == review_priority)

    return query.order_by(DeteriorationAlert.created_at.desc()).limit(limit).all()


@router.get("/{alert_id}", response_model=DeteriorationAlertOut)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(DeteriorationAlert).filter(DeteriorationAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deterioration alert with ID '{alert_id}' not found.",
        )
    return alert


@router.get("/{alert_id}/evidence", response_model=AlertEvidenceDetailOut)
def get_alert_evidence(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(DeteriorationAlert).filter(DeteriorationAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deterioration alert with ID '{alert_id}' not found.",
        )

    astro = alert.astronaut
    evidence_items = alert.evidence_items
    countermeasures = alert.countermeasures
    followups = alert.followups

    return AlertEvidenceDetailOut(
        alert=DeteriorationAlertOut.model_validate(alert),
        astronaut_callsign=astro.callsign if astro else "UNKNOWN",
        astronaut_full_name=astro.full_name if astro else "Unknown Astronaut",
        evidence_items=[AlertEvidenceItemOut.model_validate(e) for e in evidence_items],
        countermeasures=[ClinicalCountermeasureOut.model_validate(c) for c in countermeasures],
        followups=[CMOFollowupOut.model_validate(f) for f in followups],
    )


@router.post("/run-analysis", response_model=AnalysisRunOut, status_code=status.HTTP_201_CREATED)
def trigger_analysis_run(
    mission_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    analysis_run = run_fleet_deterioration_analysis(db, mission_id=mission_id, run_type="MANUAL_TRIGGER")
    return analysis_run


@router.patch("/{alert_id}/status", response_model=DeteriorationAlertOut)
def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
):
    alert = db.query(DeteriorationAlert).filter(DeteriorationAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deterioration alert with ID '{alert_id}' not found.",
        )

    valid_statuses = ["NEW", "UNDER_REVIEW", "MONITORING", "RESOLVED", "DISMISSED"]
    if payload.lifecycle_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.lifecycle_status}'. Allowed: {valid_statuses}",
        )

    old_status = alert.lifecycle_status
    alert.lifecycle_status = payload.lifecycle_status
    alert.updated_at = datetime.now(timezone.utc).isoformat()

    # Record CMO Followup entry
    followup = CMOFollowup(
        alert_id=alert.id,
        astronaut_id=alert.astronaut_id,
        reviewer_callsign=payload.reviewer_callsign,
        review_notes=payload.notes,
        status_transition=f"{old_status} -> {payload.lifecycle_status}",
        recorded_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(followup)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/countermeasures", response_model=ClinicalCountermeasureOut, status_code=status.HTTP_201_CREATED)
def prescribe_countermeasure(
    alert_id: str,
    payload: ClinicalCountermeasureCreate,
    db: Session = Depends(get_db),
):
    alert = db.query(DeteriorationAlert).filter(DeteriorationAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deterioration alert with ID '{alert_id}' not found.",
        )

    countermeasure = ClinicalCountermeasure(
        alert_id=alert.id,
        astronaut_id=alert.astronaut_id,
        prescribed_by=payload.prescribed_by,
        countermeasure_type=payload.countermeasure_type,
        title=payload.title,
        prescription_details=payload.prescription_details,
        target_duration_hours=payload.target_duration_hours,
        outcome_status="ACTIVE",
    )
    db.add(countermeasure)

    # Transition alert status to MONITORING if currently NEW or UNDER_REVIEW
    if alert.lifecycle_status in ["NEW", "UNDER_REVIEW"]:
        old_status = alert.lifecycle_status
        alert.lifecycle_status = "MONITORING"
        alert.updated_at = datetime.now(timezone.utc).isoformat()
        followup = CMOFollowup(
            alert_id=alert.id,
            astronaut_id=alert.astronaut_id,
            reviewer_callsign=payload.prescribed_by,
            review_notes=f"Prescribed countermeasure: {payload.title}. Status moved to MONITORING.",
            status_transition=f"{old_status} -> MONITORING",
            recorded_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(followup)

    db.commit()
    db.refresh(countermeasure)
    return countermeasure


@router.get("/{alert_id}/countermeasures", response_model=List[ClinicalCountermeasureOut])
def list_countermeasures_for_alert(
    alert_id: str,
    db: Session = Depends(get_db),
):
    return db.query(ClinicalCountermeasure).filter(ClinicalCountermeasure.alert_id == alert_id).all()


# --- Analysis Runs Router ---

@runs_router.get("", response_model=List[AnalysisRunOut])
def list_analysis_runs(
    mission_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(AnalysisRun)
    if mission_id:
        query = query.filter(AnalysisRun.mission_id == mission_id)
    return query.order_by(AnalysisRun.executed_at.desc()).limit(limit).all()
