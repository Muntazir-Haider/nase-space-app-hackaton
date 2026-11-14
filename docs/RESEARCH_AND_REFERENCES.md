# MISSION SENTINEL: RESEARCH, EVIDENCE & NASA REFERENCES DOSSIER
**Project:** Mission Sentinel — Astronaut Health Intelligence and Medical Review Support System  
**Event:** NASA Space Apps Challenge 2026 (Superior University, Faisalabad)  
**Selected Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*  
**Core Innovation:** Explainable Silent Deterioration Detection for the Crew Medical Officer (CMO)  
**Document Status:** Official Reference & Provenance Ledger  

---

## 1. NASA Space Apps Challenge Alignment

### 1.1 Challenge Overview
* **Challenge Title:** Create Health Monitoring Software for Astronauts on Space Missions  
* **Official URL:** [NASA Space Apps Challenge](https://www.spaceappschallenge.org/)  
* **Local Event:** [NASA Space Apps Faisalabad — Superior University](https://www.spaceappschallenge.org/2026/local-events/faisalabad)  
* **Challenge Problem Statement:** Long-duration space missions (such as NASA's Artemis lunar campaigns and crewed transit to Mars) isolate human crews from terrestrial medical infrastructure. Real-time communication delays (up to 22 minutes one-way to Mars) render direct, interactive telemedicine from Earth impossible during acute scenarios. Spacecraft crews, led by the Crew Medical Officer (CMO), require autonomous, offline-capable software to continuously monitor health indicators, detect emerging physiological anomalies early, and provide actionable, explainable decision support.

### 1.2 Mission Sentinel Solution Alignment
Mission Sentinel directly addresses this challenge through:
1. **Targeted Role:** Tailored specifically for the **Crew Medical Officer (CMO)**, avoiding generic civilian fitness tracker cliches and providing clinical-grade decision support.
2. **Autonomous Offline-First Architecture:** Operates 100% locally on spacecraft workstations without requiring telemetry sync with Earth.
3. **Silent Deterioration Engine:** Overcomes naive single-threshold alarms by analyzing multi-indicator trends, individual baseline deviations, and operational workload context.
4. **Transparent Explainability:** Every alert presents full evidence provenance, baseline math, and observation windows to empower human medical judgment.

---

## 2. NASA Human Spaceflight Hazards: The RIDGE Framework

NASA’s Human Research Program classifies spaceflight stressors into five primary hazards known as **RIDGE**. Mission Sentinel's analytical modules map directly to these hazards:

| Hazard Code | Spaceflight Hazard | Physiological & Operational Impact | Mission Sentinel Countermeasure / Detection |
| :--- | :--- | :--- | :--- |
| **R** | **Radiation** | Galactic cosmic rays (GCR) and solar particle events (SPE) induce cellular damage, immune dysregulation, and long-term cardiovascular risks. | Tracks chronic physiological stress markers and baseline shifts across extended mission timelines. |
| **I** | **Isolation & Confinement** | Monotonous environment, circadian misalignment, sleep fragmentation, and psychological stress impair performance. | Monitors sleep duration, sleep continuity, and cumulative rest deficits correlated with workload. |
| **D** | **Distance from Earth** | Communication latency (up to 22 min to Mars) and communication blackouts eliminate real-time Earth medical oversight. | **Zero-cloud requirement:** Local SQLite database, local Python analytical engine, and local browser dashboard. |
| **G** | **Gravity Fields** | Cephalad fluid shifts, microgravity cardiovascular deconditioning, muscle atrophy, and post-exercise recovery lag. | Continuous tracking of resting heart rate (RHR), exercise recovery (HRR-1), and baseline cardiovascular drift. |
| **E** | **Hostile Closed Environments** | Elevated ambient $CO_2$, continuous acoustic noise, rigid operational shifts, and intense EVA workloads. | Correlates physiological changes with mission context (e.g., EVA preparation, heavy maintenance, schedule shifts). |

*Reference:* NASA Human Spaceflight Hazards: https://www.nasa.gov/hrp/hazards/

---

## 3. NASA Human Research Program (HRP) Evidence & Roadmap

Mission Sentinel bases its physiological indicators, baseline modeling, and alert thresholds on published evidence reports from the **NASA Human Research Roadmap (HRR)**:

### 3.1 Sleep, Circadian Rhythm, and Workload
* **HRP Risk Title:** *Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload*
* **NASA Evidence Source:** [NASA Human Research Roadmap — Sleep Loss](https://humanresearchroadmap.nasa.gov/)
* **Scientific Finding:** Astronauts on the ISS average between 6.0 and 6.4 hours of sleep per night—significantly below the terrestrial 7.5–8.0 hour recommendation. Chronic sleep debt impairs neurobehavioral vigilance, executive decision-making, and autonomic cardiac stability.
* **Mission Sentinel Application:**
  - Indicator: **Sleep Duration (hours/night)**.
  - Normal Baseline: $\mathcal{N}(\mu=7.4, \sigma=0.45\text{ hr})$.
  - Deterioration Drift: Drops to $\le 5.2\text{ hr}$ ($z \le -2.0\sigma$, OLS slope $\le -0.25\text{ hr/day}$).
  - Contextual Correlation: Correlates sleep loss with reported operational workload spikes and scheduled mission shifts.

### 3.2 Cardiovascular Deconditioning
* **HRP Risk Title:** *Risk of Cardiovascular Adaptations Contributing to Adverse Mission Performance and Health Outcomes*
* **NASA Evidence Source:** [NASA HRP Cardiovascular Risk](https://www.nasa.gov/hrp/risks/)
* **Scientific Finding:** In microgravity, the absence of hydrostatic pressure gradients leads to an upward fluid shift (cephalad redistribution), reducing circulating plasma volume and altering baroreflex sensitivity. Over time, astronauts experience resting heart rate elevation, autonomic tone shifts, and decreased exercise capacity.
* **Mission Sentinel Application:**
  - Indicator: **Resting Heart Rate (RHR in bpm)**.
  - Normal Baseline: $\mathcal{N}(\mu=62.0, \sigma=2.5\text{ bpm})$.
  - Deterioration Drift: Creeps upward to $\ge 74.0\text{ bpm}$ ($z \ge +2.0\sigma$, OLS slope $\ge +0.8\text{ bpm/day}$).
  - Resilience to Spikes: Single-day spikes (e.g. 92 bpm during high exertion) do not trigger deterioration alerts if baseline recovery is preserved.

### 3.3 Physical Exercise and Cardiovascular Recovery
* **HRP Risk Title:** *Risk of Impaired Performance and Decrements in Health Due to Inadequate Physical Exercise*
* **NASA Evidence Source:** NASA Technical Reports Server (NTRS) & Life Sciences Portal
* **Scientific Finding:** Countermeasure exercise (ARED resistance training and T2 cycle/treadmill) is mandatory on orbit. A declining rate of heart rate recovery post-exercise is a verified indicator of autonomic fatigue, cardiovascular deconditioning, and systemic strain.
* **Mission Sentinel Application:**
  - Indicator: **Heart Rate Recovery at 1 minute (HRR-1 in bpm)** (drop in heart rate 60 seconds post-cessation of peak exercise).
  - Normal Baseline: $\mathcal{N}(\mu=28.0, \sigma=3.0\text{ bpm drop})$.
  - Deterioration Drift: Drops below $15.0\text{ bpm drop}$ ($z \le -2.0\sigma$, OLS slope $\le -1.5\text{ bpm/day}$).

---

## 4. Synthetic Scenario Calibration Parameters

To ensure our synthetic test scenarios reflect physiological reality, data generators use parametric Gaussian distributions calibrated to published spaceflight analogs:

```python
# Calibration Profiles for Synthetic Data Generation

NOMINAL_ASTRONAUT_PROFILE = {
    "RHR_BPM": {"mean": 62.0, "std": 2.5, "min": 50, "max": 78},
    "SLEEP_HOURS": {"mean": 7.4, "std": 0.45, "min": 6.2, "max": 8.5},
    "HRR1_BPM_DROP": {"mean": 28.0, "std": 3.0, "min": 20, "max": 40},
}

DETERIORATION_PROGRESSION = [
    # Day 8: Mild onset
    {"rhr_delta": +2.0, "sleep_delta": -0.6, "hrr_delta": -3.0},
    # Day 9: Progressive drift
    {"rhr_delta": +5.0, "sleep_delta": -1.2, "hrr_delta": -7.0},
    # Day 10: Multi-indicator threshold reached
    {"rhr_delta": +8.5, "sleep_delta": -1.8, "hrr_delta": -11.0},
    # Day 11-12: Sustained multi-day persistence (Trigger State)
    {"rhr_delta": +12.0, "sleep_delta": -2.3, "hrr_delta": -14.0},
]
```

---

## 5. Master Evidence and Reference Directory

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
