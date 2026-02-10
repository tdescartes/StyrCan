#!/usr/bin/env pwsh
# Pulse Setup Script for Windows (PowerShell)
# This script helps set up the development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pulse Development Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "[ERROR] Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Docker is installed" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
$dockerComposeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $dockerComposeInstalled) {
    Write-Host "[WARNING] docker-compose not found, will use 'docker compose' instead" -ForegroundColor Yellow
    $composeCommand = "docker compose"
} else {
    Write-Host "[OK] docker-compose is installed" -ForegroundColor Green
    $composeCommand = "docker-compose"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Options" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Full Setup (Docker Compose)"
Write-Host "2. Backend Only (Local Development)"
Write-Host "3. Create .env files only"
Write-Host "4. Exit"
Write-Host ""

$choice = Read-Host "Select an option (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Setting up with Docker Compose..." -ForegroundColor Cyan
        Write-Host ""

        # Create .env file if it doesn't exist
        if (-not (Test-Path "backend\.env")) {
            Write-Host "Creating backend/.env file..." -ForegroundColor Yellow
            Copy-Item "backend\.env.example" "backend\.env"
            
            # Generate a random secret key
            $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            
            Write-Host "Generated SECRET_KEY for you." -ForegroundColor Green
            Write-Host "[IMPORTANT] Please review and update backend/.env with your settings!" -ForegroundColor Yellow
            
            # Update SECRET_KEY in .env
            $envContent = Get-Content "backend\.env" -Raw
            $envContent = $envContent -replace "your-secret-key-here-change-in-production", $secretKey
            Set-Content "backend\.env" -Value $envContent
        } else {
            Write-Host "[OK] backend/.env already exists" -ForegroundColor Green
        }

        Write-Host ""
        Write-Host "Starting services with Docker Compose..." -ForegroundColor Yellow
        
        # Start services
        & $composeCommand up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  Setup Complete!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Services are starting up. Please wait a moment..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            
            Write-Host ""
            Write-Host "Access your application:" -ForegroundColor Cyan
            Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
            Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
            Write-Host "  API Docs:  http://localhost:8000/api/docs" -ForegroundColor White
            Write-Host "  Health:    http://localhost:8000/health" -ForegroundColor White
            Write-Host ""
            Write-Host "View logs:" -ForegroundColor Cyan
            Write-Host "  $composeCommand logs -f" -ForegroundColor White
            Write-Host ""
            Write-Host "Stop services:" -ForegroundColor Cyan
            Write-Host "  $composeCommand down" -ForegroundColor White
            Write-Host ""
            
            # Check health
            Write-Host "Checking backend health..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Host "[OK] Backend is healthy!" -ForegroundColor Green
                }
            } catch {
                Write-Host "[WARNING] Backend not responding yet. Give it a few more seconds." -ForegroundColor Yellow
            }
        } else {
            Write-Host ""
            Write-Host "[ERROR] Failed to start services. Check the output above for errors." -ForegroundColor Red
        }
    }
    "2" {
        Write-Host ""
        Write-Host "Setting up Backend for Local Development..." -ForegroundColor Cyan
        Write-Host ""

        # Check Python
        $pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
        if (-not $pythonInstalled) {
            Write-Host "[ERROR] Python is not installed. Please install Python 3.11+." -ForegroundColor Red
            exit 1
        }
        Write-Host "[OK] Python is installed" -ForegroundColor Green

        # Navigate to backend
        Set-Location backend

        # Create virtual environment
        if (-not (Test-Path "venv")) {
            Write-Host "Creating virtual environment..." -ForegroundColor Yellow
            python -m venv venv
            Write-Host "[OK] Virtual environment created" -ForegroundColor Green
        } else {
            Write-Host "[OK] Virtual environment already exists" -ForegroundColor Green
        }

        # Activate virtual environment and install dependencies
        Write-Host "Activating virtual environment and installing dependencies..." -ForegroundColor Yellow
        & ".\venv\Scripts\Activate.ps1"
        pip install -r requirements.txt

        # Create .env
        if (-not (Test-Path ".env")) {
            Write-Host "Creating .env file..." -ForegroundColor Yellow
            Copy-Item ".env.example" ".env"
            
            $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            $envContent = Get-Content ".env" -Raw
            $envContent = $envContent -replace "your-secret-key-here-change-in-production", $secretKey
            Set-Content ".env" -Value $envContent
            
            Write-Host "[OK] .env file created with generated SECRET_KEY" -ForegroundColor Green
        }

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Backend Setup Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Start PostgreSQL:" -ForegroundColor White
        Write-Host "   docker run -d --name pulse-postgres -p 5432:5432 -e POSTGRES_USER=pulse -e POSTGRES_PASSWORD=pulse_password -e POSTGRES_DB=pulse_db postgres:16-alpine" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Start Redis:" -ForegroundColor White
        Write-Host "   docker run -d --name pulse-redis -p 6379:6379 redis:7-alpine" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Activate virtual environment:" -ForegroundColor White
        Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4. Start backend:" -ForegroundColor White
        Write-Host "   uvicorn app.main:app --reload" -ForegroundColor Gray
        Write-Host ""

        Set-Location ..
    }
    "3" {
        Write-Host ""
        Write-Host "Creating .env files..." -ForegroundColor Cyan
        Write-Host ""

        if (-not (Test-Path "backend\.env")) {
            Copy-Item "backend\.env.example" "backend\.env"
            $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            $envContent = Get-Content "backend\.env" -Raw
            $envContent = $envContent -replace "your-secret-key-here-change-in-production", $secretKey
            Set-Content "backend\.env" -Value $envContent
            Write-Host "[OK] Created backend/.env with generated SECRET_KEY" -ForegroundColor Green
        } else {
            Write-Host "[INFO] backend/.env already exists" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "[IMPORTANT] Please review and update the .env files with your actual values!" -ForegroundColor Yellow
        Write-Host ""
    }
    "4" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "[ERROR] Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "For more information, see PROJECT_README.md" -ForegroundColor Cyan
Write-Host ""
