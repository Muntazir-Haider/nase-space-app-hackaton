import json
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from dateutil import parser as date_parser
from sqlalchemy.orm import Session
from backend.app.models.entities import (
    IndicatorDefinition,
    HealthObservation,
    DataQualityAuditLog,
    AstronautProfile,
)
from backend.app.schemas.schemas import HealthObservationItem

class ValidationResult:
    def __init__(
        self,
        is_valid: bool,
        quality_status: str,
        error_code: Optional[str] = None,
        quality_notes: Optional[str] = None,
        indicator_id: Optional[str] = None,
    ):
        self.is_valid = is_valid
        self.quality_status = quality_status
        self.error_code = error_code
        self.quality_notes = quality_notes
        self.indicator_id = indicator_id

def validate_observation(db: Session, obs: HealthObservationItem) -> ValidationResult:
    now_utc = datetime.now(timezone.utc)
    raw_payload_blob = json.dumps(obs.model_dump())

    # 1. Verify Astronaut exists
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == obs.astronaut_id).first()
    if not astro:
        error_code = "ASTRONAUT_NOT_FOUND"
        reason = f"Astronaut with ID '{obs.astronaut_id}' does not exist."
        _log_audit(db, "BIOMETRIC_TELEMETRY", raw_payload_blob, obs.astronaut_id, obs.indicator_key, error_code, reason)
        return ValidationResult(False, "REJECTED", error_code, reason)

    # 2. Verify Indicator Definition
    indicator = db.query(IndicatorDefinition).filter(IndicatorDefinition.indicator_key == obs.indicator_key).first()
    if not indicator:
        error_code = "UNKNOWN_INDICATOR"
        reason = f"Indicator key '{obs.indicator_key}' is not cataloged in indicator definitions."
        _log_audit(db, "BIOMETRIC_TELEMETRY", raw_payload_blob, obs.astronaut_id, obs.indicator_key, error_code, reason)
        return ValidationResult(False, "REJECTED", error_code, reason)

    # 3. Unit Validation
    if obs.unit.strip().lower() != indicator.standard_unit.strip().lower():
        error_code = "INVALID_UNIT"
        reason = f"Invalid unit '{obs.unit}' for {obs.indicator_key}. Expected '{indicator.standard_unit}'."
        _log_audit(db, "BIOMETRIC_TELEMETRY", raw_payload_blob, obs.astronaut_id, obs.indicator_key, error_code, reason)
        return ValidationResult(False, "REJECTED", error_code, reason)

    # 4. Physiological Plausibility Range Check
    if obs.value < indicator.critical_min or obs.value > indicator.critical_max:
        error_code = "OUT_OF_BOUNDS"
        reason = (
            f"Value {obs.value} {obs.unit} is outside plausible physiological bounds "
            f"[{indicator.critical_min}, {indicator.critical_max}]."
        )
        _log_audit(db, "BIOMETRIC_TELEMETRY", raw_payload_blob, obs.astronaut_id, obs.indicator_key, error_code, reason)
        return ValidationResult(False, "REJECTED", error_code, reason)

    # 5. Temporal Integrity Check
    try:
        obs_dt = date_parser.isoparse(obs.observation_time)
        if obs_dt.tzinfo is None:
            obs_dt = obs_dt.replace(tzinfo=timezone.utc)
    except Exception as e:
        error_code = "MALFORMED_TIMESTAMP"
        reason = f"Failed to parse timestamp '{obs.observation_time}': {str(e)}"
        _log_audit(db, "BIOMETRIC_TELEMETRY", raw_payload_blob, obs.astronaut_id, obs.indicator_key, error_code, reason)
        return ValidationResult(False, "REJECTED", error_code, reason)

    if obs_dt > now_utc + timedelta(minutes=5):
        error_code = "FUTURE_TIMESTAMP"
        reason = f"Observation timestamp '{obs.observation_time}' is in the future (current UTC: {now_utc.isoformat()})."
        _log_audit(db, "BIOMETRIC_TELEMETRY", raw_payload_blob, obs.astronaut_id, obs.indicator_key, error_code, reason)
        return ValidationResult(False, "REJECTED", error_code, reason)

    # 6. Duplicate Observation Check
    duplicate = (
        db.query(HealthObservation)
        .filter(
            HealthObservation.astronaut_id == obs.astronaut_id,
            HealthObservation.indicator_id == indicator.id,
            HealthObservation.observation_time == obs.observation_time,
        )
        .first()
    )
    if duplicate:
        error_code = "DUPLICATE_RECORD"
        reason = f"Duplicate observation already recorded for astronaut '{obs.astronaut_id}' at {obs.observation_time}."
        _log_audit(db, "BIOMETRIC_TELEMETRY", raw_payload_blob, obs.astronaut_id, obs.indicator_key, error_code, reason)
        return ValidationResult(False, "REJECTED", error_code, reason)

    # 7. Staleness Check
    if obs_dt < now_utc - timedelta(hours=36):
        return ValidationResult(
            is_valid=True,
            quality_status="STALE",
            error_code=None,
            quality_notes=f"Observation timestamp is older than 36 hours (recorded at {obs.observation_time}).",
            indicator_id=indicator.id,
        )

    # All validations passed
    return ValidationResult(
        is_valid=True,
        quality_status="VALID",
        error_code=None,
        quality_notes=None,
        indicator_id=indicator.id,
    )

def _log_audit(
    db: Session,
    source_type: str,
    raw_payload_blob: str,
    astronaut_id: Optional[str],
    indicator_key: Optional[str],
    error_code: str,
    rejection_reason: str,
):
    audit_entry = DataQualityAuditLog(
        source_type=source_type,
        raw_payload_blob=raw_payload_blob,
        astronaut_id=astronaut_id,
        indicator_key=indicator_key,
        error_code=error_code,
        rejection_reason=rejection_reason,
    )
    db.add(audit_entry)
    db.commit()

def detect_missing_data_gaps(
    db: Session,
    astronaut_id: str,
    days: int = 7,
    reference_time: Optional[datetime] = None,
):
    """
    Scans the specified observation window (default: past 7 calendar days)
    for missing daily biometric observations per astronaut.
    Explicitly reports data gaps rather than assuming nominal health.
    """
    if reference_time is None:
        latest = (
            db.query(HealthObservation)
            .filter(HealthObservation.astronaut_id == astronaut_id)
            .order_by(HealthObservation.observation_time.desc())
            .first()
        )
        if latest:
            try:
                reference_time = date_parser.isoparse(latest.observation_time)
                if reference_time.tzinfo is None:
                    reference_time = reference_time.replace(tzinfo=timezone.utc)
            except Exception:
                reference_time = datetime.now(timezone.utc)
        else:
            reference_time = datetime.now(timezone.utc)
    elif reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)

    target_keys = ["RESTING_HEART_RATE", "SLEEP_DURATION", "HEART_RATE_RECOVERY_1MIN"]
    gaps = []

    # Map indicators to IDs
    ind_map = {}
    for k in target_keys:
        ind = db.query(IndicatorDefinition).filter(IndicatorDefinition.indicator_key == k).first()
        if ind:
            ind_map[k] = ind.id

    for day_offset in range(days):
        target_date = (reference_time - timedelta(days=day_offset)).date()
        date_prefix = target_date.isoformat()

        for key in target_keys:
            ind_id = ind_map.get(key)
            if not ind_id:
                continue

            has_obs = (
                db.query(HealthObservation)
                .filter(
                    HealthObservation.astronaut_id == astronaut_id,
                    HealthObservation.indicator_id == ind_id,
                    HealthObservation.observation_time.like(f"{date_prefix}%"),
                    HealthObservation.quality_status.in_(["VALID", "STALE"]),
                )
                .first()
            )

            if not has_obs:
                gaps.append({
                    "date": date_prefix,
                    "astronaut_id": astronaut_id,
                    "indicator_key": key,
                    "status": "MISSING_DATA_GAP",
                    "message": f"No telemetry recorded for {key} on {date_prefix}. Telemetry gap detected (nominal health not assumed).",
                })

    return gaps

