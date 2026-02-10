#!/usr/bin/env pwsh
# Start Pulse Backend Server
# This script starts the FastAPI backend application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Pulse Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
$currentDir = Get-Location
if (-not (Test-Path "app/main.py")) {
    Write-Host "[ERROR] Cannot find app/main.py" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory" -ForegroundColor Yellow
    Write-Host "Current location: $currentDir" -ForegroundColor Gray
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Cyan
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] .env file created" -ForegroundColor Green
        Write-Host "Please review .env and update settings if needed" -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] .env.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Check if virtual environment exists
if (Test-Path "venv/Scripts/Activate.ps1") {
    Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Cyan
    & "venv/Scripts/Activate.ps1"
} elseif (Test-Path "../venv/Scripts/Activate.ps1") {
    Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Cyan
    & "../venv/Scripts/Activate.ps1"
}

# Check if required packages are installed
Write-Host "[INFO] Checking dependencies..." -ForegroundColor Cyan
$pipList = pip list 2>$null
if ($pipList -notmatch "fastapi") {
    Write-Host "[WARNING] FastAPI not found. Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Starting Backend Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server URL: http://localhost:8000" -ForegroundColor White
Write-Host "API Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "ReDoc:      http://localhost:8000/redoc" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
