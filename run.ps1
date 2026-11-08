# FINN Launcher Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  FINN: Financial Investment Agent (ENAM AI Challenge)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; .\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload"

Write-Host "Starting Vite Mobile Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host "`nFINN services launched successfully!" -ForegroundColor Green
Write-Host "Access on mobile/desktop browser at: http://localhost:5173" -ForegroundColor White
Write-Host "Interactive API Docs at: http://localhost:8000/docs`n" -ForegroundColor White
