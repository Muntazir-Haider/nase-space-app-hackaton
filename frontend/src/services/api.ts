import { 
  AstronautSummary, 
  HealthCheckResponse, 
  ScenarioLoadResponse,
  AstronautTimelineResponse,
  DeteriorationAlert,
  AlertEvidenceDetail,
  DataQualityAuditLog,
} from '../types';

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Failed to fetch health check: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAstronauts(): Promise<AstronautSummary[]> {
  const res = await fetch(`${API_BASE}/astronauts`);
  if (!res.ok) {
    throw new Error(`Failed to fetch astronauts roster: ${res.statusText}`);
  }
  return res.json();
}

export async function loadDemoScenario(scenarioKey: string): Promise<ScenarioLoadResponse> {
  const res = await fetch(`${API_BASE}/scenarios/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_key: scenarioKey }),
  });
  if (!res.ok) {
    throw new Error(`Failed to load scenario: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAstronautTimeline(astronautId: string): Promise<AstronautTimelineResponse> {
  const res = await fetch(`${API_BASE}/astronauts/${astronautId}/timeline`);
  if (!res.ok) {
    throw new Error(`Failed to fetch timeline: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAlerts(astronautId?: string): Promise<DeteriorationAlert[]> {
  const url = astronautId ? `${API_BASE}/alerts?astronaut_id=${astronautId}` : `${API_BASE}/alerts`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAlertEvidence(alertId: string): Promise<AlertEvidenceDetail> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/evidence`);
  if (!res.ok) {
    throw new Error(`Failed to fetch alert evidence: ${res.statusText}`);
  }
  return res.json();
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
  if (!res.ok) {
    throw new Error(`Failed to update alert status: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDataQualityAudit(): Promise<DataQualityAuditLog[]> {
  const res = await fetch(`${API_BASE}/data-quality/audit`);
  if (!res.ok) {
    throw new Error(`Failed to fetch audit log: ${res.statusText}`);
  }
  return res.json();
}
