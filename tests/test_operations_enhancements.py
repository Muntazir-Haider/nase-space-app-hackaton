import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db

init_db()
client = TestClient(app)


def test_handover_report_generation():
    # 1. Load Scenario C so we have realistic alerts, baselines, and environmental data
    scenario_res = client.post("/api/v1/scenarios/load", json={"scenario_key": "SCENARIO_C_SILENT_DETERIORATION"})
    assert scenario_res.status_code == 200
    sc_data = scenario_res.json()
    astro_id = sc_data["astronaut_id"]

    # 2. Fetch Handover Report without notes
    res = client.get(f"/api/v1/reports/handover/{astro_id}")
    assert res.status_code == 200
    report = res.json()

    assert report["astronaut_id"] == astro_id
    assert report["callsign"] == "ARTEMIS-01"
    assert report["overall_clinical_status"] in ["CRITICAL_REVIEW", "OBSERVATION", "NOMINAL"]
    assert "baselines_summary" in report
    assert "RESTING_HEART_RATE" in report["baselines_summary"]
    assert "SLEEP_DURATION" in report["baselines_summary"]
    assert "active_alerts" in report
    assert len(report["active_alerts"]) > 0
    assert "environmental_context" in report
    assert "flight_surgeon_recommendation" in report
    assert "CLINICAL ACTION DIRECTIVE" in report["flight_surgeon_recommendation"] or "FLIGHT SURGEON" in report["flight_surgeon_recommendation"]
    assert "integrity_hash" in report
    assert len(report["integrity_hash"]) == 64  # SHA-256 hex length

    # 3. Fetch Handover Report with CMO handover notes
    cmo_notes = "Astronaut completed 45-min interval cycle countermeasure session. Review prior to FD-14 EVA."
    res_with_notes = client.get(f"/api/v1/reports/handover/{astro_id}?cmo_notes={cmo_notes}")
    assert res_with_notes.status_code == 200
    report_notes = res_with_notes.json()
    assert report_notes["cmo_handover_notes"] == cmo_notes

    # 4. 404 for non-existent astronaut
    res_404 = client.get("/api/v1/reports/handover/NON-EXISTENT-ID")
    assert res_404.status_code == 404


def test_clearance_lifecycle_update():
    # 1. Fetch astronauts list to get a valid astronaut
    astro_list = client.get("/api/v1/astronauts").json()
    assert len(astro_list) > 0
    target_astro = astro_list[0]
    astro_id = target_astro["id"]

    # 2. Update clearance to TEMPORARY_MEDICAL_HOLD
    patch_res = client.patch(
        f"/api/v1/astronauts/{astro_id}/clearance",
        json={
            "clearance_status": "TEMPORARY_MEDICAL_HOLD",
            "reviewer_callsign": "CMO-CHIEF",
            "notes": "48-hour medical hold due to acute cardiac drift.",
        },
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["medical_clearance_status"] == "TEMPORARY_MEDICAL_HOLD"

    # 3. Verify sync queue contains ASTRONAUT_CLEARANCE_UPDATE
    sync_res = client.get("/api/v1/sync/status").json()
    types = [item["transaction_type"] for item in sync_res["recent_items"]]
    assert "ASTRONAUT_CLEARANCE_UPDATE" in types

    # 4. Reject invalid clearance status
    invalid_res = client.patch(
        f"/api/v1/astronauts/{astro_id}/clearance",
        json={
            "clearance_status": "INVALID_UNKNOWN_STATUS",
            "reviewer_callsign": "CMO-CHIEF",
        },
    )
    assert invalid_res.status_code == 400

    # 5. Restore to FULL_FLIGHT_CLEARANCE
    restore_res = client.patch(
        f"/api/v1/astronauts/{astro_id}/clearance",
        json={
            "clearance_status": "FULL_FLIGHT_CLEARANCE",
            "reviewer_callsign": "CMO-CHIEF",
            "notes": "Medical clearance restored following countermeasure protocol.",
        },
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["medical_clearance_status"] == "FULL_FLIGHT_CLEARANCE"


def test_mission_events_lifecycle():
    # 1. Get mission
    missions = client.get("/api/v1/missions").json()
    assert len(missions) > 0
    mission_id = missions[0]["id"]

    # Get astronaut
    astros = client.get("/api/v1/astronauts").json()
    astro_id = astros[0]["id"]

    # 2. Create mission event
    event_payload = {
        "astronaut_id": astro_id,
        "event_type": "EVA",
        "title": "Lunar South Pole Geotechnical Sortie",
        "start_time": "2026-11-14T08:00:00Z",
        "end_time": "2026-11-14T14:30:00Z",
        "workload_intensity": "HIGH",
        "notes": "Surface sample collection and seismic sensor deployment.",
    }
    create_res = client.post(f"/api/v1/missions/{mission_id}/events", json=event_payload)
    assert create_res.status_code == 201
    event_data = create_res.json()
    assert event_data["mission_id"] == mission_id
    assert event_data["astronaut_id"] == astro_id
    assert event_data["event_type"] == "EVA"
    assert event_data["workload_intensity"] == "HIGH"

    # 3. List mission events
    list_res = client.get(f"/api/v1/missions/{mission_id}/events?astronaut_id={astro_id}")
    assert list_res.status_code == 200
    events = list_res.json()
    assert len(events) >= 1
    assert any(e["title"] == "Lunar South Pole Geotechnical Sortie" for e in events)

    # 4. Verify offline sync queue contains MISSION_EVENT_CREATE
    sync_res = client.get("/api/v1/sync/status").json()
    types = [item["transaction_type"] for item in sync_res["recent_items"]]
    assert "MISSION_EVENT_CREATE" in types


def test_database_snapshot_export():
    res = client.get("/api/v1/health/database/snapshot")
    assert res.status_code == 200
    snapshot = res.json()

    assert "system" in snapshot
    assert "version" in snapshot
    assert "snapshot_timestamp_utc" in snapshot
    assert snapshot["total_tables"] == 14
    assert snapshot["total_records"] > 0
    assert "data" in snapshot

    # Verify all 14 tables are present in the snapshot payload
    expected_tables = [
        "missions",
        "astronaut_profiles",
        "indicator_definitions",
        "health_observations",
        "environmental_telemetry",
        "data_quality_audit_log",
        "personal_baselines",
        "mission_events",
        "analysis_runs",
        "deterioration_alerts",
        "alert_evidence_links",
        "clinical_countermeasures",
        "cmo_followups",
        "offline_sync_queue",
    ]
    for tbl in expected_tables:
        assert tbl in snapshot["data"], f"Missing table '{tbl}' in database snapshot"
        assert isinstance(snapshot["data"][tbl], list)
