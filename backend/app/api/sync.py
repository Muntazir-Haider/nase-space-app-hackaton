from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.sync_engine import get_sync_queue_summary, simulate_comms_window_flush

router = APIRouter(prefix="/sync", tags=["Offline Resilience & Sync Queue"])

@router.get("/status")
def get_sync_status(db: Session = Depends(get_db)):
    return get_sync_queue_summary(db)

@router.post("/flush", status_code=status.HTTP_200_OK)
def trigger_comms_flush(db: Session = Depends(get_db)):
    flushed_count = simulate_comms_window_flush(db)
    return {
        "status": "SUCCESS",
        "flushed_count": flushed_count,
        "message": f"High-gain Deep Space Network (DSN) comms window active: {flushed_count} transactions transmitted to Mission Control."
    }
