# FINN Launcher Script (Auto-bootstrapping)
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  FINN: Financial Investment Agent (ENAM Build Challenge)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# 1. Python venv bootstrap
if (-not (Test-Path "$scriptDir\venv\Scripts\python.exe")) {
    Write-Host "`n[Setup] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "[Setup] Installing backend dependencies from requirements.txt..." -ForegroundColor Yellow
    & "$scriptDir\venv\Scripts\pip" install -r "$scriptDir\requirements.txt"
}

# 2. Node modules bootstrap
if (-not (Test-Path "$scriptDir\frontend\node_modules")) {
    Write-Host "`n[Setup] Installing frontend dependencies via npm..." -ForegroundColor Yellow
    Set-Location "$scriptDir\frontend"
    npm install
    Set-Location $scriptDir
}

Write-Host "`nStarting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; .\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload"

Write-Host "Starting Vite Mobile Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "FINN services launched successfully!" -ForegroundColor Green
Write-Host "Terminal Web Interface: http://localhost:5173" -ForegroundColor White
Write-Host "FastAPI Documentation:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Green
