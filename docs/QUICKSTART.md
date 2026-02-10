# Pulse - Quick Start Guide

Get Pulse up and running in minutes!

## 🚀 Fastest Way to Start

### Option 1: Docker Compose (Recommended)

**1. Prerequisites:**

- Docker Desktop installed and running
- Git installed

**2. Clone and Start:**

```powershell
# Clone repository
git clone <your-repo-url>
cd Pulse

# Run setup script
.\setup.ps1
# Choose option 1 (Full Setup)
```

**3. Access the application:**

- Frontend: http://localhost:3000 (when implemented)
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/health

**4. Create your first account:**

```powershell
# Use the API docs or curl
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "My Company",
    "email": "company@example.com",
    "phone": "1234567890",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "john@example.com",
    "admin_password": "SecurePass123!"
  }'
```

That's it! You're ready to go! 🎉

---

## Option 2: Local Development

### Backend Only

```powershell
# Run setup script
.\setup.ps1
# Choose option 2 (Backend Only)

# Start PostgreSQL
docker run -d --name pulse-postgres -p 5432:5432 `
  -e POSTGRES_USER=pulse `
  -e POSTGRES_PASSWORD=pulse_password `
  -e POSTGRES_DB=pulse_db `
  postgres:16-alpine

# Start Redis
docker run -d --name pulse-redis -p 6379:6379 redis:7-alpine

# Initialize database
docker exec -i pulse-postgres psql -U pulse -d pulse_db < database/init.sql

# Navigate to backend
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux/Mac

# Start backend
uvicorn app.main:app --reload
```

---

## 🧪 Testing the API

### Using PowerShell

**Register a company:**

```powershell
$body = @{
    name = "Test Company"
    email = "test@company.com"
    admin_first_name = "Admin"
    admin_last_name = "User"
    admin_email = "admin@test.com"
    admin_password = "SecurePassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**Login:**

```powershell
$loginBody = @{
    email = "admin@test.com"
    password = "SecurePassword123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

# Save the token
$token = $response.access_token
```

**Get current user:**

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/auth/me" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### Using API Documentation

1. Open http://localhost:8000/api/docs
2. Click on any endpoint
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"

---

## 📊 Verify Everything Works

### Check Services

```powershell
# Check all containers are running
docker ps

# Should see:
# - pulse-postgres
# - pulse-redis
# - pulse-backend
# - pulse-frontend (when implemented)
```

### Check Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Check Health

```powershell
# Backend health
Invoke-RestMethod -Uri "http://localhost:8000/health"

# Should return:
# {
#   "status": "healthy",
#   "app": "Pulse",
#   "version": "1.0.0",
#   "environment": "development"
# }
```

---

## 🛑 Stopping Services

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop specific container
docker stop pulse-backend
```

---

## 🔧 Troubleshooting

### Port Already in Use

```powershell
# Check what's using the port
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Error

```powershell
# Check PostgreSQL is running
docker ps | findstr postgres

# Check logs
docker logs pulse-postgres

# Restart PostgreSQL
docker restart pulse-postgres
```

### Backend Won't Start

```powershell
# Check Python version (needs 3.11+)
python --version

# Reinstall dependencies
cd backend
pip install -r requirements.txt --force-reinstall

# Check .env file exists
Test-Path .env
```

### Docker Issues

```powershell
# Restart Docker Desktop
# Then rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Next Steps

1. ✅ **Explore the API**
   - Visit http://localhost:8000/api/docs
   - Try the authentication endpoints
   - Create test companies and users

2. ✅ **Read the Documentation**
   - [PROJECT_README.md](./PROJECT_README.md) - Complete project overview
   - [backend/README.md](./backend/README.md) - Backend documentation
   - [Plan.md](./Plan.md) - Technical architecture

3. ✅ **Set Up Development Environment**
   - Install VS Code with Python extensions
   - Install Postman or Insomnia for API testing
   - Install PostgreSQL client (pgAdmin or DBeaver)

4. ✅ **Start Development**
   - Check [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
   - Pick an issue from the roadmap
   - Start contributing!

---

## 🎯 Default Credentials

**Note:** These are only for initial testing. Change them immediately!

- **Database:**
  - User: `pulse`
  - Password: `pulse_password`
  - Database: `pulse_db`
  - Port: `5432`

- **Redis:**
  - Host: `localhost`
  - Port: `6379`
  - No password (development only)

- **API:**
  - Base URL: `http://localhost:8000`
  - Docs: `http://localhost:8000/api/docs`

---

## 🆘 Getting Help

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review logs: `docker-compose logs -f`
3. Check [PROJECT_README.md](./PROJECT_README.md) for detailed docs
4. Open an issue on GitHub (when available)

---

**Happy Coding! 🚀**
