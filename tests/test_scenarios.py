import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.database import Base, get_db

@pytest.fixture
def api_client():
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


def test_load_scenario_c_silent_deterioration(api_client):
    res = api_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_C_SILENT_DETERIORATION"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["scenario_key"] == "SCENARIO_C_SILENT_DETERIORATION"
    assert data["active_alerts_generated"] == 1
    assert data["records_inserted"] > 50

    # Verify roster
    roster_res = api_client.get("/api/v1/astronauts")
    assert roster_res.status_code == 200
    roster = roster_res.json()
    assert len(roster) == 3

    vance = next(a for a in roster if a["callsign"] == "ARTEMIS-01")
    assert vance["status_indicator"] == "REVIEW_ALERT"
    assert vance["active_alert_count"] == 1

    thorne = next(a for a in roster if a["callsign"] == "ARTEMIS-02")
    assert thorne["status_indicator"] == "NOMINAL"

def test_load_scenario_a_nominal(api_client):
    res = api_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_A_NOMINAL"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["active_alerts_generated"] == 0

    # Verify all astronauts nominal
    roster = api_client.get("/api/v1/astronauts").json()
    assert all(a["status_indicator"] == "NOMINAL" for a in roster)
    assert all(a["active_alert_count"] == 0 for a in roster)

def test_load_scenario_b_acute_spike(api_client):
    res = api_client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_B_ACUTE_SPIKE"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["active_alerts_generated"] == 0

    # Verify spike did not trigger false alert
    roster = api_client.get("/api/v1/astronauts").json()
    assert all(a["active_alert_count"] == 0 for a in roster)

def test_invalid_scenario_key_returns_400(api_client):
    res = api_client.post("/api/v1/scenarios/load", json={"scenario_key": "INVALID_SCENARIO"})
    assert res.status_code == 400
