# Database Setup Guide

## 🎉 Current Status

### ✅ MongoDB - Fully Configured!

- **Host:** localhost:27017
- **Database:** pulse_logs
- **Collections Created:**
  - audit_logs
  - chat_messages
  - notifications
  - analytics_events
  - document_metadata
  - application_logs

### ⚠️ PostgreSQL - Needs Password

PostgreSQL is running but needs authentication setup.

## PostgreSQL Setup Instructions

### Method 1: Using PowerShell (Recommended)

Open PowerShell in the `backend` folder and run:

```powershell
# Set your PostgreSQL postgres user password
$env:POSTGRES_PASSWORD = "YOUR_POSTGRES_PASSWORD_HERE"

# Run the setup script
python setup_databases.py
```

Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password.

### Method 2: Using pgAdmin or psql directly

If you prefer to set up manually:

1. **Connect to PostgreSQL** using pgAdmin or psql
2. **Run these commands:**

```sql
-- Create database
CREATE DATABASE pulse_db;

-- Create application user
CREATE USER pulse WITH PASSWORD 'pulse_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pulse_db TO pulse;

-- Connect to pulse_db and run the init.sql
\c pulse_db
\i 'C:/Users/Descartes Tuyishime/OneDrive/Documents/Pulse/Pulse/database/init.sql'

-- Grant table privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse;
```

### Method 3: Using Python script directly

```powershell
cd backend

# Edit setup_databases.py and change line 14:
# PG_PASSWORD = "YOUR_POSTGRES_PASSWORD"

python setup_databases.py
```

## Verify Setup

After PostgreSQL is set up, test both connections:

```powershell
python test_connections.py
```

## Expected Result

You should see:

```
PostgreSQL: ✅ PASS
MongoDB:    ✅ PASS
```

## Start the Application

Once both databases are connected:

```powershell
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

## Configuration Files

- **Environment:** `backend/.env` (already created from .env.example)
- **PostgreSQL Schema:** `database/init.sql`
- **MongoDB Models:** `backend/app/mongodb.py`
- **Database Config:** `backend/app/config.py`

## Database Connections in Code

### PostgreSQL

```python
from app.database import get_db

# In route handlers
def some_route(db: Session = Depends(get_db)):
    # Use db for queries
    pass
```

### MongoDB

```python
from app.mongodb import get_mongodb_client

# In application
client = await get_mongodb_client()
db = client.get_database()
```

## Troubleshooting

### PostgreSQL Connection Fails

- Verify PostgreSQL service is running: `Get-Service postgresql*`
- Check port 5432 is correct: `netstat -an | findstr 5432`
- Verify password for postgres user
- Check pg_hba.conf allows local connections

### MongoDB Connection Fails

- MongoDB service should be running (it's currently working!)
- Default port is 27017
- Check service: `Get-Service MongoDB*`

### Import Errors

```powershell
pip install -r requirements.txt
```

## Next Steps

1. ✅ Set PostgreSQL password and run `setup_databases.py`
2. ✅ Run `test_connections.py` to verify
3. ✅ Start application with `uvicorn app.main:app --reload`
4. ✅ Test API endpoints at http://localhost:8000/docs
5. ✅ Run frontend (separate terminal): `cd frontend && npm run dev`

---

**Note:** Your `.env` file has been created with the correct connection strings. Review it and update the `SECRET_KEY` before deploying to production!
