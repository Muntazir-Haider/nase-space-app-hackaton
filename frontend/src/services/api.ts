import { AstronautSummary, HealthCheckResponse, ScenarioLoadResponse } from '../types';

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
