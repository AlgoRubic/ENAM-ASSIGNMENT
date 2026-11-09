@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   FINN: Financial Investment Agent (ENAM Build Challenge)
echo ========================================================

cd /d %~dp0

:: Check Python venv
if not exist "venv\Scripts\python.exe" (
    echo [Setup] Creating Python virtual environment...
    python -m venv venv
    echo [Setup] Installing dependencies from requirements.txt...
    venv\Scripts\pip install -r requirements.txt
)

:: Check Node modules
if not exist "frontend\node_modules" (
    echo [Setup] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo Starting Backend (FastAPI on http://localhost:8000)...
start "FINN Backend" cmd /k "cd /d %~dp0 && .\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend (Vite on http://localhost:5173)...
start "FINN Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers initiated!
echo Terminal UI: http://localhost:5173
echo API Docs:    http://localhost:8000/docs
echo ========================================================
pause
