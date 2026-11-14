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
  active_role: string;
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
