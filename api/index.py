"""Vercel entrypoint for the FINN FastAPI application.

The local SQLite snapshot is copied to /tmp because Vercel's deployed bundle is
read-only at runtime. This preserves the seeded demo data while keeping the
serverless function able to initialise its tables.
"""
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

runtime_db = Path("/tmp/finn.db")
source_db = BACKEND_ROOT / "app" / "db" / "finn.db"
if not runtime_db.exists() and source_db.exists():
    shutil.copy2(source_db, runtime_db)
os.environ.setdefault("FINN_DB_PATH", str(runtime_db))

from app.main import app  # noqa: E402

