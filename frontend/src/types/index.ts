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
