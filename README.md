# MISSION SENTINEL 🛰️
### Astronaut Health Intelligence and Medical Review Support System
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Core Innovation:** Explainable Silent Deterioration Detection for Deep-Space Crew Medical Officers  
**Architecture:** Modular Monolith — Local-First Offline Medical Workstation  

---

## 1. The Deep-Space Operational Challenge

During deep-space exploration missions (such as NASA's **Artemis lunar campaigns** and crewed **Mars transit**), astronauts will operate far beyond Low Earth Orbit. Transmission latencies of up to **22 minutes each way** eliminate the possibility of real-time telemedicine oversight from Earth flight surgeons. 

The **Crew Medical Officer (CMO)** aboard the spacecraft is solely responsible for clinical decision-making. Conventional spaceflight medical monitors rely on fixed, static threshold alarms (e.g. sound an alarm when heart rate exceeds 160 bpm). However, physiological deconditioning in microgravity is insidious:
- Resting heart rate creeps upward over days.
- Cumulative sleep debt degrades neurocognitive performance.
- Post-exercise cardiovascular recovery lags behind baseline.

Examined independently, each measurement appears completely normal and below emergency thresholds. But together, they signal **Silent Deterioration**.

**Mission Sentinel** solves this challenge by analyzing multi-indicator physiological trends against individual rolling baselines, cross-correlating deviations with mission workload and habitat environmental stressors ($CO_2$, radiation), and delivering clinical-grade, explainable review alerts with full evidence provenance and countermeasure tracking.

---

## 2. Core Capabilities

- **Single Role Focus (CMO):** Tailored specifically for the Crew Medical Officer, delivering high-density, mission-control medical intelligence without consumer fitness app clutter.
- **7-Day Calendar-Time Rolling Baseline:** Establishes individual physiological reference states ($\mu, M, \sigma$) requiring a minimum valid sample threshold ($N \ge 4$) to avoid premature conclusions.
- **Silent Deterioration Engine:** Uses Ordinary Least Squares (OLS) regression slopes and standardized deviations ($z$-scores) across multiple correlated indicators (Resting HR, Sleep Duration, and 1-Minute Heart Rate Recovery).
- **Environmental & Workload Context:** Correlates physiological changes with EVA preparation drills, sleep schedule shifts, and cabin $CO_2$ spikes (NASA RIDGE framework).
- **Persistence Rule & Single-Spike Rejection:** Requires adverse deviations to persist across $\ge 2$ indicators for $\ge 3$ consecutive days. Isolated acute exertion spikes will **never** trigger false alarms.
- **Explainable Evidence Inspector:** Every alert links directly to raw observation UUIDs, mathematical deviation metrics, mission schedule context, and official NASA Human Research Program (HRP) Evidence Reports.
- **Clinical Countermeasure Action Tracker:** Enables the CMO to prescribe and monitor clinical protocols (sleep extension, hydration, workload modulation) directly within the alert review workflow.
- **100% Offline-First Execution:** Operates completely on a local workstation using FastAPI and SQLite (13-table production relational schema); zero dependency on cloud internet connectivity.

---

## 3. Project Documentation Directory (`/docs`)

All project specifications, architectural blueprints, research dossiers, and tracking logs are organized within the [`docs/`](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs) directory:

```
Nasa Space App/
├── README.md                      <-- Root Entrypoint, Project Overview & Architecture Guide
└── docs/                          <-- Centralized Documentation & Technical Specifications
    ├── AGENT_RULES.md             <-- AI Agent Operating Protocol, Pre-flight Checks & Enforceable Rules
    ├── TASKS.md                   <-- Active Implementation Tracker with Explicit Test Conditions
    ├── WORKLOG.md                 <-- Append-Only Chronological Audit Log
    ├── REQUIREMENTS.md            <-- System Spec, Dynamic Indicators, Engine Math & 16 Acceptance Tests
    ├── ARCHITECTURE.md            <-- 13-Table SQLite DDL Schemas, REST API Contracts & Component Tree
    └── RESEARCH_AND_REFERENCES.md <-- NASA HRP Evidence, RIDGE Hazards, OSDR Schemas & Citations
```

| Document | Primary Contents |
| :--- | :--- |
| **[docs/AGENT_RULES.md](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/AGENT_RULES.md)** | Mandatory governance rules, pre-task verification protocols, coding standards, definition of done, and medical safety rules. |
| **[docs/TASKS.md](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/TASKS.md)** | Phase-by-phase actionable implementation ledger with explicit target files, test commands, and status tracking. |
| **[docs/WORKLOG.md](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/WORKLOG.md)** | Append-only chronological audit log of all decisions, implementations, test outcomes, and next steps. |
| **[docs/REQUIREMENTS.md](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/REQUIREMENTS.md)** | Complete system specification, physiological indicator ranges, data quality checks, detection logic, and 16 acceptance test criteria. |
| **[docs/ARCHITECTURE.md](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/ARCHITECTURE.md)** | Concrete technical blueprints: exact 13-table SQLite DDL schemas, REST API contracts (`/api/v1`), OLS mathematical formulas, and frontend component tree. |
| **[docs/RESEARCH_AND_REFERENCES.md](file:///c:/Users/Fast%20Computers/Desktop/Nasa%20Space%20App/docs/RESEARCH_AND_REFERENCES.md)** | Official NASA research citations (HRP Evidence Reports, Human Research Roadmap, RIDGE hazards, OSDR data schemas) and synthetic calibration models. |

---

## 4. Evaluator Demo Scenarios (Superior University Faisalabad)

For hackathon judges, Mission Sentinel includes a **1-Click Demo Scenario Switcher** in the top navigation bar:
1. **Scenario A (Nominal Spaceflight Baseline):** Artemis crew member with 10 days of stable data within normal physiological variance. Zero alerts; displays healthy green fleet readiness.
2. **Scenario B (Acute Exertion Spike):** Astronaut undergoes high-intensity EVA simulation on Day 5; heart rate spikes once to 95 bpm and recovers. Engine suppresses false alarms, demonstrating avoidance of alert fatigue.
3. **Scenario C (The Hero Scenario — Silent Deterioration):** Over 5 days under heavy EVA workload and elevated cabin $CO_2$, resting HR creeps up from 62 to 74 bpm ($+2.1\sigma$), sleep drops by 2.3 hours ($-2.3\sigma$), and exercise recovery drops 50%. The engine flags a **High-Priority Explainable Alert** with full mathematical provenance, environmental correlation, and NASA HRP evidence citations. CMO logs a clinical countermeasure directly from the review workflow.

---

## 5. Technology Stack

- **Backend:** Python 3.10+ / FastAPI / Pydantic v2 / SQLAlchemy 2.0 / NumPy / Pandas / SciPy / Pytest
- **Database:** SQLite 3 (13-Table Relational Schema, WAL Mode, Foreign Key Enforcement)
- **Frontend:** React 18+ / Vite / TypeScript / Tailwind CSS / Recharts / Lucide Icons
- **Operating Environment:** 100% Localhost / Offline-First

---

## 6. How to Run and Test the System Locally

### Step 1: Run the Backend Automated Test Suite
Verify that all database models, SQLite foreign keys, and REST API endpoints pass:
```powershell
python -m pytest tests/ -v
```

### Step 2: Start the FastAPI Backend Server
Run the local FastAPI application using `python -m uvicorn` (or double-click `run_backend.bat`):
```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- System Health Check Endpoint: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- Astronaut Fleet Roster Endpoint: [http://127.0.0.1:8000/api/v1/astronauts](http://127.0.0.1:8000/api/v1/astronauts)

### Step 3: Start the React Frontend Application
In a separate terminal, navigate to the frontend and launch Vite (or double-click `run_frontend.bat`):
```powershell
cd frontend
npm run dev
```
- Open the Medical Review Dashboard in your browser: [http://localhost:5173](http://localhost:5173)

### Quick 1-Click Launchers (Windows)
You can also launch the entire system without opening PowerShell commands by double-clicking:
- `run_backend.bat` — Starts the FastAPI backend server on port 8000.
- `run_frontend.bat` — Starts the React Vite dashboard on port 5173.
- `run_tests.bat` — Runs the full automated test suite.

### Step 4: Verify the Production Frontend Build
```powershell
cd frontend
npm run build
```
