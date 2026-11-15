import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    ForeignKey,
    Index,
    UniqueConstraint,
    Text,
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# ============================================================================
# DOMAIN 1: MISSIONS & CREW CONTEXT
# ============================================================================

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_code = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(200), nullable=False)
    target_destination = Column(String(100), nullable=False)
    spacecraft_module = Column(String(100), nullable=False)
    flight_day = Column(Integer, nullable=False, default=1)
    comms_latency_seconds = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="ACTIVE")
    start_date = Column(String(50), nullable=False)
    created_at = Column(String(50), nullable=False, default=get_utc_now_iso)

    # Relationships
    astronauts = relationship("AstronautProfile", back_populates="mission")
    environmental_readings = relationship("EnvironmentalTelemetry", back_populates="mission")
    events = relationship("MissionEvent", back_populates="mission")
    analysis_runs = relationship("AnalysisRun", back_populates="mission")


class AstronautProfile(Base):
    __tablename__ = "astronaut_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="RESTRICT"), nullable=False)
    callsign = Column(String(50), nullable=False, unique=True, index=True)
    full_name = Column(String(150), nullable=False)
    flight_role = Column(String(100), nullable=False)
    medical_clearance_status = Column(String(50), nullable=False, default="FULL_FLIGHT_CLEARANCE")
    created_at = Column(String(50), nullable=False, default=get_utc_now_iso)
    updated_at = Column(String(50), nullable=False, default=get_utc_now_iso)

    # Relationships
    mission = relationship("Mission", back_populates="astronauts")
    observations = relationship("HealthObservation", back_populates="astronaut", cascade="all, delete-orphan")
    baselines = relationship("PersonalBaseline", back_populates="astronaut", cascade="all, delete-orphan")
    events = relationship("MissionEvent", back_populates="astronaut", cascade="all, delete-orphan")
    alerts = relationship("DeteriorationAlert", back_populates="astronaut", cascade="all, delete-orphan")
    countermeasures = relationship("ClinicalCountermeasure", back_populates="astronaut", cascade="all, delete-orphan")
    followups = relationship("CMOFollowup", back_populates="astronaut", cascade="all, delete-orphan")


# ============================================================================
# DOMAIN 2: DYNAMIC INDICATOR CATALOG & TELEMETRY INGESTION
# ============================================================================

class IndicatorDefinition(Base):
    __tablename__ = "indicator_definitions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    indicator_key = Column(String(80), nullable=False, unique=True, index=True)
    category = Column(String(50), nullable=False)
    display_name = Column(String(100), nullable=False)
    standard_unit = Column(String(30), nullable=False)
    nominal_min = Column(Float, nullable=False)
    nominal_max = Column(Float, nullable=False)
    critical_min = Column(Float, nullable=False)
    critical_max = Column(Float, nullable=False)
    sampling_frequency_hours = Column(Float, nullable=False, default=24.0)
    nasa_hrp_reference = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    # Relationships
    observations = relationship("HealthObservation", back_populates="indicator_def")
    baselines = relationship("PersonalBaseline", back_populates="indicator_def")


class HealthObservation(Base):
    __tablename__ = "health_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    astronaut_id = Column(String(36), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    indicator_id = Column(String(36), ForeignKey("indicator_definitions.id", ondelete="RESTRICT"), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(30), nullable=False)
    observation_time = Column(String(50), nullable=False)
    recorded_time = Column(String(50), nullable=False, default=get_utc_now_iso)
    data_origin = Column(String(30), nullable=False, default="SIMULATED")
    provenance_ref = Column(String(150), nullable=False)
    quality_status = Column(String(30), nullable=False, default="VALID")
    quality_notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("idx_obs_astro_ind_time", "astronaut_id", "indicator_id", "observation_time"),
    )

    # Relationships
    astronaut = relationship("AstronautProfile", back_populates="observations")
    indicator_def = relationship("IndicatorDefinition", back_populates="observations")
    evidence_links = relationship("AlertEvidenceLink", back_populates="observation")


class EnvironmentalTelemetry(Base):
    __tablename__ = "environmental_telemetry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="RESTRICT"), nullable=False)
    parameter_name = Column(String(80), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(30), nullable=False)
    habitat_zone = Column(String(80), nullable=False)
    timestamp = Column(String(50), nullable=False)
    quality_status = Column(String(30), nullable=False, default="VALID")

    __table_args__ = (
        Index("idx_env_mission_time", "mission_id", "timestamp"),
    )

    # Relationships
    mission = relationship("Mission", back_populates="environmental_readings")
    evidence_links = relationship("AlertEvidenceLink", back_populates="environmental_reading")


class DataQualityAuditLog(Base):
    __tablename__ = "data_quality_audit_log"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_type = Column(String(50), nullable=False)
    raw_payload_blob = Column(Text, nullable=False)
    astronaut_id = Column(String(36), nullable=True)
    indicator_key = Column(String(80), nullable=True)
    error_code = Column(String(50), nullable=False)
    rejection_reason = Column(Text, nullable=False)
    flagged_at = Column(String(50), nullable=False, default=get_utc_now_iso, index=True)


# ============================================================================
# DOMAIN 3: BASELINES & ANALYTICS AUDIT
# ============================================================================

class PersonalBaseline(Base):
    __tablename__ = "personal_baselines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    astronaut_id = Column(String(36), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    indicator_id = Column(String(36), ForeignKey("indicator_definitions.id", ondelete="RESTRICT"), nullable=False)
    window_start = Column(String(50), nullable=False)
    window_end = Column(String(50), nullable=False)
    sample_count = Column(Integer, nullable=False)
    mean = Column(Float, nullable=False)
    median = Column(Float, nullable=False)
    std_dev = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")
    version = Column(Integer, nullable=False, default=1)
    calculated_at = Column(String(50), nullable=False, default=get_utc_now_iso)

    __table_args__ = (
        UniqueConstraint("astronaut_id", "indicator_id", "version", name="uq_baseline_astro_ind_version"),
        Index("idx_baseline_lookup", "astronaut_id", "indicator_id", "status"),
    )

    # Relationships
    astronaut = relationship("AstronautProfile", back_populates="baselines")
    indicator_def = relationship("IndicatorDefinition", back_populates="baselines")


class MissionEvent(Base):
    __tablename__ = "mission_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="RESTRICT"), nullable=False)
    astronaut_id = Column(String(36), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(80), nullable=False)
    title = Column(String(200), nullable=False)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    workload_intensity = Column(String(50), nullable=False, default="NOMINAL")
    notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("idx_events_astro_time", "astronaut_id", "start_time", "end_time"),
    )

    # Relationships
    mission = relationship("Mission", back_populates="events")
    astronaut = relationship("AstronautProfile", back_populates="events")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="RESTRICT"), nullable=False)
    run_type = Column(String(50), nullable=False, default="SCHEDULED_BATCH")
    rule_version = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="SUCCESS")
    observations_evaluated_count = Column(Integer, nullable=False, default=0)
    alerts_generated_count = Column(Integer, nullable=False, default=0)
    execution_duration_ms = Column(Integer, nullable=False, default=0)
    executed_at = Column(String(50), nullable=False, default=get_utc_now_iso)
    notes = Column(Text, nullable=True)

    # Relationships
    mission = relationship("Mission", back_populates="analysis_runs")
    alerts = relationship("DeteriorationAlert", back_populates="analysis_run")


# ============================================================================
# DOMAIN 4: SILENT DETERIORATION ALERTS & EVIDENCE
# ============================================================================

class DeteriorationAlert(Base):
    __tablename__ = "deterioration_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    astronaut_id = Column(String(36), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    analysis_run_id = Column(String(36), ForeignKey("analysis_runs.id", ondelete="RESTRICT"), nullable=False)
    review_priority = Column(String(30), nullable=False, default="MEDIUM")
    pattern_type = Column(String(80), nullable=False)
    lifecycle_status = Column(String(50), nullable=False, default="NEW")
    window_start = Column(String(50), nullable=False)
    window_end = Column(String(50), nullable=False)
    detection_narrative = Column(Text, nullable=False)
    math_summary = Column(Text, nullable=False)  # JSON-encoded statistics summary
    mission_context_notes = Column(Text, nullable=False)
    environmental_context_notes = Column(Text, nullable=True)
    scientific_ref = Column(Text, nullable=False)
    rule_version = Column(String(50), nullable=False)
    created_at = Column(String(50), nullable=False, default=get_utc_now_iso)
    updated_at = Column(String(50), nullable=False, default=get_utc_now_iso)

    __table_args__ = (
        Index("idx_alert_astro_status", "astronaut_id", "lifecycle_status"),
    )

    # Relationships
    astronaut = relationship("AstronautProfile", back_populates="alerts")
    analysis_run = relationship("AnalysisRun", back_populates="alerts")
    evidence_items = relationship("AlertEvidenceLink", back_populates="alert", cascade="all, delete-orphan")
    countermeasures = relationship("ClinicalCountermeasure", back_populates="alert", cascade="all, delete-orphan")
    followups = relationship("CMOFollowup", back_populates="alert", cascade="all, delete-orphan")


class AlertEvidenceLink(Base):
    __tablename__ = "alert_evidence_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_id = Column(String(36), ForeignKey("deterioration_alerts.id", ondelete="CASCADE"), nullable=False)
    observation_id = Column(String(36), ForeignKey("health_observations.id", ondelete="RESTRICT"), nullable=True)
    environmental_telemetry_id = Column(String(36), ForeignKey("environmental_telemetry.id", ondelete="RESTRICT"), nullable=True)
    evidence_type = Column(String(50), nullable=False)
    metric_name = Column(String(80), nullable=False)
    observed_value = Column(Float, nullable=False)
    baseline_mean = Column(Float, nullable=True)
    z_score = Column(Float, nullable=True)
    ols_slope = Column(Float, nullable=True)
    contribution_summary = Column(Text, nullable=False)

    __table_args__ = (
        Index("idx_evidence_alert", "alert_id"),
    )

    # Relationships
    alert = relationship("DeteriorationAlert", back_populates="evidence_items")
    observation = relationship("HealthObservation", back_populates="evidence_links")
    environmental_reading = relationship("EnvironmentalTelemetry", back_populates="evidence_links")


# ============================================================================
# DOMAIN 5: CMO CLINICAL ACTION & PROTOCOLS
# ============================================================================

class ClinicalCountermeasure(Base):
    __tablename__ = "clinical_countermeasures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_id = Column(String(36), ForeignKey("deterioration_alerts.id", ondelete="CASCADE"), nullable=False)
    astronaut_id = Column(String(36), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    prescribed_by = Column(String(50), nullable=False)
    countermeasure_type = Column(String(80), nullable=False)
    title = Column(String(200), nullable=False)
    prescription_details = Column(Text, nullable=False)
    target_duration_hours = Column(Integer, nullable=False, default=24)
    outcome_status = Column(String(50), nullable=False, default="ACTIVE")
    prescribed_at = Column(String(50), nullable=False, default=get_utc_now_iso)
    updated_at = Column(String(50), nullable=False, default=get_utc_now_iso)

    __table_args__ = (
        Index("idx_countermeasure_astro", "astronaut_id", "outcome_status"),
    )

    # Relationships
    alert = relationship("DeteriorationAlert", back_populates="countermeasures")
    astronaut = relationship("AstronautProfile", back_populates="countermeasures")


class CMOFollowup(Base):
    __tablename__ = "cmo_followups"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_id = Column(String(36), ForeignKey("deterioration_alerts.id", ondelete="CASCADE"), nullable=False)
    astronaut_id = Column(String(36), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    reviewer_callsign = Column(String(50), nullable=False)
    review_notes = Column(Text, nullable=False)
    status_transition = Column(String(100), nullable=False)
    recorded_at = Column(String(50), nullable=False, default=get_utc_now_iso)

    __table_args__ = (
        Index("idx_followup_alert", "alert_id"),
    )

    # Relationships
    alert = relationship("DeteriorationAlert", back_populates="followups")
    astronaut = relationship("AstronautProfile", back_populates="followups")


# ============================================================================
# DOMAIN 6: RESILIENCE & OFFLINE SYNCHRONIZATION QUEUE
# ============================================================================

class OfflineSyncQueue(Base):
    __tablename__ = "offline_sync_queue"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transaction_type = Column(String(80), nullable=False)
    entity_table = Column(String(80), nullable=False)
    entity_id = Column(String(36), nullable=False)
    idempotency_hash = Column(String(64), nullable=False, unique=True, index=True)
    payload_json = Column(Text, nullable=False)
    sync_status = Column(String(50), nullable=False, default="QUEUED", index=True)
    retry_count = Column(Integer, nullable=False, default=0)
    last_attempt_at = Column(String(50), nullable=True)
    created_at = Column(String(50), nullable=False, default=get_utc_now_iso)
