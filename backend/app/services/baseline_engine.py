from datetime import datetime, timezone, timedelta
from typing import List, Optional
import numpy as np
from sqlalchemy.orm import Session
from backend.app.models.entities import (
    PersonalBaseline,
    HealthObservation,
    IndicatorDefinition,
    AstronautProfile,
)

MIN_BASELINE_SAMPLES = 4
BASELINE_WINDOW_DAYS = 7

def compute_astronaut_baseline(
    db: Session,
    astronaut_id: str,
    indicator_id: str,
    reference_time: Optional[datetime] = None,
) -> PersonalBaseline:
    if reference_time is None:
        reference_time = datetime.now(timezone.utc)
    elif reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)

    window_end_dt = reference_time
    window_start_dt = window_end_dt - timedelta(days=BASELINE_WINDOW_DAYS)

    window_start_str = window_start_dt.isoformat()
    window_end_str = window_end_dt.isoformat()

    # Query valid observations within the 7-day calendar window
    observations = (
        db.query(HealthObservation)
        .filter(
            HealthObservation.astronaut_id == astronaut_id,
            HealthObservation.indicator_id == indicator_id,
            HealthObservation.quality_status.in_(["VALID", "STALE"]),
            HealthObservation.observation_time >= window_start_str,
            HealthObservation.observation_time <= window_end_str,
        )
        .order_by(HealthObservation.observation_time.asc())
        .all()
    )

    sample_count = len(observations)
    
    # Determine next version
    latest_existing = (
        db.query(PersonalBaseline)
        .filter(
            PersonalBaseline.astronaut_id == astronaut_id,
            PersonalBaseline.indicator_id == indicator_id,
        )
        .order_by(PersonalBaseline.version.desc())
        .first()
    )
    next_version = (latest_existing.version + 1) if latest_existing else 1

    if sample_count < MIN_BASELINE_SAMPLES:
        # Insufficient data condition
        baseline = PersonalBaseline(
            astronaut_id=astronaut_id,
            indicator_id=indicator_id,
            window_start=window_start_str,
            window_end=window_end_str,
            sample_count=sample_count,
            mean=0.0,
            median=0.0,
            std_dev=0.0,
            status="INSUFFICIENT_BASELINE_DATA",
            version=next_version,
            calculated_at=datetime.now(timezone.utc).isoformat(),
        )
    else:
        values = [obs.value for obs in observations]
        mean_val = float(np.mean(values))
        median_val = float(np.median(values))
        
        # Sample standard deviation (ddof=1 for Bessel's correction N-1)
        std_val = float(np.std(values, ddof=1))
        if std_val == 0.0:
            std_val = 0.01  # Prevent divide-by-zero in z-score calculations

        baseline = PersonalBaseline(
            astronaut_id=astronaut_id,
            indicator_id=indicator_id,
            window_start=window_start_str,
            window_end=window_end_str,
            sample_count=sample_count,
            mean=round(mean_val, 3),
            median=round(median_val, 3),
            std_dev=round(std_val, 3),
            status="ACTIVE",
            version=next_version,
            calculated_at=datetime.now(timezone.utc).isoformat(),
        )

    db.add(baseline)
    db.commit()
    db.refresh(baseline)
    return baseline

def compute_all_baselines_for_astronaut(
    db: Session,
    astronaut_id: str,
    reference_time: Optional[datetime] = None,
) -> List[PersonalBaseline]:
    indicators = db.query(IndicatorDefinition).filter(
        IndicatorDefinition.category.in_(["CARDIOVASCULAR", "SLEEP", "EXERCISE_RECOVERY"])
    ).all()
    
    baselines = []
    for ind in indicators:
        baseline = compute_astronaut_baseline(db, astronaut_id, ind.id, reference_time)
        baselines.append(baseline)
    return baselines

def get_latest_baselines_for_astronaut(
    db: Session,
    astronaut_id: str,
) -> List[PersonalBaseline]:
    indicators = db.query(IndicatorDefinition).filter(
        IndicatorDefinition.category.in_(["CARDIOVASCULAR", "SLEEP", "EXERCISE_RECOVERY"])
    ).all()
    
    latest_list = []
    for ind in indicators:
        latest = (
            db.query(PersonalBaseline)
            .filter(
                PersonalBaseline.astronaut_id == astronaut_id,
                PersonalBaseline.indicator_id == ind.id,
            )
            .order_by(PersonalBaseline.version.desc())
            .first()
        )
        if latest:
            latest_list.append(latest)
    return latest_list
