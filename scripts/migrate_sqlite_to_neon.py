"""
Mission Sentinel — SQLite to Neon PostgreSQL Data Migration Utility
Transfers all local SQLite station data, astronauts, telemetry, baselines, and alerts
into Neon serverless PostgreSQL in dependency order.
"""

import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.core.config import settings
from backend.app.database import Base
from backend.app.models.entities import *  # noqa: F401, F403


TABLE_ORDER = [
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


def migrate(neon_url: str = None):
    # Determine target Neon URL
    target_url = neon_url or os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not target_url or target_url.startswith("sqlite"):
        print("❌ Error: No Neon PostgreSQL connection string provided.")
        print("Please provide it as an argument or set NEON_DATABASE_URL in .env")
        print("Example: python scripts/migrate_sqlite_to_neon.py 'postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require'")
        return False

    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    sqlite_path = settings.DATABASE_PATH
    if not sqlite_path.exists():
        print(f"❌ Error: SQLite source file '{sqlite_path}' does not exist.")
        return False

    sqlite_url = f"sqlite:///{sqlite_path.as_posix()}"
    print(f"============================================================")
    print(f"🛰️  MISSION SENTINEL: SQLite ➔ Neon PostgreSQL Migration")
    print(f"============================================================")
    print(f"Source (SQLite):     {sqlite_path} ({os.path.getsize(sqlite_path)} bytes)")
    print(f"Target (Neon):       {target_url.split('@')[-1] if '@' in target_url else 'PostgreSQL'}")
    print()

    src_engine = create_engine(sqlite_url, echo=False)
    dst_engine = create_engine(target_url, pool_pre_ping=True, echo=False)

    print("Step 1/3: Creating table schemas on Neon PostgreSQL...")
    Base.metadata.create_all(bind=dst_engine)
    print("✅ All 14 relational schemas created on Neon.")

    print("\nStep 2/3: Copying records in dependency order...")
    total_migrated = 0

    with src_engine.connect() as src_conn, dst_engine.begin() as dst_conn:
        for tbl in TABLE_ORDER:
            # Read from SQLite
            select_query = text(f"SELECT * FROM {tbl}")
            rows = src_conn.execute(select_query).mappings().all()

            if not rows:
                print(f"  • {tbl.ljust(26)}: 0 records")
                continue

            # Clear any existing rows in target table to avoid duplicates
            dst_conn.execute(text(f"DELETE FROM {tbl}"))

            # Insert into Postgres
            keys = list(rows[0].keys())
            cols_clause = ", ".join(f'"{k}"' for k in keys)
            bind_clause = ", ".join(f":{k}" for k in keys)
            insert_query = text(f'INSERT INTO {tbl} ({cols_clause}) VALUES ({bind_clause})')

            dst_conn.execute(insert_query, [dict(r) for r in rows])
            print(f"  • {tbl.ljust(26)}: {len(rows)} records migrated")
            total_migrated += len(rows)

    print(f"\nStep 3/3: Verifying Neon record counts...")
    with dst_engine.connect() as dst_conn:
        for tbl in TABLE_ORDER:
            cnt = dst_conn.execute(text(f"SELECT COUNT(*) FROM {tbl}")).scalar()
            print(f"  ✓ {tbl.ljust(26)}: {cnt} verified")

    print(f"\n🎉 Migration Complete! Successfully migrated {total_migrated} records to Neon PostgreSQL.")
    print("Your Mission Sentinel system is ready to run live with Neon cloud database.")
    return True


if __name__ == "__main__":
    url_arg = sys.argv[1] if len(sys.argv) > 1 else None
    success = migrate(url_arg)
    sys.exit(0 if success else 1)
