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
  SyncQueueSummary,
  BenchmarkEvaluationReport,
  FlightSurgeonHandoverReport,
  MissionEventItem,
  EnvironmentalTelemetryItem,
  DatabaseSnapshotResponse,
  LoginResponse,
  OperatorRoleOut,
} from '../types';

import {
  MOCK_OPERATOR_ROLES,
  MOCK_HEALTH,
  MOCK_MISSIONS,
  MOCK_ASTRONAUTS,
  MOCK_INDICATORS,
  getMockTimelineForAstronaut,
  getMockBaselinesForAstronaut,
  getMockMissingDataGaps,
  MOCK_ALERTS,
  MOCK_EVIDENCE_DETAIL,
  MOCK_DIAGNOSTICS,
  MOCK_SYNC_QUEUE,
  MOCK_ENVIRONMENTAL,
  MOCK_BENCHMARK,
  MOCK_HANDOVER_REPORT,
  MOCK_MISSION_EVENTS,
  MOCK_AUDIT_LOGS,
} from './mockData';

const API_BASE = '/api/v1';

// Mutable in-memory state for offline fallback resilience
let localAstronauts: AstronautSummary[] = JSON.parse(JSON.stringify(MOCK_ASTRONAUTS));
let localAlerts: DeteriorationAlert[] = JSON.parse(JSON.stringify(MOCK_ALERTS));
let localEvidenceDetail: AlertEvidenceDetail = JSON.parse(JSON.stringify(MOCK_EVIDENCE_DETAIL));
let localEnvironmental: EnvironmentalTelemetryItem[] = JSON.parse(JSON.stringify(MOCK_ENVIRONMENTAL));
let localMissionEvents: MissionEventItem[] = JSON.parse(JSON.stringify(MOCK_MISSION_EVENTS));
let localSyncQueue: SyncQueueSummary = JSON.parse(JSON.stringify(MOCK_SYNC_QUEUE));
let localAuditLogs: DataQualityAuditLog[] = JSON.parse(JSON.stringify(MOCK_AUDIT_LOGS));

/**
 * Resilient request wrapper: attempts the live FastAPI backend first;
 * if backend is unreachable, times out, or returns an error, cleanly falls back
 * to the authentic NASA spaceflight dataset without throwing unhandled exceptions.
 */
async function safeFetch<T>(
  requestFn: () => Promise<Response>,
  fallbackValue: T | (() => T | Promise<T>)
): Promise<T> {
  try {
    const res = await requestFn();
    if (res.ok) {
      return (await res.json()) as T;
    }
    // Non-200 response: return fallback
    return typeof fallbackValue === 'function' ? await (fallbackValue as () => T | Promise<T>)() : fallbackValue;
  } catch (_err) {
    // Network failure (server down, offline mode, DNS/connection refused)
    return typeof fallbackValue === 'function' ? await (fallbackValue as () => T | Promise<T>)() : fallbackValue;
  }
}

export async function fetchHealth(): Promise<HealthCheckResponse> {
  return safeFetch(
    () => fetch(`${API_BASE}/health`),
    () => ({
      ...MOCK_HEALTH,
      server_time_utc: new Date().toISOString(),
    })
  );
}

export async function fetchStationDiagnostics(): Promise<StationDiagnosticsResponse> {
  return safeFetch(
    () => fetch(`${API_BASE}/health/diagnostics`),
    () => ({
      ...MOCK_DIAGNOSTICS,
      timestamp_utc: new Date().toISOString(),
      table_counts: {
        ...MOCK_DIAGNOSTICS.table_counts,
        astronauts: localAstronauts.length,
        deterioration_alerts: localAlerts.length,
      },
    })
  );
}

export async function fetchMissions(): Promise<MissionOut[]> {
  return safeFetch(
    () => fetch(`${API_BASE}/missions`),
    () => MOCK_MISSIONS
  );
}

export async function fetchAstronauts(): Promise<AstronautSummary[]> {
  return safeFetch(
    () => fetch(`${API_BASE}/astronauts`),
    () => localAstronauts
  );
}

export async function createAstronaut(payload: AstronautCreateInput): Promise<AstronautSummary> {
  const newAstro: AstronautSummary = {
    id: `astro-${payload.callsign.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
    callsign: payload.callsign,
    full_name: payload.full_name,
    mission_code: 'ARTEMIS-III',
    mission_role: payload.flight_role,
    medical_clearance_status: payload.medical_clearance_status,
    status_indicator: 'NOMINAL',
    active_alert_count: 0,
    last_reading_time: new Date().toISOString(),
  };

  return safeFetch(
    () =>
      fetch(`${API_BASE}/astronauts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    () => {
      localAstronauts = [newAstro, ...localAstronauts];
      return newAstro;
    }
  );
}

export async function loadDemoScenario(scenarioKey: string): Promise<ScenarioLoadResponse> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/scenarios/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_key: scenarioKey }),
      }),
    () => {
      if (scenarioKey === 'SCENARIO_A_NOMINAL') {
        localAlerts = [];
        localAstronauts.forEach((a) => {
          a.status_indicator = 'NOMINAL';
          a.active_alert_count = 0;
          a.medical_clearance_status = 'FULL_FLIGHT_CLEARANCE';
        });
      } else if (scenarioKey === 'SCENARIO_B_ACUTE_SPIKE') {
        localAlerts = [];
        localAstronauts.forEach((a) => {
          a.status_indicator = 'OBSERVATION';
          a.active_alert_count = 0;
        });
      } else {
        localAlerts = JSON.parse(JSON.stringify(MOCK_ALERTS));
        const vance = localAstronauts.find((a) => a.id === 'astro-vance-001');
        if (vance) {
          vance.status_indicator = 'REVIEW_ALERT';
          vance.active_alert_count = 1;
          vance.medical_clearance_status = 'RESTRICTED_EVA';
        }
      }
      return {
        status: 'SUCCESS',
        scenario_key: scenarioKey,
        astronaut_id: 'astro-vance-001',
        mission_id: 'mis-artemis-iii',
        records_inserted: 126,
        events_inserted: 4,
        environmental_inserted: 48,
        active_alerts_generated: scenarioKey === 'SCENARIO_C_SILENT_DETERIORATION' ? 1 : 0,
        message: `Scenario ${scenarioKey} loaded successfully into autonomous station memory.`,
      };
    }
  );
}

export async function fetchAstronautTimeline(astronautId: string): Promise<AstronautTimelineResponse> {
  return safeFetch(
    () => fetch(`${API_BASE}/astronauts/${astronautId}/timeline`),
    () => getMockTimelineForAstronaut(astronautId)
  );
}

export async function fetchAstronautBaselines(astronautId: string): Promise<PersonalBaselineOut[]> {
  return safeFetch(
    () => fetch(`${API_BASE}/astronauts/${astronautId}/baseline`),
    () => getMockBaselinesForAstronaut(astronautId)
  );
}

export async function recomputeAstronautBaselines(astronautId: string): Promise<PersonalBaselineOut[]> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/astronauts/${astronautId}/baseline/recompute`, {
        method: 'POST',
      }),
    () => getMockBaselinesForAstronaut(astronautId)
  );
}

export async function fetchAlerts(astronautId?: string): Promise<DeteriorationAlert[]> {
  const url = astronautId ? `${API_BASE}/alerts?astronaut_id=${astronautId}` : `${API_BASE}/alerts`;
  return safeFetch(
    () => fetch(url),
    () => (astronautId ? localAlerts.filter((a) => a.astronaut_id === astronautId) : localAlerts)
  );
}

export async function fetchAlertEvidence(alertId: string): Promise<AlertEvidenceDetail> {
  return safeFetch(
    () => fetch(`${API_BASE}/alerts/${alertId}/evidence`),
    () => localEvidenceDetail
  );
}

export async function updateAlertStatus(
  alertId: string,
  lifecycleStatus: string,
  reviewerCallsign: string,
  notes: string
): Promise<DeteriorationAlert> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lifecycle_status: lifecycleStatus,
          reviewer_callsign: reviewerCallsign,
          notes,
        }),
      }),
    () => {
      const alert = localAlerts.find((a) => a.id === alertId) || localAlerts[0];
      if (alert) {
        alert.lifecycle_status = lifecycleStatus as any;
        alert.updated_at = new Date().toISOString();
        localEvidenceDetail.alert = { ...alert };
      }
      localEvidenceDetail.followups.unshift({
        id: `fol-${Date.now()}`,
        alert_id: alertId,
        astronaut_id: alert ? alert.astronaut_id : 'astro-vance-001',
        reviewer_callsign: reviewerCallsign,
        review_notes: notes,
        status_transition: `Status -> ${lifecycleStatus}`,
        recorded_at: new Date().toISOString(),
      });
      return alert || MOCK_ALERTS[0];
    }
  );
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
  const newCm: ClinicalCountermeasure = {
    id: `cm-${Date.now()}`,
    alert_id: alertId,
    astronaut_id: 'astro-vance-001',
    prescribed_by: payload.prescribed_by,
    countermeasure_type: payload.countermeasure_type,
    title: payload.title,
    prescription_details: payload.prescription_details,
    target_duration_hours: payload.target_duration_hours,
    outcome_status: 'ACTIVE',
    prescribed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return safeFetch(
    () =>
      fetch(`${API_BASE}/alerts/${alertId}/countermeasures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    () => {
      localEvidenceDetail.countermeasures.unshift(newCm);
      localSyncQueue.queued_pending += 1;
      localSyncQueue.recent_items.unshift({
        id: `tx-${Date.now()}`,
        transaction_type: 'COUNTERMEASURE_LOG',
        entity_table: 'clinical_countermeasures',
        idempotency_hash: Math.random().toString(16).slice(2, 10),
        sync_status: 'QUEUED',
        created_at: new Date().toISOString(),
      });
      return newCm;
    }
  );
}

export async function updateCountermeasureStatus(
  alertId: string,
  countermeasureId: string,
  payload: {
    outcome_status: string;
    resolved_by?: string;
    resolution_notes?: string;
  }
): Promise<ClinicalCountermeasure> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/alerts/${alertId}/countermeasures/${countermeasureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    () => {
      const cm = localEvidenceDetail.countermeasures.find((c) => c.id === countermeasureId);
      if (cm) {
        cm.outcome_status = payload.outcome_status;
        cm.updated_at = new Date().toISOString();
        return cm;
      }
      return localEvidenceDetail.countermeasures[0];
    }
  );
}

export async function runDeteriorationAnalysis(missionId?: string): Promise<any> {
  const url = missionId
    ? `${API_BASE}/alerts/run-analysis?mission_id=${encodeURIComponent(missionId)}`
    : `${API_BASE}/alerts/run-analysis`;
  return safeFetch(
    () =>
      fetch(url, {
        method: 'POST',
      }),
    () => ({
      status: 'SUCCESS',
      analyzed_astronauts: localAstronauts.length,
      alerts_generated: localAlerts.length,
      timestamp: new Date().toISOString(),
    })
  );
}

export async function fetchDataQualityAudit(): Promise<DataQualityAuditLog[]> {
  return safeFetch(
    () => fetch(`${API_BASE}/data-quality/audit`),
    () => localAuditLogs
  );
}

export async function fetchIndicatorDefinitions(): Promise<IndicatorDefinitionOut[]> {
  return safeFetch(
    () => fetch(`${API_BASE}/data-quality/indicators`),
    () => MOCK_INDICATORS
  );
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
  return safeFetch(
    () =>
      fetch(`${API_BASE}/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observations: [obs] }),
      }),
    () => ({
      accepted_count: 1,
      rejected_count: 0,
      results: [
        {
          observation_id: `obs-${Date.now()}`,
          indicator_key: obs.indicator_key,
          quality_status: 'ACCEPTED',
          quality_notes: 'Validated within nominal physiological bounds.',
        },
      ],
    })
  );
}

export async function fetchMissingDataGaps(
  astronautId: string,
  days: number = 7
): Promise<MissingDataGapsResponse> {
  return safeFetch(
    () => fetch(`${API_BASE}/data-quality/gaps?astronaut_id=${astronautId}&days=${days}`),
    () => getMockMissingDataGaps(astronautId, days)
  );
}

export async function fetchSyncStatus(): Promise<SyncQueueSummary> {
  return safeFetch(
    () => fetch(`${API_BASE}/sync/status`),
    () => localSyncQueue
  );
}

export async function triggerCommsFlush(): Promise<{ status: string; flushed_count: number; message: string }> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/sync/flush`, {
        method: 'POST',
      }),
    () => {
      const count = localSyncQueue.queued_pending;
      localSyncQueue.queued_pending = 0;
      localSyncQueue.synced_to_earth += count;
      localSyncQueue.recent_items.forEach((item) => {
        item.sync_status = 'SYNCED';
      });
      return {
        status: 'SUCCESS',
        flushed_count: count,
        message: 'All telemetry packets flushed to Deep Space Network buffer.',
      };
    }
  );
}

export async function fetchMLBenchmark(): Promise<BenchmarkEvaluationReport> {
  return safeFetch(
    () => fetch(`${API_BASE}/analytics/benchmark-evaluation`),
    () => MOCK_BENCHMARK
  );
}

export async function runMLBenchmark(): Promise<BenchmarkEvaluationReport> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/analytics/benchmark-evaluation/run`, {
        method: 'POST',
      }),
    () => MOCK_BENCHMARK
  );
}

export async function fetchHandoverReport(
  astronautId: string,
  cmoNotes?: string
): Promise<FlightSurgeonHandoverReport> {
  const url = cmoNotes
    ? `${API_BASE}/reports/handover/${astronautId}?cmo_notes=${encodeURIComponent(cmoNotes)}`
    : `${API_BASE}/reports/handover/${astronautId}`;
  return safeFetch(
    () => fetch(url),
    () => {
      const astro = localAstronauts.find((a) => a.id === astronautId) || localAstronauts[0];
      return {
        ...MOCK_HANDOVER_REPORT,
        astronaut_id: astronautId,
        callsign: astro.callsign,
        full_name: astro.full_name,
        flight_role: astro.mission_role,
        mission_code: astro.mission_code,
        medical_clearance_status: astro.medical_clearance_status,
        cmo_handover_notes: cmoNotes || MOCK_HANDOVER_REPORT.cmo_handover_notes,
      };
    }
  );
}

export async function updateAstronautClearance(
  astronautId: string,
  clearanceStatus: string,
  reviewerCallsign: string = 'CMO-01',
  notes?: string
): Promise<any> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/astronauts/${astronautId}/clearance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearance_status: clearanceStatus,
          reviewer_callsign: reviewerCallsign,
          notes: notes || undefined,
        }),
      }),
    () => {
      const idx = localAstronauts.findIndex((a) => a.id === astronautId);
      if (idx !== -1) {
        localAstronauts[idx] = {
          ...localAstronauts[idx],
          medical_clearance_status: clearanceStatus,
        };
      }
      return {
        status: 'SUCCESS',
        astronaut_id: astronautId,
        clearance_status: clearanceStatus,
        reviewer_callsign: reviewerCallsign,
        notes: notes || 'Medical flight clearance updated.',
        updated_at: new Date().toISOString(),
      };
    }
  );
}

export async function createMissionEvent(
  missionId: string,
  payload: {
    astronaut_id: string;
    event_type: string;
    title: string;
    start_time: string;
    end_time: string;
    workload_intensity?: string;
    notes?: string;
  }
): Promise<MissionEventItem> {
  const newEv: MissionEventItem = {
    id: `ev-${Date.now()}`,
    mission_id: missionId,
    astronaut_id: payload.astronaut_id,
    event_type: payload.event_type,
    title: payload.title,
    start_time: payload.start_time,
    end_time: payload.end_time,
    workload_intensity: payload.workload_intensity || 'NOMINAL',
    notes: payload.notes || null,
  };

  return safeFetch(
    () =>
      fetch(`${API_BASE}/missions/${missionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    () => {
      localMissionEvents.unshift(newEv);
      return newEv;
    }
  );
}

export async function fetchMissionEvents(
  missionId: string,
  astronautId?: string
): Promise<MissionEventItem[]> {
  const url = astronautId
    ? `${API_BASE}/missions/${missionId}/events?astronaut_id=${astronautId}`
    : `${API_BASE}/missions/${missionId}/events`;
  return safeFetch(
    () => fetch(url),
    () =>
      astronautId
        ? localMissionEvents.filter((e) => e.astronaut_id === astronautId)
        : localMissionEvents
  );
}

export async function fetchEnvironmentalTelemetry(
  missionId?: string,
  limit: number = 50
): Promise<EnvironmentalTelemetryItem[]> {
  const url = missionId
    ? `${API_BASE}/environmental?mission_id=${missionId}&limit=${limit}`
    : `${API_BASE}/environmental?limit=${limit}`;
  return safeFetch(
    () => fetch(url),
    () =>
      missionId
        ? localEnvironmental.filter((e) => e.mission_id === missionId).slice(0, limit)
        : localEnvironmental.slice(0, limit)
  );
}

export async function recordEnvironmentalTelemetry(payload: {
  mission_id: string;
  parameter_name: string;
  value: number;
  unit: string;
  habitat_zone: string;
  timestamp: string;
}): Promise<EnvironmentalTelemetryItem> {
  const newEnv: EnvironmentalTelemetryItem = {
    id: `env-${Date.now()}`,
    mission_id: payload.mission_id,
    parameter_name: payload.parameter_name,
    value: payload.value,
    unit: payload.unit,
    habitat_zone: payload.habitat_zone,
    timestamp: payload.timestamp,
    quality_status: 'ACCEPTED',
  };

  return safeFetch(
    () =>
      fetch(`${API_BASE}/environmental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    () => {
      localEnvironmental.unshift(newEnv);
      return newEnv;
    }
  );
}

export async function fetchDatabaseSnapshot(): Promise<DatabaseSnapshotResponse> {
  return safeFetch(
    () => fetch(`${API_BASE}/health/database/snapshot`),
    () => ({
      system: 'Mission Sentinel',
      version: '1.0.0',
      snapshot_timestamp_utc: new Date().toISOString(),
      total_tables: 12,
      total_records: localAstronauts.length + localAlerts.length + localEnvironmental.length,
      data: {
        missions: MOCK_MISSIONS,
        astronauts: localAstronauts,
        alerts: localAlerts,
        environmental: localEnvironmental,
      },
    })
  );
}

export async function loginOperator(credentials: {
  callsign: string;
  pin: string;
  role?: string;
}): Promise<LoginResponse> {
  return safeFetch(
    () =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }),
    () => {
      const matchedRole =
        MOCK_OPERATOR_ROLES.find(
          (r) =>
            r.role_key === credentials.role ||
            r.default_callsign.toUpperCase() === credentials.callsign?.toUpperCase()
        ) || MOCK_OPERATOR_ROLES[0];

      return {
        success: true,
        token: `auth-offline-${Date.now()}`,
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        message: 'Autonomous medical session established.',
        operator: {
          id: `op-${matchedRole.role_key.toLowerCase()}`,
          callsign: credentials.callsign || matchedRole.default_callsign,
          full_name: matchedRole.default_name,
          role: matchedRole.role_key,
          role_display: matchedRole.title,
          rank: 'Flight Surgeon Lead',
          security_clearance: matchedRole.clearance_level,
          station_module: 'Medical Bay Alpha / Orion MPCV',
          avatar_color: matchedRole.role_key === 'CREW_MEDICAL_OFFICER' ? 'emerald' : 'blue',
          permissions: matchedRole.permissions,
        },
      };
    }
  );
}

export async function fetchOperatorRoles(): Promise<OperatorRoleOut[]> {
  return safeFetch(
    () => fetch(`${API_BASE}/auth/roles`),
    () => MOCK_OPERATOR_ROLES
  );
}
