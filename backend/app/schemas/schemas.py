from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# ============================================================================
# MISSIONS & CREW CONTEXT
# ============================================================================

class MissionBase(BaseModel):
    mission_code: str = Field(..., examples=["ARTEMIS-III"])
    name: str = Field(..., examples=["Artemis III Lunar Surface Expedition"])
    target_destination: str = Field(..., examples=["LUNAR_SOUTH_POLE"])
    spacecraft_module: str = Field(..., examples=["ORION_MPC_V"])
    flight_day: int = Field(default=1, ge=1)
    comms_latency_seconds: int = Field(default=0, ge=0)
    status: str = Field(default="ACTIVE")
    start_date: str = Field(..., examples=["2026-11-01T00:00:00Z"])

class MissionCreate(MissionBase):
    pass

class MissionOut(MissionBase):
    id: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class AstronautProfileBase(BaseModel):
    callsign: str = Field(..., examples=["ARTEMIS-01"])
    full_name: str = Field(..., examples=["Dr. Elena Vance"])
    flight_role: str = Field(..., examples=["COMMANDER"])
    medical_clearance_status: str = Field(default="FULL_FLIGHT_CLEARANCE")

class AstronautProfileCreate(AstronautProfileBase):
    mission_id: str

class AstronautProfileOut(AstronautProfileBase):
    id: str
    mission_id: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

class AstronautSummaryOut(BaseModel):
    id: str
    callsign: str
    full_name: str
    mission_code: str
    mission_role: str
    medical_clearance_status: str
    status_indicator: str  # 'NOMINAL', 'OBSERVATION', 'REVIEW_ALERT'
    active_alert_count: int
    last_reading_time: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# INDICATORS & TELEMETRY
# ============================================================================

class IndicatorDefinitionOut(BaseModel):
    id: str
    indicator_key: str
    category: str
    display_name: str
    standard_unit: str
    nominal_min: float
    nominal_max: float
    critical_min: float
    critical_max: float
    sampling_frequency_hours: float
    nasa_hrp_reference: str
    description: str

    model_config = ConfigDict(from_attributes=True)


class HealthObservationItem(BaseModel):
    astronaut_id: str
    indicator_key: str
    value: float
    unit: str
    observation_time: str
    data_origin: str = "SIMULATED"
    provenance_ref: str = "NASA-OSDR-ANALOG"

class HealthObservationBatchIn(BaseModel):
    observations: List[HealthObservationItem]

class IngestionResultItem(BaseModel):
    observation_id: Optional[str] = None
    indicator_key: str
    quality_status: str  # 'VALID', 'REJECTED', 'SUSPICIOUS'
    quality_notes: Optional[str] = None

class IngestionResponse(BaseModel):
    accepted_count: int
    rejected_count: int
    results: List[IngestionResultItem]


class EnvironmentalTelemetryCreate(BaseModel):
    mission_id: str
    parameter_name: str
    value: float
    unit: str
    habitat_zone: str
    timestamp: str

class EnvironmentalTelemetryOut(EnvironmentalTelemetryCreate):
    id: str
    quality_status: str

    model_config = ConfigDict(from_attributes=True)


class DataQualityAuditLogOut(BaseModel):
    id: str
    source_type: str
    raw_payload_blob: str
    astronaut_id: Optional[str] = None
    indicator_key: Optional[str] = None
    error_code: str
    rejection_reason: str
    flagged_at: str

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BASELINES & ANALYTICS
# ============================================================================

class PersonalBaselineOut(BaseModel):
    id: str
    astronaut_id: str
    indicator_id: str
    indicator_key: Optional[str] = None
    window_start: str
    window_end: str
    sample_count: int
    mean: float
    median: float
    std_dev: float
    status: str
    version: int
    calculated_at: str

    model_config = ConfigDict(from_attributes=True)


class AnalysisRunOut(BaseModel):
    id: str
    mission_id: str
    run_type: str
    rule_version: str
    status: str
    observations_evaluated_count: int
    alerts_generated_count: int
    execution_duration_ms: int
    executed_at: str

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ALERTS & COUNTERMEASURES
# ============================================================================

class AlertEvidenceItemOut(BaseModel):
    id: str
    alert_id: str
    evidence_type: str
    metric_name: str
    observed_value: float
    baseline_mean: Optional[float] = None
    z_score: Optional[float] = None
    ols_slope: Optional[float] = None
    contribution_summary: str

    model_config = ConfigDict(from_attributes=True)


class DeteriorationAlertOut(BaseModel):
    id: str
    astronaut_id: str
    review_priority: str
    pattern_type: str
    lifecycle_status: str
    window_start: str
    window_end: str
    detection_narrative: str
    math_summary: str
    mission_context_notes: str
    environmental_context_notes: Optional[str] = None
    scientific_ref: str
    rule_version: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class AlertEvidenceDetailOut(BaseModel):
    alert: DeteriorationAlertOut
    astronaut_callsign: str
    astronaut_full_name: str
    evidence_items: List[AlertEvidenceItemOut]
    countermeasures: List["ClinicalCountermeasureOut"] = []
    followups: List["CMOFollowupOut"] = []

    model_config = ConfigDict(from_attributes=True)


class AlertStatusUpdate(BaseModel):
    lifecycle_status: str = Field(..., examples=["UNDER_REVIEW"])
    reviewer_callsign: str = Field(..., examples=["CMO-01"])
    notes: str = Field(..., examples=["Reviewed trend; ordered supplemental sleep and fluid intake."])



class ClinicalCountermeasureCreate(BaseModel):
    prescribed_by: str = Field(..., examples=["CMO-01"])
    countermeasure_type: str = Field(..., examples=["SLEEP_SCHEDULE_ADJUSTMENT"])
    title: str = Field(..., examples=["Mandatory 60-min Sleep Extension"])
    prescription_details: str = Field(..., examples=["Prescribe 60 min supplemental sleep cycle prior to EVA."])
    target_duration_hours: int = Field(default=24, ge=1)

class ClinicalCountermeasureOut(ClinicalCountermeasureCreate):
    id: str
    alert_id: str
    astronaut_id: str
    outcome_status: str
    prescribed_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class CMOFollowupCreate(BaseModel):
    reviewer_callsign: str = Field(..., examples=["CMO-01"])
    review_notes: str = Field(..., examples=["Review completed. Workload modulation ordered."])
    status_transition: str = Field(..., examples=["NEW -> UNDER_REVIEW"])

class CMOFollowupOut(CMOFollowupCreate):
    id: str
    alert_id: str
    astronaut_id: str
    recorded_at: str

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# HACKATHON DEMO SCENARIO CONTRACTS
# ============================================================================

class ScenarioLoadRequest(BaseModel):
    scenario_key: str = Field(..., examples=["SCENARIO_C_SILENT_DETERIORATION"])

class ScenarioLoadResponse(BaseModel):
    status: str
    scenario_key: str
    astronaut_id: str
    mission_id: str
    records_inserted: int
    events_inserted: int
    environmental_inserted: int
    active_alerts_generated: int
    message: str
