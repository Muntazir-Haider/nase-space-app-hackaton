# ANTIGRAVITY — PERMANENT SYSTEM-WIDE DEVELOPMENT RULES
**Project:** Mission Sentinel  
**Subtitle:** Astronaut Health Intelligence and Medical Review Support System  
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Primary User:** Crew Medical Officer (CMO)  
**Document Status:** Permanent System-Wide Governance Charter  

These rules apply to the entire Mission Sentinel project, permanently. They are not specific to Phase 1, a particular feature, or a single development session. Every future task, phase, implementation, modification, bug fix, research activity, testing activity, and refactoring must follow these standards.

---

## 1. QUALITY OVER SPEED

- We are not in a hurry.
- Never sacrifice correctness, completeness, research, usability, or reliability for speed.
- Never intentionally produce superficial implementations just to finish a task quickly.
- Investigate problems thoroughly before attempting solutions.
- Prefer complete, reliable, maintainable implementations over quick patches.
- Do not rush to declare work finished.

---

## 2. RESEARCH BEFORE IMPLEMENTATION

Before implementing any meaningful feature or making architectural decisions:

- Understand the actual requirement and its purpose.
- Inspect existing project code and documentation.
- Research relevant official documentation and reliable sources.
- Investigate appropriate technologies, methods, datasets, and established practices.
- Identify limitations, dependencies, edge cases, and risks.
- Compare reasonable implementation approaches when necessary.
- Record important findings and sources in the appropriate existing project documentation (`docs/REQUIREMENTS.md`).

For NASA-related functionality, research NASA's actual challenge requirements, scientific context, relevant research, and available datasets.

**Never invent NASA datasets, scientific findings, astronaut measurements, or claims of NASA validation.**

---

## 3. REQUIREMENT COMPLETENESS

- Read the relevant requirements before starting.
- Implement every requirement applicable to the approved task.
- Never silently remove, simplify, or ignore requirements.
- Never replace real functionality with placeholders without explicit approval.
- Never consider a feature complete merely because its basic structure exists.
- Identify missing functionality, dependencies, and edge cases before declaring completion.
- If requirements are unclear, research first and ask when a consequential ambiguity remains.

---

## 4. EXISTING CODE AND ARCHITECTURE

- Inspect the existing implementation before modifying it.
- Reuse working code and existing components whenever appropriate.
- Avoid unnecessary rewrites, duplication, and architectural complexity.
- Maintain consistent architecture, naming, API contracts, and design patterns.
- Make focused changes without damaging unrelated functionality.
- Do not introduce unnecessary dependencies or modules.
- Keep the application maintainable and understandable.

---

## 5. UI AND UX QUALITY

Every user-facing feature must have a properly implemented interface:

- Build consistent, polished, responsive interfaces.
- Maintain consistent navigation, typography, spacing, colors, and components.
- Implement loading, empty, error, and success states where applicable.
- Ensure buttons, forms, navigation, filters, and other controls actually work.
- Ensure the interface accurately reflects backend functionality and application state.
- Handle unavailable services, missing data, and offline conditions appropriately.
- Use accessible interaction patterns.
- Avoid generic, unfinished, inconsistent, or superficial UI implementations.
- Never use fake charts, fabricated health information, or misleading visualizations.
- Never make an interface appear functional when its underlying feature is not implemented.

---

## 6. BACKEND AND DATA INTEGRITY

For backend features:

- Implement actual business logic.
- Use proper validation and centralized error handling.
- Maintain consistent API contracts.
- Ensure correct persistence and data integrity.
- Use appropriate database constraints, foreign keys, and transactions.
- Handle invalid input, missing records, duplicate requests, and failure conditions.
- Keep frontend and backend responsibilities properly separated.
- Never substitute hardcoded responses for real functionality.
- Never claim data was saved, processed, or synchronized unless it actually was.

---

## 7. TESTING AND VERIFICATION

Testing is mandatory for every meaningful implementation:

- Test the actual implementation.
- Run relevant automated tests (`pytest`, TypeScript build).
- Test integration between affected components.
- Test error cases and invalid input.
- Verify persistence across restarts when applicable.
- Verify the UI and actual interactions.
- Check application logs and runtime errors.
- Perform regression testing where existing functionality could be affected.
- Fix discovered problems and repeat relevant tests.

**A task is not DONE simply because code was written or files were created.**

Every completion claim must be supported by actual verification.

If testing cannot be performed, clearly report the limitation and leave the task unverified.

---

## 8. COMPLETENESS GATE

Before marking any task, feature, phase, or implementation DONE, verify:

1. All applicable requirements are implemented.
2. No required functionality is missing.
3. No unresolved implementation errors remain.
4. All required UI elements and interactions work.
5. Backend and database behavior is correct where applicable.
6. Integration works correctly.
7. Relevant tests pass.
8. No unacceptable regressions were introduced.
9. Documentation is updated.
10. Remaining limitations are disclosed.

Report each applicable acceptance criterion as:

- **PASS** — verified with evidence.
- **FAIL** — implementation or verification failed.
- **BLOCKED** — cannot be completed or verified, with the reason.
- **NOT APPLICABLE** — genuinely irrelevant to the task, with justification.

**Never mark a task DONE while a mandatory acceptance criterion is FAIL or BLOCKED.**

---

## 9. HONESTY AND TRANSPARENCY

- Never fabricate research, test results, data, functionality, or completion status.
- Never hide errors or missing requirements.
- Never describe a partial implementation as complete.
- Never claim clinical accuracy, scientific validation, or NASA approval without appropriate evidence.
- Clearly distinguish implemented, simulated, experimental, and planned functionality.
- Report limitations honestly.

---

## 10. DOCUMENTATION AND PROJECT MEMORY

Maintain exactly these 4 project documentation files:

- `REQUIREMENTS.md` — Consolidated Master Requirements, Research, Architecture & Acceptance Tests.
- `AGENT_RULES.md` — AI Agent Operating Protocol & Permanent System-Wide Development Rules.
- `TASKS.md` — Active Task Ledger with Test Conditions & Progress Tracking.
- `WORKLOG.md` — Append-Only Chronological Audit Log & Verification History.

**Do not create additional documentation files without approval.**

Keep requirements accurate, task statuses honest, and worklog chronological.

Before starting work, review the relevant documentation and existing project state.

After completing work, update the appropriate documents.

---

## 11. TASK MANAGEMENT

- Break meaningful work into actionable tasks.
- Define measurable acceptance criteria.
- Track progress honestly.
- Maintain `TODO`, `IN PROGRESS`, `BLOCKED`, `TESTING`, and `DONE` statuses.
- Do not mark tasks `DONE` prematurely.
- Identify dependencies and blockers.
- Do not silently skip incomplete tasks.

---

## 12. APPROVAL AND PHASE CONTROL

- Respect the approved project scope and development phases.
- Complete the current approved phase before moving forward.
- **Do not begin a new major phase without user approval.**
- Report findings and proposed changes before making consequential scope changes.
- Small corrections within approved scope may proceed normally.
- Never assume permission to redesign the entire project or change its requirements.

---

## 13. COMPLETION REPORT

At the end of meaningful work, provide a truthful summary of:

- What was requested.
- What was researched.
- What was implemented.
- What files changed.
- What tests were executed.
- Actual test results.
- Acceptance criteria status.
- Remaining issues and limitations.
- Any blocked or incomplete work.
- Relevant next steps.

---

## 14. UNIVERSAL EXECUTION STANDARD

For every task, follow this workflow as appropriate:

$$\text{Understand} \longrightarrow \text{Inspect} \longrightarrow \text{Research} \longrightarrow \text{Plan} \longrightarrow \text{Implement} \longrightarrow \text{Test} \longrightarrow \text{Fix} \longrightarrow \text{Verify Completeness} \longrightarrow \text{Document} \longrightarrow \text{Report}$$

Do not skip essential stages merely to save time.

---

### FINAL RULE

These instructions are permanent project-wide standards. They apply automatically to all current and future work.

**The objective is not to generate code quickly. The objective is to build Mission Sentinel correctly, completely, professionally, and reliably.**
