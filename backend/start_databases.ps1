#!/usr/bin/env pwsh
# Start StyrCan Database Services
# This script starts PostgreSQL and MongoDB services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting StyrCan Database Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check for admin privileges
if (-not (Test-Administrator)) {
    Write-Host "[WARNING] This script requires Administrator privileges to start services" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Attempting to restart with elevated privileges..." -ForegroundColor Cyan
    
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-File", "`"$scriptPath`""
    exit
}

Write-Host "[INFO] Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Start PostgreSQL services
Write-Host "Starting PostgreSQL services..." -ForegroundColor Cyan

$pgServices = Get-Service postgresql* -ErrorAction SilentlyContinue
if ($pgServices) {
    foreach ($service in $pgServices) {
        Write-Host "  Checking service: $($service.DisplayName)" -ForegroundColor Gray
        
        if ($service.Status -eq "Running") {
            Write-Host "  [OK] $($service.DisplayName) is already running" -ForegroundColor Green
        } else {
            Write-Host "  Starting $($service.DisplayName)..." -ForegroundColor Cyan
            try {
                Start-Service $service.Name -ErrorAction Stop
                Write-Host "  [OK] $($service.DisplayName) started successfully" -ForegroundColor Green
            } catch {
                Write-Host "  [ERROR] Failed to start $($service.DisplayName): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "  [WARNING] No PostgreSQL services found" -ForegroundColor Yellow
    Write-Host "  Please ensure PostgreSQL is installed" -ForegroundColor Yellow
}

Write-Host ""

# Start MongoDB service
Write-Host "Starting MongoDB service..." -ForegroundColor Cyan

$mongoServices = Get-Service MongoDB* -ErrorAction SilentlyContinue
if ($mongoServices) {
    foreach ($service in $mongoServices) {
        Write-Host "  Checking service: $($service.DisplayName)" -ForegroundColor Gray
        
        if ($service.Status -eq "Running") {
            Write-Host "  [OK] $($service.DisplayName) is already running" -ForegroundColor Green
        } else {
            Write-Host "  Starting $($service.DisplayName)..." -ForegroundColor Cyan
            try {
                Start-Service $service.Name -ErrorAction Stop
                Write-Host "  [OK] $($service.DisplayName) started successfully" -ForegroundColor Green
            } catch {
                Write-Host "  [ERROR] Failed to start $($service.DisplayName): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "  [WARNING] No MongoDB services found" -ForegroundColor Yellow
    Write-Host "  Please ensure MongoDB is installed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database Services Status" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Display PostgreSQL status
Write-Host "PostgreSQL Services:" -ForegroundColor White
$pgServices = Get-Service postgresql* -ErrorAction SilentlyContinue
if ($pgServices) {
    foreach ($service in $pgServices) {
        $status = $service.Status
        $color = if ($status -eq "Running") { "Green" } else { "Red" }
        Write-Host "  - $($service.DisplayName): " -NoNewline -ForegroundColor Gray
        Write-Host "$status" -ForegroundColor $color
    }
    
    # Check PostgreSQL ports
    Write-Host ""
    Write-Host "  Active PostgreSQL ports:" -ForegroundColor Gray
    $pgPorts = netstat -an | Select-String "5432|5433" | Select-String "LISTENING"
    if ($pgPorts) {
        foreach ($port in $pgPorts) {
            Write-Host "    $port" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "  No services found" -ForegroundColor Yellow
}

Write-Host ""

# Display MongoDB status
Write-Host "MongoDB Services:" -ForegroundColor White
$mongoServices = Get-Service MongoDB* -ErrorAction SilentlyContinue
if ($mongoServices) {
    foreach ($service in $mongoServices) {
        $status = $service.Status
        $color = if ($status -eq "Running") { "Green" } else { "Red" }
        Write-Host "  - $($service.DisplayName): " -NoNewline -ForegroundColor Gray
        Write-Host "$status" -ForegroundColor $color
    }
    
    # Check MongoDB port
    Write-Host ""
    Write-Host "  Active MongoDB ports:" -ForegroundColor Gray
    $mongoPorts = netstat -an | Select-String "27017" | Select-String "LISTENING"
    if ($mongoPorts) {
        foreach ($port in $mongoPorts) {
            Write-Host "    $port" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "  No services found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database Connection Information" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL:" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 5433 (StyrCan DB)" -ForegroundColor Gray
Write-Host "  Database: styrcan_db" -ForegroundColor Gray
Write-Host "  User: styrcan" -ForegroundColor Gray
Write-Host ""
Write-Host "MongoDB:" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 27017" -ForegroundColor Gray
Write-Host "  Database: styrcan_logs" -ForegroundColor Gray
Write-Host ""
Write-Host "Databases are ready!" -ForegroundColor Green
Write-Host "You can now start the backend with: .\start_backend.ps1" -ForegroundColor Cyan
Write-Host ""
