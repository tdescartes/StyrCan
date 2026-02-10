# StyrCan Service Management Scripts

Quick reference for starting and managing StyrCan services.

## Available Scripts

### 1. `start_backend.ps1` - Start Backend Only

Starts the FastAPI backend application.

**Usage:**

```powershell
cd backend
.\start_backend.ps1
```

**What it does:**

- Checks for `.env` file (creates from example if missing)
- Activates virtual environment (if available)
- Verifies dependencies are installed
- Starts backend server on http://localhost:8000

**Requirements:**

- Databases must already be running
- Python dependencies installed

---

### 2. `start_databases.ps1` - Start Databases Only

Starts PostgreSQL and MongoDB services.

**Usage:**

```powershell
cd backend
.\start_databases.ps1
```

**What it does:**

- Starts PostgreSQL services (ports 5432, 5433)
- Starts MongoDB service (port 27017)
- Displays service status and connection info

**Requirements:**

- **Administrator privileges required**
- PostgreSQL and MongoDB installed as Windows services

**Note:** The script will automatically request elevation if not run as Administrator.

---

### 3. `start_all.ps1` - Start Everything

Starts all services (databases + backend).

**Usage:**

```powershell
cd backend
.\start_all.ps1
```

**What it does:**

1. Starts database services (PostgreSQL & MongoDB)
2. Verifies database connections
3. Starts backend server

**Requirements:**

- **Administrator privileges** (for database services)
- All dependencies installed

**Note:** If run without admin privileges, you can choose to skip database startup.

---

## Quick Start

**First Time Setup:**

```powershell
# 1. Start databases (run as Administrator)
cd backend
.\start_databases.ps1

# 2. In a new terminal, start backend
cd backend
.\start_backend.ps1
```

**Subsequent Runs:**

```powershell
# Start everything at once (run as Administrator)
cd backend
.\start_all.ps1
```

---

## Service URLs

Once started, access:

- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc

---

## Database Connections

- **PostgreSQL:** `localhost:5433/styrcan_db`
  - User: `styrcan`
  - Password: `styrcan_password`

- **MongoDB:** `localhost:27017/styrcan_logs`
  - No authentication (local development)

---

## Stopping Services

**Stop Backend:**

- Press `Ctrl+C` in the terminal running the backend

**Stop Databases:**
Run as Administrator:

```powershell
# Stop PostgreSQL
Stop-Service postgresql-x64-18

# Stop MongoDB
Stop-Service MongoDB
```

Or use Services Manager:

```powershell
services.msc
```

---

## Troubleshooting

### "Cannot run script" or "Execution policy" error

```powershell
# Allow script execution for current session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### "Administrator privileges required"

1. Right-click PowerShell
2. Select "Run as Administrator"
3. Navigate to backend folder
4. Run the script again

### Database connection fails

1. Check services are running:

   ```powershell
   Get-Service postgresql*, MongoDB*
   ```

2. Test connections:

   ```powershell
   python test_connections.py
   ```

3. Verify ports are listening:
   ```powershell
   netstat -an | findstr "5433 27017"
   ```

### Backend fails to start

1. Check `.env` file exists and is configured correctly
2. Verify dependencies are installed:
   ```powershell
   pip install -r requirements.txt
   ```
3. Ensure databases are running first

---

## Development Workflow

**Daily workflow:**

```powershell
# Morning: Start everything
.\start_all.ps1

# Work on your code...

# Evening: Stop backend (Ctrl+C)
# Databases can keep running
```

**Full restart:**

```powershell
# Stop backend: Ctrl+C

# Restart databases
.\start_databases.ps1

# Restart backend
.\start_backend.ps1
```

---

## Additional Scripts

- `test_connections.py` - Test database connections
- `test_mongodb_only.py` - Test MongoDB only
- `setup_databases.py` - Initial database setup
- `setup_postgresql.py` - PostgreSQL setup only

---

## Environment Configuration

All configuration is in `.env` file:

- Database URLs (ports 5433 for PostgreSQL, 27017 for MongoDB)
- JWT secrets
- CORS settings
- File upload settings

Edit `.env` to customize your setup.

---

## Need Help?

- Database setup: See `DATABASE_SETUP_GUIDE.md`
- API testing: See `API_TESTING_GUIDE.md`
- Build info: See `BUILD_SUMMARY.md`
- Setup details: See `SETUP_SUMMARY.md`
