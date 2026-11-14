import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.services.sync_engine import (
    compute_idempotency_hash,
    queue_offline_transaction,
    get_sync_queue_summary,
    simulate_comms_window_flush,
)
from backend.app.models.entities import OfflineSyncQueue

@pytest.fixture
def sync_client():
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
    
    yield client, TestingSessionLocal
    
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_idempotency_hash_deterministic():
    payload1 = {"value": 74.0, "unit": "bpm", "timestamp": "2026-11-14T06:00:00Z"}
    payload2 = {"timestamp": "2026-11-14T06:00:00Z", "unit": "bpm", "value": 74.0}
    
    hash1 = compute_idempotency_hash("INSERT_OBSERVATION", "health_observations", payload1)
    hash2 = compute_idempotency_hash("INSERT_OBSERVATION", "health_observations", payload2)

    # Key order variance must yield identical hash
    assert hash1 == hash2
    assert len(hash1) == 64


def test_offline_queue_deduplication(sync_client):
    _, session_factory = sync_client
    with session_factory() as db:
        payload = {"astronaut_id": "astro-01", "value": 72.0}
        
        # First queue: inserts item
        item1 = queue_offline_transaction(db, "COUNTERMEASURE_LOG", "clinical_countermeasures", "cntm-01", payload)
        assert item1.sync_status == "QUEUED"
        
        # Second queue: duplicate suppressed
        item2 = queue_offline_transaction(db, "COUNTERMEASURE_LOG", "clinical_countermeasures", "cntm-01", payload)
        assert item2.id == item1.id
        
        count = db.query(OfflineSyncQueue).count()
        assert count == 1


def test_sync_status_and_flush_api(sync_client):
    client, session_factory = sync_client
    with session_factory() as db:
        queue_offline_transaction(db, "OBSERVATION", "health_observations", "obs-01", {"rhr": 65})
        queue_offline_transaction(db, "OBSERVATION", "health_observations", "obs-02", {"rhr": 68})

    # Test status endpoint
    res = client.get("/api/v1/sync/status")
    assert res.status_code == 200
    data = res.json()
    assert data["queued_pending"] == 2
    assert data["comms_mode"] == "STORE_AND_FORWARD"

    # Test flush endpoint
    flush_res = client.post("/api/v1/sync/flush")
    assert flush_res.status_code == 200
    assert flush_res.json()["flushed_count"] == 2

    # Verify status transitioned
    after_res = client.get("/api/v1/sync/status")
    assert after_res.json()["queued_pending"] == 0
    assert after_res.json()["synced_to_earth"] == 2
