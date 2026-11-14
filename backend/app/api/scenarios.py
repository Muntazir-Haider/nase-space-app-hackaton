from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.schemas import ScenarioLoadRequest, ScenarioLoadResponse
from backend.app.services.scenario_loader import load_scenario

router = APIRouter(prefix="/scenarios", tags=["Demonstration Scenarios"])

@router.post("/load", response_model=ScenarioLoadResponse)
def load_demo_scenario_endpoint(payload: ScenarioLoadRequest, db: Session = Depends(get_db)):
    valid_keys = [
        "SCENARIO_A_NOMINAL",
        "SCENARIO_B_ACUTE_SPIKE",
        "SCENARIO_C_SILENT_DETERIORATION",
    ]
    if payload.scenario_key not in valid_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scenario '{payload.scenario_key}'. Allowed: {valid_keys}",
        )
    result = load_scenario(db, payload.scenario_key)
    return ScenarioLoadResponse(**result)
