# Setup local PostgreSQL for StyrCan/Pulse backend
# Run this once to create the pulse user and database

$PG18 = "C:\Program Files\PostgreSQL\18\bin"
$PG16 = "C:\Program Files\PostgreSQL\16\bin"

# Find available psql
$psql = $null
if (Test-Path "$PG18\psql.exe") { $psql = "$PG18\psql.exe" }
elseif (Test-Path "$PG16\psql.exe") { $psql = "$PG16\psql.exe" }
else { Write-Error "psql not found"; exit 1 }

Write-Host "Using psql: $psql"

# Check if pulse user can connect (may already be set up)
$connTest = python -c "
import psycopg2, sys
try:
    conn = psycopg2.connect('postgresql://pulse:pulse_password@localhost:5433/pulse_db')
    print('CONNECTED:', conn.server_version)
    conn.close()
    sys.exit(0)
except Exception as e:
    print('FAILED:', e)
    sys.exit(1)
" 2>&1

Write-Host $connTest

if ($LASTEXITCODE -eq 0) {
    Write-Host "pulse_db already accessible. No setup needed."
    exit 0
}

Write-Host "Setting up pulse user and database..."

# Try with Windows integrated auth (peer auth for local admin)
$setupSQL = @"
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pulse') THEN
        CREATE USER pulse WITH PASSWORD 'pulse_password' SUPERUSER CREATEDB;
    END IF;
END
`$`$;

SELECT 'User pulse exists' FROM pg_roles WHERE rolname='pulse';
"@

# Try to connect as current Windows user (no password needed for local admin)
$setupSQL | & $psql -p 5433 -c "DO `$`$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='pulse') THEN CREATE USER pulse WITH PASSWORD 'pulse_password' SUPERUSER CREATEDB; END IF; END`$`$;" 2>&1

# Create database
& $psql -p 5433 -c "SELECT 'Creating DB' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='pulse_db'); CREATE DATABASE pulse_db OWNER pulse;" 2>&1

Write-Host "Done."
