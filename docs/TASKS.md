# MISSION SENTINEL: MASTER TASK LEDGER
**Project:** Mission Sentinel — Astronaut Health Intelligence and Medical Review Support System  
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Operating Principle:** Modular, testable, evidence-based, incremental, offline-first  

---

## Phase 0: Project Inspection, Research & Planning
*Objective: Thorough exploration of NASA resources, formalization of requirements, architectural blueprints, and strict project planning before any implementation begins.*

- [x] **TASK-001: Workspace Inspection & Ground Rules Establishment**
  - **Scope:** Verify workspace status, establish strict planning constraints, and configure development boundaries.
  - **Target Files:** Root workspace inspection.
  - **Verification:** Workspace clean; planning rules established.
  - **Status:** `DONE`

- [x] **TASK-002: NASA Resources Exploration & Research Dossier Creation**
  - **Scope:** Research NASA Space Apps challenge specifications, NASA HRP Evidence Reports, Human Research Roadmap, RIDGE hazards, and OSDR schema standards.
  - **Target Files:** `docs/RESEARCH_AND_REFERENCES.md`
  - **Verification:** File authored with verifiable URLs, scientific rationale, and schema standards.
  - **Status:** `DONE`

- [x] **TASK-003: System Architecture Blueprint (13-Table Production Schema)**
  - **Scope:** Author complete technical architecture, 13 SQLite DDL schemas (Missions, Profiles, Indicator Definitions, Observations, Environmental Telemetry, Data Quality Audit, Baselines, Events, Analysis Runs, Alerts, Evidence Links, Countermeasures, Sync Queue), REST API contracts, and OLS mathematical formulas.
  - **Target Files:** `docs/ARCHITECTURE.md`
  - **Verification:** SQLite DDL schemas and RESTful JSON contracts fully specified.
  - **Status:** `DONE`

- [x] **TASK-004: Formal System Requirements Specification**
  - **Scope:** Author `docs/REQUIREMENTS.md` detailing CMO user role, indicator catalog, Data Quality Engine, Calendar-Time Baseline Engine, Silent Deterioration Engine, Clinical Countermeasures, and 16 Acceptance Tests.
  - **Target Files:** `docs/REQUIREMENTS.md`
  - **Verification:** `docs/REQUIREMENTS.md` complete and aligned with NASA challenge objectives.
  - **Status:** `DONE`

- [x] **TASK-005: AI Agent Operating Protocol & Governance Rules**
  - **Scope:** Author `docs/AGENT_RULES.md` documenting the pre-task protocol, coding standards, definition of done, and medical safety boundaries.
  - **Target Files:** `docs/AGENT_RULES.md`
  - **Verification:** Enforceable rules file verified.
  - **Status:** `DONE`

- [x] **TASK-006: Task Ledger, Master Overview & Centralized Documentation Organization**
  - **Scope:** Organize all documentation files into `docs/` (`docs/AGENT_RULES.md`, `docs/TASKS.md`, `docs/WORKLOG.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/RESEARCH_AND_REFERENCES.md`) and author root `README.md`.
  - **Target Files:** `docs/TASKS.md`, `README.md`, `docs/WORKLOG.md`
  - **Verification:** All files organized and cross-referenced.
  - **Status:** `DONE`

---

## Phase 1: Foundation (Backend, Database & Frontend Scaffolding)
*Objective: Establish local FastAPI backend, 13-table SQLite database models, API contracts, and React+Vite frontend skeleton.*
*Approval Gate: Requires explicit user approval before execution.*

- [x] **TASK-101: Backend Environment & Dependency Configuration**
  - **Scope:** Set up Python virtual environment and configure backend dependencies (`fastapi`, `uvicorn`, `pydantic>=2.0`, `sqlalchemy>=2.0`, `pandas`, `numpy`, `scipy`, `pytest`, `httpx`).
  - **Target Files:** `backend/requirements.txt`, `backend/app/main.py`
  - **Verification:** `python -m pytest --version` and FastAPI starts on `http://127.0.0.1:8000/docs`.
  - **Status:** `DONE`

- [x] **TASK-102: Relational Database Models & Persistence Schema (13 Tables)**
  - **Scope:** Implement SQLAlchemy 2.0 models matching the full 13-table SQLite DDL in `docs/ARCHITECTURE.md` (`missions`, `astronaut_profiles`, `indicator_definitions`, `health_observations`, `environmental_telemetry`, `data_quality_audit_log`, `personal_baselines`, `mission_events`, `analysis_runs`, `deterioration_alerts`, `alert_evidence_links`, `clinical_countermeasures`, `offline_sync_queue`).
  - **Target Files:** `backend/app/models/entities.py`, `backend/app/database.py`
  - **Verification:** `pytest tests/test_database.py -v` verifies creation of all 13 tables, foreign key constraints, cascade rules, and indexes.
  - **Status:** `DONE`

- [x] **TASK-103: Core Pydantic Schemas & Health Check Contract**
  - **Scope:** Implement Pydantic v2 validation models for all 13 entities; implement `/api/v1/health` and `/api/v1/astronauts` roster endpoints.
  - **Target Files:** `backend/app/schemas/`, `backend/app/api/astronauts.py`
  - **Verification:** `pytest tests/test_api_astronauts.py -v` returns valid JSON schemas.
  - **Status:** `DONE`

- [x] **TASK-104: Frontend Application Scaffolding (React + Vite + TypeScript)**
  - **Scope:** Initialize React 18+ Vite project with TypeScript, Tailwind CSS, Lucide Icons, and Recharts.
  - **Target Files:** `frontend/package.json`, `frontend/src/App.tsx`, `frontend/tailwind.config.js`
  - **Verification:** `npm run build` succeeds; local Vite server renders dark-mode Mission Control shell.
  - **Status:** `DONE`

---

## Phase 2: Ingestion, Environmental Telemetry & Data Quality Engine
*Objective: Build pre-analysis validation engine, physiological & environmental bounds checking, and telemetry ingestion endpoints.*
*Approval Gate: Requires Phase 1 verification and user sign-off.*

- [x] **TASK-201: Ingestion & Data Quality Engine Implementation**
  - **Scope:** Implement numeric range plausibility checks, timestamp integrity, duplicate prevention, and staleness detection; log rejected/flagged records to `data_quality_audit_log`.
  - **Target Files:** `backend/app/services/data_quality.py`
  - **Verification:** Unit tests verify invalid units, out-of-range vitals, future timestamps, and duplicates are rejected with explicit notes logged to audit table.
  - **Status:** `DONE`

- [x] **TASK-202: Observation & Environmental Ingestion Endpoints**
  - **Scope:** Implement `POST /api/v1/observations`, `POST /api/v1/environmental`, and `GET /api/v1/data-quality/audit`.
  - **Target Files:** `backend/app/api/observations.py`, `backend/app/api/data_quality.py`
  - **Verification:** `pytest tests/test_ingestion.py -v` (Tests 2, 3, 4, 5, 15).
  - **Status:** `DONE`

---

## Phase 3: Personal Baseline Engine
*Objective: Calculate 7-day calendar-time rolling baselines and handle insufficient data conditions.*
*Approval Gate: Requires Phase 2 verification and user sign-off.*

- [x] **TASK-301: Rolling Calendar-Time Baseline Calculation**
  - **Scope:** Calculate mean ($\mu$), median ($M$), sample standard deviation ($\sigma$), and sample count over 7-day calendar window ($N \ge 4$).
  - **Target Files:** `backend/app/services/baseline_engine.py`
  - **Verification:** `pytest tests/test_baseline.py -v` (Tests 6, 7, 16) verifies hand-calculated statistical precision.
  - **Status:** `DONE`

- [x] **TASK-302: Baseline Versioning & State Management Endpoint**
  - **Scope:** Implement sample threshold rule ($<4$ samples $\rightarrow$ `INSUFFICIENT_BASELINE_DATA`; $\ge 4$ samples $\rightarrow$ `ACTIVE`); expose `GET /api/v1/astronauts/{id}/baseline`.
  - **Target Files:** `backend/app/api/baselines.py`
  - **Verification:** API returns versioned baseline object with active status flags.
  - **Status:** `DONE`

---

## Phase 4: Silent Deterioration Engine & Explainable Alerts
*Objective: Implement multi-indicator trend detection, OLS regression slopes, environmental cross-correlation, and evidence tracking.*
*Approval Gate: Requires Phase 3 verification and user sign-off.*

- [x] **TASK-401: OLS Linear Regression Trend & $z$-Score Engine**
  - **Scope:** Compute rolling $z$-scores and Ordinary Least Squares slopes for RHR, Sleep, and HRR-1 across 3-to-5 day sliding windows.
  - **Target Files:** `backend/app/services/analytics/ols_trends.py`
  - **Verification:** `pytest tests/test_trends.py -v` verifies slope and deviation calculations against NumPy reference.
  - **Status:** `DONE`

- [x] **TASK-402: Multi-Indicator Persistence Rule & Single-Spike Filter**
  - **Scope:** Implement rule requiring $\ge 2$ indicators deviating for $\ge 3$ consecutive days; filter out isolated acute spikes; cross-correlate with cabin $CO_2$ and workload.
  - **Target Files:** `backend/app/services/deterioration_engine.py`
  - **Verification:** `pytest tests/test_deterioration.py -v` (Tests 8, 9, 10) confirms single spike suppresses alert, sustained drift triggers alert.
  - **Status:** `DONE`

- [x] **TASK-403: Alert Evidence Linking & Analysis Run Audit Logging**
  - **Scope:** Log execution run in `analysis_runs`; generate structured explainable alert linking raw observation UUIDs in `alert_evidence_links` and NASA HRP citations; expose `/api/v1/alerts/{id}/evidence`.
  - **Target Files:** `backend/app/api/alerts.py`, `backend/app/services/deterioration_engine.py`
  - **Verification:** `pytest tests/test_deterioration.py -v` (Tests 11, 12).
  - **Status:** `DONE`

---

## Phase 5: CMO Dashboard, Clinical Countermeasures & User Interface
*Objective: Build high-density medical review interface, Recharts data visualization, alert inspection, countermeasure logging, and scenario switcher.*
*Approval Gate: Requires Phase 4 verification and user sign-off.*

- [ ] **TASK-501: CMO Dashboard & Crew Status Overview**
  - **Scope:** Build fleet cards, active alert banners, data quality counters, and 1-click Demo Scenario switcher.
  - **Target Files:** `frontend/src/components/FleetOverview.tsx`, `frontend/src/components/Header.tsx`
  - **Verification:** Displays actual backend data with zero hardcoded metrics.
  - **Status:** `TODO`

- [ ] **TASK-502: Synchronized Multi-Indicator & Habitat Time-Series Charts**
  - **Scope:** Implement Recharts visualizers with baseline bands ($\pm 1.5\sigma$), reading points, missing data gaps, cabin $CO_2$ overlay, and alert markers.
  - **Target Files:** `frontend/src/components/charts/SynchronizedCharts.tsx`
  - **Verification:** Real stored data rendered accurately with crisp time-axis alignment.
  - **Status:** `TODO`

- [ ] **TASK-503: Alert Detail Drill-Down, Evidence Inspector & Data Quality Modal**
  - **Scope:** Modal/view presenting detection narrative, baseline math breakdown, mission context, raw readings table, and Data Quality rejection audit inspector.
  - **Target Files:** `frontend/src/components/alerts/AlertEvidenceModal.tsx`, `frontend/src/components/quality/DataQualityModal.tsx`
  - **Verification:** CMO can drill directly from alert to underlying evidence records and inspect rejected sensor packets.
  - **Status:** `TODO`

- [ ] **TASK-504: Clinical Countermeasures & CMO Follow-Up Workflow**
  - **Scope:** Enable CMO to prescribe clinical countermeasures (`SLEEP_SCHEDULE_ADJUSTMENT`, `HYDRATION_PROTOCOL`, etc.), append review notes, and transition alert states.
  - **Target Files:** `frontend/src/components/alerts/ClinicalCountermeasures.tsx`, `backend/app/api/countermeasures.py`
  - **Verification:** Countermeasures persist to `clinical_countermeasures` table and update outcome states.
  - **Status:** `TODO`

---

## Phase 6: Offline Operation & Local Resilience
*Objective: Guarantee 100% offline operation and persistence across application restarts.*
*Approval Gate: Requires Phase 5 verification and user sign-off.*

- [ ] **TASK-601: Local Offline Verification & Network Independence**
  - **Scope:** Test full application workflow with network interface disconnected.
  - **Target Files:** End-to-end stack audit.
  - **Verification:** Test 13 passes; zero external network requests triggered during operation.
  - **Status:** `TODO`

- [ ] **TASK-602: Restart Resilience & Persistence Verification**
  - **Scope:** Terminate backend/frontend processes, restart, and verify complete retention across all 13 SQLite tables.
  - **Target Files:** Database verification script.
  - **Verification:** Tests 1, 14, and 15 pass; zero data loss after hard restart.
  - **Status:** `TODO`

---

## Phase 7: Experimental Anomaly Detection Evaluation
*Objective: Benchmark optional unsupervised ML anomaly detection against rule-based baseline.*
*Approval Gate: Requires Phase 6 verification and user sign-off.*

- [ ] **TASK-701: Unsupervised Model Exploration (Isolation Forest / LOF)**
  - **Scope:** Implement experimental local scikit-learn anomaly detector on synthetic multi-indicator scenarios.
  - **Target Files:** `backend/app/analytics/experimental_ml.py`
  - **Verification:** Comparative evaluation matrix documenting detection latency, false positives, and interpretability trade-offs.
  - **Status:** `TODO`

---

## Phase 8: Final Verification & NASA Space Apps Demonstration
*Objective: Execute complete 16-test acceptance suite, package demonstration, and finalize documentation.*
*Approval Gate: Final review before hackathon presentation.*

- [ ] **TASK-801: Complete 16-Test Acceptance Suite Execution**
  - **Scope:** Run automated end-to-end test suite covering all master acceptance criteria.
  - **Target Files:** `tests/test_acceptance_suite.py`
  - **Verification:** All 16 acceptance tests pass with verified logs.
  - **Status:** `TODO`

- [ ] **TASK-802: Hackathon Presentation Package & Live Demo Verification**
  - **Scope:** Rehearse the 3-minute hackathon judge flow: Scenario A (Nominal) $\rightarrow$ Scenario B (Single Exertion Spike) $\rightarrow$ Scenario C (Silent Deterioration Hero Demo with Cabin CO2 & Countermeasure Prescription).
  - **Target Files:** Live presentation script & run instructions.
  - **Verification:** Flawless live demo workflow verified for Superior University Faisalabad presentation.
  - **Status:** `TODO`
