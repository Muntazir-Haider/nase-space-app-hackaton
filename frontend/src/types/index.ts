export interface AstronautSummary {
  id: string;
  callsign: string;
  full_name: string;
  mission_code: string;
  mission_role: string;
  medical_clearance_status: string;
  status_indicator: 'NOMINAL' | 'OBSERVATION' | 'REVIEW_ALERT';
  active_alert_count: number;
  last_reading_time?: string | null;
}

export interface HealthCheckResponse {
  status: string;
  system: string;
  version: string;
  offline_storage_ready: boolean;
  database_file: string;
  database_path?: string;
  database_size_bytes?: number;
  sqlite_mode?: string;
  foreign_keys_enforced?: boolean;
  comms_latency?: string;
  active_role: string;
  server_time_utc?: string;
}

export interface MissionOut {
  id: string;
  mission_code: string;
  name: string;
  target_destination: string;
  spacecraft_module: string;
  flight_day: number;
  comms_latency_seconds: number;
  status: string;
  start_date: string;
  created_at: string;
}

export interface AstronautCreateInput {
  mission_id: string;
  callsign: string;
  full_name: string;
  flight_role: string;
  medical_clearance_status: string;
}

export interface StationDiagnosticsResponse {
  station_status: string;
  database_file: string;
  database_size_bytes: number;
  table_counts: Record<string, number | string>;
  total_records: number;
  sqlite_journal_mode: string;
  timestamp_utc: string;
}

export interface ScenarioLoadResponse {
  status: string;
  scenario_key: string;
  astronaut_id: string;
  mission_id: string;
  records_inserted: number;
  events_inserted: number;
  environmental_inserted: number;
  active_alerts_generated: number;
  message: string;
}

export interface TimelineBaselineInfo {
  mean: number;
  std_dev: number;
  status: string;
}

export interface PersonalBaselineOut {
  id: string;
  astronaut_id: string;
  indicator_id: string;
  indicator_key: string;
  window_start: string;
  window_end: string;
  sample_count: number;
  mean: number;
  median: number;
  std_dev: number;
  status: 'ACTIVE' | 'INSUFFICIENT_BASELINE_DATA';
  version: number;
  calculated_at: string;
}

export interface TimelinePoint {
  date: string;
  timestamp: string;
  rhr_value?: number | null;
  rhr_z_score?: number | null;
  sleep_value?: number | null;
  sleep_z_score?: number | null;
  hrr_value?: number | null;
  hrr_z_score?: number | null;
  cabin_co2_ppm?: number | null;
  radiation_usv?: number | null;
  mission_events: string[];
}

export interface AstronautTimelineResponse {
  astronaut_id: string;
  callsign: string;
  full_name: string;
  window_days: number;
  baselines: Record<string, TimelineBaselineInfo>;
  timeline_points: TimelinePoint[];
}

export interface DeteriorationAlert {
  id: string;
  astronaut_id: string;
  review_priority: 'LOW' | 'MEDIUM' | 'HIGH';
  pattern_type: string;
  lifecycle_status: 'NEW' | 'UNDER_REVIEW' | 'MONITORING' | 'RESOLVED' | 'DISMISSED';
  window_start: string;
  window_end: string;
  detection_narrative: string;
  math_summary: string;
  mission_context_notes: string;
  environmental_context_notes?: string | null;
  scientific_ref: string;
  rule_version: string;
  created_at: string;
  updated_at: string;
}

export interface AlertEvidenceItem {
  id: string;
  alert_id: string;
  evidence_type: string;
  metric_name: string;
  observed_value: number;
  baseline_mean?: number | null;
  z_score?: number | null;
  ols_slope?: number | null;
  contribution_summary: string;
}

export interface ClinicalCountermeasure {
  id: string;
  alert_id: string;
  astronaut_id: string;
  prescribed_by: string;
  countermeasure_type: string;
  title: string;
  prescription_details: string;
  target_duration_hours: number;
  outcome_status: string;
  prescribed_at: string;
  updated_at: string;
}

export interface CMOFollowup {
  id: string;
  alert_id: string;
  astronaut_id: string;
  reviewer_callsign: string;
  review_notes: string;
  status_transition: string;
  recorded_at: string;
}

export interface AlertEvidenceDetail {
  alert: DeteriorationAlert;
  astronaut_callsign: string;
  astronaut_full_name: string;
  flight_role: string;
  medical_clearance_status: string;
  evidence_items: AlertEvidenceItem[];
  countermeasures: ClinicalCountermeasure[];
  followups: CMOFollowup[];
}

export interface DataQualityAuditLog {
  id: string;
  source_type: string;
  raw_payload_blob: string;
  astronaut_id?: string | null;
  indicator_key?: string | null;
  error_code: string;
  rejection_reason: string;
  flagged_at: string;
}

export interface IndicatorDefinitionOut {
  id: string;
  indicator_key: string;
  category: string;
  display_name: string;
  standard_unit: string;
  nominal_min: number;
  nominal_max: number;
  critical_min: number;
  critical_max: number;
  sampling_frequency_hours: number;
  nasa_hrp_reference: string;
  description: string;
}

export interface IngestionResultItem {
  observation_id?: string | null;
  indicator_key: string;
  quality_status: string;
  quality_notes?: string | null;
}

export interface IngestionResponse {
  accepted_count: number;
  rejected_count: number;
  results: IngestionResultItem[];
}

export interface MissingDataGapItem {
  date: string;
  astronaut_id: string;
  indicator_key: string;
  status: string;
  message: string;
}

export interface MissingDataGapsResponse {
  astronaut_id: string;
  window_days: number;
  missing_gaps_count: number;
  gaps: MissingDataGapItem[];
}

export interface OfflineSyncItem {
  id: string;
  transaction_type: string;
  entity_table: string;
  idempotency_hash: string;
  sync_status: string;
  created_at: string;
}

export interface SyncQueueSummary {
  total_transactions: number;
  queued_pending: number;
  synced_to_earth: number;
  failed_retries: number;
  comms_mode: string;
  latency_simulation: string;
  recent_items: OfflineSyncItem[];
}

export interface DailyAnomalyScore {
  day: number;
  date: string;
  rule_based_alert: boolean;
  isolation_forest_score: number;
  isolation_forest_is_anomaly: boolean;
  lof_score: number;
  lof_is_anomaly: boolean;
  context_event?: string | null;
}

export interface ModelComparisonMetrics {
  model_name: string;
  model_family: string;
  description: string;
  detection_day_scenario_c?: number | null;
  scenario_b_false_positives: number;
  scenario_a_false_positives: number;
  explainability_score_out_of_10: number;
  explainability_rationale: string;
  computational_latency_ms: number;
  nasa_flight_surgeon_verdict: string;
}

export interface BenchmarkEvaluationReport {
  timestamp_utc: string;
  execution_duration_ms: number;
  evaluated_scenarios: string[];
  models_evaluated: string[];
  comparison_matrix: ModelComparisonMetrics[];
  daily_progression_scenario_c: DailyAnomalyScore[];
  daily_progression_scenario_b: DailyAnomalyScore[];
  synthesis_conclusions: string[];
}

export interface FlightSurgeonHandoverReport {
  report_id: string;
  generated_at: string;
  astronaut_id: string;
  callsign: string;
  full_name: string;
  flight_role: string;
  mission_code: string;
  target_destination: string;
  flight_day: number;
  medical_clearance_status: string;
  overall_clinical_status: 'NOMINAL' | 'OBSERVATION' | 'CRITICAL_REVIEW';
  active_alerts_count: number;
  baselines_summary: Record<string, any>;
  active_alerts: Array<{
    alert_id: string;
    indicator_key: string;
    severity: string;
    lifecycle_status: string;
    trigger_reason: string;
    evidence_summary: string;
    ols_slope: number | null;
    z_score: number | null;
    persistence_count: number;
    evidence_count: number;
    created_at: string;
  }>;
  recent_observations_summary: Record<string, {
    latest_value: number;
    latest_time: string;
    unit: string;
    count: number;
    min_7d: number;
    max_7d: number;
    avg_7d: number;
  }>;
  environmental_context: {
    cabin_co2_mean_ppm: number | null;
    cabin_co2_max_ppm: number | null;
    cabin_co2_elevated: boolean;
    radiation_total_usv: number;
    total_readings_analyzed: number;
    habitat_zone: string;
  };
  recent_mission_events: Array<{
    event_id: string;
    event_type: string;
    title: string;
    start_time: string;
    end_time: string;
    workload_intensity: string;
    notes?: string | null;
  }>;
  countermeasures_summary: Array<{
    countermeasure_id: string;
    alert_id: string;
    countermeasure_type: string;
    prescription_details: string;
    prescribed_by: string;
    prescribed_at: string;
    status: string;
    efficacy_status: string;
    followup_count: number;
    latest_followup_note?: string | null;
  }>;
  flight_surgeon_recommendation: string;
  cmo_handover_notes?: string | null;
  integrity_hash: string;
}

export interface MissionEventItem {
  id: string;
  mission_id: string;
  astronaut_id: string;
  event_type: string;
  title: string;
  start_time: string;
  end_time: string;
  workload_intensity: string;
  notes?: string | null;
}

export interface EnvironmentalTelemetryItem {
  id: string;
  mission_id: string;
  parameter_name: string;
  value: number;
  unit: string;
  habitat_zone: string;
  timestamp: string;
  quality_status: string;
}

export interface DatabaseSnapshotResponse {
  system: string;
  version: string;
  snapshot_timestamp_utc: string;
  total_tables: number;
  total_records: number;
  data: Record<string, any[]>;
}

export interface OperatorProfile {
  id: string;
  callsign: string;
  full_name: string;
  role: string;
  role_display: string;
  rank: string;
  security_clearance: string;
  station_module: string;
  avatar_color: string;
  permissions: string[];
}

export interface LoginResponse {
  success: boolean;
  token: string;
  operator: OperatorProfile;
  expires_at: string;
  message: string;
}

export interface OperatorRoleOut {
  role_key: string;
  title: string;
  description: string;
  default_callsign: string;
  default_pin: string;
  default_name: string;
  clearance_level: string;
  permissions: string[];
}


