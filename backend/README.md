# Pulse Backend

FastAPI-based backend for the Pulse business management platform.

## Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ PostgreSQL database with SQLAlchemy ORM
- ✅ Redis for caching and sessions
- ✅ Comprehensive error handling
- ✅ Docker support
- ✅ Kubernetes-ready

## Tech Stack

- **Framework**: FastAPI 0.110+
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)
- **Caching**: Redis
- **Validation**: Pydantic v2

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- pip or poetry

### Local Development

1. **Clone and navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Create virtual environment**:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file**:

   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

5. **Start PostgreSQL and Redis** (if not using Docker):

   ```bash
   # PostgreSQL
   docker run -d --name pulse-postgres \
     -e POSTGRES_USER=pulse \
     -e POSTGRES_PASSWORD=pulse_password \
     -e POSTGRES_DB=pulse_db \
     -p 5432:5432 postgres:16-alpine

   # Redis
   docker run -d --name pulse-redis \
     -p 6379:6379 redis:7-alpine
   ```

6. **Run database migrations** (when implemented):

   ```bash
   alembic upgrade head
   ```

7. **Start development server**:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

8. **Access API documentation**:
   - Swagger UI: http://localhost:8000/api/docs
   - ReDoc: http://localhost:8000/api/redoc

### Docker Development

```bash
# From project root
docker-compose up -d
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection
│   ├── auth/                # Authentication logic
│   │   ├── __init__.py
│   │   └── security.py      # JWT & password hashing
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── company.py
│   │   ├── employee.py
│   │   ├── finance.py
│   │   ├── payroll.py
│   │   └── message.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   └── auth.py
│   ├── routers/             # API endpoints
│   │   ├── __init__.py
│   │   └── auth.py
│   └── middleware/          # Custom middleware
│       ├── __init__.py
│       ├── error_handler.py
│       └── logging.py
├── tests/                   # Test suite
├── logs/                    # Application logs
├── uploads/                 # File uploads
├── .env.example             # Environment template
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker image
└── README.md               # This file
```

## API Endpoints

### Authentication

| Method | Endpoint             | Description                  | Auth Required |
| ------ | -------------------- | ---------------------------- | ------------- |
| POST   | `/api/auth/register` | Register new company + admin | No            |
| POST   | `/api/auth/login`    | Login user                   | No            |
| POST   | `/api/auth/refresh`  | Refresh access token         | No            |
| GET    | `/api/auth/me`       | Get current user             | Yes           |
| POST   | `/api/auth/logout`   | Logout user                  | No            |

### Health & Status

| Method | Endpoint  | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Health check endpoint |
| GET    | `/`       | API information       |

## Configuration

Environment variables (`.env` file):

```env
# Application
APP_NAME=Pulse
APP_VERSION=1.0.0
DEBUG=True
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# JWT
SECRET_KEY=your-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGINS=http://localhost:3000
```

## User Roles

- **super_admin**: Platform administrator (future use)
- **company_admin**: Company owner with full access
- **manager**: Department manager with team access
- **employee**: Regular employee with limited access

## Database Schema

The application uses PostgreSQL with the following main tables:

- `companies` - Company/organization data
- `users` - User accounts and authentication
- `employees` - Employee profiles and details
- `pto_balances` - PTO tracking
- `pto_requests` - PTO request management
- `shifts` - Employee scheduling
- `transactions` - Financial transactions
- `expense_categories` - Expense categorization
- `payroll_runs` - Payroll batch processing
- `payroll_items` - Individual payroll entries
- `messages` - Internal messaging

See `database/init.sql` for complete schema.

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## Development Guidelines

### Code Style

- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Run black for formatting: `black app/`
- Run flake8 for linting: `flake8 app/`

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Role-based access control (RBAC)
- CORS protection
- SQL injection prevention (SQLAlchemy ORM)
- Input validation (Pydantic)

## Deployment

### Docker

```bash
# Build image
docker build -t pulse-backend .

# Run container
docker run -d -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=... \
  pulse-backend
```

### Kubernetes

See `../kubernetes/` directory for deployment manifests.

```bash
# Deploy to Kubernetes
kubectl apply -f ../kubernetes/
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
echo $DATABASE_URL
```

### Redis Connection Error

```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli ping
```

### Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run tests and linting
5. Submit pull request

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
