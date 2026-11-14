import {
  AstronautSummary,
  HealthCheckResponse,
  AstronautTimelineResponse,
  DeteriorationAlert,
  AlertEvidenceDetail,
  DataQualityAuditLog,
  MissionOut,
  StationDiagnosticsResponse,
  IndicatorDefinitionOut,
  SyncQueueSummary,
  BenchmarkEvaluationReport,
  FlightSurgeonHandoverReport,
  EnvironmentalTelemetryItem,
  OperatorRoleOut,
  PersonalBaselineOut,
  MissingDataGapsResponse,
  MissionEventItem,
} from '../types';

export const MOCK_OPERATOR_ROLES: OperatorRoleOut[] = [
  {
    role_key: 'CREW_MEDICAL_OFFICER',
    title: 'Crew Medical Officer (CMO)',
    description: 'Autonomous flight physician with full clinical oversight and countermeasure authority.',
    default_callsign: 'ARTEMIS-CMO',
    default_name: 'Dr. Sarah Chen, MD',
    default_pin: '2026',
    clearance_level: 'LEVEL_4_CLINICAL',
    permissions: ['VIEW_TELEMETRY', 'LOG_VITALS', 'PRESCRIBE_COUNTERMEASURES', 'UPDATE_CLEARANCE'],
  },
  {
    role_key: 'FLIGHT_SURGEON',
    title: 'Flight Surgeon (Earth / Ground)',
    description: 'Mission Control flight surgeon conducting shift handovers and clinical reviews.',
    default_callsign: 'FLIGHT-SURGEON',
    default_name: 'Dr. Josef Weber, MD',
    default_pin: '1969',
    clearance_level: 'LEVEL_5_GROUND_CONTROL',
    permissions: ['VIEW_TELEMETRY', 'HANDOVER_REPORT', 'CLINICAL_AUDIT'],
  },
  {
    role_key: 'MISSION_SPECIALIST',
    title: 'Mission Specialist / Astronaut',
    description: 'Crew member access to personal daily vitals, sleep logs, and fitness metrics.',
    default_callsign: 'ASTRONAUT',
    default_name: 'Reid Wiseman, CDR',
    default_pin: '4242',
    clearance_level: 'LEVEL_3_CREW',
    permissions: ['VIEW_PERSONAL_TELEMETRY', 'LOG_SLEEP'],
  },
  {
    role_key: 'GUEST_OBSERVER',
    title: 'Judge / Evaluator',
    description: 'Evaluator and inspector access with all scenarios and diagnostic tools unlocked.',
    default_callsign: 'JUDGE-GUEST',
    default_name: 'NASA Space Apps Evaluator',
    default_pin: '0000',
    clearance_level: 'LEVEL_5_EVALUATOR',
    permissions: ['ALL_PERMISSIONS', 'RUN_BENCHMARKS', 'LOAD_SCENARIOS'],
  },
];

export const MOCK_HEALTH: HealthCheckResponse = {
  status: 'ONLINE',
  system: 'Mission Sentinel',
  version: '1.0.0',
  offline_storage_ready: true,
  database_file: 'sentinel.db',
  database_path: 'local/station/sentinel.db',
  database_size_bytes: 241664,
  sqlite_mode: 'WAL',
  foreign_keys_enforced: true,
  comms_latency: '22m 14s (One-Way Mars Sim)',
  active_role: 'CREW_MEDICAL_OFFICER',
  server_time_utc: new Date().toISOString(),
};

export const MOCK_MISSIONS: MissionOut[] = [
  {
    id: 'mis-artemis-iii',
    mission_code: 'ARTEMIS-III',
    name: 'Artemis III Lunar Surface Expedition',
    target_destination: 'LUNAR_SOUTH_POLE',
    spacecraft_module: 'ORION_MPC_V',
    flight_day: 14,
    comms_latency_seconds: 1334,
    status: 'ACTIVE',
    start_date: new Date(Date.now() - 13 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'mis-artemis-ii',
    mission_code: 'ARTEMIS-II',
    name: 'Artemis II Crewed Lunar Flyby',
    target_destination: 'LUNAR_ORBIT_FREE_RETURN',
    spacecraft_module: 'ORION_CM_002',
    flight_day: 8,
    comms_latency_seconds: 180,
    status: 'ACTIVE',
    start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'mis-iss-exp71',
    mission_code: 'ISS-EXP-71',
    name: 'International Space Station Expedition 71',
    target_destination: 'LOW_EARTH_ORBIT',
    spacecraft_module: 'ISS_HARMONY_NODE_2',
    flight_day: 124,
    comms_latency_seconds: 2,
    status: 'ACTIVE',
    start_date: new Date(Date.now() - 123 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 124 * 86400000).toISOString(),
  },
];

export const MOCK_ASTRONAUTS: AstronautSummary[] = [
  {
    id: 'astro-vance-001',
    callsign: 'ARTEMIS-01',
    full_name: 'Dr. Elena Vance',
    mission_code: 'ARTEMIS-III',
    mission_role: 'Commander & Medical Lead',
    medical_clearance_status: 'RESTRICTED_EVA',
    status_indicator: 'REVIEW_ALERT',
    active_alert_count: 1,
    last_reading_time: new Date().toISOString(),
  },
  {
    id: 'astro-thorne-002',
    callsign: 'ARTEMIS-02',
    full_name: 'Marcus Thorne',
    mission_code: 'ARTEMIS-III',
    mission_role: 'Pilot & Systems Specialist',
    medical_clearance_status: 'FULL_FLIGHT_CLEARANCE',
    status_indicator: 'NOMINAL',
    active_alert_count: 0,
    last_reading_time: new Date().toISOString(),
  },
  {
    id: 'astro-chen-003',
    callsign: 'ARTEMIS-03',
    full_name: 'Dr. Sarah Chen',
    mission_code: 'ARTEMIS-III',
    mission_role: 'Mission Specialist & Astrobiologist',
    medical_clearance_status: 'FULL_FLIGHT_CLEARANCE',
    status_indicator: 'NOMINAL',
    active_alert_count: 0,
    last_reading_time: new Date().toISOString(),
  },
  {
    id: 'astro-wiseman-004',
    callsign: 'ARTEMIS-II-01',
    full_name: 'Reid Wiseman',
    mission_code: 'ARTEMIS-II',
    mission_role: 'Commander',
    medical_clearance_status: 'FULL_FLIGHT_CLEARANCE',
    status_indicator: 'NOMINAL',
    active_alert_count: 0,
    last_reading_time: new Date().toISOString(),
  },
  {
    id: 'astro-glover-005',
    callsign: 'ARTEMIS-II-02',
    full_name: 'Victor Glover',
    mission_code: 'ARTEMIS-II',
    mission_role: 'Pilot',
    medical_clearance_status: 'FULL_FLIGHT_CLEARANCE',
    status_indicator: 'NOMINAL',
    active_alert_count: 0,
    last_reading_time: new Date().toISOString(),
  },
  {
    id: 'astro-koch-006',
    callsign: 'ARTEMIS-II-03',
    full_name: 'Christina Koch',
    mission_code: 'ARTEMIS-II',
    mission_role: 'Mission Specialist 1',
    medical_clearance_status: 'FULL_FLIGHT_CLEARANCE',
    status_indicator: 'NOMINAL',
    active_alert_count: 0,
    last_reading_time: new Date().toISOString(),
  },
  {
    id: 'astro-moghbeli-007',
    callsign: 'EXP71-CDR',
    full_name: 'Dr. Jasmin Moghbeli',
    mission_code: 'ISS-EXP-71',
    mission_role: 'Expedition 71 Commander',
    medical_clearance_status: 'FULL_FLIGHT_CLEARANCE',
    status_indicator: 'NOMINAL',
    active_alert_count: 0,
    last_reading_time: new Date().toISOString(),
  },
];

export const MOCK_INDICATORS: IndicatorDefinitionOut[] = [
  {
    id: 'ind-rhr-001',
    indicator_key: 'RESTING_HEART_RATE',
    category: 'CARDIOVASCULAR',
    display_name: 'Resting Heart Rate',
    standard_unit: 'bpm',
    nominal_min: 50.0,
    nominal_max: 80.0,
    critical_min: 40.0,
    critical_max: 130.0,
    sampling_frequency_hours: 24,
    nasa_hrp_reference: 'NASA HRP Risk of Cardiovascular Deconditioning (HRR-CV-01)',
    description: 'Daily resting pulse measured post-sleep to detect cephalad fluid shift compensation.',
  },
  {
    id: 'ind-sleep-002',
    indicator_key: 'SLEEP_DURATION',
    category: 'CIRCADIAN',
    display_name: 'Sleep Duration',
    standard_unit: 'hours',
    nominal_min: 6.5,
    nominal_max: 9.0,
    critical_min: 3.5,
    critical_max: 12.0,
    sampling_frequency_hours: 24,
    nasa_hrp_reference: 'NASA HRP Risk of Performance Decrements from Sleep Loss (HRR-SLEEP-02)',
    description: 'Actigraphy sleep duration assessing circadian integrity and cumulative sleep debt.',
  },
  {
    id: 'ind-hrr-003',
    indicator_key: 'HEART_RATE_RECOVERY_1MIN',
    category: 'AUTONOMIC',
    display_name: '1-Min Post-Exercise Heart Rate Recovery',
    standard_unit: 'bpm drop',
    nominal_min: 25.0,
    nominal_max: 55.0,
    critical_min: 10.0,
    critical_max: 75.0,
    sampling_frequency_hours: 24,
    nasa_hrp_reference: 'NASA HRP Exercise Countermeasure Protocol (HRR-EXERCISE-03)',
    description: 'Heart rate decrease 60 seconds post ARED countermeasure indicating vagal reactivation.',
  },
  {
    id: 'ind-spo2-004',
    indicator_key: 'BLOOD_OXYGEN_SPO2',
    category: 'RESPIRATORY',
    display_name: 'Blood Oxygen Saturation (SpO₂)',
    standard_unit: '%',
    nominal_min: 94.0,
    nominal_max: 100.0,
    critical_min: 88.0,
    critical_max: 100.0,
    sampling_frequency_hours: 24,
    nasa_hrp_reference: 'NASA Spacecraft Life Support Standard (JSC-65828)',
    description: 'Peripheral pulse oximetry monitoring arterial oxygenation under cabin atmosphere.',
  },
  {
    id: 'ind-temp-005',
    indicator_key: 'CORE_BODY_TEMP',
    category: 'THERMAL',
    display_name: 'Core Body Temperature',
    standard_unit: '°C',
    nominal_min: 36.2,
    nominal_max: 37.4,
    critical_min: 35.0,
    critical_max: 39.0,
    sampling_frequency_hours: 24,
    nasa_hrp_reference: 'NASA EVA Thermal Stress and Spaceflight Thermoregulation Standard',
    description: 'Continuous ingestible core sensor detecting circadian rhythm peak phase shifts.',
  },
];

export function getMockTimelineForAstronaut(astronautId: string): AstronautTimelineResponse {
  const isVance = astronautId === 'astro-vance-001';
  const now = new Date();

  const rhrBaseline = { mean: 62.4, std_dev: 2.1, status: 'ACTIVE' };
  const sleepBaseline = { mean: 7.5, std_dev: 0.35, status: 'ACTIVE' };
  const hrrBaseline = { mean: 34.2, std_dev: 2.8, status: 'ACTIVE' };

  const points = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const timestamp = d.toISOString();
    const flightDay = 14 - i;

    let rhr = 62.0 + Math.sin(flightDay) * 0.8;
    let sleep = 7.4 + Math.cos(flightDay) * 0.2;
    let hrr = 34.0 + Math.sin(flightDay * 0.5) * 1.0;
    let co2 = 1200 + Math.floor(Math.sin(flightDay) * 150);
    const rad = 240 + flightDay * 4;
    const events: string[] = [];

    if (flightDay === 7) {
      events.push('Baseline Calibration Complete');
    }

    if (isVance) {
      if (flightDay === 8) {
        events.push('EVA Sortie Alpha (6h Egress)');
      }
      if (flightDay === 9) {
        events.push('Regolith Sample Processing');
      }
      if (flightDay >= 9) {
        const drift = flightDay - 8;
        rhr = 62.4 + drift * 1.15 + (Math.random() * 0.3 - 0.15);
        sleep = 7.5 - drift * 0.38 + (Math.random() * 0.2 - 0.1);
        hrr = 34.2 - drift * 1.8 + (Math.random() * 0.4 - 0.2);
        co2 = 2800 + drift * 220;
      }
      if (flightDay === 12) {
        events.push('CMO Clinical Countermeasure Prescribed');
      }
    } else {
      if (flightDay === 6) {
        events.push('ARED Resistance Session');
      }
      if (flightDay === 10) {
        events.push('Robotics Transect Inspection');
      }
    }

    const rhrZ = (rhr - rhrBaseline.mean) / rhrBaseline.std_dev;
    const sleepZ = (sleep - sleepBaseline.mean) / sleepBaseline.std_dev;
    const hrrZ = (hrr - hrrBaseline.mean) / hrrBaseline.std_dev;

    points.push({
      date: dateStr,
      timestamp,
      rhr_value: Number(rhr.toFixed(1)),
      sleep_value: Number(sleep.toFixed(2)),
      hrr_value: Number(hrr.toFixed(1)),
      cabin_co2_ppm: co2,
      radiation_usv: rad,
      mission_events: events,
      rhr_z_score: Number(rhrZ.toFixed(2)),
      sleep_z_score: Number(sleepZ.toFixed(2)),
      hrr_z_score: Number(hrrZ.toFixed(2)),
    });
  }

  const astro = MOCK_ASTRONAUTS.find(a => a.id === astronautId) || MOCK_ASTRONAUTS[0];

  return {
    astronaut_id: astronautId,
    callsign: astro.callsign,
    full_name: astro.full_name,
    window_days: 14,
    baselines: {
      RESTING_HEART_RATE: rhrBaseline,
      SLEEP_DURATION: sleepBaseline,
      HEART_RATE_RECOVERY_1MIN: hrrBaseline,
    },
    timeline_points: points,
  };
}

export function getMockBaselinesForAstronaut(astronautId: string): PersonalBaselineOut[] {
  return [
    {
      id: `base-rhr-${astronautId}`,
      astronaut_id: astronautId,
      indicator_id: 'ind-rhr-001',
      indicator_key: 'RESTING_HEART_RATE',
      window_start: new Date(Date.now() - 14 * 86400000).toISOString(),
      window_end: new Date(Date.now() - 7 * 86400000).toISOString(),
      sample_count: 7,
      mean: 62.4,
      median: 62.0,
      std_dev: 2.1,
      status: 'ACTIVE',
      version: 1,
      calculated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: `base-sleep-${astronautId}`,
      astronaut_id: astronautId,
      indicator_id: 'ind-sleep-002',
      indicator_key: 'SLEEP_DURATION',
      window_start: new Date(Date.now() - 14 * 86400000).toISOString(),
      window_end: new Date(Date.now() - 7 * 86400000).toISOString(),
      sample_count: 7,
      mean: 7.5,
      median: 7.6,
      std_dev: 0.35,
      status: 'ACTIVE',
      version: 1,
      calculated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: `base-hrr-${astronautId}`,
      astronaut_id: astronautId,
      indicator_id: 'ind-hrr-003',
      indicator_key: 'HEART_RATE_RECOVERY_1MIN',
      window_start: new Date(Date.now() - 14 * 86400000).toISOString(),
      window_end: new Date(Date.now() - 7 * 86400000).toISOString(),
      sample_count: 7,
      mean: 34.2,
      median: 34.0,
      std_dev: 2.8,
      status: 'ACTIVE',
      version: 1,
      calculated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];
}

export function getMockMissingDataGaps(astronautId: string, days: number = 7): MissingDataGapsResponse {
  return {
    astronaut_id: astronautId,
    window_days: days,
    missing_gaps_count: 0,
    gaps: [],
  };
}

export const MOCK_ALERTS: DeteriorationAlert[] = [
  {
    id: 'alt-silent-001',
    astronaut_id: 'astro-vance-001',
    review_priority: 'HIGH',
    pattern_type: 'MULTIVARIATE_DRIFT',
    lifecycle_status: 'UNDER_REVIEW',
    window_start: new Date(Date.now() - 6 * 86400000).toISOString(),
    window_end: new Date().toISOString(),
    detection_narrative:
      'Autonomic deterioration detected post-EVA. Resting Heart Rate rose from 62.4 to 68.9 bpm (OLS slope +1.12 bpm/day, p < 0.01). Sleep duration dropped to 5.2 hrs/day with delayed cardiac recovery post-ARED exercise.',
    math_summary:
      'OLS Beta = +1.12 bpm/day (R² = 0.94); Combined Multivariate Mahalanobis Z = 6.95; Persistence = 4 consecutive days beyond personal 2.0-sigma baseline threshold.',
    mission_context_notes:
      'Preceded by 6.2-hour lunar south pole surface EVA on Flight Day 8 with elevated metabolic workload (350 kcal/hr).',
    environmental_context_notes:
      'Airlock scrubber maintenance delayed. Cabin CO2 elevated to 3,450 ppm during the deterioration window.',
    scientific_ref: 'NASA HRP Human Research Roadmap HRR-CV-01 / HRR-SLEEP-02',
    rule_version: 'NASA-AMO-2026.4',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_EVIDENCE_DETAIL: AlertEvidenceDetail = {
  alert: MOCK_ALERTS[0],
  astronaut_callsign: 'ARTEMIS-01',
  astronaut_full_name: 'Dr. Elena Vance',
  flight_role: 'Commander & Medical Lead',
  medical_clearance_status: 'RESTRICTED_EVA',
  evidence_items: [
    {
      id: 'evi-001',
      alert_id: 'alt-silent-001',
      evidence_type: 'TREND_DRIFT',
      metric_name: 'RESTING_HEART_RATE',
      observed_value: 68.9,
      baseline_mean: 62.4,
      z_score: 3.1,
      ols_slope: 1.12,
      contribution_summary: '4-day persistent upward elevation above personal baseline mean (+6.5 bpm over 6 days).',
    },
    {
      id: 'evi-002',
      alert_id: 'alt-silent-001',
      evidence_type: 'DEFICIT_TREND',
      metric_name: 'SLEEP_DURATION',
      observed_value: 5.2,
      baseline_mean: 7.5,
      z_score: -3.4,
      ols_slope: -0.38,
      contribution_summary: 'Cumulative sleep debt of 7.2 hours over past 4 flight days.',
    },
    {
      id: 'evi-003',
      alert_id: 'alt-silent-001',
      evidence_type: 'RECOVERY_BLUNTING',
      metric_name: 'HEART_RATE_RECOVERY_1MIN',
      observed_value: 24.5,
      baseline_mean: 34.2,
      z_score: -3.5,
      ols_slope: -1.8,
      contribution_summary: 'Delayed parasympathetic reactivation post-countermeasure exercise.',
    },
    {
      id: 'evi-004',
      alert_id: 'alt-silent-001',
      evidence_type: 'ENVIRONMENTAL_COMPOUND',
      metric_name: 'CABIN_CO2_PPM',
      observed_value: 3450,
      baseline_mean: 1200,
      z_score: 4.8,
      ols_slope: 220,
      contribution_summary: 'Life support airlock scrubber saturation compound stressor.',
    },
  ],
  countermeasures: [
    {
      id: 'cm-001',
      alert_id: 'alt-silent-001',
      astronaut_id: 'astro-vance-001',
      prescribed_by: 'ARTEMIS-CMO',
      countermeasure_type: 'SLEEP_SCHEDULE_ADJUSTMENT',
      title: 'Mandatory 60-Minute Sleep Window Extension',
      prescription_details:
        'Extend daily sleep opportunity to 8.5 hours. Postpone non-critical maintenance tasks to allow recovery.',
      target_duration_hours: 48,
      outcome_status: 'ACTIVE',
      prescribed_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  followups: [
    {
      id: 'fol-001',
      alert_id: 'alt-silent-001',
      astronaut_id: 'astro-vance-001',
      reviewer_callsign: 'ARTEMIS-CMO',
      review_notes: 'Reviewed 4-day OLS slope. Countermeasure prescribed. EVA qualification placed on temporary hold.',
      status_transition: 'NEW -> UNDER_REVIEW',
      recorded_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

export const MOCK_DIAGNOSTICS: StationDiagnosticsResponse = {
  station_status: 'HEALTHY',
  database_file: 'sentinel.db',
  database_size_bytes: 241664,
  table_counts: {
    missions: 3,
    astronauts: 7,
    indicator_definitions: 5,
    health_observations: 1284,
    personal_baselines: 21,
    deterioration_alerts: 1,
    alert_evidence_links: 4,
    clinical_countermeasures: 1,
    cmo_followups: 1,
    mission_events: 18,
    environmental_telemetry: 420,
    offline_sync_queue: 3,
  },
  total_records: 1766,
  sqlite_journal_mode: 'WAL',
  timestamp_utc: new Date().toISOString(),
};

export const MOCK_SYNC_QUEUE: SyncQueueSummary = {
  total_transactions: 14,
  queued_pending: 3,
  synced_to_earth: 11,
  failed_retries: 0,
  comms_mode: 'DEEP_SPACE_STORE_AND_FORWARD',
  latency_simulation: '22m 14s One-Way Mars Analog Delay',
  recent_items: [
    {
      id: 'tx-001',
      transaction_type: 'COUNTERMEASURE_LOG',
      entity_table: 'clinical_countermeasures',
      idempotency_hash: 'c8f49a21b3e6d87a',
      sync_status: 'QUEUED',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'tx-002',
      transaction_type: 'ALERT_ACKNOWLEDGEMENT',
      entity_table: 'cmo_followups',
      idempotency_hash: '9e7b2a14f6d3c85a',
      sync_status: 'QUEUED',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'tx-003',
      transaction_type: 'CLEARANCE_UPDATE',
      entity_table: 'astronaut_profiles',
      idempotency_hash: '5a1b3c9d7e8f2042',
      sync_status: 'QUEUED',
      created_at: new Date(Date.now() - 10800000).toISOString(),
    },
  ],
};

export const MOCK_AUDIT_LOGS: DataQualityAuditLog[] = [
  {
    id: 'aud-001',
    source_type: 'FLIGHT_SUIT_TELEMETRY',
    raw_payload_blob: '{"rhr": 248, "sensor_id": "SUIT_04_ECG", "flag": "OUT_OF_BOUNDS"}',
    astronaut_id: 'astro-vance-001',
    indicator_key: 'RESTING_HEART_RATE',
    error_code: 'ERR_CRITICAL_PHYS_RANGE',
    rejection_reason: 'Heart rate reading (248 bpm) exceeded critical physiological threshold (220 bpm). Rejected by validation gate.',
    flagged_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'aud-002',
    source_type: 'ACTIGRAPHY_LOG',
    raw_payload_blob: '{"sleep_duration": -1.5, "sensor_id": "CREW_BAND_01"}',
    astronaut_id: 'astro-thorne-002',
    indicator_key: 'SLEEP_DURATION',
    error_code: 'ERR_NEGATIVE_VALUE',
    rejection_reason: 'Negative sleep duration value detected (-1.5 hrs). Flagged as sensor calibration artifact.',
    flagged_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const MOCK_MISSION_EVENTS: MissionEventItem[] = [
  {
    id: 'ev-01',
    mission_id: 'mis-artemis-iii',
    astronaut_id: 'astro-vance-001',
    event_type: 'EVA_PREP',
    title: 'Airlock Suit Ingress Simulation',
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() - 86400000 + 7200000).toISOString(),
    workload_intensity: 'HIGH_WORKLOAD',
    notes: 'Commander Vance conducted 2-hour pressurization drill.',
  },
  {
    id: 'ev-02',
    mission_id: 'mis-artemis-iii',
    astronaut_id: 'astro-vance-001',
    event_type: 'SURFACE_SORTIE',
    title: 'Surface Sortie Alpha Egress',
    start_time: new Date(Date.now() - 172800000).toISOString(),
    end_time: new Date(Date.now() - 172800000 + 14400000).toISOString(),
    workload_intensity: 'VERY_HIGH',
    notes: 'Lunar south pole geology transect and core sample extraction.',
  },
  {
    id: 'ev-03',
    mission_id: 'mis-artemis-iii',
    astronaut_id: 'astro-thorne-002',
    event_type: 'ARED_WORKOUT',
    title: 'ARED Resistance Exercise',
    start_time: new Date(Date.now() - 86400000 * 3).toISOString(),
    end_time: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString(),
    workload_intensity: 'NOMINAL',
    notes: 'Scheduled daily countermeasure resistance protocol.',
  },
];

export const MOCK_ENVIRONMENTAL: EnvironmentalTelemetryItem[] = [
  {
    id: 'env-01',
    mission_id: 'mis-artemis-iii',
    parameter_name: 'CABIN_CO2_PPM',
    value: 3450,
    unit: 'ppm',
    habitat_zone: 'AIRLOCK',
    timestamp: new Date().toISOString(),
    quality_status: 'ACCEPTED',
  },
  {
    id: 'env-02',
    mission_id: 'mis-artemis-iii',
    parameter_name: 'CABIN_PRESSURE_KPA',
    value: 101.3,
    unit: 'kPa',
    habitat_zone: 'CREW_CABIN',
    timestamp: new Date().toISOString(),
    quality_status: 'ACCEPTED',
  },
  {
    id: 'env-03',
    mission_id: 'mis-artemis-iii',
    parameter_name: 'IONIZING_RADIATION',
    value: 295,
    unit: 'uSv/day',
    habitat_zone: 'HABITAT_TRANSEPTS',
    timestamp: new Date().toISOString(),
    quality_status: 'ACCEPTED',
  },
  {
    id: 'env-04',
    mission_id: 'mis-artemis-iii',
    parameter_name: 'AMBIENT_TEMPERATURE_C',
    value: 21.4,
    unit: '°C',
    habitat_zone: 'CREW_QUARTERS',
    timestamp: new Date().toISOString(),
    quality_status: 'ACCEPTED',
  },
  {
    id: 'env-05',
    mission_id: 'mis-artemis-iii',
    parameter_name: 'RELATIVE_HUMIDITY_PCT',
    value: 48.2,
    unit: '%',
    habitat_zone: 'CREW_QUARTERS',
    timestamp: new Date().toISOString(),
    quality_status: 'ACCEPTED',
  },
];

export const MOCK_BENCHMARK: BenchmarkEvaluationReport = {
  timestamp_utc: new Date().toISOString(),
  execution_duration_ms: 28.4,
  evaluated_scenarios: [
    'SCENARIO_A_NOMINAL',
    'SCENARIO_B_ACUTE_SPIKE',
    'SCENARIO_C_SILENT_DETERIORATION',
  ],
  models_evaluated: [
    'Mission Sentinel (Explainable Multi-Indicator Regression)',
    'Scikit-Learn Isolation Forest',
    'Scikit-Learn Local Outlier Factor (LOF)',
  ],
  comparison_matrix: [
    {
      model_name: 'Mission Sentinel (NASA-AMO Rule/Regression Engine)',
      model_family: 'Domain-Calibrated Statistical Regression + Context Engine',
      description: 'NASA AMO compliant OLS trend slope with personalized baseline z-scores and context gating.',
      detection_day_scenario_c: 10,
      scenario_b_false_positives: 0,
      scenario_a_false_positives: 0,
      explainability_score_out_of_10: 10,
      explainability_rationale: 'Outputs explicit formula, slope, baseline variance, p-value, and actionable clinical narrative.',
      computational_latency_ms: 1.2,
      nasa_flight_surgeon_verdict: 'APPROVED - Unanimously selected for autonomous flight operations.',
    },
    {
      model_name: 'Scikit-Learn Isolation Forest',
      model_family: 'Unsupervised Decision Ensemble',
      description: 'Random forest partition depth anomaly detector.',
      detection_day_scenario_c: 11,
      scenario_b_false_positives: 1,
      scenario_a_false_positives: 0,
      explainability_score_out_of_10: 3,
      explainability_rationale: 'Black-box decision tree depth score without anatomical or physiological attribution.',
      computational_latency_ms: 14.8,
      nasa_flight_surgeon_verdict: 'REJECTED - Black box causes alarm fatigue and cannot defend clinical countermeasures.',
    },
    {
      model_name: 'Scikit-Learn Local Outlier Factor (LOF)',
      model_family: 'Density-Based Local Outlier Detection',
      description: 'K-nearest neighbors local density divergence algorithm.',
      detection_day_scenario_c: 12,
      scenario_b_false_positives: 1,
      scenario_a_false_positives: 0,
      explainability_score_out_of_10: 2,
      explainability_rationale: 'Pure distance metric in Euclidean space. Fails to account for physiological recovery lags.',
      computational_latency_ms: 12.4,
      nasa_flight_surgeon_verdict: 'REJECTED - Triggers false alarm on acute high-intensity exercise days.',
    },
  ],
  daily_progression_scenario_c: [
    { day: 1, date: '2026-10-01', rule_based_alert: false, isolation_forest_score: 0.12, isolation_forest_is_anomaly: false, lof_score: 1.01, lof_is_anomaly: false, context_event: null },
    { day: 2, date: '2026-10-02', rule_based_alert: false, isolation_forest_score: 0.14, isolation_forest_is_anomaly: false, lof_score: 1.02, lof_is_anomaly: false, context_event: null },
    { day: 3, date: '2026-10-03', rule_based_alert: false, isolation_forest_score: 0.11, isolation_forest_is_anomaly: false, lof_score: 0.99, lof_is_anomaly: false, context_event: null },
    { day: 4, date: '2026-10-04', rule_based_alert: false, isolation_forest_score: 0.13, isolation_forest_is_anomaly: false, lof_score: 1.03, lof_is_anomaly: false, context_event: null },
    { day: 5, date: '2026-10-05', rule_based_alert: false, isolation_forest_score: 0.15, isolation_forest_is_anomaly: false, lof_score: 1.01, lof_is_anomaly: false, context_event: null },
    { day: 6, date: '2026-10-06', rule_based_alert: false, isolation_forest_score: 0.12, isolation_forest_is_anomaly: false, lof_score: 1.00, lof_is_anomaly: false, context_event: null },
    { day: 7, date: '2026-10-07', rule_based_alert: false, isolation_forest_score: 0.16, isolation_forest_is_anomaly: false, lof_score: 1.04, lof_is_anomaly: false, context_event: 'Baseline established' },
    { day: 8, date: '2026-10-08', rule_based_alert: false, isolation_forest_score: 0.28, isolation_forest_is_anomaly: false, lof_score: 1.18, lof_is_anomaly: false, context_event: 'EVA Sortie Alpha' },
    { day: 9, date: '2026-10-09', rule_based_alert: false, isolation_forest_score: 0.42, isolation_forest_is_anomaly: false, lof_score: 1.34, lof_is_anomaly: false, context_event: 'Regolith scrub' },
    { day: 10, date: '2026-10-10', rule_based_alert: true, isolation_forest_score: 0.61, isolation_forest_is_anomaly: true, lof_score: 1.58, lof_is_anomaly: true, context_event: 'Silent Drift Confirmed' },
    { day: 11, date: '2026-10-11', rule_based_alert: true, isolation_forest_score: 0.72, isolation_forest_is_anomaly: true, lof_score: 1.76, lof_is_anomaly: true, context_event: null },
    { day: 12, date: '2026-10-12', rule_based_alert: true, isolation_forest_score: 0.81, isolation_forest_is_anomaly: true, lof_score: 1.94, lof_is_anomaly: true, context_event: 'CMO Countermeasure' },
    { day: 13, date: '2026-10-13', rule_based_alert: true, isolation_forest_score: 0.79, isolation_forest_is_anomaly: true, lof_score: 1.88, lof_is_anomaly: true, context_event: null },
    { day: 14, date: '2026-10-14', rule_based_alert: true, isolation_forest_score: 0.74, isolation_forest_is_anomaly: true, lof_score: 1.75, lof_is_anomaly: true, context_event: 'Stabilizing' },
  ],
  daily_progression_scenario_b: [
    { day: 1, date: '2026-10-01', rule_based_alert: false, isolation_forest_score: 0.10, isolation_forest_is_anomaly: false, lof_score: 1.00, lof_is_anomaly: false, context_event: null },
    { day: 2, date: '2026-10-02', rule_based_alert: false, isolation_forest_score: 0.11, isolation_forest_is_anomaly: false, lof_score: 1.01, lof_is_anomaly: false, context_event: null },
    { day: 3, date: '2026-10-03', rule_based_alert: false, isolation_forest_score: 0.09, isolation_forest_is_anomaly: false, lof_score: 0.99, lof_is_anomaly: false, context_event: null },
    { day: 4, date: '2026-10-04', rule_based_alert: false, isolation_forest_score: 0.12, isolation_forest_is_anomaly: false, lof_score: 1.02, lof_is_anomaly: false, context_event: null },
    { day: 5, date: '2026-10-05', rule_based_alert: false, isolation_forest_score: 0.10, isolation_forest_is_anomaly: false, lof_score: 1.01, lof_is_anomaly: false, context_event: null },
    { day: 6, date: '2026-10-06', rule_based_alert: false, isolation_forest_score: 0.13, isolation_forest_is_anomaly: false, lof_score: 1.03, lof_is_anomaly: false, context_event: null },
    { day: 7, date: '2026-10-07', rule_based_alert: false, isolation_forest_score: 0.11, isolation_forest_is_anomaly: false, lof_score: 1.00, lof_is_anomaly: false, context_event: null },
    { day: 8, date: '2026-10-08', rule_based_alert: false, isolation_forest_score: 0.69, isolation_forest_is_anomaly: true, lof_score: 1.82, lof_is_anomaly: true, context_event: 'Acute exertion spike' },
    { day: 9, date: '2026-10-09', rule_based_alert: false, isolation_forest_score: 0.15, isolation_forest_is_anomaly: false, lof_score: 1.05, lof_is_anomaly: false, context_event: 'Recovered' },
    { day: 10, date: '2026-10-10', rule_based_alert: false, isolation_forest_score: 0.12, isolation_forest_is_anomaly: false, lof_score: 1.02, lof_is_anomaly: false, context_event: null },
  ],
  synthesis_conclusions: [
    'Mission Sentinel filters acute exertion spikes through contextual gating, preventing false alarms.',
    'Mission Sentinel flags subtle slope drift on Flight Day 10 with full mathematical transparency.',
    'Unsupervised ML algorithms produce false alarms on isolated exercise spikes and fail to provide clinical rationale.',
  ],
};

export const MOCK_HANDOVER_REPORT: FlightSurgeonHandoverReport = {
  report_id: 'rpt-handover-vance-001',
  generated_at: new Date().toISOString(),
  astronaut_id: 'astro-vance-001',
  callsign: 'ARTEMIS-01',
  full_name: 'Dr. Elena Vance',
  flight_role: 'Commander & Medical Lead',
  mission_code: 'ARTEMIS-III',
  target_destination: 'LUNAR_SOUTH_POLE',
  flight_day: 14,
  medical_clearance_status: 'RESTRICTED_EVA',
  overall_clinical_status: 'CRITICAL_REVIEW',
  active_alerts_count: 1,
  flight_surgeon_recommendation:
    'Maintain EVA restriction for next 48 hours. Enforce 60-minute sleep extension protocol. Monitor airlock CO2 scrubbers.',
  cmo_handover_notes:
    'Patient acknowledged countermeasure protocol. Resting heart rate elevation stabilizing; fatigue reported as reducing.',
  baselines_summary: {
    RESTING_HEART_RATE: { mean: 62.4, std_dev: 2.1, status: 'ACTIVE' },
    SLEEP_DURATION: { mean: 7.5, std_dev: 0.35, status: 'ACTIVE' },
    HEART_RATE_RECOVERY_1MIN: { mean: 34.2, std_dev: 2.8, status: 'ACTIVE' },
  },
  recent_observations_summary: {
    RESTING_HEART_RATE: {
      latest_value: 68.9,
      latest_time: new Date().toISOString(),
      unit: 'bpm',
      count: 14,
      min_7d: 62.1,
      max_7d: 68.9,
      avg_7d: 66.2,
    },
    SLEEP_DURATION: {
      latest_value: 5.2,
      latest_time: new Date().toISOString(),
      unit: 'hours',
      count: 14,
      min_7d: 4.8,
      max_7d: 7.6,
      avg_7d: 6.1,
    },
    HEART_RATE_RECOVERY_1MIN: {
      latest_value: 24.5,
      latest_time: new Date().toISOString(),
      unit: 'bpm drop',
      count: 14,
      min_7d: 23.8,
      max_7d: 35.0,
      avg_7d: 28.4,
    },
  },
  active_alerts: [
    {
      alert_id: 'alt-silent-001',
      indicator_key: 'MULTIVARIATE_DRIFT',
      severity: 'CRITICAL',
      lifecycle_status: 'UNDER_REVIEW',
      trigger_reason: 'Resting HR drift (+1.12 bpm/day) + Sleep deficit (-0.38 hr/day) + Delayed HRR',
      evidence_summary: '4 evidence items confirmed by mathematical regression.',
      ols_slope: 1.12,
      z_score: 6.95,
      persistence_count: 4,
      evidence_count: 4,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  environmental_context: {
    cabin_co2_mean_ppm: 1450,
    cabin_co2_max_ppm: 3950,
    cabin_co2_elevated: true,
    radiation_total_usv: 18.4,
    total_readings_analyzed: 420,
    habitat_zone: 'AIRLOCK',
  },
  recent_mission_events: [
    {
      event_id: 'ev-01',
      event_type: 'EVA_PREP',
      title: 'Airlock Suit Ingress Simulation',
      workload_intensity: 'HIGH_WORKLOAD',
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date(Date.now() - 86400000 + 7200000).toISOString(),
      notes: 'Commander Vance conducted 2-hour drill.',
    },
    {
      event_id: 'ev-02',
      event_type: 'SURFACE_SORTIE',
      title: 'Surface Sortie Alpha Egress',
      workload_intensity: 'VERY_HIGH',
      start_time: new Date(Date.now() - 172800000).toISOString(),
      end_time: new Date(Date.now() - 172800000 + 14400000).toISOString(),
      notes: 'Lunar south pole transect.',
    },
  ],
  countermeasures_summary: [
    {
      countermeasure_id: 'cm-001',
      alert_id: 'alt-silent-001',
      countermeasure_type: 'SLEEP_SCHEDULE_ADJUSTMENT',
      prescription_details: 'Provide 60-minute sleep extension prior to EVA prep.',
      prescribed_by: 'ARTEMIS-CMO',
      prescribed_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'ACTIVE',
      efficacy_status: 'PENDING_EVALUATION',
      followup_count: 1,
      latest_followup_note: 'Patient compliant with bedtime schedule.',
    },
  ],
  integrity_hash: '9a8f4c2e5b17e42cf5e2d1c809ab76fe8b3c1d9f4e2a1b0c9d8e7f6a5b4c3d2e',
};
