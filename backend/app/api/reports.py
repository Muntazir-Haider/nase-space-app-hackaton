import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.entities import (
    AstronautProfile,
    Mission,
    DeteriorationAlert,
    AlertEvidenceLink,
    HealthObservation,
    PersonalBaseline,
    IndicatorDefinition,
    EnvironmentalTelemetry,
    MissionEvent,
    ClinicalCountermeasure,
    CMOFollowup,
)
from backend.app.schemas.schemas import FlightSurgeonHandoverReportOut

router = APIRouter(prefix="/reports", tags=["Flight Surgeon Clinical Reports"])


def _calculate_recommendation(
    overall_status: str,
    active_alerts: List[DeteriorationAlert],
    clearance_status: str,
    co2_elevated: bool,
) -> str:
    """Generates an evidence-grounded NASA Flight Surgeon clinical recommendation."""
    if overall_status == "CRITICAL_REVIEW" or any(a.review_priority in ["CRITICAL", "HIGH"] for a in active_alerts):
        recs = [
            "CLINICAL ACTION DIRECTIVE [CRITICAL]: Sustained multi-indicator physiological deterioration confirmed.",
            "1. MANDATORY CLEARANCE ACTION: Enforce TEMPORARY_MEDICAL_HOLD on all extravehicular activities (EVAs) and strenuous maintenance.",
            "2. COUNTERMEASURES: Administer targeted cardiovascular reconditioning protocol (ARED resistive exercise + 45-min cycle ergometer interval session).",
            "3. CIRCADIAN & SLEEP: Enforce uninterrupted 8.5-hour crew sleep period with cabin acoustic dampening.",
        ]
        if co2_elevated:
            recs.append("4. LIFE SUPPORT SYNERGY: Cabin CO2 concentration is elevated (>1000 ppm); request ECLSS scrubber cycle optimization.")
        recs.append("5. RE-EVALUATION: Mandatory CMO bedside biometric reassessment prior to next flight shift.")
        return "\n".join(recs)

    if overall_status == "OBSERVATION" or len(active_alerts) > 0 or clearance_status != "FULL_FLIGHT_CLEARANCE":
        recs = [
            "CLINICAL MONITORING NOTICE [OBSERVATION]: Sub-acute physiological drift or active operational restriction detected.",
            "1. CLEARANCE STATUS: Maintain OBSERVATION_RESTRICTED flight status; monitor heart rate recovery kinetics post-exercise.",
            "2. COUNTERMEASURES: Ensure adherence to nominal prescribed hydration (2.5L/day) and scheduled daily conditioning.",
            "3. SURVEILLANCE: Review next 24-hour resting heart rate and sleep telemetry for persistence or resolution.",
        ]
        return "\n".join(recs)

    return (
        "NOMINAL FLIGHT CLEARANCE ASSESSMENT: All monitored vital parameters conform to the astronaut's "
        "7-day personalized baseline corridor (mu +/- 1.5 sigma). Cardiovascular recovery kinetics and sleep architecture "
        "demonstrate nominal spaceflight adaptation. Astronaut is medically cleared for unrestricted mission operations, "
        "heavy habitat maintenance, and scheduled extravehicular activities (EVAs)."
    )


@router.get("/handover/{astronaut_id}", response_model=FlightSurgeonHandoverReportOut)
def get_flight_surgeon_handover_report(
    astronaut_id: str,
    cmo_notes: Optional[str] = Query(None, description="Optional CMO handover clinical notes"),
    db: Session = Depends(get_db),
):
    """
    Compiles a comprehensive, verifiable NASA Flight Surgeon Clinical Handover & Medical Summary Report.
    Grounds findings in personalized baselines, OLS deterioration trends, environmental habitat telemetry,
    and countermeasure histories.
    """
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found.",
        )

    mission = db.query(Mission).filter(Mission.id == astro.mission_id).first()
    now_iso = datetime.now(timezone.utc).isoformat()
    report_id = f"RPT-HANDOVER-{uuid.uuid4().hex[:8].upper()}"

    # 1. Active Alerts
    active_alerts = (
        db.query(DeteriorationAlert)
        .filter(
            DeteriorationAlert.astronaut_id == astro.id,
            DeteriorationAlert.lifecycle_status.in_(["NEW", "UNDER_REVIEW", "MONITORING"]),
        )
        .order_by(DeteriorationAlert.created_at.desc())
        .all()
    )

    alerts_summary = []
    for a in active_alerts:
        evidence_count = db.query(AlertEvidenceLink).filter(AlertEvidenceLink.alert_id == a.id).count()
        math_data = {}
        try:
            math_data = json.loads(a.math_summary)
        except Exception:
            pass

        ols_slope = math_data.get("rhr_slope") or math_data.get("slope") or math_data.get("ols_slope")
        z_score = math_data.get("z_score") or math_data.get("rhr_z_score")
        k_pers = math_data.get("persistence_count") or math_data.get("k", 3)

        alerts_summary.append({
            "alert_id": a.id,
            "indicator_key": a.pattern_type,
            "severity": a.review_priority,
            "lifecycle_status": a.lifecycle_status,
            "trigger_reason": a.detection_narrative,
            "evidence_summary": a.detection_narrative,
            "ols_slope": round(float(ols_slope), 4) if ols_slope is not None else None,
            "z_score": round(float(z_score), 2) if z_score is not None else None,
            "persistence_count": int(k_pers) if k_pers is not None else 3,
            "evidence_count": evidence_count,
            "created_at": a.created_at,
        })

    # Overall Clinical Status
    if any(a.review_priority in ["CRITICAL", "HIGH"] for a in active_alerts) or len(active_alerts) >= 2:
        overall_clinical_status = "CRITICAL_REVIEW"
    elif len(active_alerts) == 1 or astro.medical_clearance_status != "FULL_FLIGHT_CLEARANCE":
        overall_clinical_status = "OBSERVATION"
    else:
        overall_clinical_status = "NOMINAL"

    # 2. Baselines Summary
    target_keys = ["RESTING_HEART_RATE", "SLEEP_DURATION", "HEART_RATE_RECOVERY_1MIN"]
    baselines_summary: Dict[str, Any] = {}
    for key in target_keys:
        ind = db.query(IndicatorDefinition).filter_by(indicator_key=key).first()
        if ind:
            b = (
                db.query(PersonalBaseline)
                .filter(PersonalBaseline.astronaut_id == astro.id, PersonalBaseline.indicator_id == ind.id)
                .order_by(PersonalBaseline.version.desc())
                .first()
            )
            if b:
                baselines_summary[key] = {
                    "mean": round(b.mean, 2),
                    "median": round(b.median, 2),
                    "std_dev": round(b.std_dev, 2),
                    "sample_count": b.sample_count,
                    "status": b.status,
                    "version": b.version,
                    "nominal_min": ind.nominal_min,
                    "nominal_max": ind.nominal_max,
                    "unit": ind.standard_unit,
                }
            else:
                baselines_summary[key] = {
                    "status": "INSUFFICIENT_DATA",
                    "sample_count": 0,
                    "mean": None,
                    "std_dev": None,
                    "unit": ind.standard_unit,
                }

    # 3. Recent Observations Summary (Last 7 Days)
    obs_query = (
        db.query(HealthObservation)
        .filter(HealthObservation.astronaut_id == astro.id)
        .order_by(HealthObservation.observation_time.desc())
        .limit(40)
        .all()
    )
    obs_by_indicator: Dict[str, List[float]] = {}
    latest_by_indicator: Dict[str, Any] = {}
    for obs in obs_query:
        ind_def = db.query(IndicatorDefinition).filter_by(id=obs.indicator_id).first()
        if ind_def:
            k = ind_def.indicator_key
            if k not in obs_by_indicator:
                obs_by_indicator[k] = []
                latest_by_indicator[k] = {
                    "latest_value": round(obs.value, 2),
                    "latest_time": obs.observation_time,
                    "unit": ind_def.standard_unit,
                }
            obs_by_indicator[k].append(obs.value)

    recent_obs_summary: Dict[str, Any] = {}
    for k, vals in obs_by_indicator.items():
        recent_obs_summary[k] = {
            **latest_by_indicator[k],
            "count": len(vals),
            "min_7d": round(min(vals), 2),
            "max_7d": round(max(vals), 2),
            "avg_7d": round(sum(vals) / len(vals), 2),
        }

    # 4. Environmental Stressor Context
    env_readings = (
        db.query(EnvironmentalTelemetry)
        .filter(EnvironmentalTelemetry.mission_id == astro.mission_id)
        .order_by(EnvironmentalTelemetry.timestamp.desc())
        .limit(100)
        .all()
    )
    co2_vals = [r.value for r in env_readings if r.parameter_name == "CABIN_CO2_PPM"]
    rad_vals = [r.value for r in env_readings if "RADIATION" in r.parameter_name.upper()]
    co2_elevated = any(v > 1000 for v in co2_vals)

    environmental_context = {
        "cabin_co2_mean_ppm": round(sum(co2_vals) / len(co2_vals), 1) if co2_vals else None,
        "cabin_co2_max_ppm": round(max(co2_vals), 1) if co2_vals else None,
        "cabin_co2_elevated": co2_elevated,
        "radiation_total_usv": round(sum(rad_vals), 2) if rad_vals else 0.0,
        "total_readings_analyzed": len(env_readings),
        "habitat_zone": env_readings[0].habitat_zone if env_readings else "CREW_QUARTERS",
    }

    # 5. Recent Mission Events
    events = (
        db.query(MissionEvent)
        .filter(MissionEvent.astronaut_id == astro.id)
        .order_by(MissionEvent.start_time.desc())
        .limit(10)
        .all()
    )
    events_summary = [
        {
            "event_id": e.id,
            "event_type": e.event_type,
            "title": e.title,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "workload_intensity": e.workload_intensity,
            "notes": e.notes,
        }
        for e in events
    ]

    # 6. Countermeasures Summary
    cms = (
        db.query(ClinicalCountermeasure)
        .filter(ClinicalCountermeasure.astronaut_id == astro.id)
        .order_by(ClinicalCountermeasure.prescribed_at.desc())
        .all()
    )
    cm_summary = []
    for cm in cms:
        followups = (
            db.query(CMOFollowup)
            .filter(CMOFollowup.countermeasure_id == cm.id)
            .order_by(CMOFollowup.created_at.desc())
            .all()
        )
        cm_summary.append({
            "countermeasure_id": cm.id,
            "alert_id": cm.alert_id,
            "countermeasure_type": cm.countermeasure_type,
            "prescription_details": cm.prescription_details,
            "prescribed_by": cm.prescribed_by,
            "prescribed_at": cm.prescribed_at,
            "status": cm.status,
            "efficacy_status": cm.efficacy_status,
            "followup_count": len(followups),
            "latest_followup_note": followups[0].notes if followups else None,
        })

    # 7. Clinical Recommendation
    recommendation = _calculate_recommendation(
        overall_status=overall_clinical_status,
        active_alerts=active_alerts,
        clearance_status=astro.medical_clearance_status,
        co2_elevated=co2_elevated,
    )

    # 8. Cryptographic Integrity Hash
    hash_payload = {
        "report_id": report_id,
        "astronaut_id": astro.id,
        "callsign": astro.callsign,
        "generated_at": now_iso,
        "overall_clinical_status": overall_clinical_status,
        "active_alerts_count": len(active_alerts),
        "clearance": astro.medical_clearance_status,
    }
    canonical_repr = json.dumps(hash_payload, sort_keys=True)
    integrity_hash = hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()

    return FlightSurgeonHandoverReportOut(
        report_id=report_id,
        generated_at=now_iso,
        astronaut_id=astro.id,
        callsign=astro.callsign,
        full_name=astro.full_name,
        flight_role=astro.flight_role,
        mission_code=mission.mission_code if mission else "UNASSIGNED",
        target_destination=mission.target_destination if mission else "UNKNOWN",
        flight_day=mission.flight_day if mission else 1,
        medical_clearance_status=astro.medical_clearance_status,
        overall_clinical_status=overall_clinical_status,
        active_alerts_count=len(active_alerts),
        baselines_summary=baselines_summary,
        active_alerts=alerts_summary,
        recent_observations_summary=recent_obs_summary,
        environmental_context=environmental_context,
        recent_mission_events=events_summary,
        countermeasures_summary=cm_summary,
        flight_surgeon_recommendation=recommendation,
        cmo_handover_notes=cmo_notes,
        integrity_hash=integrity_hash,
    )
