# MISSION SENTINEL: SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION
**Product:** Mission Sentinel — Astronaut Health Intelligence and Medical Review Support System  
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Architecture Style:** Modular Monolith — Local-First Offline Medical Workstation  
**Document Status:** Approved Enterprise-Grade Technical Blueprint (13-Table Relational Schema)  

---

## 1. System Overview & Architecture

Mission Sentinel is structured as a tightly-integrated modular monolith designed to operate 100% locally on a Crew Medical Officer's (CMO) workstation without reliance on terrestrial cloud infrastructure.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CREW MEDICAL OFFICER (CMO) UI                                  │
│   React 18 (Vite) + TypeScript + Tailwind CSS + Recharts + Lucide Icons                          │
│   - Mission Control Dark-Theme Medical Review Dashboard                                          │
│   - Synchronized Multi-Indicator Time-Series Visualizer (Vitals + Habitat Environment)           │
│   - Silent Deterioration Alert Drill-Down & Evidence Inspector                                   │
│   - Clinical Countermeasure Action Logger & Protocol Tracker                                     │
│   - Ingestion & Data Quality Rejection Audit Inspector                                           │
│   - 1-Click NASA Space Apps Demo Scenario Switcher (Nominal, Single-Spike, Silent Deterioration) │
└───────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                │ JSON over HTTP (`/api/v1`)
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FASTAPI APPLICATION BACKEND                                      │
│   Python 3.10+ / FastAPI / Pydantic v2 / SQLAlchemy 2.0 / NumPy / SciPy                          │
│                                                                                                  │
│   ┌───────────────────────────┐  ┌───────────────────────────┐  ┌────────────────────────────┐   │
│   │    Data Quality Engine    │  │  Indicator Catalog Engine │  │  Personal Baseline Engine  │   │
│   │  - Strict Range Checking  │  │  - Dynamic Bound Configs  │  │  - 7-Day Rolling Calendar  │   │
│   │  - Duplicate Prevention   │  │  - Standard Units (bpm/hr)│  │  - Sample Minimum (N ≥ 4)  │   │
│   │  - Rejection Audit Logger │  │  - NASA HRP Citations     │  │  - Statistical Distribution│   │
│   └─────────────┬─────────────┘  └─────────────┬─────────────┘  └─────────────┬──────────────┘   │
│                 │                              │                              │                  │
│                 ▼                              ▼                              ▼                  │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                               Silent Deterioration Engine                                │   │
│   │   - OLS Linear Regression Trend Slope Calculation (Directional Drift)                    │   │
│   │   - Standardized Deviation (z-score) Evaluator with Physiological Baselines              │   │
│   │   - Multi-Indicator Persistence Rule (≥2 Metrics Deviating for ≥3 Consecutive Days)      │   │
│   │   - Single-Spike Filtering (Rejects False Alarms from Acute Workout Spikes)              │   │
│   │   - Environmental & Workload Context Cross-Correlator (EVA, Cabin CO2, Radiation)        │   │
│   └────────────────────────────────────────────┬─────────────────────────────────────────────┘   │
│                                                │                                                 │
│                                                ▼                                                 │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                             Clinical Review & Action Services                            │   │
│   │   - Explainable Alert Generator (Traceable UUID Evidence Links)                          │   │
│   │   - Clinical Countermeasure Workflow (Prescription, Monitoring, Outcome Tracking)        │   │
│   │   - Engine Execution Audit Logging (`analysis_runs` Tracking & Reproducibility)          │   │
│   │   - Offline Transaction Queue (Idempotency Ledger for Safe Resynchronization)            │   │
│   └──────────────────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                │ SQLite Driver (WAL Mode, Foreign Keys Enforced)
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  LOCAL RELATIONAL DATABASE (SQLite)                              │
│   - Local file: `data/sentinel.db` (13 Tables, Strict Relational Constraints, WAL Journaling)    │
│   - 100% Offline Persistence; Survives System Power Cycles and Process Restarts                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete 13-Table Relational Schema (SQLite DDL)

Foreign key enforcement (`PRAGMA foreign_keys = ON;`) is enabled on every database connection. All timestamps are ISO 8601 UTC strings (`YYYY-MM-DDTHH:MM:SSZ`).

```sql
-- ============================================================================
-- DOMAIN 1: MISSIONS & CREW CONTEXT
-- ============================================================================

-- 1. Missions Metadata
CREATE TABLE missions (
    id TEXT PRIMARY KEY,                       -- UUID v4
    mission_code TEXT NOT NULL UNIQUE,         -- e.g., 'ARTEMIS-III'
    name TEXT NOT NULL,                        -- e.g., 'Artemis III Lunar Surface Expedition'
    target_destination TEXT NOT NULL,          -- 'LUNAR_SOUTH_POLE', 'MARS_TRANSIT', 'LEO_GATEWAY'
    spacecraft_module TEXT NOT NULL,           -- 'ORION_MPC_V', 'STARSHIP_HLS', 'LUNAR_GATEWAY'
    flight_day INTEGER NOT NULL DEFAULT 1,     -- Mission Elapsed Day (MET Day)
    comms_latency_seconds INTEGER NOT NULL,    -- One-way speed-of-light comms delay in seconds (e.g. 1320 for Mars)
    status TEXT NOT NULL,                      -- 'ACTIVE', 'COMPLETED', 'PLANNED'
    start_date TEXT NOT NULL,                  -- ISO 8601 UTC
    created_at TEXT NOT NULL                   -- ISO 8601 UTC
);

-- 2. Astronaut Profiles
CREATE TABLE astronaut_profiles (
    id TEXT PRIMARY KEY,                       -- UUID v4
    mission_id TEXT NOT NULL,
    callsign TEXT NOT NULL UNIQUE,             -- e.g., 'ARTEMIS-01'
    full_name TEXT NOT NULL,                   -- Fictional Astronaut Name
    flight_role TEXT NOT NULL,                 -- 'COMMANDER', 'PILOT', 'MISSION_SPECIALIST', 'FLIGHT_ENGINEER'
    medical_clearance_status TEXT NOT NULL,    -- 'FULL_FLIGHT_CLEARANCE', 'RESTRICTED_DUTY', 'MEDICAL_OBSERVATION'
    created_at TEXT NOT NULL,                  -- ISO 8601 UTC
    updated_at TEXT NOT NULL,                  -- ISO 8601 UTC
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT
);

CREATE INDEX idx_astronaut_mission ON astronaut_profiles(mission_id);

-- ============================================================================
-- DOMAIN 2: DYNAMIC INDICATOR CATALOG & TELEMETRY INGESTION
-- ============================================================================

-- 3. Physiological & Environmental Indicator Definitions Catalog
CREATE TABLE indicator_definitions (
    id TEXT PRIMARY KEY,                       -- UUID v4
    indicator_key TEXT NOT NULL UNIQUE,        -- 'RESTING_HEART_RATE', 'SLEEP_DURATION', 'HEART_RATE_RECOVERY_1MIN', 'CABIN_CO2_PPM', 'AMBIENT_RADIATION_USV'
    category TEXT NOT NULL,                    -- 'CARDIOVASCULAR', 'SLEEP', 'EXERCISE_RECOVERY', 'ENVIRONMENTAL'
    display_name TEXT NOT NULL,                -- e.g., 'Resting Heart Rate'
    standard_unit TEXT NOT NULL,               -- 'bpm', 'hours', 'ppm', 'uSv/day'
    nominal_min REAL NOT NULL,                 -- Lower boundary of normal baseline (e.g. 50 bpm)
    nominal_max REAL NOT NULL,                 -- Upper boundary of normal baseline (e.g. 85 bpm)
    critical_min REAL NOT NULL,                -- Severe medical danger lower threshold (e.g. 35 bpm)
    critical_max REAL NOT NULL,                -- Severe medical danger upper threshold (e.g. 180 bpm)
    sampling_frequency_hours REAL NOT NULL,    -- Expected interval between readings (e.g. 24.0 for daily resting metrics)
    nasa_hrp_reference TEXT NOT NULL,          -- NASA Human Research Program Evidence Report key
    description TEXT NOT NULL
);

-- 4. Validated Health Observations
CREATE TABLE health_observations (
    id TEXT PRIMARY KEY,                       -- UUID v4
    astronaut_id TEXT NOT NULL,
    indicator_id TEXT NOT NULL,
    value REAL NOT NULL,                       -- Measured numeric value
    unit TEXT NOT NULL,                        -- Verified unit
    observation_time TEXT NOT NULL,            -- Measurement timestamp (ISO 8601 UTC)
    recorded_time TEXT NOT NULL,               -- Database ingestion timestamp (ISO 8601 UTC)
    data_origin TEXT NOT NULL,                 -- 'SIMULATED', 'MANUAL_ENTRY', 'RESEARCH_DATASET'
    provenance_ref TEXT NOT NULL,              -- Dataset or scenario ID (e.g., 'OSDR-EXP71-ANALOG')
    quality_status TEXT NOT NULL,              -- 'VALID', 'SUSPICIOUS', 'STALE'
    quality_notes TEXT,                        -- Optional warnings
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (indicator_id) REFERENCES indicator_definitions(id) ON DELETE RESTRICT
);

CREATE INDEX idx_obs_astro_ind_time 
ON health_observations(astronaut_id, indicator_id, observation_time);

-- 5. Spacecraft Environmental Telemetry (Cabin Habitat Stressors)
CREATE TABLE environmental_telemetry (
    id TEXT PRIMARY KEY,                       -- UUID v4
    mission_id TEXT NOT NULL,
    parameter_name TEXT NOT NULL,              -- 'CABIN_CO2_PPM', 'CABIN_PRESSURE_PSI', 'AMBIENT_RADIATION_USV', 'CABIN_TEMP_C'
    value REAL NOT NULL,
    unit TEXT NOT NULL,                        -- 'ppm', 'psi', 'uSv/day', 'C'
    habitat_zone TEXT NOT NULL,                -- 'CREW_QUARTERS', 'AIRLOCK', 'EXERCISE_BAY', 'COMMAND_DECK'
    timestamp TEXT NOT NULL,                   -- ISO 8601 UTC
    quality_status TEXT NOT NULL,              -- 'VALID', 'SUSPICIOUS', 'REJECTED'
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT
);

CREATE INDEX idx_env_mission_time ON environmental_telemetry(mission_id, timestamp);

-- 6. Ingestion & Data Quality Rejection Audit Log
CREATE TABLE data_quality_audit_log (
    id TEXT PRIMARY KEY,                       -- UUID v4
    source_type TEXT NOT NULL,                 -- 'BIOMETRIC_TELEMETRY', 'ENVIRONMENTAL_SENSOR', 'MANUAL_ENTRY'
    raw_payload_blob TEXT NOT NULL,            -- Exact raw JSON string or stringified payload
    astronaut_id TEXT,                         -- Populated if known; nullable if payload unparseable
    indicator_key TEXT,                        -- Target indicator key
    error_code TEXT NOT NULL,                  -- 'OUT_OF_BOUNDS', 'INVALID_UNIT', 'FUTURE_TIMESTAMP', 'DUPLICATE_RECORD', 'CORRUPT_FORMAT'
    rejection_reason TEXT NOT NULL,            -- Detailed explanation for CMO inspection
    flagged_at TEXT NOT NULL                   -- ISO 8601 UTC
);

CREATE INDEX idx_audit_time ON data_quality_audit_log(flagged_at);

-- ============================================================================
-- DOMAIN 3: BASELINES & ANALYTICS AUDIT
-- ============================================================================

-- 7. Personal Rolling Baselines
CREATE TABLE personal_baselines (
    id TEXT PRIMARY KEY,                       -- UUID v4
    astronaut_id TEXT NOT NULL,
    indicator_id TEXT NOT NULL,
    window_start TEXT NOT NULL,                -- 7 calendar days lookback (ISO 8601 UTC)
    window_end TEXT NOT NULL,                  -- Baseline evaluation cutoff (ISO 8601 UTC)
    sample_count INTEGER NOT NULL,             -- Number of valid daily readings in window
    mean REAL NOT NULL,                        -- Arithmetic mean (μ)
    median REAL NOT NULL,                      -- 50th percentile (M)
    std_dev REAL NOT NULL,                     -- Sample standard deviation (σ)
    status TEXT NOT NULL,                      -- 'ACTIVE', 'INSUFFICIENT_BASELINE_DATA'
    version INTEGER NOT NULL DEFAULT 1,        -- Monotonically increasing version counter
    calculated_at TEXT NOT NULL,               -- ISO 8601 UTC
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (indicator_id) REFERENCES indicator_definitions(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_baseline_version 
ON personal_baselines(astronaut_id, indicator_id, version);

-- 8. Mission Context & Schedule Events
CREATE TABLE mission_events (
    id TEXT PRIMARY KEY,                       -- UUID v4
    mission_id TEXT NOT NULL,
    astronaut_id TEXT NOT NULL,
    event_type TEXT NOT NULL,                  -- 'EVA_OPERATION', 'SLEEP_SHIFT', 'INTENSE_MAINTENANCE', 'EXERCISE_COUNTERMEASURE'
    title TEXT NOT NULL,                       -- Human readable summary
    start_time TEXT NOT NULL,                  -- ISO 8601 UTC
    end_time TEXT NOT NULL,                    -- ISO 8601 UTC
    workload_intensity TEXT NOT NULL,          -- 'NOMINAL', 'MODERATE', 'HIGH', 'CRITICAL'
    notes TEXT,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_astro_time 
ON mission_events(astronaut_id, start_time, end_time);

-- 9. Engine Execution & Analysis Audit History
CREATE TABLE analysis_runs (
    id TEXT PRIMARY KEY,                       -- UUID v4
    mission_id TEXT NOT NULL,
    run_type TEXT NOT NULL,                    -- 'SCHEDULED_BATCH', 'EVENT_TRIGGERED', 'MANUAL_RECOMPUTE'
    rule_version TEXT NOT NULL,                -- Engine version identifier (e.g. 'v1.0.0-ols')
    status TEXT NOT NULL,                      -- 'SUCCESS', 'FAILED', 'WARNING'
    observations_evaluated_count INTEGER NOT NULL,
    alerts_generated_count INTEGER NOT NULL,
    execution_duration_ms INTEGER NOT NULL,    -- Execution performance tracking
    executed_at TEXT NOT NULL,                 -- ISO 8601 UTC
    notes TEXT,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT
);

-- ============================================================================
-- DOMAIN 4: SILENT DETERIORATION ALERTS & EVIDENCE
-- ============================================================================

-- 10. Silent Deterioration Alerts
CREATE TABLE deterioration_alerts (
    id TEXT PRIMARY KEY,                       -- UUID v4
    astronaut_id TEXT NOT NULL,
    analysis_run_id TEXT NOT NULL,
    review_priority TEXT NOT NULL,             -- 'LOW', 'MEDIUM', 'HIGH'
    pattern_type TEXT NOT NULL,                -- 'SILENT_MULTI_INDICATOR_DETERIORATION', 'ISOLATED_ANOMALY_MONITORING'
    lifecycle_status TEXT NOT NULL,            -- 'NEW', 'UNDER_REVIEW', 'MONITORING', 'RESOLVED', 'DISMISSED'
    window_start TEXT NOT NULL,                -- Anomaly window start
    window_end TEXT NOT NULL,                  -- Anomaly window end
    detection_narrative TEXT NOT NULL,         -- Human-readable clinical-grade explanation
    math_summary TEXT NOT NULL,                -- JSON: μ, σ, z-scores, OLS slopes for all indicators
    mission_context_notes TEXT NOT NULL,       -- Temporal correlation to mission workload
    environmental_context_notes TEXT,          -- Temporal correlation to cabin CO2/Radiation
    scientific_ref TEXT NOT NULL,              -- NASA HRP Evidence Report citation
    rule_version TEXT NOT NULL,                -- Ruleset version
    created_at TEXT NOT NULL,                  -- ISO 8601 UTC
    updated_at TEXT NOT NULL,                  -- ISO 8601 UTC
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id) ON DELETE RESTRICT
);

CREATE INDEX idx_alert_astro_status ON deterioration_alerts(astronaut_id, lifecycle_status);

-- 11. Alert Supporting Evidence Links (Many-to-Many Granular Join)
CREATE TABLE alert_evidence_links (
    id TEXT PRIMARY KEY,                       -- UUID v4
    alert_id TEXT NOT NULL,
    observation_id TEXT,                       -- FK to biometric reading (optional)
    environmental_telemetry_id TEXT,           -- FK to environmental reading (optional)
    evidence_type TEXT NOT NULL,               -- 'BIOMETRIC', 'ENVIRONMENTAL', 'MISSION_EVENT'
    metric_name TEXT NOT NULL,                 -- e.g. 'RESTING_HEART_RATE'
    observed_value REAL NOT NULL,
    baseline_mean REAL,                        -- Reference baseline μ (if applicable)
    z_score REAL,                              -- Deviation from baseline (if applicable)
    ols_slope REAL,                            -- Multi-day trend slope
    contribution_summary TEXT NOT NULL,        -- Explanation of why this record proves the pattern
    FOREIGN KEY (alert_id) REFERENCES deterioration_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (observation_id) REFERENCES health_observations(id) ON DELETE RESTRICT,
    FOREIGN KEY (environmental_telemetry_id) REFERENCES environmental_telemetry(id) ON DELETE RESTRICT
);

CREATE INDEX idx_evidence_alert ON alert_evidence_links(alert_id);

-- ============================================================================
-- DOMAIN 5: CMO CLINICAL ACTION & PROTOCOLS
-- ============================================================================

-- 12. Clinical Countermeasures & Prescriptions
CREATE TABLE clinical_countermeasures (
    id TEXT PRIMARY KEY,                       -- UUID v4
    alert_id TEXT NOT NULL,
    astronaut_id TEXT NOT NULL,
    prescribed_by TEXT NOT NULL,               -- CMO Callsign (e.g. 'CMO-01')
    countermeasure_type TEXT NOT NULL,         -- 'SLEEP_SCHEDULE_ADJUSTMENT', 'HYDRATION_ELECTROLYTE_PROTOCOL', 'EXERCISE_WORKLOAD_MODULATION', 'ACTIVE_MONITORING'
    title TEXT NOT NULL,                       -- Summary of clinical intervention
    prescription_details TEXT NOT NULL,        -- Explicit medical instructions
    target_duration_hours INTEGER NOT NULL,    -- Protocol duration (e.g. 48 hours)
    outcome_status TEXT NOT NULL,              -- 'PENDING', 'ACTIVE', 'RESOLVED_IMPROVED', 'UNCHANGED'
    prescribed_at TEXT NOT NULL,               -- ISO 8601 UTC
    updated_at TEXT NOT NULL,                  -- ISO 8601 UTC
    FOREIGN KEY (alert_id) REFERENCES deterioration_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_countermeasure_astro ON clinical_countermeasures(astronaut_id, outcome_status);

-- 13. CMO Review & Clinical Follow-up Log
CREATE TABLE cmo_followups (
    id TEXT PRIMARY KEY,                       -- UUID v4
    alert_id TEXT NOT NULL,
    astronaut_id TEXT NOT NULL,
    reviewer_callsign TEXT NOT NULL,           -- e.g., 'CMO-01'
    review_notes TEXT NOT NULL,                -- Clinical impressions and instructions
    status_transition TEXT NOT NULL,           -- e.g., 'NEW -> UNDER_REVIEW'
    recorded_at TEXT NOT NULL,                 -- ISO 8601 UTC
    FOREIGN KEY (alert_id) REFERENCES deterioration_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_followup_alert ON cmo_followups(alert_id);

-- ============================================================================
-- DOMAIN 6: RESILIENCE & OFFLINE SYNCHRONIZATION QUEUE
-- ============================================================================

-- 14. Offline Sync Transaction Queue (Idempotency Ledger)
CREATE TABLE offline_sync_queue (
    id TEXT PRIMARY KEY,                       -- UUID v4
    transaction_type TEXT NOT NULL,            -- 'INGEST_OBSERVATION', 'UPDATE_ALERT_STATUS', 'LOG_COUNTERMEASURE', 'LOG_FOLLOWUP'
    entity_table TEXT NOT NULL,                -- Table name modified
    entity_id TEXT NOT NULL,                   -- Record UUID
    idempotency_hash TEXT NOT NULL UNIQUE,     -- SHA-256 hash of payload to guarantee zero duplicates
    payload_json TEXT NOT NULL,                -- Serialized JSON representation
    sync_status TEXT NOT NULL,                 -- 'QUEUED', 'IN_FLIGHT', 'SYNCED', 'FAILED'
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,                      -- ISO 8601 UTC
    created_at TEXT NOT NULL                   -- ISO 8601 UTC
);

CREATE INDEX idx_sync_status ON offline_sync_queue(sync_status);
```

---

## 3. Mathematical Foundations: Baseline & Detection Engines

### 3.1 7-Day Calendar-Time Rolling Baseline
For an astronaut $A$ and indicator $I$, evaluated at reference timestamp $T_0$:
- **Calendar Time Window:** $W = [T_0 - 7\text{ days}, T_0]$.
- **Valid Observations Subset:** $\{x_1, x_2, \dots, x_N\} \subset W$ where $\text{quality\_status} = \text{'VALID'}$.
- **Sample Threshold:**
  - If $N < 4$: Status is `INSUFFICIENT_BASELINE_DATA`. (Calculations aborted; dashboard flags insufficient history).
  - If $N \ge 4$: Status is `ACTIVE`.
- **Formulas:**
  $$\mu = \frac{1}{N}\sum_{i=1}^N x_i$$
  $$\sigma = \sqrt{\frac{1}{N-1}\sum_{i=1}^N (x_i - \mu)^2} \quad (\text{if } \sigma = 0, \text{ fallback to } \sigma_{\text{default}} = 0.01)$$
  $$M = \begin{cases} x_{\left(\frac{N+1}{2}\right)} & \text{if } N \text{ is odd} \\ \frac{1}{2}\left(x_{\left(\frac{N}{2}\right)} + x_{\left(\frac{N}{2}+1\right)}\right) & \text{if } N \text{ is even} \end{cases}$$

### 3.2 Standardized Deviation ($z$-score)
For any observation $x_t$:
$$z_t = \frac{x_t - \mu}{\sigma}$$

### 3.3 Ordinary Least Squares (OLS) Linear Regression Trend
To detect true directional drift across a multi-day observation window $\{ (t_1, y_1), (t_2, y_2), \dots, (t_k, y_k) \}$ (where $k \ge 3$, and $t_i$ is elapsed days from window start):
$$\bar{t} = \frac{1}{k}\sum_{i=1}^k t_i, \quad \bar{y} = \frac{1}{k}\sum_{i=1}^k y_i$$
$$\text{Slope } m = \frac{\sum_{i=1}^k (t_i - \bar{t})(y_i - \bar{y})}{\sum_{i=1}^k (t_i - \bar{t})^2}$$

* **Directional Drift Criteria:**
  - **Resting Heart Rate (RHR):** Positive slope $m_{\text{RHR}} \ge +0.8\text{ bpm/day}$ AND average $z \ge +1.5\sigma$.
  - **Sleep Duration:** Negative slope $m_{\text{Sleep}} \le -0.25\text{ hours/day}$ AND average $z \le -1.5\sigma$.
  - **Exercise Recovery (HRR-1):** Negative slope $m_{\text{HRR}} \le -1.5\text{ bpm/day}$ AND average $z \le -1.5\sigma$.

### 3.4 Multi-Indicator Persistence Rule
* **Persistence Window:** $k \ge 3$ consecutive daily cycles.
* **Alert Trigger:** An alert is generated if and only if:
  $$\text{Count}\left( \text{Indicators with Adverse Drift over } k \ge 3 \text{ days} \right) \ge 2$$
* **Single-Spike Immunity:** If an acute deviation occurs on day $t$ ($z_t > 2.5$) but days $t-1$ and $t+1$ remain nominal, the persistence count resets to 0. No deterioration alert is triggered.

---

## 4. RESTful API Contracts (`/api/v1`)

### 4.1 System & Scenario Management

#### `POST /api/v1/scenarios/load`
Pre-loads calibrated demonstration scenarios for hackathon judges.
* **Request:**
  ```json
  {
    "scenario_key": "SCENARIO_C_SILENT_DETERIORATION"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "SUCCESS",
    "scenario_key": "SCENARIO_C_SILENT_DETERIORATION",
    "astronaut_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "mission_id": "m1-artemis-uuid",
    "records_inserted": 36,
    "events_inserted": 4,
    "environmental_inserted": 12,
    "active_alerts_generated": 1,
    "message": "Scenario C loaded successfully. High-priority Silent Deterioration alert active."
  }
  ```

---

### 4.2 Astronaut Profiles & Mission Roster

#### `GET /api/v1/astronauts`
Returns all crew profiles with current health status summaries.
* **Response (200 OK):**
  ```json
  [
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "callsign": "ARTEMIS-01",
      "full_name": "Dr. Elena Vance",
      "mission_code": "ARTEMIS-III",
      "mission_role": "Commander & Pilot",
      "medical_clearance_status": "MEDICAL_OBSERVATION",
      "status_indicator": "REVIEW_ALERT",
      "active_alert_count": 1,
      "last_reading_time": "2026-11-14T06:30:00Z"
    }
  ]
  ```

---

### 4.3 Ingestion & Data Quality Rejection Audit

#### `POST /api/v1/observations`
Ingests single or batch health observations conforming to NASA OSDR standards.
* **Request:**
  ```json
  {
    "observations": [
      {
        "astronaut_id": "a1b2c3d4-0000-0000-0000-000000000001",
        "indicator_key": "RESTING_HEART_RATE",
        "value": 74.5,
        "unit": "bpm",
        "observation_time": "2026-11-14T06:30:00Z",
        "data_origin": "SIMULATED",
        "provenance_ref": "OSDR-ANALOG-EXP71"
      }
    ]
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "accepted_count": 1,
    "rejected_count": 0,
    "results": [
      {
        "observation_id": "obs-9876-uuid",
        "indicator_key": "RESTING_HEART_RATE",
        "quality_status": "VALID",
        "quality_notes": null
      }
    ]
  }
  ```

#### `GET /api/v1/data-quality/audit`
Returns logged rejected or suspicious sensor packets for CMO quality inspection.
* **Response (200 OK):**
  ```json
  [
    {
      "id": "aud-1234-uuid",
      "source_type": "BIOMETRIC_TELEMETRY",
      "indicator_key": "RESTING_HEART_RATE",
      "error_code": "OUT_OF_BOUNDS",
      "rejection_reason": "Value 295.0 bpm exceeds critical physiological maximum (180.0 bpm).",
      "raw_payload_blob": "{\"value\": 295.0, \"unit\": \"bpm\"}",
      "flagged_at": "2026-11-14T07:15:00Z"
    }
  ]
  ```

---

### 4.4 Multi-Indicator Timeline & Habitat Charts

#### `GET /api/v1/astronauts/{id}/timeline`
Fetches synchronized historical vitals, baseline reference bands, and environmental stressors for charting.
* **Response (200 OK):**
  ```json
  {
    "astronaut_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "window_days": 14,
    "baselines": {
      "RESTING_HEART_RATE": { "mean": 62.1, "std_dev": 2.4, "status": "ACTIVE" },
      "SLEEP_DURATION": { "mean": 7.4, "std_dev": 0.45, "status": "ACTIVE" },
      "HEART_RATE_RECOVERY_1MIN": { "mean": 28.5, "std_dev": 3.1, "status": "ACTIVE" }
    },
    "timeline_points": [
      {
        "date": "2026-11-14",
        "timestamp": "2026-11-14T06:00:00Z",
        "rhr_value": 74.0,
        "rhr_z_score": 4.95,
        "sleep_value": 5.1,
        "sleep_z_score": -5.11,
        "hrr_value": 14.0,
        "hrr_z_score": -4.67,
        "cabin_co2_ppm": 4200.0,
        "radiation_usv": 450.0,
        "mission_events": ["EVA Prep: Airlock Ingress Drill (High Intensity)"]
      }
    ]
  }
  ```

---

### 4.5 Alerts, Evidence & Clinical Countermeasures

#### `GET /api/v1/alerts/{id}/evidence`
Provides the CMO with deep clinical explainability and underlying raw data points.
* **Response (200 OK):**
  ```json
  {
    "alert_id": "alt-5555-uuid",
    "astronaut_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "callsign": "ARTEMIS-01",
    "full_name": "Dr. Elena Vance",
    "review_priority": "HIGH",
    "pattern_type": "SILENT_MULTI_INDICATOR_DETERIORATION",
    "lifecycle_status": "NEW",
    "observation_window": {
      "start": "2026-11-11T00:00:00Z",
      "end": "2026-11-14T12:00:00Z",
      "consecutive_days": 4
    },
    "detection_narrative": "Persistent synergistic drift detected across 3 indicators over 4 consecutive observation cycles. Resting Heart Rate has increased by +12.0 bpm (+4.95σ, OLS slope +2.8 bpm/day). Sleep duration has decreased by -2.3 hours (-5.11σ, OLS slope -0.65 hr/day). Post-exercise cardiac recovery has slowed by -14.0 bpm drop (-4.67σ). Environmental telemetry confirms concurrent elevation in cabin CO2 (4,200 ppm) during intensive EVA preparation.",
    "math_summary": {
      "rhr": { "baseline_mean": 62.1, "latest": 74.0, "z_score": 4.95, "slope": 2.8 },
      "sleep": { "baseline_mean": 7.4, "latest": 5.1, "z_score": -5.11, "slope": -0.65 },
      "hrr": { "baseline_mean": 28.5, "latest": 14.0, "z_score": -4.67, "slope": -3.2 }
    },
    "mission_context_notes": "Temporal correlation with EVA Preparation Schedule (3 high-intensity maintenance drills logged in past 96 hours).",
    "environmental_context_notes": "Airlock & Crew Quarters CO2 averaged 4,200 ppm (nominal < 2,500 ppm).",
    "scientific_ref": "NASA Human Research Roadmap (HRR) Risks: Sleep Loss & Work Overload (NASA/TP-2014-218556) & Cardiovascular Adaptations.",
    "rule_version": "v1.0.0-ols",
    "evidence_items": [
      {
        "evidence_id": "evi-001",
        "evidence_type": "BIOMETRIC",
        "metric_name": "RESTING_HEART_RATE",
        "observed_value": 74.0,
        "baseline_mean": 62.1,
        "z_score": 4.95,
        "contribution_summary": "4.95σ deviation from 7d baseline persisting for 4 consecutive mornings."
      }
    ],
    "countermeasures": [],
    "followup_history": []
  }
  ```

#### `POST /api/v1/alerts/{id}/countermeasures`
Allows the CMO to log a clinical prescription/intervention.
* **Request:**
  ```json
  {
    "prescribed_by": "CMO-01",
    "countermeasure_type": "SLEEP_SCHEDULE_ADJUSTMENT",
    "title": "Mandatory 60-min Sleep Extension & CO2 Scrubber Scrub",
    "prescription_details": "Prescribe 60 min supplemental sleep prior to MET Day 15 EVA. Cycle life support scrubbers in Crew Quarters to reduce CO2 < 2,000 ppm.",
    "target_duration_hours": 48
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "countermeasure_id": "cntm-7777-uuid",
    "alert_id": "alt-5555-uuid",
    "outcome_status": "ACTIVE",
    "prescribed_at": "2026-11-14T13:45:00Z"
  }
  ```

---

## 5. Frontend Component Hierarchy & User Flow

```
<App>
 └── <DashboardLayout>
      ├── <TopNavigationBar>
      │    ├── <LogoAndMissionClock> (MET: Flight Day 14, Comms Latency: 22m 14s)
      │    ├── <OfflineIndicatorBadge> (Status: Local Storage SQLite / Online)
      │    ├── <DataQualityBadge> (Active Rejection Counter & Warning Flag)
      │    └── <DemoScenarioSwitcher> (1-Click Judge Scenario Switcher)
      │
      ├── <FleetOverviewGrid>
      │    └── [<AstronautCard>] (Card per crew member: role, clearance, alert pill, sparklines)
      │
      ├── <MainReviewWorkspace>
      │    ├── <AstronautHeaderBanner> (Callsign, Role, Mission Phase, Clearance Status)
      │    │
      │    ├── <SynchronizedChartsContainer>
      │    │    ├── <CardiovascularChart> (RHR vs 7d Baseline Band ±1.5σ)
      │    │    ├── <SleepDurationChart> (Hours vs Baseline Band & Sleep Debt)
      │    │    ├── <RecoveryVelocityChart> (HRR-1 vs Baseline Recovery)
      │    │    └── <EnvironmentalChart> (Cabin CO2 ppm & Radiation Overlaid on Timeline)
      │    │
      │    ├── <MissionContextTimeline>
      │    │    └── <EventGanttTrack> (Aligns EVAs, shift changes with trend dates)
      │    │
      │    └── <AlertInspectorPanel>
      │         ├── <AlertSummaryCard> (Priority, Pattern Type, Detection Narrative)
      │         ├── <MathProvenanceDrawer> (Exact μ, σ, z-scores, OLS slopes)
      │         ├── <EvidenceTable> (Linked raw observation UUIDs, timestamps, deltas)
      │         ├── <ClinicalCountermeasureTracker> (Prescribed protocols & outcome status)
      │         └── <CMOFollowupActionBox> (Clinical notes logger, state transition selector)
      │
      └── <DataQualityAuditModal> (CMO inspector for rejected packets, sensor drops & error codes)
```
