from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import HealthObservation, IndicatorDefinition
from backend.app.schemas.schemas import (
    HealthObservationBatchIn,
    IngestionResponse,
    IngestionResultItem,
)
from backend.app.services.data_quality import validate_observation
from backend.app.services.sync_engine import queue_offline_transaction

router = APIRouter(prefix="/observations", tags=["Observations & Ingestion"])

@router.post("", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
def ingest_observations(payload: HealthObservationBatchIn, db: Session = Depends(get_db)):
    results: List[IngestionResultItem] = []
    accepted_count = 0
    rejected_count = 0

    for item in payload.observations:
        val_res = validate_observation(db, item)
        
        if val_res.is_valid:
            obs = HealthObservation(
                astronaut_id=item.astronaut_id,
                indicator_id=val_res.indicator_id,
                value=item.value,
                unit=item.unit,
                observation_time=item.observation_time,
                data_origin=item.data_origin,
                provenance_ref=item.provenance_ref,
                quality_status=val_res.quality_status,
                quality_notes=val_res.quality_notes,
            )
            db.add(obs)
            db.commit()
            db.refresh(obs)
            
            # Queue to offline store-and-forward queue with SHA-256 idempotency protection
            queue_offline_transaction(
                db=db,
                transaction_type="OBSERVATION_INGEST",
                entity_table="health_observations",
                entity_id=obs.id,
                payload={
                    "astronaut_id": item.astronaut_id,
                    "indicator_key": item.indicator_key,
                    "value": item.value,
                    "unit": item.unit,
                    "observation_time": item.observation_time,
                },
            )

            accepted_count += 1
            results.append(
                IngestionResultItem(
                    observation_id=obs.id,
                    indicator_key=item.indicator_key,
                    quality_status=val_res.quality_status,
                    quality_notes=val_res.quality_notes,
                )
            )
        else:
            rejected_count += 1
            results.append(
                IngestionResultItem(
                    observation_id=None,
                    indicator_key=item.indicator_key,
                    quality_status="REJECTED",
                    quality_notes=val_res.quality_notes,
                )
            )

    return IngestionResponse(
        accepted_count=accepted_count,
        rejected_count=rejected_count,
        results=results,
    )

@router.get("")
def list_observations(
    astronaut_id: Optional[str] = Query(None),
    indicator_key: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(HealthObservation)
    if astronaut_id:
        query = query.filter(HealthObservation.astronaut_id == astronaut_id)
    if indicator_key:
        indicator = db.query(IndicatorDefinition).filter_by(indicator_key=indicator_key).first()
        if indicator:
            query = query.filter(HealthObservation.indicator_id == indicator.id)
    
    observations = query.order_by(HealthObservation.observation_time.desc()).limit(limit).all()
    return observations
