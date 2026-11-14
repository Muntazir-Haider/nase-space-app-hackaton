# MISSION SENTINEL: SYSTEM REQUIREMENTS, RESEARCH & ARCHITECTURE SPECIFICATION
**Product:** Mission Sentinel  
**Subtitle:** Astronaut Health Intelligence and Medical Review Support System  
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Primary User:** Crew Medical Officer (CMO)  
**Operating Principle:** Modular, testable, evidence-based, offline-first  
**Architecture Style:** Modular Monolith — Local-First Offline Medical Workstation  
**Document Status:** Approved Master Specification (14-Table Relational Schema)  

---

## 1. Executive Summary & Purpose

Mission Sentinel is an autonomous, offline-first astronaut health intelligence system designed to support the **Crew Medical Officer (CMO)** during long-duration exploration missions (such as NASA Artemis lunar operations and crewed Mars transits).

In deep-space operations beyond Low Earth Orbit, transmission delays of up to **22 minutes each way** make real-time telemedicine from Earth flight surgeons impossible during evolving situations. Mission Sentinel fills this critical operational gap by providing an autonomous, explainable decision-support system running locally on the spacecraft.

Instead of relying on naive static threshold alarms (which only trigger when an acute, dangerous medical event has already occurred), Mission Sentinel powers the **Silent Deterioration Engine** to detect subtle, multi-indicator physiological drifts from an astronaut's personal baseline over multi-day observation windows. It cross-correlates these patterns with operational workload and spacecraft environmental telemetry (e.g., elevated cabin $CO_2$ and ambient radiation), providing the CMO with an auditable, evidence-backed medical review alert and countermeasure tracking.

---

## 2. User Roles & System Boundaries

### 2.1 Single User Role: Crew Medical Officer (CMO)
The system supports exactly one application role: **Crew Medical Officer (CMO)**.
* **Core Capabilities:**
  - View overall crew fleet readiness across mission modules and drill into individual astronaut profiles.
  - Review live/ingested health telemetry and inspect the **Data Quality Audit Log** for sensor dropouts and rejected packets.
  - Inspect calculated 7-day rolling personal baselines and statistical distributions ($\mu, M, \sigma$).
  - Review Silent Deterioration alerts, drill down into raw evidence, and inspect underlying mathematical logic.
  - Correlate physiological trends with mission timelines (EVAs, workload, sleep shifts) and habitat environmental telemetry ($CO_2$, radiation).
  - Prescribe and track **Clinical Countermeasures** (e.g. sleep extensions, rehydration, workload modulation) and append review notes.
  - Switch demonstration scenarios for hackathon evaluation in 1 click.
* **Out of Scope for Version 1.0:**
  - Astronaut individual self-monitoring logins (avoiding crew alarm fatigue; all reviews flow through CMO).
  - Terrestrial Flight Surgeon remote logins (deep-space comms latency renders remote access secondary).
  - Multi-tenant cloud administration.

### 2.2 Medical & Ethical Boundaries
* **Decision Support Only:** Mission Sentinel is an advisory intelligence system; it does **not** diagnose pathology, prescribe medications, or replace human medical judgment.
* **Informational Alerts:** Alerts are classified as *application-defined review priorities* (`LOW`, `MEDIUM`, `HIGH`) requiring human clinical evaluation, never automated medical diagnoses.

---

## 3. NASA Space Apps Challenge Alignment & Research Dossier

### 3.1 Challenge Problem Statement & Solution Alignment
* **Challenge Title:** Create Health Monitoring Software for Astronauts on Space Missions  
* **Official URL:** [NASA Space Apps Challenge](https://www.spaceappschallenge.org/)  
* **Local Event:** [NASA Space Apps Faisalabad — Superior University](https://www.spaceappschallenge.org/2026/local-events/faisalabad)  
* **Challenge Problem Statement:** Long-duration space missions (such as NASA's Artemis lunar campaigns and crewed transit to Mars) isolate human crews from terrestrial medical infrastructure. Real-time communication delays (up to 22 minutes one-way to Mars) render direct, interactive telemedicine from Earth impossible during acute scenarios. Spacecraft crews, led by the Crew Medical Officer (CMO), require autonomous, offline-capable software to continuously monitor health indicators, detect emerging physiological anomalies early, and provide actionable, explainable decision support.

Mission Sentinel directly addresses this challenge through:
1. **Targeted Role:** Tailored specifically for the **Crew Medical Officer (CMO)**, avoiding generic civilian fitness tracker cliches and providing clinical-grade decision support.
2. **Autonomous Offline-First Architecture:** Operates 100% locally on spacecraft workstations without requiring telemetry sync with Earth.
3. **Silent Deterioration Engine:** Overcomes naive single-threshold alarms by analyzing multi-indicator trends, individual baseline deviations, and operational workload context.
4. **Transparent Explainability:** Every alert presents full evidence provenance, baseline math, and observation windows to empower human medical judgment.

### 3.2 NASA Human Spaceflight Hazards: The RIDGE Framework
NASA’s Human Research Program classifies spaceflight stressors into five primary hazards known as **RIDGE**. Mission Sentinel's analytical modules map directly to these hazards:

| Hazard Code | Spaceflight Hazard | Physiological & Operational Impact | Mission Sentinel Countermeasure / Detection |
| :--- | :--- | :--- | :--- |
| **R** | **Radiation** | Galactic cosmic rays (GCR) and solar particle events (SPE) induce cellular damage, immune dysregulation, and long-term cardiovascular risks. | Tracks ambient radiation telemetry ($\mu$Sv/day) and long-term baseline shifts across extended mission timelines. |
| **I** | **Isolation & Confinement** | Monotonous environment, circadian misalignment, sleep fragmentation, and psychological stress impair performance. | Monitors sleep duration, sleep continuity, and cumulative rest deficits correlated with workload. |
| **D** | **Distance from Earth** | Communication latency (up to 22 min to Mars) and communication blackouts eliminate real-time Earth medical oversight. | **Zero-cloud requirement:** Local SQLite database, local Python analytical engine, and local browser dashboard. |
| **G** | **Gravity Fields** | Cephalad fluid shifts, microgravity cardiovascular deconditioning, muscle atrophy, and post-exercise recovery lag. | Continuous tracking of resting heart rate (RHR), exercise recovery (HRR-1), and baseline cardiovascular drift. |
| **E** | **Hostile Closed Environments** | Elevated ambient $CO_2$, continuous acoustic noise, rigid operational shifts, and intense EVA workloads. | Correlates physiological changes with habitat telemetry ($CO_2$) and mission context (e.g., EVA preparation, heavy maintenance, schedule shifts). |

*Reference:* NASA Human Spaceflight Hazards: https://www.nasa.gov/hrp/hazards/

### 3.3 NASA Human Research Program (HRP) Evidence & Roadmap
Mission Sentinel bases its physiological indicators, baseline modeling, and alert thresholds on published evidence reports from the **NASA Human Research Roadmap (HRR)**:

1. **Sleep, Circadian Rhythm, and Workload:**
   - *HRP Risk Title:* *Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload*
   - *NASA Evidence Source:* [NASA Human Research Roadmap — Sleep Loss](https://humanresearchroadmap.nasa.gov/)
   - *Scientific Finding:* Astronauts on the ISS average between 6.0 and 6.4 hours of sleep per night—significantly below the terrestrial 7.5–8.0 hour recommendation. Chronic sleep debt impairs neurobehavioral vigilance, executive decision-making, and autonomic cardiac stability.
   - *Mission Sentinel Application:* Indicator: Sleep Duration (`hours/night`). Normal Baseline: $\mathcal{N}(\mu=7.4, \sigma=0.45\text{ hr})$. Deterioration Drift: Drops to $\le 5.2\text{ hr}$ ($z \le -2.0\sigma$, OLS slope $\le -0.25\text{ hr/day}$).

2. **Cardiovascular Deconditioning:**
   - *HRP Risk Title:* *Risk of Cardiovascular Adaptations Contributing to Adverse Mission Performance and Health Outcomes*
   - *NASA Evidence Source:* [NASA HRP Cardiovascular Risk](https://www.nasa.gov/hrp/risks/)
   - *Scientific Finding:* In microgravity, the absence of hydrostatic pressure gradients leads to an upward fluid shift (cephalad redistribution), reducing circulating plasma volume and altering baroreflex sensitivity. Over time, astronauts experience resting heart rate elevation, autonomic tone shifts, and decreased exercise capacity.
   - *Mission Sentinel Application:* Indicator: Resting Heart Rate (`bpm`). Normal Baseline: $\mathcal{N}(\mu=62.0, \sigma=2.5\text{ bpm})$. Deterioration Drift: Creeps upward to $\ge 74.0\text{ bpm}$ ($z \ge +2.0\sigma$, OLS slope $\ge +0.8\text{ bpm/day}$). Resilience to Spikes: Single-day spikes (e.g. 92 bpm during high exertion) do not trigger deterioration alerts.

3. **Physical Exercise and Cardiovascular Recovery:**
   - *HRP Risk Title:* *Risk of Impaired Performance and Decrements in Health Due to Inadequate Physical Exercise*
   - *NASA Evidence Source:* NASA Technical Reports Server (NTRS) & Life Sciences Portal
   - *Scientific Finding:* Countermeasure exercise (ARED resistance training and T2 cycle/treadmill) is mandatory on orbit. A declining rate of heart rate recovery post-exercise is a verified indicator of autonomic fatigue, cardiovascular deconditioning, and systemic strain.
   - *Mission Sentinel Application:* Indicator: Heart Rate Recovery at 1 minute (HRR-1 in `bpm drop`). Normal Baseline: $\mathcal{N}(\mu=28.0, \sigma=3.0\text{ bpm drop})$. Deterioration Drift: Drops below $15.0\text{ bpm drop}$ ($z \le -2.0\sigma$, OLS slope $\le -1.5\text{ bpm/day}$).

### 3.4 Open Science Data Repository (OSDR) & LSDA Data Governance Reality
- **Data Availability Research:** Real human spaceflight physiological telemetry (such as astronaut electrocardiograms, continuous polysomnography, and personal flight medical records) is governed by the **NASA Life Sciences Data Archive (LSDA)** and **Lifetime Surveillance of Astronaut Health (LSAH)**. Under federal regulations and astronaut privacy protections (HIPAA / Privacy Act), raw identifiable human astronaut biometrics are **controlled-access** and not freely downloadable public files.
- **Open-Access OSDR Holdings:** NASA OSDR openly hosts non-human model organism spaceflight data (e.g. rodent genomics, cell cultures, plant microgravity assays: `OSD-729`, `OSD-1010`), and published summary research statistics.
- **Data Provenance Rule (Zero Hallucination):** Mission Sentinel strictly avoids fabricating "real" NASA astronaut files. Our synthetic demonstration data generators use parametric Gaussian distributions mathematically grounded in published NASA HRP evidence reports, and all records are explicitly tagged with `data_origin: "SIMULATED"` and provenance metadata.

---

## 4. Physiological & Environmental Indicators Catalog

| Indicator Group | Specific Parameter | Standard Unit | Normal Range | Critical Thresholds | NASA Rationale / Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cardiovascular** | Resting Heart Rate (RHR) | `bpm` | 50 – 85 bpm | $<35$ or $>180$ bpm | Microgravity cephalad fluid shift & cardiovascular deconditioning (NASA HRP HRR-CV). |
| **Sleep** | Total Sleep Duration | `hours` | 6.0 – 8.5 hrs | $<4.0$ or $>14.0$ hrs | Circadian disruption, microgravity sleep fragmentation (NASA HRP HRR-Sleep). |
| **Exercise & Recovery** | Heart Rate Recovery at 1 min (HRR-1) | `bpm` drop | 15 – 45 bpm | $<5$ or $>80$ bpm | Autonomic nervous system tone and exercise recovery velocity (NASA HRP Exercise). |
| **Environmental** | Cabin Carbon Dioxide ($CO_2$) | `ppm` | 400 – 2,500 ppm | $>5,000$ ppm | Spacecraft closed environment headache, hypercapnia & cardiac stress (NASA HIDH). |
| **Environmental** | Ambient Radiation Dosimetry | `uSv/day` | 200 – 600 $\mu$Sv | $>1,500$ $\mu$Sv/day | Galactic cosmic radiation and solar particle event monitoring (NASA HRP Radiation). |

### Ingestion Observation Schema (NASA OSDR Compatible)
Every ingested observation must preserve:
- `observation_id` (UUID): Unique record identifier.
- `astronaut_id` (UUID): Profile association.
- `indicator_key` (Enum): `RESTING_HEART_RATE`, `SLEEP_DURATION`, `HEART_RATE_RECOVERY_1MIN`.
- `value` (Float): Measured numeric value.
- `unit` (String): Standardized unit (`bpm`, `hours`).
- `observation_time` (ISO 8601 UTC): When measurement was taken.
- `recorded_time` (ISO 8601 UTC): Database ingestion timestamp.
- `data_origin` (Enum): `SIMULATED`, `MANUAL_ENTRY`, `RESEARCH_DATASET`.
- `provenance_ref` (String): Dataset or scenario identifier.
- `quality_status` (Enum): `VALID`, `SUSPICIOUS`, `REJECTED`, `STALE`.
- `quality_notes` (String, Optional): Explanation if flagged.

---

## 5. System Architecture & Complete 14-Table Relational Schema

### 5.1 Architecture Overview
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CREW MEDICAL OFFICER (CMO) UI                                  │
│   React 18 (Vite) + TypeScript + Tailwind CSS + Recharts + Lucide Icons                          │
│   - Mission Control Dark-Theme Medical Review Dashboard                                          │
│   - Modular Navigation: Fleet Overview, Astronaut Detail, Profile Registration, System Status    │
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
│   Python 3.10+ / FastAPI / Pydantic v2 / SQLAlchemy 2.0 / NumPy                                  │
│   - Centralized Exception Handling (`AppError` envelope) & Structured Logging                    │
│   - Data Quality Engine (7-Point Audit Verification)                                             │
│   - Personal Baseline Engine (7-Day Rolling Window, Bessel's Correction)                         │
│   - Silent Deterioration Engine (OLS Slopes + z-Score Persistence + Workload/CO2 Correlation)    │
│   - Clinical Review Services & Offline Synchronization Queue (Idempotency Ledger)                │
└───────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                │ SQLite Driver (WAL Mode, Foreign Keys Enforced)
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  LOCAL RELATIONAL DATABASE (SQLite)                              │
│   - Local file: `data/sentinel.db` (14 Tables, Strict Relational Constraints, WAL Journaling)    │
│   - 100% Offline Persistence; Survives System Power Cycles and Process Restarts                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 14-Table SQLite DDL
Foreign key enforcement (`PRAGMA foreign_keys = ON;`) is enabled on every connection. All timestamps are ISO 8601 UTC strings.

```sql
-- 1. Missions Metadata
CREATE TABLE missions (
    id TEXT PRIMARY KEY,
    mission_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    target_destination TEXT NOT NULL,
    spacecraft_module TEXT NOT NULL,
    flight_day INTEGER NOT NULL DEFAULT 1,
    comms_latency_seconds INTEGER NOT NULL,
    status TEXT NOT NULL,
    start_date TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 2. Astronaut Profiles
CREATE TABLE astronaut_profiles (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    callsign TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    flight_role TEXT NOT NULL,
    medical_clearance_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT
);
CREATE INDEX idx_astronaut_mission ON astronaut_profiles(mission_id);

-- 3. Indicator Definitions Catalog
CREATE TABLE indicator_definitions (
    id TEXT PRIMARY KEY,
    indicator_key TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    display_name TEXT NOT NULL,
    standard_unit TEXT NOT NULL,
    nominal_min REAL NOT NULL,
    nominal_max REAL NOT NULL,
    critical_min REAL NOT NULL,
    critical_max REAL NOT NULL,
    sampling_frequency_hours REAL NOT NULL,
    nasa_hrp_reference TEXT NOT NULL,
    description TEXT NOT NULL
);

-- 4. Health Observations
CREATE TABLE health_observations (
    id TEXT PRIMARY KEY,
    astronaut_id TEXT NOT NULL,
    indicator_id TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    observation_time TEXT NOT NULL,
    recorded_time TEXT NOT NULL,
    data_origin TEXT NOT NULL,
    provenance_ref TEXT NOT NULL,
    quality_status TEXT NOT NULL,
    quality_notes TEXT,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (indicator_id) REFERENCES indicator_definitions(id) ON DELETE RESTRICT
);
CREATE INDEX idx_obs_astro_ind_time ON health_observations(astronaut_id, indicator_id, observation_time);

-- 5. Environmental Telemetry
CREATE TABLE environmental_telemetry (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    habitat_zone TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    quality_status TEXT NOT NULL,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT
);
CREATE INDEX idx_env_mission_time ON environmental_telemetry(mission_id, timestamp);

-- 6. Data Quality Audit Log
CREATE TABLE data_quality_audit_log (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    raw_payload_blob TEXT NOT NULL,
    astronaut_id TEXT,
    indicator_key TEXT,
    error_code TEXT NOT NULL,
    rejection_reason TEXT NOT NULL,
    flagged_at TEXT NOT NULL
);
CREATE INDEX idx_audit_time ON data_quality_audit_log(flagged_at);

-- 7. Personal Baselines
CREATE TABLE personal_baselines (
    id TEXT PRIMARY KEY,
    astronaut_id TEXT NOT NULL,
    indicator_id TEXT NOT NULL,
    window_start TEXT NOT NULL,
    window_end TEXT NOT NULL,
    sample_count INTEGER NOT NULL,
    mean REAL NOT NULL,
    median REAL NOT NULL,
    std_dev REAL NOT NULL,
    status TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    calculated_at TEXT NOT NULL,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (indicator_id) REFERENCES indicator_definitions(id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX idx_baseline_version ON personal_baselines(astronaut_id, indicator_id, version);

-- 8. Mission Events
CREATE TABLE mission_events (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    astronaut_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    workload_intensity TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE
);
CREATE INDEX idx_events_astro_time ON mission_events(astronaut_id, start_time, end_time);

-- 9. Analysis Runs Audit History
CREATE TABLE analysis_runs (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    run_type TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    status TEXT NOT NULL,
    observations_evaluated_count INTEGER NOT NULL,
    alerts_generated_count INTEGER NOT NULL,
    execution_duration_ms INTEGER NOT NULL,
    executed_at TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE RESTRICT
);

-- 10. Deterioration Alerts
CREATE TABLE deterioration_alerts (
    id TEXT PRIMARY KEY,
    astronaut_id TEXT NOT NULL,
    analysis_run_id TEXT NOT NULL,
    review_priority TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    lifecycle_status TEXT NOT NULL,
    window_start TEXT NOT NULL,
    window_end TEXT NOT NULL,
    detection_narrative TEXT NOT NULL,
    math_summary TEXT NOT NULL,
    mission_context_notes TEXT NOT NULL,
    environmental_context_notes TEXT,
    scientific_ref TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id) ON DELETE RESTRICT
);
CREATE INDEX idx_alert_astro_status ON deterioration_alerts(astronaut_id, lifecycle_status);

-- 11. Alert Evidence Links
CREATE TABLE alert_evidence_links (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL,
    observation_id TEXT,
    environmental_telemetry_id TEXT,
    evidence_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    observed_value REAL NOT NULL,
    baseline_mean REAL,
    z_score REAL,
    ols_slope REAL,
    contribution_summary TEXT NOT NULL,
    FOREIGN KEY (alert_id) REFERENCES deterioration_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (observation_id) REFERENCES health_observations(id) ON DELETE RESTRICT,
    FOREIGN KEY (environmental_telemetry_id) REFERENCES environmental_telemetry(id) ON DELETE RESTRICT
);
CREATE INDEX idx_evidence_alert ON alert_evidence_links(alert_id);

-- 12. Clinical Countermeasures
CREATE TABLE clinical_countermeasures (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL,
    astronaut_id TEXT NOT NULL,
    prescribed_by TEXT NOT NULL,
    countermeasure_type TEXT NOT NULL,
    title TEXT NOT NULL,
    prescription_details TEXT NOT NULL,
    target_duration_hours INTEGER NOT NULL,
    outcome_status TEXT NOT NULL,
    prescribed_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (alert_id) REFERENCES deterioration_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE
);
CREATE INDEX idx_countermeasure_astro ON clinical_countermeasures(astronaut_id, outcome_status);

-- 13. CMO Follow-ups Log
CREATE TABLE cmo_followups (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL,
    astronaut_id TEXT NOT NULL,
    reviewer_callsign TEXT NOT NULL,
    review_notes TEXT NOT NULL,
    status_transition TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (alert_id) REFERENCES deterioration_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (astronaut_id) REFERENCES astronaut_profiles(id) ON DELETE CASCADE
);
CREATE INDEX idx_followup_alert ON cmo_followups(alert_id);

-- 14. Offline Sync Transaction Queue (Idempotency Ledger)
CREATE TABLE offline_sync_queue (
    id TEXT PRIMARY KEY,
    transaction_type TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    idempotency_hash TEXT NOT NULL UNIQUE,
    payload_json TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_sync_status ON offline_sync_queue(sync_status);
```

---

## 6. Mathematical Foundations: Baseline & Detection Engines

### 6.1 7-Day Calendar-Time Rolling Baseline
For an astronaut $A$ and indicator $I$, evaluated at reference timestamp $T_0$:
- **Calendar Time Window:** $W = [T_0 - 7\text{ days}, T_0]$.
- **Valid Observations Subset:** $\{x_1, x_2, \dots, x_N\} \subset W$ where $\text{quality\_status} = \text{'VALID'}$.
- **Sample Threshold:**
  - If $N < 4$: Status is `INSUFFICIENT_BASELINE_DATA`. (Calculations aborted; dashboard flags insufficient history).
  - If $N \ge 4$: Status is `ACTIVE`.
- **Formulas with Bessel's Correction ($N-1$ degrees of freedom):**
  $$\mu = \frac{1}{N}\sum_{i=1}^N x_i$$
  $$\sigma = \sqrt{\frac{1}{N-1}\sum_{i=1}^N (x_i - \mu)^2} \quad (\text{if } \sigma = 0, \text{ fallback to } \sigma_{\text{default}} = 0.01)$$
  $$M = \begin{cases} x_{\left(\frac{N+1}{2}\right)} & \text{if } N \text{ is odd} \\ \frac{1}{2}\left(x_{\left(\frac{N}{2}\right)} + x_{\left(\frac{N}{2}+1\right)}\right) & \text{if } N \text{ is even} \end{cases}$$

### 6.2 Standardized Deviation ($z$-score)
For any observation $x_t$:
$$z_t = \frac{x_t - \mu}{\sigma}$$

### 6.3 Ordinary Least Squares (OLS) Linear Regression Trend
To detect true directional drift across a multi-day observation window $\{ (t_1, y_1), (t_2, y_2), \dots, (t_k, y_k) \}$ (where $k \ge 3$, and $t_i$ is elapsed days from window start):
$$\bar{t} = \frac{1}{k}\sum_{i=1}^k t_i, \quad \bar{y} = \frac{1}{k}\sum_{i=1}^k y_i$$
$$\text{Slope } m = \frac{\sum_{i=1}^k (t_i - \bar{t})(y_i - \bar{y})}{\sum_{i=1}^k (t_i - \bar{t})^2}$$

* **Directional Drift Criteria:**
  - **Resting Heart Rate (RHR):** Positive slope $m_{\text{RHR}} \ge +0.8\text{ bpm/day}$ AND average $z \ge +1.5\sigma$.
  - **Sleep Duration:** Negative slope $m_{\text{Sleep}} \le -0.25\text{ hours/day}$ AND average $z \le -1.5\sigma$.
  - **Exercise Recovery (HRR-1):** Negative slope $m_{\text{HRR}} \le -1.5\text{ bpm/day}$ AND average $z \le -1.5\sigma$.

### 6.4 Multi-Indicator Persistence Rule
* **Persistence Window:** $k \ge 3$ consecutive daily cycles.
* **Alert Trigger:** An alert is generated if and only if:
  $$\text{Count}\left( \text{Indicators with Adverse Drift over } k \ge 3 \text{ days} \right) \ge 2$$
* **Single-Spike Immunity:** If an acute deviation occurs on day $t$ ($z_t > 2.5$) but days $t-1$ and $t+1$ remain nominal, the persistence count resets to 0. No deterioration alert is triggered.

---

## 7. RESTful API Contracts (`/api/v1`)

### 7.1 System, Scenarios & Profiles
- `GET /api/v1/health`: Station health, database engine, table counts, offline status.
- `POST /api/v1/scenarios/load`: 1-click loading of pre-calibrated demonstration scenarios.
- `GET /api/v1/astronauts`: Roster of all crew profiles with clearance status and active alert counts.
- `POST /api/v1/astronauts`: Register a new astronaut profile with callsign, flight role, and mission link.
- `GET /api/v1/missions`: List active missions and exploration context.

### 7.2 Telemetry, Data Quality & Baselines
- `POST /api/v1/observations`: Ingestion endpoint with 7-point data quality audit verification.
- `GET /api/v1/data-quality/audit`: Rejection audit log displaying dropped/suspicious packets.
- `GET /api/v1/astronauts/{id}/timeline`: Synchronized multi-indicator timeline with 7d baseline bands and environmental readings.
- `GET /api/v1/astronauts/{id}/baseline`: Active statistical baseline parameters ($\mu, M, \sigma$).

### 7.3 Alerts, Evidence & Countermeasures
- `GET /api/v1/alerts`: List active/historical alerts filtered by astronaut, priority, or status.
- `GET /api/v1/alerts/{id}/evidence`: Full clinical evidence breakdown with underlying observation IDs and OLS slopes.
- `POST /api/v1/alerts/{id}/countermeasures`: Prescribe and track clinical countermeasures.
- `POST /api/v1/alerts/{id}/followup`: Append CMO clinical review notes and transition lifecycle state.
- `GET /api/v1/sync/status`: Inspect offline synchronization queue status and pending items.

---

## 8. Demonstration Scenarios (Hackathon Evaluator Mode)

1. **Scenario A — Nominal Spaceflight Baseline (Stable):**
   - Artemis crew member with 10 days of stable data within normal physiological variance.
   - Outcome: Baseline is `ACTIVE`, system is green, 0 alerts triggered. Demonstrates nominal monitoring.
2. **Scenario B — Isolated Exertion Spike (False Alarm Resilience):**
   - Crew member undergoes high-intensity EVA simulation on Day 5; single acute RHR spike to 95 bpm, recovering the next day.
   - Outcome: Data Quality marks reading valid; Silent Deterioration Engine correctly filters the spike as an isolated event; **no deterioration alert generated**. Demonstrates avoidance of alert fatigue.
3. **Scenario C — Silent Deterioration (The Winning Hero Scenario):**
   - Days 1–7: Clean personal baseline established.
   - Days 8–12: Under heavy EVA preparation and elevated cabin $CO_2$ (4,200 ppm), RHR creeps up from 62 to 74 bpm ($+2.1\sigma$), sleep duration declines from 7.5 to 5.2 hours/night ($-2.3\sigma$), and HRR-1 drops from 28 to 14 bpm drop.
   - Outcome: Multi-indicator persistence threshold reached on Day 11; **High-Priority Explainable Alert generated** detailing the tri-indicator drift, baseline variance, workload correlation, cabin $CO_2$ stress, and NASA HRP evidence citations. CMO prescribes a countermeasure protocol directly from the alert modal.

---

## 9. Frontend Component Hierarchy & User Flow

```
<App>
 └── <DashboardLayout>
      ├── <TopNavigationBar>
      │    ├── <LogoAndMissionClock> (MET: Flight Day 14, Comms Latency: 22m 14s)
      │    ├── <OfflineIndicatorBadge> (Station Online / Offline Local Persistence)
      │    ├── <ViewNavigationTabs> (Fleet Roster, Detail View, New Profile, System Status)
      │    ├── <DataQualityBadge> (Active Rejection Counter & Warning Flag)
      │    └── <DemoScenarioSwitcher> (1-Click Judge Scenario Switcher)
      │
      ├── <OfflineNoticeBanner> (Displays when backend is unreachable with recovery steps)
      │
      ├── <ViewRouter>
      │    ├── <FleetOverviewGrid> (Crew cards, clearance pills, quick actions)
      │    ├── <AstronautProfileDetail> (Timeline, Synchronized Charts, Baseline Cards, Alert Inspector)
      │    ├── <ProfileRegistrationModal> (Form for adding new astronaut with validation)
      │    └── <SystemStatusView> (Database file details, table row counts, sync queue status)
      │
      ├── <AlertInspectorModal> (Evidence breakdown, OLS slopes, countermeasure prescriptions)
      └── <DataQualityAuditModal> (Dropped packets, rejection reasons, raw payload blobs)
```

---

## 10. Master Acceptance Criteria (Tests 1–16)

The implementation must pass all 16 formal acceptance tests:

- [ ] **Test 1 — Profile Creation & Persistence:** Create an astronaut profile via UI/API, restart the application, and confirm that the profile remains available in SQLite.
- [ ] **Test 2 — Valid Measurement Ingestion:** Submit valid readings for all indicators; confirm persistence with correct units, timestamps, and foreign keys.
- [ ] **Test 3 — Invalid Measurement Rejection & Audit Logging:** Submit invalid units or out-of-bound physiological values; confirm explicit rejection and verification in `data_quality_audit_log`.
- [ ] **Test 4 — Missing Data Handling:** Simulate a skipped observation day; confirm the system reports a missing data gap rather than assuming nominal health.
- [ ] **Test 5 — Stale Data Warning:** Ingest an observation older than 36 hours; confirm it is marked `STALE`.
- [ ] **Test 6 — Baseline Statistical Correctness:** Ingest $\ge 4$ valid readings over a 7-day calendar window; confirm mean, median, and sample standard deviation match hand-calculated values.
- [ ] **Test 7 — Insufficient Baseline Data State:** Ingest $< 4$ valid readings; confirm baseline reports `INSUFFICIENT_BASELINE_DATA` and blocks premature alert generation.
- [ ] **Test 8 — Stable Pattern Invariance:** Ingest 10 days of nominal data; confirm zero deterioration alerts are triggered.
- [ ] **Test 9 — Isolated Spike Filtering:** Introduce a single acute RHR spike; confirm the engine suppresses false alarms and does not generate a multi-indicator alert.
- [ ] **Test 10 — Sustained Multi-Indicator Deterioration:** Ingest Scenario C data; confirm the engine flags a high-priority alert when $\ge 2$ indicators deviate across $\ge 3$ consecutive days.
- [ ] **Test 11 — Mission & Environmental Context Temporal Alignment:** Ingest mission workload (EVA) and environmental telemetry ($CO_2$); confirm timeline displays correlation without claiming medical causation.
- [ ] **Test 12 — Alert Evidence Auditability & Countermeasure Prescription:** Open an alert; confirm all underlying observation IDs, baseline parameters, and detection narratives are accessible, and log a clinical countermeasure.
- [ ] **Test 13 — 100% Offline Execution:** Disconnect network interface; verify all dashboard views, charts, baseline math, and alert inspection operate flawlessly.
- [ ] **Test 14 — Process Restart Resilience:** Terminate backend/frontend processes, reboot, and verify 100% data retention from SQLite.
- [ ] **Test 15 — Idempotent Synchronization / Deduplication:** Re-submit duplicate observation payloads; confirm zero duplicate records created in SQLite using `offline_sync_queue` idempotency hashes.
- [ ] **Test 16 — Mathematical Precision Verification:** Run automated test assertions verifying decimal precision and OLS regression slopes against independent Python/NumPy calculations.

---

## 11. Master Evidence and Reference Directory

| # | Reference Name | Host / Agency | Canonical URL | Purpose in Mission Sentinel |
|---|:---|:---|:---|:---|
| 1 | NASA Space Apps Challenge | NASA | https://www.spaceappschallenge.org/ | Hackathon parent challenge specification. |
| 2 | Faisalabad Local Event 2026 | NASA Space Apps / Superior Univ | https://www.spaceappschallenge.org/2026/local-events/faisalabad | Official local hackathon event portal. |
| 3 | NASA Human Research Roadmap (HRR) | NASA HRP | https://humanresearchroadmap.nasa.gov/ | Authoritative source for spaceflight medical risks and evidence. |
| 4 | NASA Human Spaceflight Hazards | NASA HRP | https://www.nasa.gov/hrp/hazards/ | RIDGE framework grounding. |
| 5 | NASA Human Spaceflight Risks | NASA HRP | https://www.nasa.gov/hrp/risks/ | Specific risk documentation (Cardiovascular & Sleep). |
| 6 | NASA Open Science Data Repository (OSDR) | NASA Biological & Physical Sciences | https://osdr.nasa.gov/ | Telemetry and physiological data schema standard. |
| 7 | NASA OSDR Information & FAQ | NASA Science | https://science.nasa.gov/biological-physical/data/osdr/ | Data ingestion protocols and licensing rules. |
| 8 | NASA Life Sciences Portal (NLSP) | NASA Life Sciences | https://nlsp.nasa.gov/ | Space analog and flight historical data repository. |
| 9 | NASA Technical Reports Server (NTRS) | NASA STI | https://ntrs.nasa.gov/ | Published aerospace medicine and decision-support whitepapers. |
| 10 | Canadian Space Agency (CSA) Health Tech | CSA / ASC | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp | Wearable telemetry research and autonomous monitoring context. |
| 11 | PhysioNet Physiological Research | MIT / NIH | https://physionet.org/ | External physiological benchmarking and baseline modeling principles. |
