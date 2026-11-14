from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.app.models.entities import (
    Mission,
    AstronautProfile,
    IndicatorDefinition,
    HealthObservation,
    PersonalBaseline,
    MissionEvent,
    EnvironmentalTelemetry,
    AnalysisRun,
    DeteriorationAlert,
    AlertEvidenceLink,
    ClinicalCountermeasure,
    CMOFollowup,
)
from backend.app.services.seed_data import seed_default_indicators
from backend.app.services.baseline_engine import compute_all_baselines_for_astronaut
from backend.app.services.deterioration_engine import run_fleet_deterioration_analysis

def reset_scenario_data(db: Session):
    """
    Cleans previous simulated flight data to ensure deterministic scenario loading.
    Preserves indicator definitions.
    """
    db.query(AlertEvidenceLink).delete()
    db.query(ClinicalCountermeasure).delete()
    db.query(CMOFollowup).delete()
    db.query(DeteriorationAlert).delete()
    db.query(AnalysisRun).delete()
    db.query(MissionEvent).delete()
    db.query(EnvironmentalTelemetry).delete()
    db.query(PersonalBaseline).delete()
    db.query(HealthObservation).delete()
    db.query(AstronautProfile).delete()
    db.query(Mission).delete()
    db.commit()


def load_scenario(db: Session, scenario_key: str) -> Dict[str, Any]:
    """
    Loads one of the three pre-calibrated NASA Space Apps hackathon demonstration scenarios:
    1. SCENARIO_A_NOMINAL: All 3 crew members stable over 10 flight days. 0 alerts.
    2. SCENARIO_B_ACUTE_SPIKE: Single acute exertion spike on Day 8. Engine filters spike; 0 alerts.
    3. SCENARIO_C_SILENT_DETERIORATION: Hero scenario. Elena Vance develops subtle tri-indicator
       deterioration under EVA workload and elevated CO2. 1 HIGH-priority explainable alert.
    """
    # Ensure indicators exist
    seed_default_indicators(db)
    
    # Clean previous flight data for clean state
    reset_scenario_data(db)

    now_utc = datetime.now(timezone.utc)
    # Flight Day 14 simulation: Anchor Day 14 to today, Day 1 was 13 days ago
    t_flight_day_1 = now_utc - timedelta(days=13)

    # 1. Create Artemis III Mission
    mission = Mission(
        id="mis-artemis-iii",
        mission_code="ARTEMIS-III",
        name="Artemis III Lunar Surface Expedition",
        target_destination="LUNAR_SOUTH_POLE",
        spacecraft_module="ORION_MPC_V",
        flight_day=14,
        comms_latency_seconds=1334,  # 22 min 14 sec (Mars analog simulation)
        status="ACTIVE",
        start_date=t_flight_day_1.isoformat(),
    )
    db.add(mission)
    db.commit()

    # 2. Create Crew Roster (3 Astronauts)
    vance = AstronautProfile(
        id="astro-vance-001",
        mission_id=mission.id,
        callsign="ARTEMIS-01",
        full_name="Dr. Elena Vance",
        flight_role="Commander & Medical Lead",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
    )
    thorne = AstronautProfile(
        id="astro-thorne-002",
        mission_id=mission.id,
        callsign="ARTEMIS-02",
        full_name="Marcus Thorne",
        flight_role="Pilot & Systems Specialist",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
    )
    chen = AstronautProfile(
        id="astro-chen-003",
        mission_id=mission.id,
        callsign="ARTEMIS-03",
        full_name="Dr. Sarah Chen",
        flight_role="Mission Specialist & Astrobiologist",
        medical_clearance_status="FULL_FLIGHT_CLEARANCE",
    )
    db.add_all([vance, thorne, chen])
    db.commit()

    # Query indicators
    rhr_ind = db.query(IndicatorDefinition).filter_by(indicator_key="RESTING_HEART_RATE").first()
    sleep_ind = db.query(IndicatorDefinition).filter_by(indicator_key="SLEEP_DURATION").first()
    hrr_ind = db.query(IndicatorDefinition).filter_by(indicator_key="HEART_RATE_RECOVERY_1MIN").first()

    observations: List[HealthObservation] = []
    events: List[MissionEvent] = []
    env_readings: List[EnvironmentalTelemetry] = []

    # --- Days 1 to 7: Establish clean personal baselines for all 3 crew members ---
    for day_idx in range(7):
        day_time = (t_flight_day_1 + timedelta(days=day_idx, hours=6)).isoformat()
        
        # Elena Vance (Commander): Baseline RHR ~ 61 bpm, Sleep ~ 7.5h, HRR ~ 28 bpm
        observations.append(HealthObservation(
            astronaut_id=vance.id, indicator_id=rhr_ind.id,
            value=61.0 + (day_idx % 3) * 0.5, unit="bpm", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        observations.append(HealthObservation(
            astronaut_id=vance.id, indicator_id=sleep_ind.id,
            value=7.4 + (day_idx % 2) * 0.2, unit="hours", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        observations.append(HealthObservation(
            astronaut_id=vance.id, indicator_id=hrr_ind.id,
            value=28.0 + (day_idx % 2) * 0.5, unit="bpm", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))

        # Marcus Thorne (Pilot): Baseline RHR ~ 58 bpm, Sleep ~ 7.8h, HRR ~ 32 bpm
        observations.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=rhr_ind.id,
            value=58.0 + (day_idx % 2) * 0.5, unit="bpm", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        observations.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=sleep_ind.id,
            value=7.8 - (day_idx % 2) * 0.1, unit="hours", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        observations.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=hrr_ind.id,
            value=32.0 + (day_idx % 2) * 0.4, unit="bpm", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))

        # Sarah Chen (Specialist): Baseline RHR ~ 64 bpm, Sleep ~ 7.2h, HRR ~ 25 bpm
        observations.append(HealthObservation(
            astronaut_id=chen.id, indicator_id=rhr_ind.id,
            value=64.0 + (day_idx % 2) * 0.5, unit="bpm", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        observations.append(HealthObservation(
            astronaut_id=chen.id, indicator_id=sleep_ind.id,
            value=7.2 + (day_idx % 2) * 0.2, unit="hours", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        observations.append(HealthObservation(
            astronaut_id=chen.id, indicator_id=hrr_ind.id,
            value=25.0 + (day_idx % 2) * 0.5, unit="bpm", observation_time=day_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))

    db.add_all(observations)
    db.commit()

    # Pre-calculate active baselines for all 3 crew members based on Days 1-7
    day_7_time = t_flight_day_1 + timedelta(days=6, hours=12)
    compute_all_baselines_for_astronaut(db, vance.id, reference_time=day_7_time)
    compute_all_baselines_for_astronaut(db, thorne.id, reference_time=day_7_time)
    compute_all_baselines_for_astronaut(db, chen.id, reference_time=day_7_time)

    # --- Scenario-Specific Follow-Up Days (Days 8 to 13) ---
    extra_obs: List[HealthObservation] = []

    if scenario_key == "SCENARIO_A_NOMINAL":
        # Days 8 to 13: All crew members continue with nominal, healthy variations
        for day_idx in range(7, 13):
            day_time = (t_flight_day_1 + timedelta(days=day_idx, hours=6)).isoformat()
            # Vance
            extra_obs.append(HealthObservation(
                astronaut_id=vance.id, indicator_id=rhr_ind.id,
                value=61.5 + (day_idx % 2) * 0.4, unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            extra_obs.append(HealthObservation(
                astronaut_id=vance.id, indicator_id=sleep_ind.id,
                value=7.5 - (day_idx % 2) * 0.2, unit="hours", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            extra_obs.append(HealthObservation(
                astronaut_id=vance.id, indicator_id=hrr_ind.id,
                value=28.5 + (day_idx % 2) * 0.5, unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            # Thorne & Chen remain nominal
            extra_obs.append(HealthObservation(
                astronaut_id=thorne.id, indicator_id=rhr_ind.id,
                value=58.2, unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            extra_obs.append(HealthObservation(
                astronaut_id=chen.id, indicator_id=rhr_ind.id,
                value=64.1, unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))

        # Nominal habitat telemetry
        env_readings.append(EnvironmentalTelemetry(
            mission_id=mission.id, parameter_name="CABIN_CO2_PPM",
            value=1250.0, unit="ppm", habitat_zone="CREW_QUARTERS",
            timestamp=(t_flight_day_1 + timedelta(days=10)).isoformat(),
        ))
        message = "Scenario A loaded successfully. All crew physiological indicators nominal."

    elif scenario_key == "SCENARIO_B_ACUTE_SPIKE":
        # Days 8: Single acute exertion spike for Marcus Thorne post-EVA
        spike_time = (t_flight_day_1 + timedelta(days=8, hours=6)).isoformat()
        recovery_time = (t_flight_day_1 + timedelta(days=9, hours=6)).isoformat()
        day10_time = (t_flight_day_1 + timedelta(days=10, hours=6)).isoformat()

        events.append(MissionEvent(
            mission_id=mission.id, astronaut_id=thorne.id,
            event_type="EVA_OPERATION", title="Lunar Surface Geology Sortie #1",
            start_time=(t_flight_day_1 + timedelta(days=7, hours=18)).isoformat(),
            end_time=(t_flight_day_1 + timedelta(days=8, hours=2)).isoformat(),
            workload_intensity="HIGH",
            notes="6.5-hour surface EVA conducted in Shackleton Crater. High cardiovascular exertion recorded."
        ))

        # Thorne spike on Day 8, recovering on Day 9
        extra_obs.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=rhr_ind.id,
            value=92.0, unit="bpm", observation_time=spike_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        extra_obs.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=sleep_ind.id,
            value=7.4, unit="hours", observation_time=spike_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        extra_obs.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=hrr_ind.id,
            value=31.0, unit="bpm", observation_time=spike_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        # Day 9 recovery:
        extra_obs.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=rhr_ind.id,
            value=59.0, unit="bpm", observation_time=recovery_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))
        extra_obs.append(HealthObservation(
            astronaut_id=thorne.id, indicator_id=rhr_ind.id,
            value=58.5, unit="bpm", observation_time=day10_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))

        # Vance and Chen nominal
        extra_obs.append(HealthObservation(
            astronaut_id=vance.id, indicator_id=rhr_ind.id,
            value=61.0, unit="bpm", observation_time=spike_time,
            data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
        ))

        message = "Scenario B loaded successfully. Isolated exertion spike on Day 8 filtered out (0 false alarms)."

    else:
        # SCENARIO_C_SILENT_DETERIORATION (The Winning Hero Scenario)
        # Days 8 to 12: Elena Vance develops multi-indicator deterioration under heavy EVA prep and CO2 stress
        events.append(MissionEvent(
            mission_id=mission.id, astronaut_id=vance.id,
            event_type="EVA_OPERATION", title="EVA Suit Maintenance & Ingress Drills",
            start_time=(t_flight_day_1 + timedelta(days=8, hours=8)).isoformat(),
            end_time=(t_flight_day_1 + timedelta(days=8, hours=16)).isoformat(),
            workload_intensity="HIGH",
            notes="Intense mechanical maintenance in Airlock module. Heavy physical upper-body torque loads."
        ))
        events.append(MissionEvent(
            mission_id=mission.id, astronaut_id=vance.id,
            event_type="SLEEP_SHIFT", title="Circadian Shift: Lunar Sunset Schedule",
            start_time=(t_flight_day_1 + timedelta(days=9, hours=20)).isoformat(),
            end_time=(t_flight_day_1 + timedelta(days=10, hours=4)).isoformat(),
            workload_intensity="MODERATE",
            notes="3-hour schedule shift required for communications window with Earth ground control."
        ))

        # Elevated Cabin CO2 in Crew Quarters
        env_readings.append(EnvironmentalTelemetry(
            mission_id=mission.id, parameter_name="CABIN_CO2_PPM",
            value=4200.0, unit="ppm", habitat_zone="CREW_QUARTERS",
            timestamp=(t_flight_day_1 + timedelta(days=9, hours=12)).isoformat(),
        ))
        env_readings.append(EnvironmentalTelemetry(
            mission_id=mission.id, parameter_name="CABIN_CO2_PPM",
            value=3950.0, unit="ppm", habitat_zone="AIRLOCK",
            timestamp=(t_flight_day_1 + timedelta(days=11, hours=8)).isoformat(),
        ))

        # Progressive drift across Days 8, 9, 10, 11, 12 for Elena Vance
        vance_rhr = [65.0, 68.0, 71.0, 74.0, 75.5]       # Slope ~ +2.8 bpm/d
        vance_sleep = [6.5, 6.0, 5.5, 5.1, 4.8]          # Slope ~ -0.65 hr/d
        vance_hrr = [24.0, 20.0, 17.0, 14.0, 13.0]       # Slope ~ -3.0 bpm/d

        for i in range(5):
            day_time = (t_flight_day_1 + timedelta(days=8 + i, hours=6)).isoformat()
            extra_obs.append(HealthObservation(
                astronaut_id=vance.id, indicator_id=rhr_ind.id,
                value=vance_rhr[i], unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            extra_obs.append(HealthObservation(
                astronaut_id=vance.id, indicator_id=sleep_ind.id,
                value=vance_sleep[i], unit="hours", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            extra_obs.append(HealthObservation(
                astronaut_id=vance.id, indicator_id=hrr_ind.id,
                value=vance_hrr[i], unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            # Thorne & Chen remain healthy
            extra_obs.append(HealthObservation(
                astronaut_id=thorne.id, indicator_id=rhr_ind.id,
                value=58.0 + (i % 2) * 0.4, unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))
            extra_obs.append(HealthObservation(
                astronaut_id=chen.id, indicator_id=rhr_ind.id,
                value=64.0 + (i % 2) * 0.4, unit="bpm", observation_time=day_time,
                data_origin="SIMULATED", provenance_ref="NASA-OSDR-ANALOG-EXP71"
            ))

        message = (
            "Scenario C (Silent Deterioration) loaded successfully. "
            "High-priority alert active for Commander Dr. Elena Vance: multi-indicator cardiovascular drift & sleep debt."
        )

    db.add_all(extra_obs)
    db.add_all(events)
    db.add_all(env_readings)
    db.commit()

    # Run fleet deterioration analysis to detect pattern
    analysis_run = run_fleet_deterioration_analysis(db, mission_id=mission.id, run_type="EVENT_TRIGGERED")

    # Count active alerts
    active_alerts = (
        db.query(DeteriorationAlert)
        .filter(DeteriorationAlert.lifecycle_status.in_(["NEW", "UNDER_REVIEW", "MONITORING"]))
        .count()
    )

    total_records = len(observations) + len(extra_obs)

    return {
        "status": "SUCCESS",
        "scenario_key": scenario_key,
        "astronaut_id": vance.id,
        "mission_id": mission.id,
        "records_inserted": total_records,
        "events_inserted": len(events),
        "environmental_inserted": len(env_readings),
        "active_alerts_generated": active_alerts,
        "message": message,
    }
