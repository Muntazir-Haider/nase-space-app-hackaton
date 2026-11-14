import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.database import Base, get_db

@pytest.fixture
def client_with_clean_db():
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

def test_astronaut_roster_flow(client_with_clean_db):
    client = client_with_clean_db
    
    # 1. Create a Mission
    mission_res = client.post(
        "/api/v1/missions",
        json={
            "mission_code": "ARTEMIS-III",
            "name": "Artemis III Surface Expedition",
            "target_destination": "LUNAR_SOUTH_POLE",
            "spacecraft_module": "ORION_MPC_V",
            "flight_day": 14,
            "comms_latency_seconds": 3,
            "status": "ACTIVE",
            "start_date": "2026-11-01T00:00:00Z",
        },
    )
    assert mission_res.status_code == 201
    mission_data = mission_res.json()
    mission_id = mission_data["id"]

    # 2. Create Astronaut Profile
    astro_res = client.post(
        "/api/v1/astronauts",
        json={
            "mission_id": mission_id,
            "callsign": "ARTEMIS-01",
            "full_name": "Dr. Elena Vance",
            "flight_role": "COMMANDER",
            "medical_clearance_status": "FULL_FLIGHT_CLEARANCE",
        },
    )
    assert astro_res.status_code == 201
    astro_data = astro_res.json()
    astro_id = astro_data["id"]
    assert astro_data["callsign"] == "ARTEMIS-01"

    # 3. Retrieve Astronaut by ID
    get_res = client.get(f"/api/v1/astronauts/{astro_id}")
    assert get_res.status_code == 200
    assert get_res.json()["full_name"] == "Dr. Elena Vance"

    # 4. List Astronauts (Summary with Status Indicator)
    list_res = client.get("/api/v1/astronauts")
    assert list_res.status_code == 200
    roster = list_res.json()
    assert len(roster) == 1
    assert roster[0]["callsign"] == "ARTEMIS-01"
    assert roster[0]["mission_code"] == "ARTEMIS-III"
    assert roster[0]["status_indicator"] == "NOMINAL"
    assert roster[0]["active_alert_count"] == 0

    # 5. Duplicate callsign should return 409
    dup_res = client.post(
        "/api/v1/astronauts",
        json={
            "mission_id": mission_id,
            "callsign": "ARTEMIS-01",
            "full_name": "Duplicate Person",
            "flight_role": "PILOT",
            "medical_clearance_status": "FULL_FLIGHT_CLEARANCE",
        },
    )
    assert dup_res.status_code == 409

    # 6. Unknown astronaut ID returns 404
    not_found_res = client.get("/api/v1/astronauts/non-existent-uuid")
    assert not_found_res.status_code == 404
