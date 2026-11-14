import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.services.seed_data import seed_default_indicators
from backend.app.models.entities import Mission, AstronautProfile, HealthObservation, DataQualityAuditLog

@pytest.fixture
def client_with_seeded_db():
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
    
    # Seed default indicators
    with TestingSessionLocal() as session:
        seed_default_indicators(session)
        # Create a test mission and astronaut
        mission = Mission(
            mission_code="ARTEMIS-III",
            name="Artemis III Expedition",
            target_destination="LUNAR_SURFACE",
            spacecraft_module="STARSHIP_HLS",
            flight_day=10,
            comms_latency_seconds=3,
            status="ACTIVE",
            start_date="2026-11-01T00:00:00Z",
        )
        session.add(mission)
        session.commit()

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

def test_acceptance_2_valid_measurement_ingestion(client_with_seeded_db):
    client = client_with_seeded_db
    now_str = datetime.now(timezone.utc).isoformat()
    
    payload = {
        "observations": [
            {
                "astronaut_id": "astro-vance-001",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 62.0,
                "unit": "bpm",
                "observation_time": now_str,
                "data_origin": "SIMULATED",
                "provenance_ref": "OSDR-EXP71-ANALOG",
            },
            {
                "astronaut_id": "astro-vance-001",
                "indicator_key": "SLEEP_DURATION",
                "value": 7.5,
                "unit": "hours",
                "observation_time": now_str,
                "data_origin": "SIMULATED",
                "provenance_ref": "OSDR-EXP71-ANALOG",
            },
            {
                "astronaut_id": "astro-vance-001",
                "indicator_key": "HEART_RATE_RECOVERY_1MIN",
                "value": 28.0,
                "unit": "bpm",
                "observation_time": now_str,
                "data_origin": "SIMULATED",
                "provenance_ref": "OSDR-EXP71-ANALOG",
            }
        ]
    }
    
    res = client.post("/api/v1/observations", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["accepted_count"] == 3
    assert data["rejected_count"] == 0
    for r in data["results"]:
        assert r["quality_status"] == "VALID"
        assert r["observation_id"] is not None

def test_acceptance_3_invalid_measurement_rejection_and_audit(client_with_seeded_db):
    client = client_with_seeded_db
    now_str = datetime.now(timezone.utc).isoformat()
    
    payload = {
        "observations": [
            {
                # Invalid unit test
                "astronaut_id": "astro-vance-001",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 65.0,
                "unit": "psi",  # Invalid unit
                "observation_time": now_str,
            },
            {
                # Out of bounds value test
                "astronaut_id": "astro-vance-001",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 295.0,  # Exceeds critical max 220
                "unit": "bpm",
                "observation_time": now_str,
            }
        ]
    }
    
    res = client.post("/api/v1/observations", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["accepted_count"] == 0
    assert data["rejected_count"] == 2
    assert "Invalid unit" in data["results"][0]["quality_notes"]
    assert "outside plausible physiological bounds" in data["results"][1]["quality_notes"]

    # Verify that data_quality_audit_log recorded both rejections
    audit_res = client.get("/api/v1/data-quality/audit")
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    assert len(audit_logs) >= 2
    error_codes = [log["error_code"] for log in audit_logs]
    assert "INVALID_UNIT" in error_codes
    assert "OUT_OF_BOUNDS" in error_codes

def test_acceptance_5_stale_data_warning(client_with_seeded_db):
    client = client_with_seeded_db
    # 48 hours ago
    stale_time = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    
    payload = {
        "observations": [
            {
                "astronaut_id": "astro-vance-001",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 64.0,
                "unit": "bpm",
                "observation_time": stale_time,
            }
        ]
    }
    
    res = client.post("/api/v1/observations", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["accepted_count"] == 1
    assert data["results"][0]["quality_status"] == "STALE"
    assert "older than 36 hours" in data["results"][0]["quality_notes"]

def test_acceptance_15_duplicate_prevention(client_with_seeded_db):
    client = client_with_seeded_db
    fixed_time = "2026-11-14T05:00:00Z"
    
    single_obs = {
        "observations": [
            {
                "astronaut_id": "astro-vance-001",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 61.0,
                "unit": "bpm",
                "observation_time": fixed_time,
            }
        ]
    }
    
    # First ingest: Accepted
    res1 = client.post("/api/v1/observations", json=single_obs)
    assert res1.status_code == 201
    assert res1.json()["accepted_count"] == 1
    
    # Duplicate ingest: Rejected
    res2 = client.post("/api/v1/observations", json=single_obs)
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["accepted_count"] == 0
    assert data2["rejected_count"] == 1
    assert "Duplicate observation already recorded" in data2["results"][0]["quality_notes"]

def test_future_timestamp_rejection(client_with_seeded_db):
    client = client_with_seeded_db
    # 2 hours in the future
    future_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    
    payload = {
        "observations": [
            {
                "astronaut_id": "astro-vance-001",
                "indicator_key": "SLEEP_DURATION",
                "value": 8.0,
                "unit": "hours",
                "observation_time": future_time,
            }
        ]
    }
    
    res = client.post("/api/v1/observations", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["rejected_count"] == 1
    assert "in the future" in data["results"][0]["quality_notes"]

def test_environmental_telemetry_flow(client_with_seeded_db):
    client = client_with_seeded_db
    # Fetch mission to get its ID
    missions = client.get("/api/v1/missions").json()
    assert len(missions) >= 1
    mission_id = missions[0]["id"]
    now_str = datetime.now(timezone.utc).isoformat()

    # Record Cabin CO2
    co2_payload = {
        "mission_id": mission_id,
        "parameter_name": "CABIN_CO2_PPM",
        "value": 1850.0,
        "unit": "ppm",
        "habitat_zone": "CREW_QUARTERS",
        "timestamp": now_str,
    }
    res = client.post("/api/v1/environmental", json=co2_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["parameter_name"] == "CABIN_CO2_PPM"
    assert data["value"] == 1850.0
    assert data["quality_status"] == "VALID"

    # List environmental telemetry
    list_res = client.get(f"/api/v1/environmental?mission_id={mission_id}")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["parameter_name"] == "CABIN_CO2_PPM"

    # Invalid mission ID returns 400
    invalid_payload = dict(co2_payload, mission_id="invalid-uuid")
    bad_res = client.post("/api/v1/environmental", json=invalid_payload)
    assert bad_res.status_code == 400

def test_indicator_catalog_and_audit_endpoints(client_with_seeded_db):
    client = client_with_seeded_db
    # Get seeded indicators
    res = client.get("/api/v1/data-quality/indicators")
    assert res.status_code == 200
    indicators = res.json()
    assert len(indicators) == 5
    keys = {ind["indicator_key"] for ind in indicators}
    assert "RESTING_HEART_RATE" in keys
    assert "SLEEP_DURATION" in keys
    assert "HEART_RATE_RECOVERY_1MIN" in keys
    assert "CABIN_CO2_PPM" in keys
    assert "AMBIENT_RADIATION_USV" in keys

    # Trigger an audit log entry via invalid observation
    bad_obs = {
        "observations": [
            {
                "astronaut_id": "astro-vance-001",
                "indicator_key": "RESTING_HEART_RATE",
                "value": 999.0,  # Extreme physiological violation
                "unit": "bpm",
                "observation_time": datetime.now(timezone.utc).isoformat(),
            }
        ]
    }
    client.post("/api/v1/observations", json=bad_obs)

    # Check audit log endpoint
    audit_res = client.get("/api/v1/data-quality/audit")
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    assert len(audit_logs) >= 1
    assert any(log["error_code"] == "OUT_OF_BOUNDS" for log in audit_logs)

