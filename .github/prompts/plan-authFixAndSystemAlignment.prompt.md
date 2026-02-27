# Pulse System Alignment & Authentication Fix Plan

## Executive Summary

This document outlines the complete plan to fix authentication issues, clear databases, audit and clean documentation, and ensure the frontend UI fully reflects all backend functionality. The approach follows a principal product designer's strategic planning methodology followed by principal software engineer implementation standards.

---

## 1. Current State Assessment

### 1.1 Infrastructure Status

- **Backend**: Not running (port 8000 unreachable)
- **Database Services**: Docker containers not running (PostgreSQL 5433, MongoDB 27017, Redis 6379)
- **Frontend**: Unknown state (not checked yet)
- **Issue**: Authentication cannot be tested without running services

### 1.2 Authentication System Architecture (Verified)

**Backend Flow** (FastAPI):

- Registration: `POST /api/auth/register` → Creates Company + Admin User → Returns tokens
- Login: `POST /api/auth/login` → Validates credentials → Updates last_login → Returns tokens
- JWT: HS256, 15-min access token, 7-day refresh token with `{sub, company_id, role, exp, type}`
- Security: bcrypt passwords, `get_current_user()` validates JWT + company_id + user/company active status
- RBAC: 4 roles (super_admin, company_admin, manager, employee) with role-based dependencies

**Frontend Flow** (Next.js):

- Auth Store: Zustand with persistence (`auth-storage` in localStorage)
- Token Storage: `access_token` and `refresh_token` in localStorage (separate from Zustand)
- API Client: Auto-refresh on 401, retries once, redirects to `/login` on failure
- Auth Guard: Client-side only (no Next.js middleware), services layout redirects unauthenticated users
- Registration splits `fullName` → `firstName`/`lastName`, maps to backend schema

**Confirmed Schema Alignment**:

- Frontend `RegisterData`: `{name, email, admin_first_name, admin_last_name, admin_email, admin_password, phone?, address?, tax_id?}`
- Backend `CompanyCreate`: Exact match ✅
- Frontend `LoginCredentials`: `{email, password}`
- Backend `LoginRequest`: Exact match ✅

### 1.3 Potential Authentication Issues (Hypotheses)

#### Issue A: Services Not Running

**Symptoms**: Backend unreachable, auth fails immediately
**Root Cause**: PostgreSQL, MongoDB, Redis, or FastAPI not running
**Impact**: Complete system failure, no auth possible

#### Issue B: Database Schema Mismatch

**Symptoms**: 500 errors on registration, user creation fails
**Root Cause**: Missing tables, missing columns, or incorrect constraints (UUIDs vs strings)
**Impact**: Cannot create users/companies

#### Issue C: Token/Session Persistence Issues

**Symptoms**: Users logged out on refresh, infinite redirect loops
**Root Cause**: Zustand hydration timing, localStorage clearing, token refresh failure
**Impact**: Poor UX, users can't stay logged in

#### Issue D: Company Context Validation Failures

**Symptoms**: Force logout after login, "company mismatch" errors
**Root Cause**: `validateCompanyContext()` too strict, company_id comparison issues (UUID vs string)
**Impact**: Users can't access system after login

#### Issue E: CORS or Network Issues

**Symptoms**: Network errors, blocked requests in browser console
**Root Cause**: Backend CORS config doesn't match frontend origin, preflight failures
**Impact**: All API calls fail

---

## 2. Documentation Audit Results

### 2.1 Current Documents (21 files)

#### ✅ **Keep & Maintain** (Core System Documentation)

1. **API_TESTING_GUIDE.md** (1,923 lines) - Comprehensive curl examples for all endpoints
2. **BACKEND_API_SPECIFICATION.md** (2,573 lines) - Formal API spec with schemas, auth, WebSocket
3. **DEPLOYMENT_GUIDE.md** (636 lines) - Production deployment: Docker, K8s, migrations, monitoring
4. **PRODUCT_SPECIFICATION.md** (2,145 lines) - Complete product spec: features, business rules, data model
5. **PROJECT_README.md** (597 lines) - Project overview: status, features, tech stack, architecture
6. **QUICKSTART.md** (310 lines) - Quick start: Docker Compose, first account, troubleshooting
7. **RBAC_AND_DB_CONSOLIDATION.md** (276 lines) - RBAC design: roles, permissions, User↔Employee linkage
8. **MASTER_DATA_REFERENCE.md** (60 lines) - Demo tenant data for testing/seeding

#### ⚠️ **Needs Update** (Partially Outdated)

9. **MARKET_READINESS_ROADMAP.md** (1,064 lines) - 8-week roadmap (check if phases completed)
10. **IMPLEMENTATION_SUMMARY.md** (702 lines) - Exec summary of 4 phases (verify completion status)
11. **README.md** (35 lines) - TOC/index (needs update after doc cleanup)

#### 📦 **Archive/Deprecate** (Migration/Historical Context)

12. **MIGRATION_PLAN.md** (847 lines) - Migration from `frontend-next` → `frontend` (COMPLETED)
13. **FRONTEND_UPDATES_SUMMARY.md** (245 lines) - Component update changelog (COMPLETED)
14. **FRONTEND_BACKEND_ALIGNMENT.md** (552 lines) - Type alignment changes (COMPLETED)
15. **FRONTEND_API_INTEGRATION.md** (464 lines) - API client, types, test suite (MAY BE OUTDATED)

#### 🔄 **Review** (Multi-Tenancy Deep Dives)

16. **MULTI_TENANCY_ARCHITECTURE.md** (729 lines) - Deep-dive: data isolation, JWT, middleware
17. **MULTI_TENANCY_IMPLEMENTATION.md** (424 lines) - Implementation details: constraints, indexes, helpers
18. **MULTI_TENANCY_IMPLEMENTATION_SUMMARY.md** (441 lines) - Summary of MT changes
19. **MULTI_TENANCY_QUICK_REFERENCE.md** (291 lines) - Developer cheat sheet for MT patterns

**Decision**: Keep all 4 MT docs (valuable reference), but consolidate into:

- **MULTI_TENANCY_GUIDE.md** (architecture + implementation)
- **MULTI_TENANCY_QUICK_REFERENCE.md** (developer cheat sheet)

#### 📊 **Special Case**

20. **DEVELOPMENT_ROADMAP.md** (164 lines) - GitHub issue templates for all features
21. **Plan.md** (1,781 lines) - Original technical architecture (React/Vite/shadcn)

**Decision**:

- Keep DEVELOPMENT_ROADMAP.md (useful for issue tracking)
- Archive Plan.md → `docs/archive/original-plan.md` (historical)

### 2.2 Proposed Documentation Structure

```
docs/
├── README.md                              # Updated TOC/index
├── QUICKSTART.md                          # Quick start guide
├── PRODUCT_SPECIFICATION.md               # Product spec
├── PROJECT_README.md                      # Project overview
│
├── api/
│   ├── API_SPECIFICATION.md               # Rename from BACKEND_API_SPECIFICATION.md
│   └── API_TESTING_GUIDE.md
│
├── architecture/
│   ├── RBAC_DESIGN.md                     # Rename from RBAC_AND_DB_CONSOLIDATION.md
│   ├── MULTI_TENANCY_GUIDE.md             # Consolidate 3 MT docs
│   └── MULTI_TENANCY_QUICK_REFERENCE.md
│
├── development/
│   ├── DEVELOPMENT_ROADMAP.md
│   └── MASTER_DATA_REFERENCE.md
│
├── deployment/
│   ├── DEPLOYMENT_GUIDE.md
│   └── MARKET_READINESS_ROADMAP.md        # Move here, update status
│
└── archive/
    ├── original-plan.md                   # Was Plan.md
    ├── migration-plan.md                  # Was MIGRATION_PLAN.md
    ├── frontend-updates-summary.md
    ├── frontend-backend-alignment.md
    ├── frontend-api-integration.md
    ├── implementation-summary.md
    ├── mt-architecture.md                 # Superseded by consolidated guide
    ├── mt-implementation.md
    └── mt-implementation-summary.md
```

---

## 3. Backend API Endpoint Coverage

### 3.1 Complete Endpoint Inventory (~90 endpoints)

#### Authentication (13 endpoints) ✅

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/change-password
- PUT /api/auth/me
- POST /api/auth/2fa/setup
- POST /api/auth/2fa/verify
- POST /api/auth/2fa/disable
- GET /api/auth/2fa/status

#### Billing (8 endpoints) 💳

- POST /api/billing/checkout
- POST /api/billing/portal
- GET /api/billing/subscription
- GET /api/billing/invoices
- GET /api/billing/payment-method
- GET /api/billing/usage
- GET /api/billing/dashboard
- POST /api/billing/webhooks

#### Dashboard (3 endpoints) 📊

- GET /api/dashboard
- GET /api/dashboard/charts
- GET /api/dashboard/summary/quick

#### Employees (24 endpoints) 👥

- GET /api/employees/dashboard
- GET /api/employees/me (self-service)
- GET /api/employees/me/schedule
- GET /api/employees/me/pto
- POST /api/employees/me/pto-requests
- GET /api/employees/me/payroll
- GET /api/employees (list with filtering)
- POST /api/employees
- GET /api/employees/{id}
- PUT /api/employees/{id}
- DELETE /api/employees/{id}
- GET /api/employees/{id}/pto-balance
- PUT /api/employees/{id}/pto-balance
- GET /api/employees/{id}/pto-requests
- POST /api/employees/{id}/pto-requests
- GET /api/employees/pto-requests/pending
- PUT /api/employees/pto-requests/{id}
- GET /api/employees/{id}/shifts
- POST /api/employees/shifts
- GET /api/employees/shifts
- PUT /api/employees/shifts/{id}
- DELETE /api/employees/shifts/{id}
- GET /api/employees/export

#### Finances (13 endpoints) 💰

- GET /api/finances/dashboard
- GET /api/finances/transactions
- POST /api/finances/transactions
- GET /api/finances/transactions/{id}
- PUT /api/finances/transactions/{id}
- DELETE /api/finances/transactions/{id}
- GET /api/finances/categories
- POST /api/finances/categories
- PUT /api/finances/categories/{id}
- DELETE /api/finances/categories/{id}
- GET /api/finances/summary
- GET /api/finances/trends

#### Payroll (11 endpoints) 💵

- GET /api/payroll/dashboard
- GET /api/payroll/runs
- POST /api/payroll/runs
- GET /api/payroll/runs/{id}
- POST /api/payroll/runs/{id}/process
- PUT /api/payroll/runs/{id}
- DELETE /api/payroll/runs/{id}
- GET /api/payroll/runs/{id}/items
- PUT /api/payroll/items/{id}
- POST /api/payroll/items/{id}/mark-paid
- GET /api/payroll/employees/{id}/history

#### Messaging (7 endpoints) 💬

- POST /api/messages/send
- GET /api/messages/inbox
- GET /api/messages/sent
- GET /api/messages/thread/{id}
- PATCH /api/messages/{id}/read
- DELETE /api/messages/{id}
- GET /api/messages/unread-count

#### Notifications (6 endpoints) 🔔

- POST /api/notifications/create
- GET /api/notifications/
- PATCH /api/notifications/{id}/read
- POST /api/notifications/mark-all-read
- DELETE /api/notifications/{id}
- GET /api/notifications/unread-count

#### WebSocket (2 endpoints) 🔌

- WS /api/notifications/ws
- GET /api/notifications/stats

#### Files (6 endpoints) 📁

- POST /api/files/upload
- POST /api/files/upload/multiple
- GET /api/files/list
- GET /api/files/download/{key}
- DELETE /api/files/delete/{key}
- GET /api/files/metadata/{key}

#### Reports (3 endpoints) 📄

- POST /api/reports/financial
- POST /api/reports/payroll
- GET /api/reports/list
- GET /api/reports/download/{key}

#### Settings (10 endpoints) ⚙️

- GET /api/settings/company
- PUT /api/settings/company
- GET /api/settings/users
- POST /api/settings/users/invite
- PUT /api/settings/users/{id}
- DELETE /api/settings/users/{id}
- GET /api/settings/billing
- POST /api/settings/billing/change-plan
- GET /api/settings/notifications/preferences
- PUT /api/settings/notifications/preferences

---

## 4. Frontend UI Coverage Analysis

### 4.1 Existing Pages (~35 pages)

#### Auth Pages ✅

- `/login` - Login page with email/password
- `/register` - Registration with company creation
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset with token

#### Dashboard ⚠️

- `/reports` - Reports page (needs audit)

#### Employees Service 👥

- `/employees` - Dashboard (KPIs)
- `/employees/directory` - Employee list/directory
- `/employees/schedule` - Shift scheduling
- `/employees/pto` - PTO management
- `/employees/reviews` - Performance reviews (placeholder?)

#### Finance Service 💰

- `/finance` - Dashboard (KPIs)
- `/finance/ledger` - Transaction ledger
- `/finance/budget` - Budget management
- `/finance/categories` - Expense categories
- `/finance/reports` - Financial reports

#### Payroll Service 💵

- `/payroll` - Dashboard (KPIs)
- `/payroll/runs` - Payroll runs management
- `/payroll/history` - Payroll history
- `/payroll/employees` - Employee payroll details
- `/payroll/taxes` - Tax information

#### Communication Service 💬

- `/communication` - Dashboard
- `/communication/inbox` - Message inbox
- `/communication/broadcast` - Broadcast messages
- `/communication/threads` - Message threads
- `/communication/files` - File sharing

#### Settings ⚙️

- `/settings` - Settings dashboard
- `/settings/profile` - User profile
- `/settings/company` - Company settings
- `/settings/team` - Team/user management
- `/settings/billing` - Billing & subscription
- `/settings/security` - Security settings (2FA)
- `/settings/notifications` - Notification preferences
- `/settings/appearance` - Theme/appearance

#### Legal 📜

- `/privacy` - Privacy policy
- `/terms` - Terms of service

### 4.2 Missing UI Coverage (Backend endpoints without frontend pages)

#### 🚨 **Critical Missing Pages**

1. **Employee Self-Service Hub** (`/my` or `/self-service`)
   - Backend: `GET /api/employees/me` (dashboard view)
   - Backend: `GET /api/employees/me/schedule` (my shifts)
   - Backend: `GET /api/employees/me/pto` (my PTO balance + history)
   - Backend: `POST /api/employees/me/pto-requests` (submit PTO)
   - Backend: `GET /api/employees/me/payroll` (my pay stubs)
   - **Gap**: No dedicated self-service section for employees

2. **Billing/Subscription Management** (`/settings/billing`)
   - Backend: `POST /api/billing/checkout` (upgrade/subscribe)
   - Backend: `POST /api/billing/portal` (Stripe portal)
   - Backend: `GET /api/billing/subscription` (current plan)
   - Backend: `GET /api/billing/invoices` (invoice history)
   - Backend: `GET /api/billing/usage` (usage stats)
   - Backend: `GET /api/billing/dashboard` (billing overview)
   - **Gap**: Page exists but likely incomplete/placeholder

3. **2FA Setup** (`/settings/security`)
   - Backend: `POST /api/auth/2fa/setup` (generate QR + backup codes)
   - Backend: `POST /api/auth/2fa/verify` (enable 2FA)
   - Backend: `POST /api/auth/2fa/disable` (disable 2FA)
   - Backend: `GET /api/auth/2fa/status` (check status)
   - **Gap**: Page exists but 2FA UI likely missing

4. **File Management** (`/files` or `/communication/files`)
   - Backend: `POST /api/files/upload` (single upload)
   - Backend: `POST /api/files/upload/multiple` (batch upload)
   - Backend: `GET /api/files/list` (list files in folder)
   - Backend: `GET /api/files/download/{key}` (download URL)
   - Backend: `DELETE /api/files/delete/{key}` (admin delete)
   - Backend: `GET /api/files/metadata/{key}` (file metadata)
   - **Gap**: `/communication/files` page exists but coverage unknown

5. **Report Generation** (`/reports`)
   - Backend: `POST /api/reports/financial` (generate financial PDF)
   - Backend: `POST /api/reports/payroll` (generate payroll PDF)
   - Backend: `GET /api/reports/list` (list generated reports)
   - Backend: `GET /api/reports/download/{key}` (download URL)
   - **Gap**: Page exists but report generation UI unknown

6. **Notifications Center** (no page)
   - Backend: `POST /api/notifications/create`
   - Backend: `GET /api/notifications/`
   - Backend: `PATCH /api/notifications/{id}/read`
   - Backend: `POST /api/notifications/mark-all-read`
   - Backend: `DELETE /api/notifications/{id}`
   - Backend: `GET /api/notifications/unread-count`
   - Backend: WebSocket `/api/notifications/ws`
   - **Gap**: No notifications center/inbox page

#### ⚠️ **Partial Coverage (Needs Audit)**

7. **Dashboard** (`/dashboard` or `/`)
   - Backend: `GET /api/dashboard` (full dashboard)
   - Backend: `GET /api/dashboard/charts` (chart data)
   - Backend: `GET /api/dashboard/summary/quick` (quick widgets)
   - **Gap**: Need to verify page uses all 3 endpoints

8. **PTO Request Approval** (`/employees/pto`)
   - Backend: `GET /api/employees/pto-requests/pending` (pending requests for managers)
   - Backend: `PUT /api/employees/pto-requests/{id}` (approve/deny)
   - **Gap**: Verify manager approval UI exists

9. **Payroll Processing Flow** (`/payroll/runs`)
   - Backend: `POST /api/payroll/runs/{id}/process` (calculate payroll)
   - Backend: `PUT /api/payroll/items/{id}` (edit individual item)
   - Backend: `POST /api/payroll/items/{id}/mark-paid` (mark as paid)
   - **Gap**: Verify full processing workflow UI

10. **User Management** (`/settings/team`)
    - Backend: `GET /api/settings/users` (list users)
    - Backend: `POST /api/settings/users/invite` (invite new user)
    - Backend: `PUT /api/settings/users/{id}` (update role)
    - Backend: `DELETE /api/settings/users/{id}` (remove user)
    - **Gap**: Verify full CRUD UI exists

---

## 5. Implementation Plan

### Phase 1: Environment Setup & Database Reset (Priority 1)

#### 1.1 Start Services

```bash
# Option A: Docker Compose (if docker-compose.yml exists)
cd backend
docker-compose up -d postgres mongodb redis

# Option B: Individual Docker containers
docker run -d --name pulse-postgres \
  -e POSTGRES_USER=pulse \
  -e POSTGRES_PASSWORD=pulse_password \
  -e POSTGRES_DB=pulse_db \
  -p 5433:5432 \
  postgres:15

docker run -d --name pulse-mongodb \
  -p 27017:27017 \
  mongo:7

docker run -d --name pulse-redis \
  -p 6379:6379 \
  redis:7
```

#### 1.2 Clear All Database Data

**PostgreSQL**:

```sql
-- Connect: psql -h localhost -p 5433 -U pulse -d pulse_db
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO pulse;
GRANT ALL ON SCHEMA public TO public;
```

**MongoDB**:

```js
// Connect: mongosh mongodb://localhost:27017
use pulse_logs
db.dropDatabase()
```

**Redis**:

```bash
redis-cli -p 6379 FLUSHALL
```

#### 1.3 Run Alembic Migrations

```bash
cd backend
alembic upgrade head
```

#### 1.4 Verify DB Schema

- Check all tables exist (companies, users, employees, etc.)
- Verify UUID columns vs string columns
- Check unique constraints and indexes

### Phase 2: Authentication Fix (Priority 1)

#### 2.1 Start Backend

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2.2 Test Auth Flow Manually

```bash
# Register new company
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "email": "company@test.com",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "john@test.com",
    "admin_password": "Test1234"
  }'

# Expected: 201 Created with tokens

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "Test1234"
  }'

# Expected: 200 OK with tokens

# Get current user
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer {access_token}"

# Expected: 200 OK with user data
```

#### 2.3 Test Frontend Auth

```bash
cd frontend
npm run dev
```

1. Navigate to `http://localhost:3000/register`
2. Register a new account
3. Verify redirect to `/` after registration
4. Logout
5. Login with same credentials
6. Verify no console errors
7. Verify tokens in localStorage
8. Refresh page → verify no logout
9. Check `auth-storage` in localStorage for Zustand state

#### 2.4 Fix Identified Issues

**If Issue A (Services Not Running)**:

- Start all services as per 1.1
- No code changes needed

**If Issue B (Schema Mismatch)**:

- Run migrations
- Check `backend/alembic/versions/` for latest schema
- Verify UUID handling in models

**If Issue C (Token Persistence)**:

- Check Zustand `onRehydrateStorage` timing
- Add debug logs to `auth-store.ts`
- Verify `hasHydrated` flag is set correctly

**If Issue D (Company Context)**:

- Review `validateCompanyContext()` logic
- Check UUID vs string comparison
- May need to disable strict validation temporarily

**If Issue E (CORS)**:

- Verify frontend origin in backend `.env` CORS_ORIGINS
- Check browser DevTools Network tab for CORS errors

### Phase 3: Documentation Cleanup (Priority 2)

#### 3.1 Restructure Docs Folder

1. Create new folder structure: `api/`, `architecture/`, `development/`, `deployment/`, `archive/`
2. Move files according to proposed structure (Section 2.2)
3. Rename files:
   - `BACKEND_API_SPECIFICATION.md` → `api/API_SPECIFICATION.md`
   - `RBAC_AND_DB_CONSOLIDATION.md` → `architecture/RBAC_DESIGN.md`
4. Consolidate multi-tenancy docs:
   - Merge `MULTI_TENANCY_ARCHITECTURE.md` + `MULTI_TENANCY_IMPLEMENTATION.md` + `MULTI_TENANCY_IMPLEMENTATION_SUMMARY.md`
   - Create `architecture/MULTI_TENANCY_GUIDE.md`
   - Keep `MULTI_TENANCY_QUICK_REFERENCE.md` as-is
5. Update `README.md` with new TOC

#### 3.2 Archive Completed/Historical Docs

Move to `archive/`:

- `Plan.md` → `archive/original-plan.md`
- `MIGRATION_PLAN.md` → `archive/migration-plan.md`
- `FRONTEND_UPDATES_SUMMARY.md` → `archive/frontend-updates-summary.md`
- `FRONTEND_BACKEND_ALIGNMENT.md` → `archive/frontend-backend-alignment.md`
- `FRONTEND_API_INTEGRATION.md` → `archive/frontend-api-integration.md`
- `IMPLEMENTATION_SUMMARY.md` → `archive/implementation-summary.md`

#### 3.3 Update/Improve Core Docs

1. **QUICKSTART.md**: Verify Docker commands, add troubleshooting
2. **PROJECT_README.md**: Update features list, tech stack, status
3. **API_SPECIFICATION.md**: Add any missing endpoints from router audit
4. **RBAC_DESIGN.md**: Clarify role hierarchy, add RBAC examples
5. **MARKET_READINESS_ROADMAP.md**: Mark completed phases, update timeline

### Phase 4: UI-Backend Alignment (Priority 2)

#### 4.1 Create Missing Critical Pages

**A. Employee Self-Service Hub** (`/self-service` or `/my`)

```
Files to create:
- frontend/src/app/(services)/self-service/page.tsx (dashboard)
- frontend/src/app/(services)/self-service/layout.tsx
- frontend/src/app/(services)/self-service/schedule/page.tsx (my shifts)
- frontend/src/app/(services)/self-service/pto/page.tsx (my PTO + request form)
- frontend/src/app/(services)/self-service/payroll/page.tsx (my pay stubs)

API calls:
- GET /api/employees/me
- GET /api/employees/me/schedule
- GET /api/employees/me/pto
- POST /api/employees/me/pto-requests
- GET /api/employees/me/payroll
```

**B. Notifications Center** (`/notifications`)

```
Files to create:
- frontend/src/app/(services)/notifications/page.tsx
- frontend/src/app/(services)/notifications/layout.tsx

Features:
- List all notifications (unread + read)
- Mark as read (individual + bulk)
- Delete notifications
- Real-time updates via WebSocket
- Unread count badge in header

API calls:
- GET /api/notifications/
- PATCH /api/notifications/{id}/read
- POST /api/notifications/mark-all-read
- DELETE /api/notifications/{id}
- GET /api/notifications/unread-count
- WS /api/notifications/ws
```

**C. 2FA Setup UI** (`/settings/security`)

```
Update existing page:
- frontend/src/app/(settings)/settings/security/page.tsx

Features:
- Display 2FA status (enabled/disabled)
- Setup flow: Generate QR + backup codes → Verify code → Enable
- Disable flow: Enter password + code → Disable
- Backup codes display + regeneration

API calls:
- GET /api/auth/2fa/status
- POST /api/auth/2fa/setup
- POST /api/auth/2fa/verify
- POST /api/auth/2fa/disable
```

**D. Billing Management** (`/settings/billing`)

```
Update existing page:
- frontend/src/app/(settings)/settings/billing/page.tsx

Features:
- Current subscription display (plan, status, next billing)
- Usage stats vs plan limits
- Invoice history table
- Payment method display
- Upgrade/change plan button → Stripe Checkout
- Manage billing button → Stripe Portal

API calls:
- GET /api/billing/subscription
- GET /api/billing/usage
- GET /api/billing/invoices
- GET /api/billing/payment-method
- GET /api/billing/dashboard
- POST /api/billing/checkout
- POST /api/billing/portal
```

**E. Report Generation** (`/reports`)

```
Update existing page:
- frontend/src/app/(dashboard)/reports/page.tsx

Features:
- Financial report generator (date range → PDF)
- Payroll report generator (pay period → PDF)
- Generated reports list (download links)
- Report generation progress indicators

API calls:
- POST /api/reports/financial
- POST /api/reports/payroll
- GET /api/reports/list
- GET /api/reports/download/{key}
```

#### 4.2 Audit & Complete Existing Pages

**Priority Order**:

1. `/dashboard` - Verify uses all 3 dashboard endpoints
2. `/employees/pto` - Add manager approval UI
3. `/payroll/runs` - Verify full processing workflow
4. `/settings/team` - Verify full user management CRUD
5. `/communication/files` - Verify file upload/download UI
6. `/finance/*` - Audit all finance pages
7. `/payroll/*` - Audit all payroll pages
8. `/employees/*` - Audit all employee pages

**Audit Checklist** (per page):

- [ ] All relevant backend endpoints are called
- [ ] Loading states implemented
- [ ] Error handling implemented
- [ ] RBAC guards (role-based UI hiding)
- [ ] Forms have proper validation
- [ ] Success/error toasts
- [ ] Empty states
- [ ] Pagination (if applicable)
- [ ] Search/filter (if applicable)
- [ ] Responsive design
- [ ] Accessibility (ARIA labels, keyboard nav)

#### 4.3 Component Library Additions (If Needed)

**Potential New Components**:

- `<NotificationList />` - For notifications center
- `<TwoFASetup />` - QR code display + code input
- `<SubscriptionCard />` - Current plan display
- `<InvoiceTable />` - Billing invoice history
- `<ReportGenerator />` - Report generation form
- `<PTORequestForm />` - PTO request submission
- `<PTOApprovalCard />` - Manager approval UI
- `<FileUploader />` - Multi-file upload with progress
- `<WebSocketStatus />` - WebSocket connection indicator

### Phase 5: Testing & Validation (Priority 3)

#### 5.1 Authentication End-to-End Tests

1. Register → Login → Access protected route → Logout
2. Register → Refresh page → Verify still logged in
3. Login → Token expiry (wait 16 minutes) → Verify auto-refresh
4. Login → Manually delete access_token → Verify redirect to login
5. Login → Access with wrong company_id → Verify force logout
6. Register with duplicate email → Verify error handling
7. Login with wrong password → Verify error handling

#### 5.2 Feature Coverage Tests

For each service:

1. **Employees**: Create employee → View details → Update → Schedule shift → Request PTO → Approve PTO → Export CSV
2. **Finance**: Create transaction → View ledger → Create category → Generate financial summary → View trends
3. **Payroll**: Create payroll run → Process → View items → Edit item → Mark paid → View history
4. **Communication**: Send message → View inbox → Reply → Mark read → Delete

#### 5.3 RBAC Tests

Test user journeys for each role:

1. **Employee**: Self-service only, no manager features visible
2. **Manager**: Employee features + PTO approval + shift management
3. **Company Admin**: All features + user management + billing
4. **Super Admin**: All features across all companies

#### 5.4 Multi-Tenancy Tests

1. Register Company A → Create employees
2. Register Company B → Create employees
3. Login as Company A admin → Verify only sees Company A data
4. Login as Company B admin → Verify only sees Company B data
5. Attempt to access Company A employee via Company B token → Verify 403/404

### Phase 6: Final Polish (Priority 3)

#### 6.1 UI/UX Improvements

- Verify all pages follow design system (layout, spacing, typography)
- Add empty states for all list views
- Add skeleton loaders for all async data
- Add confirmation dialogs for destructive actions
- Add data validation error messages
- Improve form field labels and help text

#### 6.2 Performance Optimization

- Implement pagination for large lists
- Add debounce to search inputs
- Optimize API calls (avoid unnecessary refetches)
- Add cache strategies to API client
- Lazy load heavy components

#### 6.3 Accessibility

- Add ARIA labels to all interactive elements
- Ensure keyboard navigation works
- Verify screen reader compatibility
- Check color contrast ratios
- Add focus indicators

#### 6.4 Documentation Updates

- Update QUICKSTART.md with final setup steps
- Update API_TESTING_GUIDE.md with new endpoints
- Add user guide (if needed)
- Update README.md with current status

---

## 6. Success Criteria

### 6.1 Authentication

- ✅ Users can register and create company
- ✅ Users can login with email/password
- ✅ Tokens persist across page refreshes
- ✅ Auto-refresh on token expiry works
- ✅ Logout clears all auth state
- ✅ Protected routes redirect unauthenticated users
- ✅ Company context validation works correctly
- ✅ No infinite redirect loops

### 6.2 Documentation

- ✅ Docs folder reorganized with clear structure
- ✅ Core docs updated and accurate
- ✅ Historical/completed docs archived
- ✅ README.md TOC updated
- ✅ No outdated information in active docs

### 6.3 UI Coverage

- ✅ All backend endpoints have corresponding UI
- ✅ Employee self-service hub implemented
- ✅ Notifications center implemented
- ✅ 2FA setup UI implemented
- ✅ Billing management complete
- ✅ Report generation UI complete
- ✅ All existing pages audited and completed

### 6.4 Quality

- ✅ All forms have validation
- ✅ All async operations have loading states
- ✅ All errors handled gracefully
- ✅ RBAC enforced in UI (role-based hiding)
- ✅ No console errors/warnings
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ Accessibility standards met

---

## 7. Timeline Estimate

### Week 1: Foundation

- Day 1-2: Environment setup, database reset, auth fix
- Day 3-4: Documentation cleanup and reorganization
- Day 5: Testing and validation

### Week 2: UI Alignment

- Day 1-2: Employee self-service hub
- Day 3: Notifications center
- Day 4: 2FA + Billing pages
- Day 5: Report generation page

### Week 3: Audit & Complete

- Day 1-2: Audit all existing pages (Dashboard, Employees, Finance)
- Day 3-4: Audit remaining pages (Payroll, Communication, Settings)
- Day 5: Fix identified gaps

### Week 4: Testing & Polish

- Day 1-2: End-to-end testing, RBAC testing
- Day 3: Multi-tenancy testing
- Day 4: UI/UX polish, accessibility
- Day 5: Final documentation updates, deployment

**Total: ~4 weeks (20 working days)**

---

## 8. Risk Mitigation

### High-Risk Areas

1. **Database schema issues**: Mitigate with thorough migration testing before data wipe
2. **Token refresh race conditions**: Mitigate with careful promise handling in API client
3. **Company context validation false positives**: Mitigate with extensive logging and gradual rollout
4. **Incomplete UI coverage**: Mitigate with systematic endpoint inventory and checklist
5. **Breaking changes during cleanup**: Mitigate with git branching and incremental commits

### Rollback Plan

- Keep separate branch for each phase
- Commit frequently with clear messages
- Test each phase before moving to next
- Keep database backups before wipe
- Document all breaking changes

---

## 9. Next Steps

### Immediate Actions (Right Now)

1. ✅ Create this plan document
2. 🔄 Start services (PostgreSQL, MongoDB, Redis, Backend)
3. 🔄 Clear all database data
4. 🔄 Test authentication flow manually (curl)
5. 🔄 Test authentication flow in frontend
6. 🔄 Document any issues found

### After Auth Fix

1. Reorganize docs folder
2. Start UI coverage implementation
3. Parallel track: Audit existing pages

### Ongoing

- Commit changes incrementally
- Update this plan as needed
- Track progress in checklist format
- Communicate blockers early

---

## 10. Open Questions

1. **Docker Compose**: Does a `docker-compose.yml` exist in the project root? If yes, that's the preferred startup method.
2. **Alembic**: Are migrations up to date? Need to check `backend/alembic/versions/` for latest.
3. **Frontend Build**: Does `npm run dev` work without errors? Any missing dependencies?
4. **Employee Self-Service**: Should it be `/self-service`, `/my`, or `/me`? Recommendation: `/my` (shorter, clearer).
5. **RBAC UI Enforcement**: Should role-restricted features be hidden or disabled? Recommendation: Hidden (cleaner UX).
6. **Notification Preferences**: Are preferences stored in PostgreSQL (via settings endpoint) or MongoDB? Check backend implementation.
7. **File Storage**: Are files stored on S3 or local filesystem? Check `.env` for AWS credentials.

---

**END OF PLAN**

This plan will be refined as issues are discovered during implementation. Each phase should be completed, tested, and committed before moving to the next.
