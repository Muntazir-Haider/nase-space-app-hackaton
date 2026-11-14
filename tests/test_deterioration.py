import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.services.seed_data import seed_default_indicators
from backend.app.models.entities import (
    Mission,
    AstronautProfile,
    MissionEvent,
    EnvironmentalTelemetry,
    DeteriorationAlert,
    AlertEvidenceLink,
    CMOFollowup,
)

@pytest.fixture
def client_with_deterioration_env():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    with TestingSessionLocal() as session:
        seed_default_indicators(session)
        # Create Artemis Mission
        mission = Mission(
            id="mis-artemis-001",
            mission_code="ARTEMIS-III",
            name="Artemis III Lunar Surface Expedition",
            target_destination="LUNAR_SOUTH_POLE",
            spacecraft_module="ORION_MPC_V",
            flight_day=12,
            comms_latency_seconds=3,
            status="ACTIVE",
            start_date="2026-11-01T00:00:00Z",
        )
        session.add(mission)
        session.commit()

        # Create Astronaut Profile
        astro = AstronautProfile(
            id="astro-vance-001",
            mission_id=mission.id,
            callsign="ARTEMIS-01",
            full_name="Dr. Elena Vance",
            flight_role="COMMANDER",
        )
        session.add(astro)
        session.commit()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    
    yield client
    
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_acceptance_8_stable_pattern_invariance(client_with_deterioration_env):
    """
    Test 8: Ingest 7 days of stable nominal observations.
    Active baseline established, zero alerts generated.
    """
    client = client_with_deterioration_env
    t0 = datetime(2026, 11, 1, 6, 0, 0, tzinfo=timezone.utc)
    
    # 7 days of steady vitals: RHR ~ 60 bpm, Sleep ~ 7.5 hrs, HRR ~ 28 bpm
    obs_batch = []
    for day in range(7):
        obs_time = (t0 + timedelta(days=day)).isoformat()
        obs_batch.extend([
            {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": 60.0 + (day % 2) * 0.5, "unit": "bpm", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": 7.5 - (day % 2) * 0.2, "unit": "hours", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 28.0 + (day % 2) * 0.5, "unit": "bpm", "observation_time": obs_time},
        ])
    
    client.post("/api/v1/observations", json={"observations": obs_batch})
    
    # Trigger baseline calculation for all indicators
    base_res = client.get("/api/v1/astronauts/astro-vance-001/baseline")
    assert base_res.status_code == 200
    assert all(b["status"] == "ACTIVE" for b in base_res.json())

    # Trigger deterioration analysis run
    run_res = client.post("/api/v1/alerts/run-analysis?mission_id=mis-artemis-001")
    assert run_res.status_code == 201
    assert run_res.json()["alerts_generated_count"] == 0

    # Verify 0 alerts returned
    alerts_res = client.get("/api/v1/alerts?astronaut_id=astro-vance-001")
    assert alerts_res.status_code == 200
    assert len(alerts_res.json()) == 0


def test_acceptance_9_isolated_spike_filtering(client_with_deterioration_env):
    """
    Test 9: Introduce an isolated acute exertion spike on Day 5 (RHR = 92.0 bpm).
    The engine must suppress false alarms and NOT trigger a Silent Deterioration alert.
    """
    client = client_with_deterioration_env
    t0 = datetime(2026, 11, 1, 6, 0, 0, tzinfo=timezone.utc)
    
    # Establish 7 days of baseline
    obs_batch = []
    for day in range(7):
        obs_time = (t0 + timedelta(days=day)).isoformat()
        obs_batch.extend([
            {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": 60.0, "unit": "bpm", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": 7.5, "unit": "hours", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 28.0, "unit": "bpm", "observation_time": obs_time},
        ])
    client.post("/api/v1/observations", json={"observations": obs_batch})
    client.get("/api/v1/astronauts/astro-vance-001/baseline")

    # Add single day spike on Day 7, followed by immediate return to normal on Day 8
    spike_time = (t0 + timedelta(days=7)).isoformat()
    recovery_time = (t0 + timedelta(days=8)).isoformat()
    client.post("/api/v1/observations", json={"observations": [
        # Single spike in RHR only
        {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": 92.0, "unit": "bpm", "observation_time": spike_time},
        {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": 7.4, "unit": "hours", "observation_time": spike_time},
        {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 27.5, "unit": "bpm", "observation_time": spike_time},
        # Next day returns to normal
        {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": 60.5, "unit": "bpm", "observation_time": recovery_time},
        {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": 7.6, "unit": "hours", "observation_time": recovery_time},
        {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 28.0, "unit": "bpm", "observation_time": recovery_time},
    ]})

    # Trigger analysis
    run_res = client.post("/api/v1/alerts/run-analysis?mission_id=mis-artemis-001")
    assert run_res.status_code == 201
    assert run_res.json()["alerts_generated_count"] == 0

    alerts = client.get("/api/v1/alerts?astronaut_id=astro-vance-001").json()
    assert len(alerts) == 0


def test_acceptance_10_sustained_multi_indicator_deterioration(client_with_deterioration_env):
    """
    Test 10: Multi-indicator drift (Scenario C):
    RHR climbs from 62 to 74 bpm (+2.8 bpm/d), Sleep drops from 7.5 to 5.1 hrs (-0.65 hr/d),
    HRR drops from 28 to 14 bpm (-3.2 bpm/d) sustained across 4 consecutive days.
    High-priority Silent Deterioration alert must be triggered.
    """
    client = client_with_deterioration_env
    t0 = datetime(2026, 11, 1, 6, 0, 0, tzinfo=timezone.utc)

    # 1. Establish 7 days of clean baseline
    baseline_batch = []
    for day in range(7):
        obs_time = (t0 + timedelta(days=day)).isoformat()
        baseline_batch.extend([
            {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": 60.0 + (day % 2), "unit": "bpm", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": 7.5 - (day % 2) * 0.1, "unit": "hours", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 28.0, "unit": "bpm", "observation_time": obs_time},
        ])
    client.post("/api/v1/observations", json={"observations": baseline_batch})
    client.get("/api/v1/astronauts/astro-vance-001/baseline")

    # 2. Add Mission Event (EVA Prep) and Environmental stressor (Cabin CO2 = 4200 ppm)
    eva_start = (t0 + timedelta(days=7)).isoformat()
    eva_end = (t0 + timedelta(days=11)).isoformat()
    
    # Ingest Environmental Telemetry
    client.post("/api/v1/environmental", json={
        "mission_id": "mis-artemis-001",
        "parameter_name": "CABIN_CO2_PPM",
        "value": 4200.0,
        "unit": "ppm",
        "habitat_zone": "CREW_QUARTERS",
        "timestamp": eva_start,
    })

    # 3. Ingest 4 consecutive days of multi-indicator degradation
    drift_batch = []
    rhr_values = [65.0, 68.0, 71.0, 74.0]     # Rising slope ~ +3.0 bpm/d
    sleep_values = [6.5, 6.0, 5.5, 5.1]       # Falling slope ~ -0.47 hr/d
    hrr_values = [24.0, 20.0, 17.0, 14.0]     # Decelerating slope ~ -3.3 bpm/d

    for i in range(4):
        obs_time = (t0 + timedelta(days=7 + i)).isoformat()
        drift_batch.extend([
            {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": rhr_values[i], "unit": "bpm", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": sleep_values[i], "unit": "hours", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": hrr_values[i], "unit": "bpm", "observation_time": obs_time},
        ])
    client.post("/api/v1/observations", json={"observations": drift_batch})

    # 4. Trigger Analysis
    run_res = client.post("/api/v1/alerts/run-analysis?mission_id=mis-artemis-001")
    assert run_res.status_code == 201
    assert run_res.json()["alerts_generated_count"] == 1

    # 5. Verify Generated Alert
    alerts = client.get("/api/v1/alerts?astronaut_id=astro-vance-001").json()
    assert len(alerts) == 1
    alert = alerts[0]

    assert alert["review_priority"] == "HIGH"
    assert alert["pattern_type"] == "SILENT_MULTI_INDICATOR_DETERIORATION"
    assert alert["lifecycle_status"] == "NEW"
    assert "Persistent multi-indicator physiological deterioration" in alert["detection_narrative"]
    assert "Resting Heart Rate has risen" in alert["detection_narrative"]
    assert "Sleep Duration has declined" in alert["detection_narrative"]
    assert "NASA Human Research Roadmap" in alert["scientific_ref"]


def test_acceptance_11_and_12_evidence_audit_and_status_transition(client_with_deterioration_env):
    """
    Tests 11 & 12:
    - Verify explainable evidence linking (/api/v1/alerts/{id}/evidence)
    - Verify linked observation UUIDs, z-scores, and OLS slopes
    - Verify status transition (NEW -> UNDER_REVIEW) and audit follow-up logging
    """
    client = client_with_deterioration_env
    t0 = datetime(2026, 11, 1, 6, 0, 0, tzinfo=timezone.utc)

    # Seed baseline + degradation to generate alert
    batch = []
    for day in range(7):
        obs_time = (t0 + timedelta(days=day)).isoformat()
        batch.extend([
            {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": 60.0, "unit": "bpm", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": 7.5, "unit": "hours", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 28.0, "unit": "bpm", "observation_time": obs_time},
        ])
    client.post("/api/v1/observations", json={"observations": batch})
    client.get("/api/v1/astronauts/astro-vance-001/baseline")

    # Degrade across 4 days
    drift = []
    for i in range(4):
        obs_time = (t0 + timedelta(days=7 + i)).isoformat()
        drift.extend([
            {"astronaut_id": "astro-vance-001", "indicator_key": "RESTING_HEART_RATE", "value": 64.0 + i * 3.0, "unit": "bpm", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "SLEEP_DURATION", "value": 7.0 - i * 0.6, "unit": "hours", "observation_time": obs_time},
            {"astronaut_id": "astro-vance-001", "indicator_key": "HEART_RATE_RECOVERY_1MIN", "value": 26.0 - i * 3.0, "unit": "bpm", "observation_time": obs_time},
        ])
    client.post("/api/v1/observations", json={"observations": drift})
    client.post("/api/v1/alerts/run-analysis?mission_id=mis-artemis-001")

    alerts = client.get("/api/v1/alerts?astronaut_id=astro-vance-001").json()
    assert len(alerts) == 1
    alert_id = alerts[0]["id"]

    # 1. Fetch deep evidence detail
    ev_res = client.get(f"/api/v1/alerts/{alert_id}/evidence")
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["astronaut_callsign"] == "ARTEMIS-01"
    assert ev_data["astronaut_full_name"] == "Dr. Elena Vance"
    assert len(ev_data["evidence_items"]) >= 8  # Multiple observations linked across indicators

    first_evidence = ev_data["evidence_items"][0]
    assert first_evidence["evidence_type"] == "BIOMETRIC"
    assert first_evidence["metric_name"] in ["RESTING_HEART_RATE", "SLEEP_DURATION", "HEART_RATE_RECOVERY_1MIN"]
    assert first_evidence["z_score"] is not None
    assert first_evidence["ols_slope"] is not None

    # 2. Transition alert status: NEW -> UNDER_REVIEW
    update_res = client.patch(
        f"/api/v1/alerts/{alert_id}/status",
        json={
            "lifecycle_status": "UNDER_REVIEW",
            "reviewer_callsign": "CMO-01",
            "notes": "CMO initiated clinical protocol review. Sleep extension and cardiac monitoring ordered.",
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["lifecycle_status"] == "UNDER_REVIEW"

    # Verify CMO Followup history logged in evidence endpoint
    ev_updated = client.get(f"/api/v1/alerts/{alert_id}/evidence").json()
    assert len(ev_updated["followups"]) == 1
    assert ev_updated["followups"][0]["reviewer_callsign"] == "CMO-01"
    assert "NEW -> UNDER_REVIEW" in ev_updated["followups"][0]["status_transition"]
