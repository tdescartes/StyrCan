#!/usr/bin/env pwsh
# Start All StyrCan Services
# This script starts database services and the backend application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting All StyrCan Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check for admin privileges for database services
if (-not (Test-Administrator)) {
    Write-Host "[WARNING] Administrator privileges required to start database services" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Run this script as Administrator to start databases automatically" -ForegroundColor Cyan
    Write-Host "Option 2: Manually start databases, then press Enter to continue" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Continue without starting databases? (y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host ""
        Write-Host "Attempting to restart with elevated privileges..." -ForegroundColor Cyan
        $scriptPath = $MyInvocation.MyCommand.Path
        Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-File", "`"$scriptPath`""
        exit
    }
    
    Write-Host ""
    Write-Host "[INFO] Skipping database startup - assuming databases are already running" -ForegroundColor Yellow
    Write-Host ""
} else {
    # Step 1: Start Database Services
    Write-Host "STEP 1: Starting Database Services" -ForegroundColor Magenta
    Write-Host "=====================================" -ForegroundColor Magenta
    Write-Host ""
    
    # Start PostgreSQL
    Write-Host "[1/2] Starting PostgreSQL services..." -ForegroundColor Cyan
    $pgServices = Get-Service postgresql* -ErrorAction SilentlyContinue
    if ($pgServices) {
        foreach ($service in $pgServices) {
            if ($service.Status -ne "Running") {
                try {
                    Start-Service $service.Name -ErrorAction Stop
                    Write-Host "      [OK] $($service.DisplayName) started" -ForegroundColor Green
                } catch {
                    Write-Host "      [ERROR] Failed to start $($service.DisplayName)" -ForegroundColor Red
                }
            } else {
                Write-Host "      [OK] $($service.DisplayName) already running" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "      [WARNING] No PostgreSQL services found" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # Start MongoDB
    Write-Host "[2/2] Starting MongoDB service..." -ForegroundColor Cyan
    $mongoServices = Get-Service MongoDB* -ErrorAction SilentlyContinue
    if ($mongoServices) {
        foreach ($service in $mongoServices) {
            if ($service.Status -ne "Running") {
                try {
                    Start-Service $service.Name -ErrorAction Stop
                    Write-Host "      [OK] $($service.DisplayName) started" -ForegroundColor Green
                } catch {
                    Write-Host "      [ERROR] Failed to start $($service.DisplayName)" -ForegroundColor Red
                }
            } else {
                Write-Host "      [OK] $($service.DisplayName) already running" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "      [WARNING] No MongoDB services found" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "[OK] Database services startup complete" -ForegroundColor Green
    Write-Host ""
    
    # Wait for databases to be ready
    Write-Host "[INFO] Waiting for databases to initialize..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Write-Host ""
}

# Step 2: Verify Database Connections
Write-Host "STEP 2: Verifying Database Connections" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

# Check if test_connections.py exists
if (Test-Path "test_connections.py") {
    Write-Host "[INFO] Testing database connections..." -ForegroundColor Cyan
    $testResult = python test_connections.py 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database connections verified successfully" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Database connection test had issues" -ForegroundColor Yellow
        Write-Host "The backend will attempt to connect anyway..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Skipping connection test (test_connections.py not found)" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Start Backend Server
Write-Host "STEP 3: Starting Backend Server" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "app/main.py")) {
    Write-Host "[ERROR] Cannot find app/main.py" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found!" -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] Created .env from .env.example" -ForegroundColor Green
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

# Check dependencies
Write-Host "[INFO] Checking dependencies..." -ForegroundColor Cyan
$pipList = pip list 2>$null
if ($pipList -notmatch "fastapi") {
    Write-Host "[WARNING] Dependencies not found. Installing..." -ForegroundColor Yellow
    pip install -r requirements.txt -q
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All Services Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host "  ReDoc:        http://localhost:8000/redoc" -ForegroundColor White
Write-Host ""
Write-Host "Database Connections:" -ForegroundColor Cyan
Write-Host "  PostgreSQL:   localhost:5433/styrcan_db" -ForegroundColor White
Write-Host "  MongoDB:      localhost:27017/styrcan_logs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the backend server" -ForegroundColor Yellow
Write-Host "(Database services will continue running in the background)" -ForegroundColor Gray
Write-Host ""

# Start the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
