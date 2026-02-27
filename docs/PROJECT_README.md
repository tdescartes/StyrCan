# Pulse - Business Management Platform

> **Empowering Small Businesses with One Integrated Platform**

Pulse is a comprehensive full-stack business management platform designed to simplify operations for small businesses by integrating employee management, financial tracking, payroll processing, and team communication into a single, powerful solution.

---

## 🚀 Project Status

### ✅ Completed

- **Backend Infrastructure** - FastAPI with PostgreSQL & Redis
- **Authentication System** - JWT-based auth with role-based access control
- **Database Schema** - Complete PostgreSQL schema with all tables
- **Docker Configuration** - Full docker-compose setup
- **Kubernetes Manifests** - Production-ready K8s deployment files
- **Database Models** - SQLAlchemy models for all entities
- **API Documentation** - Auto-generated Swagger/ReDoc docs

- **Next.js Frontend** - Modern React application with App Router
- **Employee Management UI** - Employee profiles, PTO, scheduling
- **Financial Management UI** - Transaction tracking and reporting
- **Payroll System** - Automated payroll processing
- **Messaging System** - Real-time WebSocket communication
- **Multi-Tenancy** - Company-scoped data isolation
- **Two-Factor Authentication** - TOTP-based 2FA support
- **File Management** - Document upload and storage
- **Reports** - Configurable report generation
- **Billing Integration** - Stripe subscription management

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## ✨ Features

### Core Functionalities

#### 1. **Employee Management**

- Employee profiles and records
- PTO (Paid Time Off) tracking and requests
- Shift scheduling and management
- Performance monitoring and reports

#### 2. **Financial Management**

- Real-time cash flow monitoring
- Income and expense tracking
- Financial reporting and analytics
- Budget management per category

#### 3. **Payroll Processing**

- Automated salary calculations
- Overtime and bonus management
- Tax deductions and compliance
- Payment tracking and history

#### 4. **Team Communication**

- Direct messaging between team members
- Broadcast announcements
- Real-time notifications
- Message history and search

#### 5. **Centralized Dashboard**

- Real-time business analytics
- Customizable widgets
- Key performance indicators
- Visual data representation

#### 6. **Operational Tools**

- Document management
- Business automation
- Reporting tools
- Export capabilities

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

### Landing Page (Marketing)

- **Generator**: Eleventy (11ty)
- **Templating**: Nunjucks
- **Styling**: Custom CSS
- **Hosting**: Static files via Nginx

### Backend

- **Framework**: FastAPI 0.110+
- **Language**: Python 3.11+
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT (python-jose)
- **Caching**: Redis 7
- **WebSockets**: Native FastAPI support

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes
- **Reverse Proxy**: Nginx (Ingress)
- **Deployment**: Self-hosted on home server

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  MARKETING LAYER (pulse.com)          │
│  Eleventy Static Site (Nunjucks + CSS)                │
│  ├── Landing Page (Features, Pricing)                 │
│  ├── Contact & About Pages                            │
│  └── Newsletter Signup Forms                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 APP LAYER (use.pulse.com)            │
│  Next.js 15 (TypeScript + React + Tailwind CSS)       │
│  ├── Authentication (Login, Register)                 │
│  ├── Protected Routes (Dashboard, Management)          │
│  └── Real-time Updates (WebSocket client)             │
└─────────────────────────────────────────────────────────┘
                          ↕ REST API + WebSockets
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                      │
│  FastAPI Backend (Python 3.11+)                        │
│  ├── Authentication Service (JWT + RBAC)              │
│  ├── Employee Service (CRUD + Scheduling)             │
│  ├── Financial Service (Transactions + Reports)       │
│  ├── Payroll Service (Calculations + Processing)      │
│  ├── Messaging Service (WebSocket + Persistence)      │
│  └── Dashboard Service (Analytics + Aggregations)     │
└─────────────────────────────────────────────────────────┘
                          ↕ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                          │
│  PostgreSQL 16 (Docker Container)                      │
│  ├── Users & Authentication                            │
│  ├── Companies & Organizations                         │
│  ├── Employees & Schedules                             │
│  ├── Financial Records                                 │
│  ├── Payroll Data                                      │
│  └── Messages & Notifications                          │
│                                                         │
│  Redis 7 (Caching & Sessions)                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** installed
- **Node.js** 18+ and **npm** (for frontend development)
- **Python** 3.11+ (for backend development)
- **kubectl** (for Kubernetes deployment)
- **Git**

### Option 1: Docker Compose (Recommended for Development)

```bash
# Clone the repository
git clone <repository-url>
cd Pulse

# Copy environment files
cp backend/.env.example backend/.env

# Edit .env with your configurations
# IMPORTANT: Change SECRET_KEY and passwords!

# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Kubernetes Deployment

```bash
# Navigate to kubernetes directory
cd kubernetes

# Edit secrets.yaml with your actual values
vim secrets.yaml

# Apply configurations
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres-pv.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml

# Verify deployment
kubectl get pods -n pulse
kubectl get svc -n pulse
```

**Access via NodePort:**

- Frontend: http://<node-ip>:30300
- Backend: http://<node-ip>:30800

### Option 3: Local Development (No Docker)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your local database connection

# Start PostgreSQL and Redis (using Docker)
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_USER=pulse \
  -e POSTGRES_PASSWORD=pulse_password \
  -e POSTGRES_DB=pulse_db \
  postgres:16-alpine

docker run -d --name redis -p 6379:6379 redis:7-alpine

# Initialize database (run init.sql manually or via psql)
psql -U pulse -d pulse_db -f ../database/init.sql

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

---

## 👨‍💻 Development

### Backend Development

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Code formatting
black app/

# Linting
flake8 app/
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Linting
npm run lint
```

### Landing Page Development

```bash
cd landing

# Install dependencies
npm install

# Development server with hot reload
npm start

# Build for production
npm run build
# Output in _site directory
```

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it pulse-postgres psql -U pulse -d pulse_db

# Run migrations (when implemented)
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback
alembic downgrade -1
```

---

## 📦 Project Structure

```
Pulse/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── auth/              # Authentication logic
│   │   ├── models/            # SQLAlchemy models
│   │   ├── routers/           # API endpoints
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── middleware/        # Custom middleware
│   │   ├── main.py            # FastAPI app
│   │   ├── config.py          # Configuration
│   │   └── database.py        # DB connection
│   ├── tests/                 # Backend tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── frontend/                  # Next.js App (use.pulse.com)
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities & API client
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript types
│   ├── public/                # Static assets
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── landing/                   # Eleventy Landing Page (pulse.com)
│   ├── src/
│   │   ├── _layouts/         # Page layouts (Nunjucks)
│   │   ├── _data/            # Global data files
│   │   ├── css/              # Stylesheets
│   │   ├── js/               # JavaScript files
│   │   ├── assets/           # Static assets
│   │   ├── index.njk         # Homepage
│   │   ├── about.njk         # About page
│   │   └── contact.njk       # Contact page
│   ├── .eleventy.js          # Eleventy configuration
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── database/                  # Database scripts
│   └── init.sql              # Initial schema
├── kubernetes/                # K8s manifests
│   ├── namespace.yaml
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── landing-deployment.yaml  # Marketing site deployment
│   └── ingress.yaml           # Routes pulse.com & use.pulse.com
├── docker-compose.yml         # Docker Compose config
├── Plan.md                    # Technical architecture
├── DEVELOPMENT_ROADMAP.md     # Development roadmap
└── README.md                  # This file
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint             | Description              | Auth |
| ------ | -------------------- | ------------------------ | ---- |
| POST   | `/api/auth/register` | Register company + admin | No   |
| POST   | `/api/auth/login`    | Login user               | No   |
| POST   | `/api/auth/refresh`  | Refresh access token     | No   |
| GET    | `/api/auth/me`       | Get current user         | Yes  |
| POST   | `/api/auth/logout`   | Logout                   | No   |

### Interactive API Docs

When running in development mode:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Example API Calls

**Register Company:**

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "email": "company@example.com",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "john@example.com",
    "admin_password": "SecurePassword123!"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

---

## 🔐 Security

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: HS256 algorithm, short-lived access tokens
- **Refresh Tokens**: Long-lived, single-use recommended
- **RBAC**: Role-based access control
- **CORS**: Configured for specific origins
- **SQL Injection**: Protected via SQLAlchemy ORM
- **Input Validation**: Pydantic schemas
- **HTTPS**: Enforced in production (configure in nginx/ingress)

### User Roles

- `super_admin` - Platform administrator
- `company_admin` - Company owner (full access)
- `manager` - Department manager (team access)
- `employee` - Regular user (limited access)

---

## 🚢 Deployment

### Production Checklist

- [ ] Change all default passwords
- [ ] Generate secure SECRET_KEY (min 32 characters)
- [ ] Update CORS_ORIGINS to your domain
- [ ] Set DEBUG=False
- [ ] Configure SSL/TLS certificates
- [ ] Set up database backups
- [ ] Configure persistent volumes
- [ ] Set resource limits in K8s
- [ ] Enable monitoring and logging
- [ ] Configure firewall rules

### Building Docker Images

```bash
# Backend
docker build -t pulse-backend:latest ./backend

# Frontend (when created)
docker build -t pulse-frontend:latest ./frontend
```

### Kubernetes Deployment

See [kubernetes/README.md](./kubernetes/README.md) for detailed instructions.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Proprietary - All rights reserved

---

## 📧 Support

For issues, questions, or contributions:

- **Email**: hello@pulse.com
- **Issues**: GitHub Issues (when public)
- **Documentation**: See [Plan.md](./Plan.md) for technical details

---

## 🎯 Roadmap

See [MARKET_READINESS_ROADMAP.md](./MARKET_READINESS_ROADMAP.md) for the production readiness roadmap.

### Phase 1: Foundation ✅

- [x] Backend infrastructure (FastAPI + PostgreSQL + MongoDB)
- [x] Authentication system (JWT + RBAC + 2FA)
- [x] Database schema (12 tables with multi-tenancy)
- [x] Docker configuration
- [x] Kubernetes manifests

### Phase 2: Core Features ✅

- [x] Next.js frontend (App Router + TypeScript)
- [x] Employee management module (directory, PTO, scheduling, reviews)
- [x] Financial management module (ledger, budgets, categories, reports)
- [x] Payroll processing module (runs, history, taxes)

### Phase 3: Communication & Analytics ✅

- [x] Real-time messaging (WebSocket + threads + broadcast)
- [x] Centralized dashboard (stats, charts, quick summary)
- [x] Analytics and reporting
- [x] File management

### Phase 4: Production

- [ ] End-to-end testing and QA
- [ ] Performance optimization
- [ ] Stripe billing integration completion
- [ ] Production deployment

---

**Built with ❤️ for small businesses worldwide**
