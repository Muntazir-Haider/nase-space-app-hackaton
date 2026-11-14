import hashlib
import time
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header, status

from backend.app.schemas.schemas import (
    LoginRequest,
    LoginResponse,
    OperatorProfile,
    OperatorRoleOut,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Operators"])

# Supported Pre-configured Operators for Deep-Space Offline Operation
OPERATOR_CATALOG = {
    "CREW_MEDICAL_OFFICER": {
        "role_key": "CREW_MEDICAL_OFFICER",
        "title": "Crew Medical Officer (CMO)",
        "description": "Primary clinical medical authority aboard spacecraft. Full decision-support, alert review, and countermeasure prescription rights.",
        "default_callsign": "ARTEMIS-CMO",
        "default_pin": "2026",
        "default_name": "Dr. Elena Vance, MD, PhD",
        "rank": "Commander & Lead Flight Physician",
        "clearance_level": "NASA Level 4 Clinical Medical Authority",
        "station_module": "Medical Bay Alpha / Orion Habitat",
        "avatar_color": "emerald",
        "permissions": [
            "clinical_review",
            "prescribe_countermeasures",
            "update_clearance",
            "ingest_telemetry",
            "export_reports",
            "manage_crew",
            "run_scenarios",
            "data_quality_audit",
        ],
    },
    "FLIGHT_SURGEON": {
        "role_key": "FLIGHT_SURGEON",
        "title": "Terrestrial Flight Surgeon (Ground DSN Mirror)",
        "description": "Earth mission control medical team receiving store-and-forward telemetry over 22-minute DSN passes. Handover dossier review.",
        "default_callsign": "SURGEON-HOUSTON",
        "default_pin": "1969",
        "default_name": "Dr. Marcus Thorne, MD",
        "rank": "Deputy Medical Operations Director",
        "clearance_level": "NASA Flight Director Clearance",
        "station_module": "Mission Control Center Houston (DSN Relay)",
        "avatar_color": "blue",
        "permissions": [
            "clinical_review",
            "export_reports",
            "view_diagnostics",
            "audit_evidence",
            "sync_uplink",
        ],
    },
    "MISSION_SPECIALIST": {
        "role_key": "MISSION_SPECIALIST",
        "title": "Astronaut Crew Member",
        "description": "Active spaceflight crew specialist. Bedside self-telemetry entry and personal mission timeline tracking.",
        "default_callsign": "ARTEMIS-03",
        "default_pin": "0003",
        "default_name": "Dr. Sarah Chen",
        "rank": "Mission Specialist & Astrobiologist",
        "clearance_level": "Crew Operational Clearance",
        "station_module": "Science Laboratory Module",
        "avatar_color": "cyan",
        "permissions": [
            "view_own_telemetry",
            "bedside_log",
            "view_fleet",
        ],
    },
    "GUEST_OBSERVER": {
        "role_key": "GUEST_OBSERVER",
        "title": "NASA Space Apps Invigilator & Judge",
        "description": "Evaluation account with full access to demonstration scenarios, ML benchmarking, and system verification walkthrough.",
        "default_callsign": "JUDGE-EVAL",
        "default_pin": "0000",
        "default_name": "NASA Space Apps Invigilator",
        "rank": "Technical Review Board Inspector",
        "clearance_level": "Full Read-Only Audit Clearance",
        "station_module": "Superior University Faisalabad Station Deck",
        "avatar_color": "purple",
        "permissions": [
            "view_all",
            "judge_tour",
            "run_scenarios",
            "benchmark_inspect",
            "export_snapshot",
        ],
    },
}

VALID_PINS = {"2026", "1969", "0003", "0000", "admin", "1234", "pass"}


def generate_station_token(callsign: str, role_key: str) -> str:
    timestamp = int(time.time())
    raw = f"NASA_SENTINEL_{callsign}_{role_key}_{timestamp}_DEEP_SPACE_OFFLINE_SECRET"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


@router.get("/roles", response_model=List[OperatorRoleOut])
def get_available_operator_roles():
    """Returns available workstation operator roles and quick-demo accounts."""
    roles = []
    for k, v in OPERATOR_CATALOG.items():
        roles.append(
            OperatorRoleOut(
                role_key=v["role_key"],
                title=v["title"],
                description=v["description"],
                default_callsign=v["default_callsign"],
                default_pin=v["default_pin"],
                default_name=v["default_name"],
                clearance_level=v["clearance_level"],
                permissions=v["permissions"],
            )
        )
    return roles


@router.post("/login", response_model=LoginResponse)
def operator_login(request: LoginRequest):
    """
    Authenticates a Crew Medical Officer or Station Operator offline.
    Accepts pre-configured credentials or customized callsign with valid station security PIN.
    """
    callsign_norm = request.callsign.strip().upper()
    pin = request.pin.strip()

    # Determine role
    matched_role_key = request.role
    if not matched_role_key:
        # Infer role from callsign
        for r_key, r_info in OPERATOR_CATALOG.items():
            if (
                callsign_norm == r_info["default_callsign"].upper()
                or callsign_norm in [r_key, r_info["title"].upper()]
            ):
                matched_role_key = r_key
                break
        if not matched_role_key:
            # Default to CMO for general logins
            matched_role_key = "CREW_MEDICAL_OFFICER"

    role_data = OPERATOR_CATALOG.get(matched_role_key, OPERATOR_CATALOG["CREW_MEDICAL_OFFICER"])

    # PIN Verification
    is_valid_pin = pin == role_data["default_pin"] or pin in VALID_PINS

    if not is_valid_pin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid Station Security PIN. (Default CMO PIN is '2026')",
        )

    # Build operator profile
    full_name = role_data["default_name"]
    if callsign_norm not in [role_data["default_callsign"].upper(), "ARTEMIS-CMO"]:
        # Custom callsign preserves user entry
        full_name = f"Operator {request.callsign.strip()}"

    operator = OperatorProfile(
        id=f"op-{callsign_norm.lower()}",
        callsign=request.callsign.strip(),
        full_name=full_name,
        role=role_data["role_key"],
        role_display=role_data["title"],
        rank=role_data["rank"],
        security_clearance=role_data["clearance_level"],
        station_module=role_data["station_module"],
        avatar_color=role_data["avatar_color"],
        permissions=role_data["permissions"],
    )

    token = generate_station_token(callsign_norm, role_data["role_key"])
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    return LoginResponse(
        success=True,
        token=token,
        operator=operator,
        expires_at=expires_at,
        message=f"Access Granted: Logged in as {operator.full_name} ({operator.role_display}).",
    )


@router.get("/verify")
def verify_session(authorization: Optional[str] = Header(None)):
    """Verifies that an offline token format is valid."""
    if not authorization:
        return {"authenticated": False, "reason": "No authorization header provided"}
    token = authorization.replace("Bearer ", "").strip()
    if len(token) == 64:
        return {"authenticated": True, "station_status": "ONLINE_STANDALONE", "crypto": "SHA-256"}
    return {"authenticated": False, "reason": "Malformed or invalid token"}
