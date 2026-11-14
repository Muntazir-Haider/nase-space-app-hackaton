from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import AstronautProfile, PersonalBaseline, IndicatorDefinition
from backend.app.schemas.schemas import PersonalBaselineOut
from backend.app.services.baseline_engine import (
    compute_all_baselines_for_astronaut,
    get_latest_baselines_for_astronaut,
)

router = APIRouter(prefix="/astronauts", tags=["Personal Baselines"])

@router.get("/{astronaut_id}/baseline", response_model=List[PersonalBaselineOut])
def get_astronaut_baselines(astronaut_id: str, db: Session = Depends(get_db)):
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found.",
        )
    
    baselines = get_latest_baselines_for_astronaut(db, astronaut_id)
    # If no baseline exists yet, compute initial state
    if not baselines:
        baselines = compute_all_baselines_for_astronaut(db, astronaut_id)
    
    # Populate indicator_key for frontend clarity
    results = []
    for b in baselines:
        ind = db.query(IndicatorDefinition).filter(IndicatorDefinition.id == b.indicator_id).first()
        out = PersonalBaselineOut(
            id=b.id,
            astronaut_id=b.astronaut_id,
            indicator_id=b.indicator_id,
            indicator_key=ind.indicator_key if ind else "UNKNOWN",
            window_start=b.window_start,
            window_end=b.window_end,
            sample_count=b.sample_count,
            mean=b.mean,
            median=b.median,
            std_dev=b.std_dev,
            status=b.status,
            version=b.version,
            calculated_at=b.calculated_at,
        )
        results.append(out)
    return results

@router.post("/{astronaut_id}/baseline/recompute", response_model=List[PersonalBaselineOut])
def recompute_astronaut_baselines(astronaut_id: str, db: Session = Depends(get_db)):
    astro = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if not astro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found.",
        )
    
    baselines = compute_all_baselines_for_astronaut(db, astronaut_id)
    results = []
    for b in baselines:
        ind = db.query(IndicatorDefinition).filter(IndicatorDefinition.id == b.indicator_id).first()
        out = PersonalBaselineOut(
            id=b.id,
            astronaut_id=b.astronaut_id,
            indicator_id=b.indicator_id,
            indicator_key=ind.indicator_key if ind else "UNKNOWN",
            window_start=b.window_start,
            window_end=b.window_end,
            sample_count=b.sample_count,
            mean=b.mean,
            median=b.median,
            std_dev=b.std_dev,
            status=b.status,
            version=b.version,
            calculated_at=b.calculated_at,
        )
        results.append(out)
    return results
