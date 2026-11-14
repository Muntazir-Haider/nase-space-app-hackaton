# MISSION SENTINEL 🛰️
### Autonomous Astronaut Health Intelligence & Clinical Decision Support System
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Primary User:** Crew Medical Officer (CMO)  
**Architecture:** Modular Monolith — Local-First Offline Medical Workstation  
**Compliance Standard:** 14 Permanent System-Wide Development Rules (`docs/AGENT_RULES.md`)

---

## 1. The Deep-Space Operational Challenge

During deep-space exploration missions (such as NASA's **Artemis lunar campaigns** and crewed **Mars transit**), astronauts will operate far beyond Low Earth Orbit. Communication latency of up to **22 minutes each way** eliminates the possibility of interactive telemedicine oversight from Earth flight surgeons during acute or emerging situations.

The **Crew Medical Officer (CMO)** aboard the spacecraft is solely responsible for clinical surveillance and countermeasure intervention. Conventional spaceflight medical monitors rely on fixed, static threshold alarms (e.g. alarm sounds only when heart rate exceeds 160 bpm). However, physiological deconditioning in microgravity is insidious:
- Resting heart rate creeps upward over days due to cephalad fluid shift.
- Cumulative sleep debt degrades neurobehavioral vigilance and executive function.
- Post-exercise cardiovascular recovery lags behind baseline due to autonomic deconditioning.

Examined independently, each daily reading appears completely normal and below emergency thresholds. But together, they signal **Silent Deterioration**.

**Mission Sentinel** solves this challenge by analyzing multi-indicator physiological trends against individual rolling baselines, cross-correlating deviations with operational workload (EVAs) and habitat environmental stressors ($CO_2$, radiation), and delivering clinical-grade, explainable review alerts with full evidence provenance and countermeasure tracking.

---

## 2. NASA Spaceflight Hazards: The RIDGE Framework

Mission Sentinel's analytical modules map directly to NASA Human Research Program (HRP) hazards:

| Hazard Code | Spaceflight Hazard | Physiological & Operational Impact | Mission Sentinel Countermeasure / Detection |
| :--- | :--- | :--- | :--- |
| **R** | **Radiation** | Galactic cosmic rays (GCR) and solar particle events (SPE) induce cellular damage and long-term cardiovascular risks. | Tracks ambient radiation dosimetry ($\mu$Sv/day) and long-term baseline drift across extended flight timelines. |
| **I** | **Isolation & Confinement** | Circadian misalignment, sleep fragmentation, and psychological stress impair performance. | Monitors sleep duration and cumulative rest deficits correlated with operational workload; suppresses false alarms to avoid crew alarm fatigue. |
| **D** | **Distance from Earth** | Comms latency (up to 22 min to Mars) eliminates real-time Earth medical oversight. | **100% Offline-First Architecture:** Local SQLite WAL database, local analytical engine, and store-and-forward transaction queue with SHA-256 idempotency. |
| **G** | **Gravity Fields** | Cephalad fluid shifts, microgravity cardiovascular deconditioning, and delayed exercise recovery. | Tracks resting heart rate (RHR), 1-minute post-exercise recovery (HRR-1), and multi-day OLS slopes. |
| **E** | **Hostile Closed Environments** | Elevated ambient $CO_2$, rigid shift work, and high-intensity EVA workloads. | Correlates vitals with habitat telemetry ($CO_2$ up to 4,200 ppm) and mission context without false medical causation claims. |

---

## 3. Core System Innovations

1. **7-Day Rolling Personal Baseline with Bessel's Correction:**
   - Calculates individual mean ($\mu$), median ($M$), and sample standard deviation ($\sigma$ with $N-1$ degrees of freedom).
   - Enforces a minimum sample threshold ($N \ge 4$); suppresses premature alerts if data history is insufficient (`INSUFFICIENT_BASELINE_DATA`).
2. **Deterministic Silent Deterioration Engine (OLS Linear Regression):**
   - Calculates exact daily slopes: $m_{\text{RHR}} \ge +0.8\text{ bpm/day}$, $m_{\text{Sleep}} \le -0.25\text{ hr/day}$, $m_{\text{HRR}} \le -1.5\text{ bpm/day}$.
   - Enforces a $k \ge 3$ consecutive-day multi-indicator persistence gate.
3. **Single-Spike False Alarm Suppression (Alarm Fatigue Prevention):**
   - High-intensity EVA drills cause single-day acute heart rate spikes (e.g. 92 bpm on Day 5). Mission Sentinel filters isolated spikes without raising false alarms.
4. **Clinical Countermeasure Protocol Tracking:**
   - CMO can prescribe, monitor, and transition clinical countermeasures (e.g. interval ergometer sessions, sleep window expansion) directly within the alert review workflow.
5. **Store-and-Forward Offline Resilience with SHA-256 Idempotency:**
   - All state mutations are committed to SQLite and enqueued in `offline_sync_queue`.
   - Outgoing payloads are canonically hashed with SHA-256 to guarantee zero duplicate records during intermittent Deep Space Network (DSN) comms passes.
6. **Aerospace Machine Learning Benchmark:**
   - Side-by-side comparative evaluation of Deterministic Rule-Based OLS vs. Unsupervised Machine Learning (*Isolation Forest* and *Local Outlier Factor*).

---

## 4. Evaluator Demo Scenarios & Interactive Judge Tour

For the hackathon evaluation panel at **Superior University, Faisalabad**, Mission Sentinel includes a **6-Stage Interactive Judge Tour** (click `"Judge Tour"` in the top navigation bar):

- **Stage 1 (Scenario A — Nominal Baseline):** 10 days of stable flight telemetry. All crew nominal; establishes 7-day personal baselines ($\mu, M, \sigma$); 0 alerts.
- **Stage 2 (Scenario B — Acute Exertion Spike):** Astronaut conducts high-intensity EVA on Day 5; single acute spike to 92 bpm. Engine filters the spike with **0 false alarms**, proving alarm fatigue avoidance.
- **Stage 3 (Scenario C — Silent Deterioration Hero Event):** Days 8–12: Commander Dr. Elena Vance experiences multi-indicator drift under EVA prep and elevated cabin $CO_2$ (4,075 ppm). Ordinary Least Squares (OLS) regression triggers a **High-Priority Explainable Alert** on Day 11.
- **Stage 4 (Clinical Evidence Audit & Countermeasure Resolution):** Drill into raw observation UUIDs, OLS regression math, and NASA HRR evidence. Prescribe countermeasure and transition protocol to `COMPLETED`.
- **Stage 5 (Store-and-Forward Comms Flush):** Simulate a Deep Space Network (DSN) pass in Station Diagnostics, transmitting queued transactions to Earth.
- **Stage 6 (Machine Learning Benchmark):** Compare Rule-Based OLS (10/10 explainability, 0 false alarms) against Scikit-Learn Isolation Forest and LOF anomaly curves.

---

## 5. Technology Stack & Architecture

- **Backend:** Python 3.10+ / FastAPI / Pydantic v2 / SQLAlchemy 2.0 / NumPy / Scikit-Learn / SciPy / Pytest
- **Database:** SQLite 3 (14-Table Relational Schema, Write-Ahead Logging WAL, Foreign Keys Enforced)
- **Frontend:** React 18 / Vite / TypeScript 5.7 / Tailwind CSS / Recharts / Lucide Icons
- **Deployment Mode:** 100% Offline-First Local Workstation (Zero Cloud Reliance)

---

## 6. How to Run the Application Locally

### Prerequisites
- Python 3.10+ installed
- Node.js v18+ and npm installed

### Step 1: Install Backend Dependencies & Start FastAPI
```powershell
# In project root
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Station Health Check Endpoint: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### Step 2: Install Frontend Dependencies & Start React UI
```powershell
# In frontend directory
cd frontend
npm install
npm run dev
```
- Mission Sentinel Medical Review Workspace: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 7. Automated Testing & Master Acceptance Verification

### Run the Master 16-Test Acceptance Suite
The official verification harness verifying all 16 formal Acceptance Criteria:
```powershell
python -m pytest tests/test_acceptance_suite.py -v
```

### Run the Full Project Test Suite (43 Tests)
```powershell
python -m pytest tests/ -v
```

### Run Frontend Static Type Check & Production Build
```powershell
cd frontend
npx tsc --noEmit
npm run build
```

---

## 8. Master Acceptance Verification Matrix (Tests 1–16)

| # | Master Acceptance Criterion | Primary Automated Test Reference | Result |
|---|:---|:---|:---:|
| **1** | Profile Creation & SQLite Persistence | `tests/test_acceptance_suite.py::test_acceptance_01_profile_creation_and_persistence` | **PASS** |
| **2** | Valid Telemetry Ingestion & Foreign Key Integrity | `tests/test_acceptance_suite.py::test_acceptance_02_valid_measurement_ingestion` | **PASS** |
| **3** | Invalid Measurement Rejection & Audit Logging | `tests/test_acceptance_suite.py::test_acceptance_03_invalid_measurement_rejection_and_audit` | **PASS** |
| **4** | Missing Data Handling (No Nominal Assumption) | `tests/test_acceptance_suite.py::test_acceptance_04_missing_data_gap_reporting` | **PASS** |
| **5** | Stale Telemetry (>36h) Detection & Tagging | `tests/test_acceptance_suite.py::test_acceptance_05_stale_data_warning` | **PASS** |
| **6** | Baseline Statistical Correctness ($\mu, M, \sigma$ Bessel) | `tests/test_acceptance_suite.py::test_acceptance_06_baseline_statistical_correctness_bessel` | **PASS** |
| **7** | Insufficient Baseline Data State Handling ($N < 4$) | `tests/test_acceptance_suite.py::test_acceptance_07_insufficient_baseline_data_state` | **PASS** |
| **8** | Stable Pattern Invariance (10-Day Nominal Invariance) | `tests/test_acceptance_suite.py::test_acceptance_08_stable_pattern_nominal_invariance` | **PASS** |
| **9** | Isolated Acute Spike Filtering (False Alarm Suppression) | `tests/test_acceptance_suite.py::test_acceptance_09_isolated_spike_false_alarm_suppression` | **PASS** |
| **10** | Sustained Multi-Indicator Deterioration Detection | `tests/test_acceptance_suite.py::test_acceptance_10_sustained_multi_indicator_deterioration` | **PASS** |
| **11** | Mission Workload & Environmental Telemetry Correlation | `tests/test_acceptance_suite.py::test_acceptance_11_mission_and_environmental_context_correlation` | **PASS** |
| **12** | Alert Evidence Auditability & Countermeasure Prescription | `tests/test_acceptance_suite.py::test_acceptance_12_alert_evidence_audit_and_countermeasure_resolution` | **PASS** |
| **13** | 100% Offline Standalone Execution (No External Network) | `tests/test_acceptance_suite.py::test_acceptance_13_zero_external_network_dependencies` | **PASS** |
| **14** | Hard Process Restart Resilience (Disconnection & Reboot) | `tests/test_acceptance_suite.py::test_acceptance_14_process_restart_data_retention` | **PASS** |
| **15** | Store-and-Forward Queue & Idempotent Deduplication | `tests/test_acceptance_suite.py::test_acceptance_15_idempotent_synchronization_deduplication` | **PASS** |
| **16** | Mathematical Precision Verification (OLS Slopes) | `tests/test_acceptance_suite.py::test_acceptance_16_mathematical_precision_and_ols_slopes` | **PASS** |

---

## 9. Project Governance & Memory

Maintained strictly across 4 centralized project files in [`docs/`](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs):
- [`docs/REQUIREMENTS.md`](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/REQUIREMENTS.md): System specifications, physiological boundaries, and 16 acceptance criteria.
- [`docs/AGENT_RULES.md`](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/AGENT_RULES.md): 14 permanent system-wide engineering standards.
- [`docs/TASKS.md`](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/TASKS.md): Detailed phase-by-phase implementation ledger.
- [`docs/WORKLOG.md`](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/WORKLOG.md): Chronological implementation log with verification details.
