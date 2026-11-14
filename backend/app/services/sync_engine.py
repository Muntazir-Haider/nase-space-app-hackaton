import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.entities import OfflineSyncQueue

def compute_idempotency_hash(transaction_type: str, entity_table: str, payload: Dict[str, Any]) -> str:
    """
    Computes a deterministic SHA-256 hash across the transaction type, target table,
    and serialized payload to ensure zero duplicate records during offline synchronization.
    """
    normalized_json = json.dumps(payload, sort_keys=True)
    raw = f"{transaction_type}:{entity_table}:{normalized_json}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def queue_offline_transaction(
    db: Session,
    transaction_type: str,
    entity_table: str,
    entity_id: str,
    payload: Dict[str, Any],
) -> OfflineSyncQueue:
    """
    Appends an outgoing transaction to the offline sync queue with idempotency protection.
    """
    hash_val = compute_idempotency_hash(transaction_type, entity_table, payload)
    
    # Check if identical transaction already exists
    existing = db.query(OfflineSyncQueue).filter_by(idempotency_hash=hash_val).first()
    if existing:
        return existing

    queue_item = OfflineSyncQueue(
        transaction_type=transaction_type,
        entity_table=entity_table,
        entity_id=entity_id,
        idempotency_hash=hash_val,
        payload_json=json.dumps(payload),
        sync_status="QUEUED",
        retry_count=0,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(queue_item)
    db.commit()
    db.refresh(queue_item)
    return queue_item

def get_sync_queue_summary(db: Session) -> Dict[str, Any]:
    """
    Returns summary statistics for the offline synchronization queue.
    """
    total = db.query(OfflineSyncQueue).count()
    queued = db.query(OfflineSyncQueue).filter_by(sync_status="QUEUED").count()
    synced = db.query(OfflineSyncQueue).filter_by(sync_status="SYNCED_TO_EARTH").count()
    failed = db.query(OfflineSyncQueue).filter_by(sync_status="FAILED").count()

    latest = (
        db.query(OfflineSyncQueue)
        .order_by(OfflineSyncQueue.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_transactions": total,
        "queued_pending": queued,
        "synced_to_earth": synced,
        "failed_retries": failed,
        "comms_mode": "STORE_AND_FORWARD",
        "latency_simulation": "22m 14s (One-Way Mars Sim)",
        "recent_items": [
            {
                "id": item.id,
                "transaction_type": item.transaction_type,
                "entity_table": item.entity_table,
                "idempotency_hash": item.idempotency_hash[:12] + "...",
                "sync_status": item.sync_status,
                "created_at": item.created_at,
            }
            for item in latest
        ],
    }

def simulate_comms_window_flush(db: Session) -> int:
    """
    Simulates high-gain Earth comms window opening and marks queued items as SYNCED_TO_EARTH.
    """
    items = db.query(OfflineSyncQueue).filter_by(sync_status="QUEUED").all()
    now_str = datetime.now(timezone.utc).isoformat()
    count = len(items)
    for item in items:
        item.sync_status = "SYNCED_TO_EARTH"
        item.last_attempt_at = now_str
    db.commit()
    return count
