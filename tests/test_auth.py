import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_available_roles():
    res = client.get("/api/v1/auth/roles")
    assert res.status_code == 200
    roles = res.json()
    assert len(roles) >= 4
    role_keys = [r["role_key"] for r in roles]
    assert "CREW_MEDICAL_OFFICER" in role_keys
    assert "FLIGHT_SURGEON" in role_keys
    assert "MISSION_SPECIALIST" in role_keys
    assert "GUEST_OBSERVER" in role_keys


def test_valid_cmo_login():
    res = client.post(
        "/api/v1/auth/login",
        json={
            "callsign": "ARTEMIS-CMO",
            "pin": "2026",
            "role": "CREW_MEDICAL_OFFICER",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["token"]) == 64
    assert data["operator"]["callsign"] == "ARTEMIS-CMO"
    assert data["operator"]["role"] == "CREW_MEDICAL_OFFICER"
    assert "clinical_review" in data["operator"]["permissions"]
    assert "prescribe_countermeasures" in data["operator"]["permissions"]


def test_invalid_pin_rejected():
    res = client.post(
        "/api/v1/auth/login",
        json={
            "callsign": "ARTEMIS-CMO",
            "pin": "9999_WRONG_PIN",
            "role": "CREW_MEDICAL_OFFICER",
        },
    )
    assert res.status_code == 401
    err_body = res.json()
    msg = err_body.get("message") or err_body.get("detail")
    assert "Authentication failed" in msg


def test_flight_surgeon_quick_login():
    res = client.post(
        "/api/v1/auth/login",
        json={
            "callsign": "SURGEON-HOUSTON",
            "pin": "1969",
            "role": "FLIGHT_SURGEON",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["operator"]["role"] == "FLIGHT_SURGEON"
    assert "NASA Flight Director" in data["operator"]["security_clearance"]


def test_token_verify_endpoint():
    # 1. Login to get token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"callsign": "JUDGE-EVAL", "pin": "0000", "role": "GUEST_OBSERVER"},
    )
    token = login_res.json()["token"]

    # 2. Verify token
    verify_res = client.get(
        "/api/v1/auth/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["authenticated"] is True

    # 3. Verify bad token
    bad_res = client.get(
        "/api/v1/auth/verify",
        headers={"Authorization": "Bearer invalid_short_token"},
    )
    assert bad_res.status_code == 200
    assert bad_res.json()["authenticated"] is False
