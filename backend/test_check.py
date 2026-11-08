import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

print(f"SUCCESS: FINN FastAPI backend compiled successfully with {len(app.routes)} routes!")
