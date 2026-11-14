import { 
  AstronautSummary, 
  HealthCheckResponse, 
  ScenarioLoadResponse,
  AstronautTimelineResponse,
  DeteriorationAlert,
  AlertEvidenceDetail,
  DataQualityAuditLog,
  MissionOut,
  AstronautCreateInput,
  StationDiagnosticsResponse,
  IndicatorDefinitionOut,
  IngestionResponse,
  MissingDataGapsResponse,
  PersonalBaselineOut,
  ClinicalCountermeasure,
} from '../types';

const API_BASE = '/api/v1';

async function handleResponse<T>(res: Response, fallbackErrMsg: string): Promise<T> {
  if (!res.ok) {
    let detail = fallbackErrMsg;
    try {
      const errJson = await res.json();
      if (errJson.message) {
        detail = errJson.message;
      } else if (errJson.detail) {
        detail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      detail = `${fallbackErrMsg} (HTTP ${res.status}: ${res.statusText})`;
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthCheckResponse>(res, 'Failed to fetch station health');
}

export async function fetchStationDiagnostics(): Promise<StationDiagnosticsResponse> {
  const res = await fetch(`${API_BASE}/health/diagnostics`);
  return handleResponse<StationDiagnosticsResponse>(res, 'Failed to fetch station diagnostics');
}

export async function fetchMissions(): Promise<MissionOut[]> {
  const res = await fetch(`${API_BASE}/missions`);
  return handleResponse<MissionOut[]>(res, 'Failed to fetch missions');
}

export async function fetchAstronauts(): Promise<AstronautSummary[]> {
  const res = await fetch(`${API_BASE}/astronauts`);
  return handleResponse<AstronautSummary[]>(res, 'Failed to fetch astronauts roster');
}

export async function createAstronaut(payload: AstronautCreateInput): Promise<AstronautSummary> {
  const res = await fetch(`${API_BASE}/astronauts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AstronautSummary>(res, 'Failed to create astronaut profile');
}

export async function loadDemoScenario(scenarioKey: string): Promise<ScenarioLoadResponse> {
  const res = await fetch(`${API_BASE}/scenarios/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_key: scenarioKey }),
  });
  return handleResponse<ScenarioLoadResponse>(res, 'Failed to load demo scenario');
}

export async function fetchAstronautTimeline(astronautId: string): Promise<AstronautTimelineResponse> {
  const res = await fetch(`${API_BASE}/astronauts/${astronautId}/timeline`);
  return handleResponse<AstronautTimelineResponse>(res, 'Failed to fetch astronaut timeline');
}

export async function fetchAstronautBaselines(astronautId: string): Promise<PersonalBaselineOut[]> {
  const res = await fetch(`${API_BASE}/astronauts/${astronautId}/baseline`);
  return handleResponse<PersonalBaselineOut[]>(res, 'Failed to fetch astronaut personal baselines');
}

export async function recomputeAstronautBaselines(astronautId: string): Promise<PersonalBaselineOut[]> {
  const res = await fetch(`${API_BASE}/astronauts/${astronautId}/baseline/recompute`, {
    method: 'POST',
  });
  return handleResponse<PersonalBaselineOut[]>(res, 'Failed to recompute astronaut baselines');
}

export async function fetchAlerts(astronautId?: string): Promise<DeteriorationAlert[]> {
  const url = astronautId ? `${API_BASE}/alerts?astronaut_id=${astronautId}` : `${API_BASE}/alerts`;
  const res = await fetch(url);
  return handleResponse<DeteriorationAlert[]>(res, 'Failed to fetch alerts');
}

export async function fetchAlertEvidence(alertId: string): Promise<AlertEvidenceDetail> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/evidence`);
  return handleResponse<AlertEvidenceDetail>(res, 'Failed to fetch alert evidence');
}

export async function updateAlertStatus(
  alertId: string, 
  lifecycleStatus: string, 
  reviewerCallsign: string, 
  notes: string
): Promise<DeteriorationAlert> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lifecycle_status: lifecycleStatus,
      reviewer_callsign: reviewerCallsign,
      notes,
    }),
  });
  return handleResponse<DeteriorationAlert>(res, 'Failed to update alert status');
}

export async function prescribeCountermeasure(
  alertId: string,
  payload: {
    prescribed_by: string;
    countermeasure_type: string;
    title: string;
    prescription_details: string;
    target_duration_hours: number;
  }
): Promise<ClinicalCountermeasure> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/countermeasures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<ClinicalCountermeasure>(res, 'Failed to prescribe clinical countermeasure');
}

export async function fetchDataQualityAudit(): Promise<DataQualityAuditLog[]> {
  const res = await fetch(`${API_BASE}/data-quality/audit`);
  return handleResponse<DataQualityAuditLog[]>(res, 'Failed to fetch data quality audit log');
}

export async function fetchIndicatorDefinitions(): Promise<IndicatorDefinitionOut[]> {
  const res = await fetch(`${API_BASE}/data-quality/indicators`);
  return handleResponse<IndicatorDefinitionOut[]>(res, 'Failed to fetch indicator definitions');
}

export async function ingestObservation(obs: {
  astronaut_id: string;
  indicator_key: string;
  value: number;
  unit: string;
  observation_time: string;
  data_origin?: string;
  provenance_ref?: string;
}): Promise<IngestionResponse> {
  const res = await fetch(`${API_BASE}/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observations: [obs] }),
  });
  return handleResponse<IngestionResponse>(res, 'Failed to ingest observation');
}

export async function fetchMissingDataGaps(astronautId: string, days: number = 7): Promise<MissingDataGapsResponse> {
  const res = await fetch(`${API_BASE}/data-quality/gaps?astronaut_id=${astronautId}&days=${days}`);
  return handleResponse<MissingDataGapsResponse>(res, 'Failed to fetch missing data gaps');
}
