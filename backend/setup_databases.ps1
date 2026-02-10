# Database Setup Script for StyrCan
# This script creates and initializes PostgreSQL and MongoDB databases

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "StyrCan Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL Configuration
$PG_HOST = "localhost"
$PG_PORT = "5432"
$PG_USER = "postgres"  # Default PostgreSQL superuser
$PG_DB = "styrcan_db"
$PG_APP_USER = "styrcan"
$PG_APP_PASSWORD = "styrcan_password"
$INIT_SQL = "..\database\init.sql"

# MongoDB Configuration
$MONGO_HOST = "localhost"
$MONGO_PORT = "27017"
$MONGO_DB = "styrcan_logs"

Write-Host "Step 1: Creating PostgreSQL Database..." -ForegroundColor Yellow

# Check if database exists, create if not
$dbCheckQuery = "SELECT 1 FROM pg_database WHERE datname = '$PG_DB'"
$dbExists = psql -U $PG_USER -h $PG_HOST -p $PG_PORT -tc $dbCheckQuery 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Unable to connect to PostgreSQL. Please ensure:" -ForegroundColor Red
    Write-Host "  1. PostgreSQL is installed and running" -ForegroundColor Red
    Write-Host "  2. You can connect with user 'postgres'" -ForegroundColor Red
    Write-Host "  3. The server is listening on port $PG_PORT" -ForegroundColor Red
    exit 1
}

if ($dbExists -match "1") {
    Write-Host "  Database '$PG_DB' already exists" -ForegroundColor Green
} else {
    Write-Host "  Creating database '$PG_DB'..." -ForegroundColor Cyan
    $createDbQuery = "CREATE DATABASE $PG_DB;"
    psql -U $PG_USER -h $PG_HOST -p $PG_PORT -c $createDbQuery
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Failed to create database" -ForegroundColor Red
        exit 1
    }
}

# Create application user if it doesn't exist
Write-Host "  Creating application user..." -ForegroundColor Cyan
$userCheckQuery = "SELECT 1 FROM pg_roles WHERE rolname = '$PG_APP_USER'"
$userExists = psql -U $PG_USER -h $PG_HOST -p $PG_PORT -tc $userCheckQuery 2>$null

if ($userExists -match "1") {
    Write-Host "  User '$PG_APP_USER' already exists" -ForegroundColor Green
} else {
    $createUserQuery = "CREATE USER $PG_APP_USER WITH PASSWORD '$PG_APP_PASSWORD';"
    $grantPrivQuery = "GRANT ALL PRIVILEGES ON DATABASE $PG_DB TO $PG_APP_USER;"
    psql -U $PG_USER -h $PG_HOST -p $PG_PORT -c $createUserQuery
    psql -U $PG_USER -h $PG_HOST -p $PG_PORT -c $grantPrivQuery
    Write-Host "  [OK] User created and privileges granted" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Running Database Initialization Script..." -ForegroundColor Yellow

if (Test-Path $INIT_SQL) {
    Write-Host "  Executing init.sql..." -ForegroundColor Cyan
    psql -U $PG_USER -h $PG_HOST -p $PG_PORT -d $PG_DB -f $INIT_SQL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Schema initialized successfully" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Failed to initialize schema" -ForegroundColor Red
        exit 1
    }
    
    # Grant privileges on all tables to app user
    $grantTablesQuery = "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $PG_APP_USER;"
    $grantSeqQuery = "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $PG_APP_USER;"
    psql -U $PG_USER -h $PG_HOST -p $PG_PORT -d $PG_DB -c $grantTablesQuery
    psql -U $PG_USER -h $PG_HOST -p $PG_PORT -d $PG_DB -c $grantSeqQuery
    Write-Host "  [OK] Privileges granted to application user" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] init.sql not found at: $INIT_SQL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Setting up MongoDB..." -ForegroundColor Yellow

# Test MongoDB connection
Write-Host "  Testing MongoDB connection..." -ForegroundColor Cyan
try {
    $mongoTest = mongosh --host $MONGO_HOST --port $MONGO_PORT --eval "db.version()" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] MongoDB is running and accessible" -ForegroundColor Green
        
        # Create database and collection (MongoDB creates them on first use)
        Write-Host "  Initializing MongoDB database '$MONGO_DB'..." -ForegroundColor Cyan
        $mongoInit = @"
use $MONGO_DB
db.createCollection('audit_logs')
db.createCollection('chat_messages')
db.createCollection('notifications')
db.createCollection('analytics_events')
db.createCollection('document_metadata')
db.createCollection('application_logs')
print('Collections created successfully')
"@
        
        $mongoInit | mongosh --host $MONGO_HOST --port $MONGO_PORT | Out-Null
        Write-Host "  [OK] MongoDB database and collections initialized" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] MongoDB is not running or not accessible" -ForegroundColor Yellow
        Write-Host "  Please start MongoDB service to use logging features" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARNING] MongoDB connection failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  The application will start but logging features may not work" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Updating Environment Configuration..." -ForegroundColor Yellow

$envFile = ".\.env"
$envExampleFile = ".\.env.example"

if (Test-Path $envFile) {
    Write-Host "  [OK] .env file already exists" -ForegroundColor Green
} else {
    if (Test-Path $envExampleFile) {
        Copy-Item $envExampleFile $envFile
        Write-Host "  [OK] Created .env from .env.example" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] .env.example not found, creating basic .env" -ForegroundColor Yellow
        
        $envContent = @"
# Database Configuration
DATABASE_URL=postgresql://${PG_APP_USER}:${PG_APP_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DB}

# MongoDB Configuration
MONGODB_URL=mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}
MONGODB_HOST=${MONGO_HOST}
MONGODB_PORT=${MONGO_PORT}
MONGODB_DB=${MONGO_DB}

# JWT Configuration (CHANGE IN PRODUCTION!)
SECRET_KEY=dev-secret-key-change-in-production-$(Get-Random)

# Application Settings
DEBUG=True
ENVIRONMENT=development
"@
        $envContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Host "  [OK] Created basic .env file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Information:" -ForegroundColor Cyan
Write-Host "  PostgreSQL:" -ForegroundColor White
Write-Host "    - Host: $PG_HOST" -ForegroundColor Gray
Write-Host "    - Port: $PG_PORT" -ForegroundColor Gray
Write-Host "    - Database: $PG_DB" -ForegroundColor Gray
Write-Host "    - User: $PG_APP_USER" -ForegroundColor Gray
Write-Host "    - Connection: postgresql://${PG_APP_USER}:****@${PG_HOST}:${PG_PORT}/${PG_DB}" -ForegroundColor Gray
Write-Host ""
Write-Host "  MongoDB:" -ForegroundColor White
Write-Host "    - Host: $MONGO_HOST" -ForegroundColor Gray
Write-Host "    - Port: $MONGO_PORT" -ForegroundColor Gray
Write-Host "    - Database: $MONGO_DB" -ForegroundColor Gray
Write-Host "    - Connection: mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review and update .env file with your secret keys" -ForegroundColor White
Write-Host "  2. Run: python test_connections.py" -ForegroundColor White
Write-Host "  3. Run: uvicorn app.main:app --reload" -ForegroundColor White
Write-Host ""
