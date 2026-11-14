# MISSION SENTINEL: AI AGENT OPERATING PROTOCOL & GOVERNANCE RULES
**Project:** Mission Sentinel — Astronaut Health Intelligence and Medical Review Support System  
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Operating Principle:** Modular, testable, evidence-based, incremental, offline-first  

These rules govern all AI coding agents working on Mission Sentinel. Every tool execution, code generation, file modification, and architectural decision must strictly comply with these rules.

---

## 1. Documentation Structure & Single Source of Truth

All project documentation is centralized in the `docs/` folder:

```
Nasa Space App/
├── README.md                      <-- Root Entrypoint & Navigation Guide
└── docs/                          <-- Centralized Documentation & Governance
    ├── AGENT_RULES.md             <-- AI Agent Operating Protocol & Governance Rules
    ├── TASKS.md                   <-- Active Task Ledger with Test Conditions
    ├── WORKLOG.md                 <-- Append-Only Chronological Audit Log
    ├── REQUIREMENTS.md            <-- System Spec, Indicator Math & 16 Acceptance Tests
    ├── ARCHITECTURE.md            <-- 13-Table SQLite Schemas, REST API Contracts & OLS Math
    └── RESEARCH_AND_REFERENCES.md <-- NASA HRP Evidence, RIDGE Hazards & Citations
```

- **Rule 1 — Source of Truth:** `docs/REQUIREMENTS.md` and `docs/ARCHITECTURE.md` are the authoritative sources of truth for behavior and schemas. Never invent unapproved endpoints, columns, or metrics.
- **Rule 2 — Document Integrity:** Keep `docs/TASKS.md` actionable, `docs/WORKLOG.md` chronological, and specification files synchronized. Update documents immediately when an approved change is made.

---

## 2. Pre-Task Verification Protocol (Mandatory Before Any Coding)

Before modifying or creating any code file, the AI agent MUST perform the following pre-flight sequence:

1. **Verify Approval Gate:** Confirm that the user has explicitly approved the phase containing the target task.
2. **Inspect Target Task:** Read the exact objective, file paths, and acceptance conditions in `docs/TASKS.md`.
3. **Review Schema & Contract:** Read the corresponding table definitions and API schemas in `docs/ARCHITECTURE.md`.
4. **Update Task State:** Change the task status in `docs/TASKS.md` from `TODO` to `IN PROGRESS`.

---

## 3. Strict Development Standards

### Rule 3 — Understand Before Modifying
Inspect the existing codebase before modifying or adding code. Never rewrite an entire module when a targeted, incremental change will suffice. Never delete existing functionality to make a new implementation easier.

### Rule 4 — Zero Fake Code & Anti-Hallucination Policy
Never create:
- Hardcoded dashboard values or dummy calculations in frontend components.
- Mock API endpoints that return canned responses instead of querying the SQLite database.
- Buttons, dropdowns, or controls that do nothing when clicked.
- Fake success alerts/toasts without backend confirmation.
- Unexplained "AI confidence scores" without verifiable mathematical formulas.

### Rule 5 — Offline-First & Local Monolith Discipline
- The entire stack must run locally on `localhost` (127.0.0.1).
- No external network or cloud service dependencies are permitted.
- All persistent state must be committed to the local SQLite database (`data/sentinel.db`).
- SQLite foreign key constraints (`PRAGMA foreign_keys = ON;`) must be enabled on every database connection.

### Rule 6 — Coding & Code Quality Standards
- **Backend (Python 3.10+):**
  - Adhere to PEP 8 conventions.
  - Mandatory type annotations for all function signatures and Pydantic models.
  - SQLAlchemy 2.0 declarative models matching all 13 tables in `docs/ARCHITECTURE.md`.
  - Never log raw astronaut health values to stdout/terminal logs (protect physiological privacy).
- **Frontend (React 18+ / TypeScript / Vite):**
  - Strict TypeScript mode enabled; zero `any` types permitted.
  - Modular component structure under `src/components/`, `src/services/`, and `src/types/`.
  - Recharts for data visualization with explicit axes, labels, units, and baseline reference bands.
  - Tailwind CSS dark-mode "Mission Control" aesthetic.

---

## 4. Scientific Grounding & Medical Safety (NASA Standard)

### Rule 7 — Decision Support, Not Automated Physician
Mission Sentinel is an autonomous decision-support system for the Crew Medical Officer (CMO).
- Never claim that the software diagnoses medical diseases or prescribes treatments.
- Never output messages like "AI detected heart failure". Output explainable observations: e.g., *"Resting Heart Rate elevation (+12 bpm, +4.95σ) detected persisting across 4 observation cycles under heavy workload"*.
- Every alert is an observational notification requiring human CMO clinical review.

### Rule 8 — Mandatory Scientific Grounding & Evidence Provenance
- All physiological metrics, baseline calculations, and detection thresholds must cite verified NASA research recorded in `docs/RESEARCH_AND_REFERENCES.md`.
- Telemetry ingestion schemas must map to NASA Open Science Data Repository (OSDR) standards.
- Alert explanations must explicitly reference published NASA Human Research Program (HRP) Evidence Reports.
- All synthetic datasets must carry explicit provenance labels (`data_origin = 'SIMULATED'`).

---

## 5. Verification & Definition of Done (DoD)

### Rule 9 — Test Execution Before Completion
No task may be marked `DONE` merely because code was written. For every task:
1. Run the target automated test suite (e.g., `pytest tests/test_data_quality.py -v`).
2. Verify that all assertions pass cleanly without warnings.
3. Verify that database records persist after process restart.
4. If a test fails, diagnose and fix the root cause immediately; never bypass or comment out failing assertions.

### Rule 10 — Definition of Done (DoD) Checklist
A task is `DONE` if and only if:
- [ ] Code is implemented matching the exact specification in `docs/ARCHITECTURE.md`.
- [ ] Automated tests verify all positive, negative, and edge-case scenarios.
- [ ] No regression introduced to previously completed features.
- [ ] `docs/TASKS.md` updated with status `DONE`.
- [ ] `docs/WORKLOG.md` updated with timestamped summary of work, files changed, and test results.

---

## 6. Incremental Phase Approval Gates

### Rule 11 — Strict User Approval Gates
Follow this disciplined loop:
1. Inspect and prepare.
2. Present the plan and test strategy for the phase.
3. **Wait for explicit user approval before beginning any major implementation phase.**
4. Implement the approved phase incrementally, task by task.
5. Execute the test suite and verify acceptance criteria.
6. Present the verified outcome to the user.
7. **Wait for user confirmation before advancing to the next phase.**

### Rule 12 — No Uncontrolled Continuation
Never automatically cascade from one phase to the next without explicit user sign-off. Report the completion of the milestone, demonstrate the functioning capabilities, and pause.
