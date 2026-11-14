# MISSION SENTINEL: SYSTEM REQUIREMENTS SPECIFICATION
**Product:** Mission Sentinel  
**Subtitle:** Astronaut Health Intelligence and Medical Review Support System  
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Primary User:** Crew Medical Officer (CMO)  
**Operating Principle:** Modular, testable, evidence-based, offline-first  
**Document Status:** Approved Master Requirements (13-Table Production Architecture)  

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

## 3. Physiological & Environmental Indicators Catalog

Mission Sentinel standardizes on dynamic indicator definitions stored in the database, mapping directly to published NASA Human Research Program (HRP) evidence:

### 3.1 Indicator Group Specifications

| Indicator Group | Specific Parameter | Standard Unit | Normal Range | Critical Thresholds | NASA Rationale / Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cardiovascular** | Resting Heart Rate (RHR) | `bpm` | 50 – 85 bpm | $<35$ or $>180$ bpm | Microgravity cephalad fluid shift & cardiovascular deconditioning (NASA HRP HRR-CV). |
| **Sleep** | Total Sleep Duration | `hours` | 6.0 – 8.5 hrs | $<4.0$ or $>14.0$ hrs | Circadian disruption, microgravity sleep fragmentation (NASA HRP HRR-Sleep). |
| **Exercise & Recovery** | Heart Rate Recovery at 1 min (HRR-1) | `bpm` drop | 15 – 45 bpm | $<5$ or $>80$ bpm | Autonomic nervous system tone and exercise recovery velocity (NASA HRP Exercise). |
| **Environmental** | Cabin Carbon Dioxide ($CO_2$) | `ppm` | 400 – 2,500 ppm | $>5,000$ ppm | Spacecraft closed environment headache, hypercapnia & cardiac stress (NASA HIDH). |
| **Environmental** | Ambient Radiation Dosimetry | `uSv/day` | 200 – 600 $\mu$Sv | $>1,500$ $\mu$Sv/day | Galactic cosmic radiation and solar particle event monitoring (NASA HRP Radiation). |

### 3.2 Ingestion Observation Schema (NASA OSDR Compatible)
Every ingested observation must preserve:
- `observation_id` (UUID): Unique record identifier.
- `astronaut_id` (UUID): Profile association.
- `indicator_key` (Enum): `RESTING_HEART_RATE`, `SLEEP_DURATION`, `HEART_RATE_RECOVERY_1MIN`.
- `value` (Float): Measured numeric value.
- `unit` (String): Standardized unit (`bpm`, `hours`).
- `observation_time` (ISO 8601 UTC): When the measurement was taken.
- `recorded_time` (ISO 8601 UTC): When the system received the measurement.
- `data_origin` (Enum): `SIMULATED`, `MANUAL_ENTRY`, `RESEARCH_DATASET`.
- `provenance_ref` (String): Study ID, synthetic scenario ID, or device tag.
- `quality_status` (Enum): `VALID`, `SUSPICIOUS`, `REJECTED`, `STALE`.
- `quality_notes` (String, Optional): Explanation if flagged or rejected.

---

## 4. Analytical Engines & Core Relational Services

```
Raw Ingestion Stream
       │
       ▼
┌──────────────────────────┐
│   Data Quality Engine    │ ── Reject / Flag ──► `data_quality_audit_log`
└──────────────────────────┘
       │ Validated Data
       ▼
┌──────────────────────────┐
│ Personal Baseline Engine │ ── 7-Day Rolling Calendar Window (N ≥ 4) (μ, M, σ)
└──────────────────────────┘
       │ Active Baseline & Clean Readings
       ▼
┌──────────────────────────┐
│   Silent Deterioration   │ ── OLS Trend Slopes + z-Score Deviations
│         Engine           │ ── Multi-Indicator Persistence (≥2 metrics, ≥3 days)
│                          │ ── Workload (EVA) + Environmental (CO2) Cross-Correlation
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Explainable Alert Engine │ ── Traceable Evidence, Math Summary, Review Priority
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Clinical Action Workflow │ ── Prescribe Countermeasures, Monitor Outcomes, Log Notes
└──────────────────────────┘
```

### 4.1 Ingestion & Data Quality Engine
Validates all incoming observations prior to downstream persistence and analysis:
- **Type & Completeness Check:** Rejects null values, missing timestamps, or non-numeric values.
- **Physiological & Environmental Bounds:** Readings outside critical limits are logged to `data_quality_audit_log` with error code `OUT_OF_BOUNDS`.
- **Temporal Integrity:** Future timestamps ($t > t_{\text{current}} + 5\text{ min}$) are strictly rejected and logged with error code `FUTURE_TIMESTAMP`.
- **Duplicate Prevention:** Identical astronaut, indicator, and timestamp are rejected with error code `DUPLICATE_RECORD`.
- **Staleness Tracking:** Daily metrics older than 36 hours without a new entry trigger a `STALE` status warning on the CMO dashboard.

### 4.2 Personal Baseline Engine
Establishes an individualized physiological reference for each astronaut:
- **Calendar-Time Baseline Window:** Evaluates the preceding 7 calendar days ($T_{-7\text{d}} \le t \le T_{0}$).
- **Minimum Data Requirement:** Must contain at least **4 valid daily readings** within the 7-day period.
  - If valid samples $< 4$: Status = `INSUFFICIENT_BASELINE_DATA` (engine outputs warning; no deterioration alert generated).
  - If valid samples $\ge 4$: Status = `ACTIVE`.
- **Computed Statistical Metrics:**
  - Mean ($\mu$): Arithmetic average of valid readings.
  - Median ($M$): 50th percentile of valid readings.
  - Sample Standard Deviation ($\sigma$): Population-adjusted sample variance.
  - Baseline Version: Incremented whenever recalculated for full auditability.

### 4.3 Silent Deterioration Engine
Identifies gradual, multi-indicator physiological degradation:
- **Standardized Deviation ($z$-score):**
  $$z = \frac{x - \mu}{\sigma} \quad (\text{calculated only when } \sigma > 0)$$
- **Ordinary Least Squares (OLS) Trend Slopes:**
  Calculates linear regression slope $m$ over a 3-to-5 day sliding window:
  - *RHR Drift:* Positive slope $m \ge +0.8\text{ bpm/day}$ AND average $z \ge +1.5\sigma$.
  - *Sleep Deficit:* Negative slope $m \le -0.25\text{ hours/day}$ AND average $z \le -1.5\sigma$.
  - *Recovery Delay:* Negative slope $m \le -1.5\text{ bpm/day}$ AND average $z \le -1.5\sigma$.
- **The Persistence & Multi-Indicator Rule (Mandatory Threshold):**
  - An alert is **only** generated if **at least 2 of the 3 physiological indicators** demonstrate simultaneous adverse deviation sustained over **at least 3 consecutive daily observation cycles**.
  - **Single Spike Invariance:** An isolated single-day spike in RHR (e.g. post-exercise) or single poor night of sleep will **never** trigger a Silent Deterioration alert.
- **Mission Context & Environmental Integration:**
  - Correlates the anomaly window with recorded mission events (e.g., *High Workload: EVA Preparation*, *Sleep Shift*, *Intense Maintenance*) and habitat stressors ($CO_2$ spikes).
  - Explicitly states temporal correlation without asserting medical causation.

### 4.4 Clinical Countermeasures & Alert Lifecycle
- Every alert transitions through an auditable state machine: `NEW` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `MONITORING` $\rightarrow$ `RESOLVED`.
- The CMO can log structured `clinical_countermeasures`:
  - `SLEEP_SCHEDULE_ADJUSTMENT` (e.g. supplemental 60-min sleep cycle).
  - `HYDRATION_ELECTROLYTE_PROTOCOL` (e.g. oral electrolyte rehydration).
  - `EXERCISE_WORKLOAD_MODULATION` (e.g. reduced ARED resistance load).
  - `ACTIVE_MONITORING` (e.g. scheduled follow-up check in 24 hours).
- The system tracks whether vitals recover following countermeasure implementation.

---

## 5. Demonstration Scenarios (Hackathon Evaluator Mode)

To provide an immediate, flawless demonstration for NASA Space Apps judges at Superior University Faisalabad, Mission Sentinel features three pre-calibrated scenarios loaded in 1 click:

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

## 6. Master Acceptance Criteria (Tests 1–16)

The implementation must pass all 16 formal acceptance tests:

- [ ] **Test 1 — Profile Creation & Persistence:** Create an astronaut profile, restart the application, and confirm that the profile remains available.
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
