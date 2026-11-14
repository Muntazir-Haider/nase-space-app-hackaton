import json
import time
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from dateutil import parser as date_parser
from sqlalchemy.orm import Session

from backend.app.models.entities import (
    AstronautProfile,
    HealthObservation,
    PersonalBaseline,
    IndicatorDefinition,
    MissionEvent,
    EnvironmentalTelemetry,
    AnalysisRun,
    DeteriorationAlert,
    AlertEvidenceLink,
    Mission,
)
from backend.app.services.analytics.ols_trends import (
    ObservationPoint,
    evaluate_indicator_trend,
    TrendResult,
)

ENGINE_RULE_VERSION = "v1.0.0-ols"
SLIDING_WINDOW_DAYS = 5
NASA_HRP_SCIENTIFIC_REF = (
    "NASA Human Research Roadmap (HRR) Evidence: Risk of Adverse Health Event Due to "
    "Altered Gravitational Fields (Cardiovascular) & Risk of Performance Decrements and "
    "Adverse Health Outcomes Resulting from Sleep Loss, Circadian De-alignment, and Work Overload."
)

def run_deterioration_analysis_for_astronaut(
    db: Session,
    astronaut_id: str,
    analysis_run_id: str,
    reference_time: Optional[datetime] = None,
) -> Optional[DeteriorationAlert]:
    """
    Executes the Explainable Silent Deterioration Engine for a single astronaut.
    Enforces:
    1. Baseline Guard: All 3 indicators must have an ACTIVE baseline (N >= 4).
    2. Multi-Indicator Rule: At least 2 of 3 indicators must exhibit adverse drift.
    3. Persistence Rule: Slopes and deviations must persist over 3-to-5 day sliding window.
    4. Single-Spike Invariance: Isolated single-day spikes suppress alert generation.
    5. Environmental & Mission Cross-Correlation: Links cabin telemetry & operational schedule.
    """
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if not astro:
        return None

    if reference_time is None:
        # Determine latest observation time for this astronaut
        latest_obs = (
            db.query(HealthObservation)
            .filter(HealthObservation.astronaut_id == astronaut_id)
            .order_by(HealthObservation.observation_time.desc())
            .first()
        )
        if not latest_obs:
            return None
        reference_time = date_parser.isoparse(latest_obs.observation_time)
        if reference_time.tzinfo is None:
            reference_time = reference_time.replace(tzinfo=timezone.utc)
    elif reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)

    # 1. Retrieve Active Personal Baselines for the 3 target indicators
    target_keys = ["RESTING_HEART_RATE", "SLEEP_DURATION", "HEART_RATE_RECOVERY_1MIN"]
    baselines: Dict[str, PersonalBaseline] = {}
    for key in target_keys:
        ind = db.query(IndicatorDefinition).filter(IndicatorDefinition.indicator_key == key).first()
        if not ind:
            return None
        b = (
            db.query(PersonalBaseline)
            .filter(
                PersonalBaseline.astronaut_id == astronaut_id,
                PersonalBaseline.indicator_id == ind.id,
            )
            .order_by(PersonalBaseline.version.desc())
            .first()
        )
        if not b or b.status != "ACTIVE":
            # Baseline guard: insufficient baseline data blocks deterioration alert
            return None
        baselines[key] = b

    # 2. Query 3-to-5 Day Sliding Window Observations
    window_start_dt = reference_time - timedelta(days=SLIDING_WINDOW_DAYS)
    window_start_str = window_start_dt.isoformat()
    window_end_str = reference_time.isoformat()

    trends: Dict[str, TrendResult] = {}
    obs_by_indicator: Dict[str, List[HealthObservation]] = {}

    for key in target_keys:
        ind = db.query(IndicatorDefinition).filter(IndicatorDefinition.indicator_key == key).first()
        raw_obs = (
            db.query(HealthObservation)
            .filter(
                HealthObservation.astronaut_id == astronaut_id,
                HealthObservation.indicator_id == ind.id,
                HealthObservation.quality_status.in_(["VALID", "STALE"]),
                HealthObservation.observation_time >= window_start_str,
                HealthObservation.observation_time <= window_end_str,
            )
            .order_by(HealthObservation.observation_time.asc())
            .all()
        )
        obs_by_indicator[key] = raw_obs
        obs_points = [
            ObservationPoint(id=o.id, value=o.value, observation_time=o.observation_time)
            for o in raw_obs
        ]
        b = baselines[key]
        trend = evaluate_indicator_trend(key, obs_points, b.mean, b.std_dev)
        trends[key] = trend

    # 3. Check Multi-Indicator Persistence Rule: >= 2 indicators must be adverse
    adverse_trends = {k: t for k, t in trends.items() if t.is_adverse}
    if len(adverse_trends) < 2:
        # Fails multi-indicator persistence rule; single spike or normal variance
        return None

    # Check for existing active alert to prevent duplicate flood
    existing_alert = (
        db.query(DeteriorationAlert)
        .filter(
            DeteriorationAlert.astronaut_id == astronaut_id,
            DeteriorationAlert.pattern_type == "SILENT_MULTI_INDICATOR_DETERIORATION",
            DeteriorationAlert.lifecycle_status.in_(["NEW", "UNDER_REVIEW", "MONITORING"]),
        )
        .first()
    )
    if existing_alert:
        # Active alert already open for crew member
        return existing_alert

    # 4. Mission Context Cross-Correlation
    events = (
        db.query(MissionEvent)
        .filter(
            MissionEvent.astronaut_id == astronaut_id,
            MissionEvent.start_time <= window_end_str,
            MissionEvent.end_time >= window_start_str,
        )
        .all()
    )
    if events:
        event_descriptions = [f"{e.title} ({e.workload_intensity} workload)" for e in events]
        mission_context_notes = (
            f"Temporal correlation with recorded operational events: {'; '.join(event_descriptions)}."
        )
    else:
        mission_context_notes = "Nominal flight schedule; no high-workload EVA drills logged during this window."

    # 5. Environmental Context Cross-Correlation
    env_readings = (
        db.query(EnvironmentalTelemetry)
        .filter(
            EnvironmentalTelemetry.mission_id == astro.mission_id,
            EnvironmentalTelemetry.timestamp >= window_start_str,
            EnvironmentalTelemetry.timestamp <= window_end_str,
        )
        .all()
    )
    co2_readings = [e for e in env_readings if e.parameter_name == "CABIN_CO2_PPM"]
    elevated_co2 = [e for e in co2_readings if e.value > 2500.0]
    
    if elevated_co2:
        max_co2 = max(e.value for e in elevated_co2)
        avg_co2 = sum(e.value for e in elevated_co2) / len(elevated_co2)
        env_notes = (
            f"Cabin CO2 elevated during observation window: averaged {avg_co2:.0f} ppm "
            f"(peak {max_co2:.0f} ppm in {elevated_co2[0].habitat_zone}). Environmental stressor correlated."
        )
    else:
        env_notes = "Cabin atmospheric telemetry remained within nominal life support limits (<2500 ppm CO2)."

    # 6. Determine Review Priority & Generate Clinical Narrative
    priority = "HIGH" if (len(adverse_trends) == 3 or any(abs(t.latest_z_score) >= 3.0 for t in adverse_trends.values())) else "MEDIUM"
    
    consecutive_days = max(t.sample_count for t in adverse_trends.values())
    narrative_parts = [
        f"Persistent multi-indicator physiological deterioration detected across {len(adverse_trends)} "
        f"indicators over {consecutive_days} consecutive observation cycles."
    ]

    rhr = trends["RESTING_HEART_RATE"]
    if rhr.is_adverse:
        narrative_parts.append(
            f"Resting Heart Rate has risen to {rhr.latest_value} bpm (+{rhr.latest_z_score}σ, OLS slope +{rhr.ols_slope} bpm/day)."
        )

    sleep = trends["SLEEP_DURATION"]
    if sleep.is_adverse:
        narrative_parts.append(
            f"Sleep Duration has declined to {sleep.latest_value} hrs ({sleep.latest_z_score}σ, OLS slope {sleep.ols_slope} hr/day)."
        )

    hrr = trends["HEART_RATE_RECOVERY_1MIN"]
    if hrr.is_adverse:
        narrative_parts.append(
            f"Post-exercise cardiac recovery velocity has slowed to {hrr.latest_value} bpm ({hrr.latest_z_score}σ, OLS slope {hrr.ols_slope} bpm/day)."
        )

    narrative_parts.append(mission_context_notes)
    if elevated_co2:
        narrative_parts.append(env_notes)
    detection_narrative = " ".join(narrative_parts)

    # 7. Package Math Summary JSON
    math_summary_dict = {}
    for k, t in trends.items():
        math_summary_dict[k] = {
            "baseline_mean": t.baseline_mean,
            "baseline_std": t.baseline_std_dev,
            "latest_value": t.latest_value,
            "latest_z_score": t.latest_z_score,
            "mean_z_score": t.mean_z_score,
            "ols_slope": t.ols_slope,
            "sample_count": t.sample_count,
            "is_adverse": t.is_adverse,
        }

    # 8. Create Deterioration Alert Record
    alert = DeteriorationAlert(
        astronaut_id=astronaut_id,
        analysis_run_id=analysis_run_id,
        review_priority=priority,
        pattern_type="SILENT_MULTI_INDICATOR_DETERIORATION",
        lifecycle_status="NEW",
        window_start=window_start_str,
        window_end=window_end_str,
        detection_narrative=detection_narrative,
        math_summary=json.dumps(math_summary_dict),
        mission_context_notes=mission_context_notes,
        environmental_context_notes=env_notes,
        scientific_ref=NASA_HRP_SCIENTIFIC_REF,
        rule_version=ENGINE_RULE_VERSION,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # 9. Create Alert Evidence Links
    for k, t in adverse_trends.items():
        raw_obs_list = obs_by_indicator[k]
        for obs in raw_obs_list:
            z = round((obs.value - t.baseline_mean) / (t.baseline_std_dev if t.baseline_std_dev > 0 else 0.01), 2)
            summary = (
                f"{k}: {obs.value} observed at {obs.observation_time} "
                f"({z}σ deviation from baseline mean {t.baseline_mean})."
            )
            evidence = AlertEvidenceLink(
                alert_id=alert.id,
                observation_id=obs.id,
                evidence_type="BIOMETRIC",
                metric_name=k,
                observed_value=obs.value,
                baseline_mean=t.baseline_mean,
                z_score=z,
                ols_slope=t.ols_slope,
                contribution_summary=summary,
            )
            db.add(evidence)

    # Link elevated environmental telemetry
    if elevated_co2:
        for env in elevated_co2:
            evidence = AlertEvidenceLink(
                alert_id=alert.id,
                environmental_telemetry_id=env.id,
                evidence_type="ENVIRONMENTAL",
                metric_name=env.parameter_name,
                observed_value=env.value,
                baseline_mean=2000.0,
                z_score=round((env.value - 2000.0) / 500.0, 2),
                ols_slope=None,
                contribution_summary=f"Elevated {env.parameter_name} ({env.value} {env.unit}) in {env.habitat_zone}.",
            )
            db.add(evidence)

    db.commit()
    db.refresh(alert)
    return alert


def run_fleet_deterioration_analysis(
    db: Session,
    mission_id: Optional[str] = None,
    run_type: str = "SCHEDULED_BATCH",
) -> AnalysisRun:
    """
    Executes full fleet deterioration analysis and records an auditable AnalysisRun.
    """
    start_time = time.time()
    
    # Identify mission
    if not mission_id:
        first_mission = db.query(Mission).first()
        if first_mission:
            mission_id = first_mission.id
        else:
            # Create a placeholder mission if none exists
            first_mission = Mission(
                mission_code="ARTEMIS-DEFAULT",
                name="Artemis Fleet Operations",
                target_destination="CISLUNAR",
                spacecraft_module="ORION",
                flight_day=1,
                comms_latency_seconds=3,
                status="ACTIVE",
                start_date=datetime.now(timezone.utc).isoformat(),
            )
            db.add(first_mission)
            db.commit()
            db.refresh(first_mission)
            mission_id = first_mission.id

    # Create Analysis Run record
    analysis_run = AnalysisRun(
        mission_id=mission_id,
        run_type=run_type,
        rule_version=ENGINE_RULE_VERSION,
        status="RUNNING",
        observations_evaluated_count=0,
        alerts_generated_count=0,
        execution_duration_ms=0,
    )
    db.add(analysis_run)
    db.commit()
    db.refresh(analysis_run)

    # Query astronauts
    astro_query = db.query(AstronautProfile)
    if mission_id:
        astro_query = astro_query.filter(AstronautProfile.mission_id == mission_id)
    astronauts = astro_query.all()

    alerts_generated = 0
    total_obs_evaluated = 0

    for astro in astronauts:
        obs_count = db.query(HealthObservation).filter(HealthObservation.astronaut_id == astro.id).count()
        total_obs_evaluated += obs_count
        
        alert = run_deterioration_analysis_for_astronaut(db, astro.id, analysis_run.id)
        if alert and alert.analysis_run_id == analysis_run.id:
            alerts_generated += 1

    duration_ms = int((time.time() - start_time) * 1000)

    # Update run metrics
    analysis_run.status = "SUCCESS"
    analysis_run.observations_evaluated_count = total_obs_evaluated
    analysis_run.alerts_generated_count = alerts_generated
    analysis_run.execution_duration_ms = duration_ms
    db.commit()
    db.refresh(analysis_run)

    return analysis_run
