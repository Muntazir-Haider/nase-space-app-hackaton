import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.entities import Mission

@pytest.fixture
def persistence_client():
    """Sets up an isolated database for profile persistence tests."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    # Seed baseline mission
    db = TestingSessionLocal()
    mission = Mission(
        id="test-mission-artemis-pers",
        mission_code="ARTEMIS-III-PERS",
        name="Artemis III Test Expedition",
        target_destination="LUNAR_SOUTH_POLE",
        spacecraft_module="ORION_MPC_V",
        flight_day=14,
        comms_latency_seconds=1320,
        status="ACTIVE",
        start_date="2026-11-01T00:00:00Z",
        created_at="2026-11-01T00:00:00Z",
    )
    db.add(mission)
    db.commit()
    db.close()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client, TestingSessionLocal
    app.dependency_overrides.clear()

def test_acceptance_1_profile_creation_and_persistence(persistence_client):
    """
    Acceptance Test 1:
    Create an astronaut profile via API/UI, simulate reboot, and confirm profile remains available in SQLite.
    """
    client, SessionLocal = persistence_client

    payload = {
        "mission_id": "test-mission-artemis-pers",
        "callsign": "ARTEMIS-TEST-09",
        "full_name": "Commander Mark Watney",
        "flight_role": "COMMANDER",
        "medical_clearance_status": "FULL_FLIGHT_CLEARANCE",
    }

    # 1. Create astronaut profile
    create_res = client.post("/api/v1/astronauts", json=payload)
    assert create_res.status_code == 201, f"Expected 201, got {create_res.status_code}: {create_res.text}"
    data = create_res.json()
    astro_id = data["id"]
    assert data["callsign"] == "ARTEMIS-TEST-09"
    assert data["full_name"] == "Commander Mark Watney"

    # 2. Simulate application restart (inspect fresh session directly from database)
    db = SessionLocal()
    from backend.app.models.entities import AstronautProfile
    persisted_profile = db.query(AstronautProfile).filter(AstronautProfile.id == astro_id).first()
    assert persisted_profile is not None
    assert persisted_profile.callsign == "ARTEMIS-TEST-09"
    assert persisted_profile.flight_role == "COMMANDER"
    db.close()

    # 3. Retrieve via REST API endpoint
    get_res = client.get(f"/api/v1/astronauts/{astro_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["id"] == astro_id
    assert retrieved["callsign"] == "ARTEMIS-TEST-09"

    # 4. Confirm it appears in the roster summary
    roster_res = client.get("/api/v1/astronauts")
    assert roster_res.status_code == 200
    roster = roster_res.json()
    match = next((a for a in roster if a["id"] == astro_id), None)
    assert match is not None
    assert match["callsign"] == "ARTEMIS-TEST-09"
    assert match["status_indicator"] == "NOMINAL"

def test_profile_creation_conflict_and_validation(persistence_client):
    """Verifies duplicate callsign rejection (409) and missing fields (422)."""
    client, _ = persistence_client

    payload = {
        "mission_id": "test-mission-artemis-pers",
        "callsign": "ARTEMIS-DUP-01",
        "full_name": "Dr. Cooper",
        "flight_role": "PILOT",
        "medical_clearance_status": "FULL_FLIGHT_CLEARANCE",
    }
    r1 = client.post("/api/v1/astronauts", json=payload)
    assert r1.status_code == 201

    # Duplicate callsign should return 409 Conflict
    r2 = client.post("/api/v1/astronauts", json=payload)
    assert r2.status_code == 409
    error_data = r2.json()
    assert error_data["status"] == "error"
    assert error_data["error_code"] == "CONFLICT"

    # Invalid mission ID should return 400 Bad Request
    invalid_mission_payload = {
        "mission_id": "nonexistent-mission-id",
        "callsign": "ARTEMIS-NEW-02",
        "full_name": "Dr. Brand",
        "flight_role": "MISSION_SPECIALIST",
        "medical_clearance_status": "FULL_FLIGHT_CLEARANCE",
    }
    r3 = client.post("/api/v1/astronauts", json=invalid_mission_payload)
    assert r3.status_code == 400
    assert r3.json()["status"] == "error"

    # Missing mandatory field should return 422 Unprocessable Entity
    incomplete_payload = {
        "mission_id": "test-mission-artemis-pers",
        # missing callsign
        "full_name": "Incomplete Profile",
    }
    r4 = client.post("/api/v1/astronauts", json=incomplete_payload)
    assert r4.status_code == 422
    assert r4.json()["status"] == "error"
    assert r4.json()["error_code"] == "VALIDATION_ERROR"
