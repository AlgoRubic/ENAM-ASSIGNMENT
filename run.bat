@echo off
echo ========================================================
echo   FINN: Financial Investment Agent (ENAM AI Challenge)
echo ========================================================
echo Starting Backend (FastAPI on http://localhost:8000)...
start "FINN Backend" cmd /k "cd /d %~dp0 && .\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend (Vite on http://localhost:5173)...
start "FINN Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers initiated!
echo Open on your phone or browser at: http://localhost:5173
echo API documentation available at: http://localhost:8000/docs
echo ========================================================
pause
