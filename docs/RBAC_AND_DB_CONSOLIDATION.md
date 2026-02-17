# RBAC & Database Consolidation — Design & Implementation Plan

**Date:** February 16, 2026  
**Status:** In Progress  
**Author:** Engineering  

---

## 1. Problem Statement

### 1.1 Database Confusion
The workspace folder is named "StyrCan" while the PostgreSQL database is named `pulse_db`. There is only ONE PostgreSQL database (`pulse_db`) — no `styrcan_db` exists. The confusion is purely a naming issue between the workspace folder and the application. **No database consolidation is needed.** The single `pulse_db` PostgreSQL database and the `pulse_logs` MongoDB database are correctly separated by concern (relational data vs. documents/logs).

### 1.2 Missing Role-Based User Experience
The application has four roles defined in the backend (`super_admin`, `company_admin`, `manager`, `employee`), but the frontend treats all users identically:

- **No navigation filtering** — Every user sees every sidebar item (Finance, Payroll admin views, Employee management, etc.)
- **No conditional UI** — Action buttons like "Create Employee", "Process Payroll", "Approve PTO" are visible to all users
- **No "My Data" views** — Employees cannot view their own schedule, timesheets, pay stubs, or PTO balance
- **No User↔Employee linkage** — Login response doesn't include `employee_id`; seed data never links Users to Employees

### 1.3 Broken Role String References
Two backend files (`reports.py`, `websocket.py`) check for `"admin"` instead of `"company_admin"`, meaning those role checks never pass.

---

## 2. Role Definitions & Permissions Matrix

### 2.1 The Three Primary User Personas

| Role | Description | Created by |
|------|-------------|-----------|
| **Admin** (`company_admin`) | Registers the company. Full control over company settings, billing, payroll approval, and hiring. | Self-registration |
| **Manager** (`manager`) | Manages day-to-day employee operations: scheduling, PTO approval, payroll processing. Reports to admin. | Invited by Admin |
| **Employee** (`employee`) | Individual contributor. Views own data: schedule, time off, pay stubs, messages. | Invited by Admin or Manager |

> `super_admin` exists for platform-level operations and is not part of the company workflow. We preserve it but don't design UI around it.

### 2.2 Feature Access Matrix

| Feature Area | Employee | Manager | Admin |
|---|---|---|---|
| **Dashboard (Home)** | Personal summary (my shifts, my PTO, my pay) | Team overview + personal | Full company overview |
| **Employees → Directory** | View colleague list (limited fields) | Full directory + edit employees | Full directory + create/delete |
| **Employees → Schedule** | View MY shifts only | View/create/edit all shifts | View/create/edit all shifts |
| **Employees → Time Off** | View MY PTO balance, submit requests | View all + approve/deny PTO | View all + approve/deny PTO |
| **Employees → Reviews** | View MY reviews | Coming Soon | Coming Soon |
| **Payroll → Dashboard** | View MY pay stubs & history | Full payroll dashboard | Full payroll dashboard |
| **Payroll → Runs** | Hidden | Create & process runs | Create, process, approve, delete |
| **Payroll → History** | MY payroll history only | Full history | Full history |
| **Payroll → Tax Documents** | MY tax summary | Full tax overview | Full tax overview |
| **Payroll → By Employee** | Hidden | View all employee payroll | View all employee payroll |
| **Finance → All** | Hidden entirely | View-only access | Full CRUD |
| **Communication → Inbox** | Full access | Full access | Full access |
| **Communication → Threads** | Full access | Full access | Full access |
| **Communication → Broadcast** | Hidden | Send to own team | Send company-wide |
| **Communication → Files** | View/upload own files | Full access | Full access |
| **Settings → Profile** | Own profile | Own profile | Own profile |
| **Settings → Company** | Hidden | Hidden | Full access |
| **Settings → Security** | Own security | Own security | Own security |
| **Settings → Team** | Hidden | View team members | Full CRUD (invite, edit roles, deactivate) |
| **Settings → Billing** | Hidden | Hidden | Full access |
| **Reports** | Hidden | Limited reports | Full reports |

---

## 3. Technical Architecture Changes

### 3.1 Backend Changes

#### A. Fix User↔Employee Linkage in Login Response

**File:** `backend/app/schemas/auth.py`  
**Change:** Add `employee_id: Optional[str]` to `UserResponse`  

**File:** `backend/app/routers/auth.py`  
**Change:** On login/register, look up the linked Employee record and include `employee_id` in the response

#### B. Add "My Data" Endpoints

**File:** `backend/app/routers/employees.py`  
New endpoints:  
- `GET /api/employees/me` — Get current user's employee record  
- `GET /api/employees/me/schedule` — Get current user's shifts  
- `GET /api/employees/me/pto` — Get current user's PTO balance + requests  
- `GET /api/employees/me/payroll` — Get current user's payroll history  

These resolve User→Employee internally using the JWT `sub` claim.

#### C. Fix Broken Role Strings

**File:** `backend/app/routers/reports.py`  
**Change:** `"admin"` → `"company_admin"`  

**File:** `backend/app/routers/websocket.py`  
**Change:** `"admin"` → `"company_admin"`  

#### D. Fix Seed Data — Link Users to Employees

**File:** `backend/scripts/seed_market_readiness.py`  
**Change:** Create Employee records for User accounts and set `user_id` FK properly  

### 3.2 Frontend Changes

#### A. Extend Auth Store with Employee Context

**File:** `frontend/src/stores/auth-store.ts`  
**Change:** Store `employee_id` from login response  

**File:** `frontend/src/types/index.ts`  
**Change:** Add `employee_id?: string` to `User` type  

#### B. Create Role-Aware Navigation Hook

**File:** `frontend/src/hooks/use-role-access.ts` (NEW)  
A hook that returns:
- `role` — Current user's role
- `isAdmin` / `isManager` / `isEmployee` — Boolean helpers
- `canAccess(feature)` — Check if current role can access a feature
- `employeeId` — Current user's linked employee ID

#### C. Filter Navigation by Role

**Files:** All layout files (employees, payroll, finance, communication, settings)  
**Change:** Conditionally render sidebar items based on role:
- Employees see only items marked for their role
- Navigation items hidden by role are simply not rendered (no broken links)

#### D. Create Employee Self-Service Views

These are **role-conditional views within existing pages** — not separate routes. When an employee navigates to `/employees/schedule`, they see THEIR schedule. When a manager navigates to the same URL, they see the full team schedule.

| Page | Employee View | Manager/Admin View |
|------|--------------|-------------------|
| `/employees` | My profile card, my upcoming shifts, my PTO balance | Existing dashboard (unchanged) |
| `/employees/schedule` | My weekly schedule (read-only) | Full schedule grid + create/edit/delete |
| `/employees/pto` | My PTO balance + submit request | All PTO requests + approve/deny |
| `/payroll` | My recent pay stubs, YTD earnings | Existing payroll dashboard |
| `/payroll/history` | My payroll history only | Full history |
| `/payroll/taxes` | My tax withholding summary | Full tax overview |

#### E. Conditional Action Buttons

On pages shared between roles, action buttons (Create, Edit, Delete, Approve) are conditionally rendered:
- Employees: No admin/manager action buttons visible
- Managers: See management actions, but not admin-only actions (like delete employee)
- Admins: See everything

---

## 4. Implementation Sequence

### Phase 1: Backend Foundation ✅
- [x] Fix broken role strings in `reports.py` and `websocket.py`
- [x] Add `employee_id` to login/register response
- [x] Add `GET /api/employees/me` endpoint
- [x] Add `GET /api/employees/me/schedule` endpoint  
- [x] Add `GET /api/employees/me/pto` endpoint
- [x] Add `POST /api/employees/me/pto-requests` endpoint
- [x] Add `GET /api/employees/me/payroll` endpoint
- [x] Fix seed data to link Users↔Employees

### Phase 2: Frontend Infrastructure ✅
- [x] Add `employee_id` to `User` type and auth store
- [x] Create `useRoleAccess` hook with feature permissions matrix
- [x] Create `RoleGate` component for conditional rendering
- [x] Add API client methods for `/me` endpoints
- [x] Add self-service response types (MyProfileResponse, MyScheduleResponse, etc.)

### Phase 3: Navigation Filtering ✅
- [x] Filter employees sidebar by role (employee vs manager+)
- [x] Filter payroll sidebar by role (employee vs admin+)
- [x] Filter finance sidebar by role (manager+ only)
- [x] Filter communication sidebar by role (broadcasts manager+)
- [x] Filter settings sidebar by role (company/team/billing admin+)
- [x] Filter top header navigation by role
- [x] Filter home dashboard service cards by role

### Phase 4: Employee Self-Service Views ✅
- [x] My Profile component (employee info, PTO balance, upcoming shifts)
- [x] My Schedule view (weekly calendar with navigation)
- [x] My PTO view (balance cards + request form + history)
- [x] My Pay Stubs view (pay history, YTD summary, year filter)

### Phase 5: Dual-View Page Integration ✅
- [x] `/employees` — Employee sees MyProfile, manager+ sees admin dashboard
- [x] `/employees/schedule` — Employee sees MySchedule, manager+ sees team schedule
- [x] `/employees/pto` — Employee sees MyPTO, manager+ sees PTO management
- [x] `/payroll` — Employee sees MyPayStubs, manager+ sees payroll dashboard
- [x] Home page — Employee sees filtered cards & personal message

### Phase 6: Pending (Future)
- [ ] Manager team view refinements (team-scoped data)
- [ ] PTO approval notification workflow
- [ ] Payroll approval gate for admins
- [ ] Employee directory role-based field visibility

### Phase 7: Verification 🔲
- [ ] Frontend build passes
- [ ] All role scenarios manually tested
- [ ] MongoDB verified intact

---

## 5. Files Modified Tracker

| File | Change | Status |
|------|--------|--------|
| `backend/app/routers/reports.py` | Fix `"admin"` → `"company_admin"` | ✅ |
| `backend/app/routers/websocket.py` | Fix `"admin"` → `"company_admin"` | ✅ |
| `backend/app/schemas/auth.py` | Add `employee_id` to `UserResponse` | ✅ |
| `backend/app/routers/auth.py` | Include `employee_id` in login response | ✅ |
| `backend/app/routers/employees.py` | Add `/me` endpoints (6 new) | ✅ |
| `backend/scripts/seed_market_readiness.py` | Link Users↔Employees (8 users, 8 employees) | ✅ |
| `frontend/src/types/index.ts` | Add `employee_id` + self-service types | ✅ |
| `frontend/src/stores/auth-store.ts` | Already stores full user (no change needed) | ✅ |
| `frontend/src/hooks/use-role-access.ts` | NEW — Role access hook (21 features) | ✅ |
| `frontend/src/components/role-gate.tsx` | NEW — Conditional render component | ✅ |
| `frontend/src/lib/api/client.ts` | Add 5 `/me` API methods | ✅ |
| `frontend/src/components/employee/my-profile.tsx` | NEW — Employee profile view | ✅ |
| `frontend/src/components/employee/my-schedule.tsx` | NEW — Employee schedule view | ✅ |
| `frontend/src/components/employee/my-pto.tsx` | NEW — Employee PTO view | ✅ |
| `frontend/src/components/employee/my-paystubs.tsx` | NEW — Employee pay stubs view | ✅ |
| `frontend/src/app/(services)/employees/layout.tsx` | Role-filter sidebar | ✅ |
| `frontend/src/app/(services)/payroll/layout.tsx` | Role-filter sidebar | ✅ |
| `frontend/src/app/(services)/finance/layout.tsx` | Role-filter sidebar | ✅ |
| `frontend/src/app/(services)/communication/layout.tsx` | Role-filter sidebar | ✅ |
| `frontend/src/app/(settings)/settings/layout.tsx` | Role-filter sidebar | ✅ |
| `frontend/src/components/layout/service-header.tsx` | Role-filter top nav | ✅ |
| `frontend/src/app/(services)/employees/page.tsx` | Dual view: employee/admin | ✅ |
| `frontend/src/app/(services)/employees/schedule/page.tsx` | Dual view | ✅ |
| `frontend/src/app/(services)/employees/pto/page.tsx` | Dual view | ✅ |
| `frontend/src/app/(services)/payroll/page.tsx` | Dual view | ✅ |
| `frontend/src/app/page.tsx` | Role-filtered cards + personalized welcome | ✅ |

---

## 6. Database Confirmation

### PostgreSQL
- **Single database:** `pulse_db` on port 5432 (Docker) / 5433 (local)
- **No consolidation needed** — there is no second database
- **11 tables:** companies, users, employees, pto_balances, pto_requests, shifts, payroll_runs, payroll_items, expense_categories, transactions, messages

### MongoDB  
- **Database:** `pulse_logs` 
- **6 collections:** audit_logs, chat_messages, notifications, analytics_events, document_metadata, application_logs
- **Purpose:** Logging, messaging, notifications, file metadata — correctly separated from relational data
- **Status:** No changes needed — MongoDB remains intact

---

## 7. Design Principles (Preserved)

- **No layout/style changes** — Existing shadcn/ui components, color scheme, typography, spacing all preserved
- **Same page routes** — No new URLs; role determines what CONTENT appears on existing pages
- **Progressive disclosure** — Employees see a simpler, focused view; managers see more; admins see everything
- **Graceful degradation** — If employee_id linkage is missing, show a helpful "Contact your admin" message instead of errors
- **Backend is source of truth** — Frontend filtering is a UX convenience; real authorization remains server-side
