# StyrCan Backend API

## Overview

FastAPI-based backend for StyrCan business management platform.

## Features

- **Authentication**: JWT-based authentication with access & refresh tokens
- **Employees Management**: CRUD operations, PTO tracking, shift scheduling
- **Finance Management**: Transaction tracking, expense categories, financial reporting
- **Payroll Processing**: Payroll runs, payment processing, employee payroll history
- **Communication**: Internal messaging system
- **Dashboard**: Comprehensive analytics and KPIs
- **Settings**: Company & user management, billing

## Tech Stack

- **Framework**: FastAPI 0.110.0
- **Databases**:
  - PostgreSQL (primary data)
  - MongoDB (logs & messages)
  - Redis (caching & sessions)
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic 2.6
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- MongoDB 6.0+
- Redis 7.0+

## Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Unix/MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Important: Change SECRET_KEY in production!
```

### 3. Database Setup

```bash
# Start PostgreSQL (using Docker)
docker run --name styrcan-postgres \
  -e POSTGRES_USER=styrcan_user \
  -e POSTGRES_PASSWORD=styrcan_password \
  -e POSTGRES_DB=styrcan_db \
  -p 5432:5432 -d postgres:14

# Start MongoDB
docker run --name styrcan-mongodb \
  -p 27017:27017 -d mongo:6

# Start Redis
docker run --name styrcan-redis \
  -p 6379:6379 -d redis:7-alpine

# Run database migrations
alembic upgrade head
```

### 4. Run Development Server

```bash
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use Python directly
python -m app.main
```

The API will be available at:

- API: http://localhost:8000
- Documentation: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # PostgreSQL database setup
│   ├── mongodb.py           # MongoDB setup
│   ├── auth/                # Authentication utilities
│   │   ├── __init__.py
│   │   └── security.py      # JWT & password handling
│   ├── middleware/          # Custom middleware
│   │   ├── audit.py
│   │   ├── error_handler.py
│   │   └── logging.py
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── company.py
│   │   ├── employee.py
│   │   ├── finance.py
│   │   ├── payroll.py
│   │   └── message.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── auth.py
│   │   ├── employee.py
│   │   ├── finance.py
│   │   ├── payroll.py
│   │   └── messaging.py
│   └── routers/             # API endpoints
│       ├── auth.py          # Authentication
│       ├── employees.py     # Employee management
│       ├── finances.py      # Finance tracking
│       ├── payroll.py       # Payroll processing
│       ├── messaging.py     # Communication
│       ├── dashboard.py     # Analytics
│       └── settings.py      # Settings & billing
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── requirements.txt
├── Dockerfile
└── README.md
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register company & admin
- `POST /login` - User login
- `POST /logout` - Logout
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `POST /change-password` - Change password
- `GET /me` - Get current user
- `PUT /me` - Update profile

### Employees (`/api/employees`)

- `GET /dashboard` - Employee KPIs
- `GET /` - List employees
- `POST /` - Create employee
- `GET /{id}` - Get employee details
- `PUT /{id}` - Update employee
- `DELETE /{id}` - Delete employee
- `GET /export` - Export to CSV
- PTO & Shift management endpoints

### Finance (`/api/finances`)

- `GET /dashboard` - Finance KPIs
- `GET /transactions` - List transactions
- `POST /transactions` - Create transaction
- `GET /summary` - Financial summary
- `GET /trends` - Financial trends
- Category management endpoints

### Payroll (`/api/payroll`)

- `GET /dashboard` - Payroll KPIs
- `GET /runs` - List payroll runs
- `POST /runs` - Create payroll run
- `POST /runs/{id}/process` - Process payroll
- `GET /employees/{id}/history` - Employee payroll history

### Communication (`/api/messages`)

- `POST /send` - Send message
- `GET /inbox` - Get inbox
- `GET /sent` - Get sent messages
- `GET /thread/{id}` - Get thread
- `PATCH /{id}/read` - Mark as read
- `GET /unread-count` - Unread count

### Dashboard (`/api/dashboard`)

- `GET /` - Complete dashboard data
- `GET /charts` - Chart data
- `GET /summary/quick` - Quick summary

### Settings (`/api/settings`)

- `GET /company` - Get company info
- `PUT /company` - Update company
- `GET /users` - List company users
- `POST /users/invite` - Invite user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user
- `GET /billing` - Billing info
- `POST /billing/change-plan` - Change plan

## Environment Variables

| Variable                      | Description                  | Default   |
| ----------------------------- | ---------------------------- | --------- |
| `APP_NAME`                    | Application name             | StyrCan   |
| `APP_VERSION`                 | API version                  | 1.0.0     |
| `DEBUG`                       | Debug mode                   | False     |
| `DATABASE_URL`                | PostgreSQL connection string | -         |
| `MONGODB_URL`                 | MongoDB connection string    | -         |
| `REDIS_HOST`                  | Redis host                   | localhost |
| `SECRET_KEY`                  | JWT secret key (32+ chars)   | -         |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiry          | 15        |
| `CORS_ORIGINS`                | Allowed CORS origins         | []        |

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

### Code Quality

```bash
# Format code
black app/

# Lint code
flake8 app/

# Type checking
mypy app/
```

### Database Migrations

```bash
# Create new migration
alembic revision -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

## Production Deployment

### Using Docker

```bash
# Build image
docker build -t styrcan-backend .

# Run container
docker run -d \
  --name styrcan-api \
  -p 8000:8000 \
  --env-file .env \
  styrcan-backend
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## Security Best Practices

1. **Change SECRET_KEY**: Use a secure random string (32+ characters)
2. **Use HTTPS**: Always use TLS in production
3. **Environment Variables**: Never commit `.env` files
4. **Database Passwords**: Use strong, unique passwords
5. **CORS**: Restrict allowed origins in production
6. **Rate Limiting**: Implement rate limiting for public endpoints
7. **Input Validation**: All inputs are validated via Pydantic schemas

## Monitoring & Logging

- Application logs: `logs/app.log`
- Audit logs: MongoDB collection
- Health check: `GET /health`
- Metrics: Available via middleware

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U styrcan_user -d styrcan_db
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker ps | grep mongo

# Test connection
mongo mongodb://localhost:27017/styrcan_logs
```

### Import Errors

```bash
# Ensure virtual environment is activated
which python  # Should show venv path

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## API Documentation

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Support

For issues and questions:

- GitHub Issues: [repository URL]
- Documentation: [docs URL]
- Email: support@styrcan.com

## License

Copyright © 2026 StyrCan. All rights reserved.
