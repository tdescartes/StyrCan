# Pulse — Complete Product Specification

> **Version:** 1.0.0
> **Date:** February 6, 2026
> **Purpose:** Definitive reference for every feature, business rule, user interaction, and data flow in the Pulse platform.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Platform Architecture](#3-platform-architecture)
4. [Authentication & Onboarding](#4-authentication--onboarding)
5. [Employees Service](#5-employees-service)
6. [Finance Service](#6-finance-service)
7. [Payroll Service](#7-payroll-service)
8. [Communication Service](#8-communication-service)
9. [Settings & Administration](#9-settings--administration)
10. [Dashboard & Analytics](#10-dashboard--analytics)
11. [Subscription & Billing](#11-subscription--billing)
12. [Real-Time Events & Notifications](#12-real-time-events--notifications)
13. [Cross-Service Business Logic](#13-cross-service-business-logic)
14. [Security Model](#14-security-model)
15. [Error Handling & Rate Limiting](#15-error-handling--rate-limiting)
16. [Data Model Reference](#16-data-model-reference)
17. [Technology Stack](#17-technology-stack)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)

---

## 1. Product Overview

### 1.1 What Is Pulse?

Pulse is a **SaaS business management platform** designed for small-to-medium businesses (5–50+ employees). It unifies employee management, financial tracking, payroll processing, and team communication into a single web application — eliminating the need for multiple disconnected tools.

### 1.2 Problem Statement

Small business owners juggle separate tools for HR, accounting, payroll, and messaging. This leads to:

- **Data silos** — employee records in one app, salary data in another, communication in a third.
- **Manual reconciliation** — transferring numbers between spreadsheets and systems.
- **Missed compliance** — forgotten tax filings, unapproved PTO, scheduling gaps.
- **Cost overhead** — paying for 4–6 different subscriptions when one platform could serve all needs.

### 1.3 Solution

Pulse replaces the patchwork with **four integrated service packages** plus global settings:

| Service           | Purpose                          | Key Benefit                                  |
| ----------------- | -------------------------------- | -------------------------------------------- |
| **Employees**     | Staff records, scheduling, PTO   | Single source of truth for all HR data       |
| **Finance**       | Cash flow, transactions, budgets | Real-time visibility into company finances   |
| **Payroll**       | Salary calculations, payments    | Automated payroll linked to employee records |
| **Communication** | Messaging, broadcasts            | Secure internal communication hub            |
| **Settings**      | Profile, company config, billing | Centralized administration                   |

### 1.4 Target Users

| Business Type     | Size             | Examples                     |
| ----------------- | ---------------- | ---------------------------- |
| Startups          | 2–10 employees   | Tech startups, agencies      |
| Small Businesses  | 10–50 employees  | Restaurants, retail, clinics |
| Growing Companies | 50–200 employees | Regional firms, franchises   |

### 1.5 Two-Site Architecture

Pulse operates across two web properties:

| Site               | URL               | Purpose                        | Technology             |
| ------------------ | ----------------- | ------------------------------ | ---------------------- |
| **Marketing Site** | `pulse.com`     | Landing page, pricing, contact | Eleventy (SSG) + Nginx |
| **Application**    | `use.pulse.com` | The full SaaS product          | Next.js 14 + FastAPI   |

---

## 2. User Roles & Permissions

### 2.1 Role Hierarchy

```
Owner (super_admin)
  └── Admin (company_admin)
        └── Manager
              └── Employee
```

### 2.2 Role Definitions

#### Owner / Super Admin

- **Who:** The person who registers the company on Pulse.
- **Created:** Automatically on company registration.
- **Capabilities:** Full control over everything — billing, settings, all services, user management. Can delete the company.
- **Limit:** One per company (the founding account).

#### Admin (Company Admin)

- **Who:** Trusted senior staff promoted by the Owner.
- **Created:** Invited by the Owner via Settings → Users.
- **Capabilities:** Everything the Owner can do **except** deleting the company or changing the subscription plan. Can manage users, approve payroll, manage finances.
- **Typical persona:** COO, Office Manager, HR Director.

#### Manager

- **Who:** Department leads or team supervisors.
- **Created:** Invited by an Admin or Owner.
- **Capabilities:**
  - **Employees:** View all employees, manage their department, approve PTO for their team, create shifts.
  - **Finance:** View transactions, create transactions, view dashboards.
  - **Payroll:** View payroll runs and history (cannot process or approve).
  - **Communication:** Send messages, view threads, send broadcasts (if Professional+).
  - **Settings:** Update own profile, change own password. Cannot access company settings, billing, or user management.
- **Typical persona:** Engineering Manager, Sales Team Lead, Shift Supervisor.

#### Employee

- **Who:** Regular staff members.
- **Created:** Invited by a Manager, Admin, or Owner.
- **Capabilities:**
  - **Employees:** View own profile, submit PTO requests, view own schedule.
  - **Finance:** No access (hidden from navigation).
  - **Payroll:** View own payroll history and pay stubs.
  - **Communication:** Send/receive direct messages, participate in group threads.
  - **Settings:** Update own profile, change own password, set notification preferences.
- **Typical persona:** Developer, Sales Rep, Barista.

### 2.3 Permission Matrix

| Action                  | Owner | Admin |    Manager    | Employee |
| ----------------------- | :---: | :---: | :-----------: | :------: |
| **EMPLOYEES**           |       |       |               |          |
| View all employees      |  ✅   |  ✅   |      ✅       |    ❌    |
| View own profile        |  ✅   |  ✅   |      ✅       |    ✅    |
| Create/edit employees   |  ✅   |  ✅   | ✅ (own dept) |    ❌    |
| Delete employees        |  ✅   |  ✅   |      ❌       |    ❌    |
| Approve PTO             |  ✅   |  ✅   | ✅ (own team) |    ❌    |
| Submit PTO              |  ✅   |  ✅   |      ✅       |    ✅    |
| Create shifts           |  ✅   |  ✅   |      ✅       |    ❌    |
| Export employee CSV     |  ✅   |  ✅   |      ✅       |    ❌    |
| **FINANCE**             |       |       |               |          |
| View finance dashboard  |  ✅   |  ✅   |      ✅       |    ❌    |
| Create transactions     |  ✅   |  ✅   |      ✅       |    ❌    |
| Delete transactions     |  ✅   |  ✅   |      ❌       |    ❌    |
| Manage categories       |  ✅   |  ✅   |      ❌       |    ❌    |
| Manage budgets          |  ✅   |  ✅   |      ❌       |    ❌    |
| **PAYROLL**             |       |       |               |          |
| View payroll dashboard  |  ✅   |  ✅   |      ✅       |    ❌    |
| Create payroll run      |  ✅   |  ✅   |      ❌       |    ❌    |
| Process payroll         |  ✅   |  ✅   |      ❌       |    ❌    |
| View own pay stubs      |  ✅   |  ✅   |      ✅       |    ✅    |
| **COMMUNICATION**       |       |       |               |          |
| Send direct messages    |  ✅   |  ✅   |      ✅       |    ✅    |
| Create group threads    |  ✅   |  ✅   |      ✅       |    ✅    |
| Send broadcasts         |  ✅   |  ✅   |      ✅       |    ❌    |
| **SETTINGS**            |       |       |               |          |
| Edit own profile        |  ✅   |  ✅   |      ✅       |    ✅    |
| Manage company settings |  ✅   |  ✅   |      ❌       |    ❌    |
| Manage users            |  ✅   |  ✅   |      ❌       |    ❌    |
| Manage billing          |  ✅   |  ❌   |      ❌       |    ❌    |
| Change theme            |  ✅   |  ✅   |      ✅       |    ✅    |

---

## 3. Platform Architecture

### 3.1 System Layers

```
┌─────────────────────────────────────────────────────────┐
│               MARKETING LAYER (pulse.com)              │
│   Eleventy Static Site · Nunjucks · CSS                  │
│   Landing Page · Pricing · About · Contact               │
└──────────────────────────┬──────────────────────────────┘
                           │ Link to "Get Started"
┌──────────────────────────▼──────────────────────────────┐
│              APPLICATION LAYER (use.pulse.com)          │
│   Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui     │
│   React Query · Zustand · React Hook Form · Zod          │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API + WebSocket
┌──────────────────────────▼──────────────────────────────┐
│                   API LAYER (FastAPI)                     │
│   Auth Service · Employees · Finance · Payroll           │
│   Communication · Dashboard · Settings · Notifications   │
│   JWT + RBAC · Feature Gating Middleware                  │
└──────────────────────────┬──────────────────────────────┘
                           │ ORM / ODM
┌──────────────────────────▼──────────────────────────────┐
│                     DATA LAYER                           │
│   PostgreSQL 16   │   MongoDB 7   │   Redis 7            │
│   Users, Employees│   Messages,   │   Sessions,          │
│   Finance, Payroll│   Threads,    │   Caching,           │
│   Companies, PTO  │   Broadcasts  │   Rate Limits        │
└───────────────────┴───────────────┴─────────────────────┘
```

### 3.2 Frontend Service-Oriented Routing

Each service module is a self-contained package with its own layout, sidebar, dashboard, and sub-pages:

```
/                           → Home (service selector cards)
├── /employees              → Employees Dashboard
│   ├── /employees/directory→ Employee list + CRUD
│   ├── /employees/schedule → Shift calendar
│   └── /employees/pto      → PTO requests
├── /finance                → Finance Dashboard
│   ├── /finance/ledger     → Transaction list
│   └── /finance/categories → Category management
├── /payroll                → Payroll Dashboard
│   ├── /payroll/runs       → Payroll run management
│   ├── /payroll/history    → Past runs
│   └── /payroll/employees  → Per-employee breakdown
├── /communication          → Communication Dashboard
│   ├── /communication/inbox→ Chat UI
│   └── /communication/threads → Thread history
├── /settings               → Settings overview
│   ├── /settings/profile
│   ├── /settings/company
│   ├── /settings/security
│   ├── /settings/notifications
│   ├── /settings/appearance
│   └── /settings/billing
└── /(auth)
    ├── /login
    ├── /register
    └── /forgot-password
```

### 3.3 Navigation Model

**Global Header** (persistent across all pages):

```
┌──────────────────────────────────────────────────────────────┐
│ 🏢 Pulse [PLAN]  [Employees] [Finance] [Payroll] [Comms]  🔔 👤 ⚙️ │
└──────────────────────────────────────────────────────────────┘
```

- **Service Tabs:** Highlight the active service. Clicking switches the entire context.
- **Bell Icon (🔔):** Opens notification dropdown showing recent notifications.
- **Avatar (👤):** Opens user menu (Profile, Log Out).
- **Gear (⚙️):** Links to `/settings`.

**Service Sidebars** (each service has its own):

| Employees Sidebar | Finance Sidebar | Payroll Sidebar | Communication Sidebar |
| ----------------- | --------------- | --------------- | --------------------- |
| Dashboard         | Dashboard       | Dashboard       | Dashboard             |
| Directory         | Ledger          | Payroll Runs    | Inbox                 |
| Schedule          | Budget          | History         | Broadcasts            |
| Time Off          | Reports         | Tax Documents   | Threads               |
| Reviews           | Categories      | By Employee     | Files                 |

---

## 4. Authentication & Onboarding

### 4.1 Registration Flow

**User Journey:** Visitor → `pulse.com` → "Get Started" → `/register`

**Step-by-step:**

1. **User fills the registration form:**
   - Company name
   - Admin first name, last name
   - Admin email address
   - Password (min 8 chars, at least 1 uppercase, 1 number, 1 special character)
   - Selected plan (Standard / Professional / Enterprise)

2. **Backend processing (`POST /api/auth/register`):**
   - Validate all fields (Pydantic schema enforcement)
   - Check email uniqueness across all companies
   - Hash password using bcrypt with salt
   - Create `Company` record (generates UUID, sets `status: active`)
   - Create `User` record (role: `admin`, linked to company)
   - Create initial `PTOBalance` record for the admin user (20 days for current year)
   - Generate JWT access token (15-minute TTL) and refresh token (7-day TTL)
   - Return user, company, and tokens

3. **Frontend post-registration:**
   - Store tokens in Zustand auth store (persisted to localStorage)
   - Redirect to `/` (home / service selector)
   - Show onboarding prompt: "Welcome! Start by adding your first employee."

**Business Rules:**

- One admin is created per registration — this user becomes the `owner`.
- Company names do not need to be globally unique (scoped by ID).
- Emails must be globally unique (one account per email across all companies).
- Password reset tokens expire after 1 hour.

### 4.2 Login Flow

**User Journey:** `/login` → enters email + password → redirected to `/`

**Step-by-step:**

1. **User enters credentials on the login page.**
2. **Backend processing (`POST /api/auth/login`):**
   - Look up user by email.
   - If not found → `401 Unauthorized` with generic message ("Invalid credentials").
   - If found → verify password hash using bcrypt.
   - If invalid → `401 Unauthorized`.
   - If valid → update `last_login` timestamp, generate tokens.
   - Return user data (id, email, name, role, avatar), company data (id, name, subscription), tokens.
3. **Frontend post-login:**
   - Store tokens and user data in Zustand auth store.
   - Set API client authorization header.
   - Redirect to `/` (or to the page the user was trying to access before being redirected to login).

**Remember Me:** If `remember_me: true`, the refresh token gets a 30-day TTL instead of 7 days.

### 4.3 Token Lifecycle

```
User logs in
  → Access Token (15 min TTL)
  → Refresh Token (7 days TTL, or 30 days with "remember me")

Access Token expires
  → Frontend detects 401 response
  → Calls POST /api/auth/refresh with refresh token
  → Receives new access + refresh tokens
  → Retries the failed request transparently

Refresh Token expires
  → User is logged out
  → Redirected to /login
```

**Business Rules:**

- Access tokens contain: `user_id`, `company_id`, `role`, `exp`, `type: "access"`.
- Refresh tokens contain: `user_id`, `exp`, `type: "refresh"`.
- Tokens are signed with HS256 using a server-side secret key.
- Token refresh returns BOTH a new access token and a new refresh token (token rotation).

### 4.4 Password Reset Flow

1. **User clicks "Forgot Password" on the login page.**
2. **User enters their email (`POST /api/auth/forgot-password`):**
   - Backend always responds with `"If the email exists, a reset link has been sent."` (prevents email enumeration).
   - If email exists: generate a password reset token (UUID), store it with a 1-hour expiry, send email with reset link.
3. **User clicks the link in email → `/reset-password?token=...`**
4. **User enters new password + confirmation (`POST /api/auth/reset-password`):**
   - Backend validates token, checks expiry.
   - Hashes new password, updates user record, invalidates the reset token.
   - User is redirected to login with a success message.

### 4.5 Password Change (Authenticated)

- Logged-in users can change their password from Settings → Security.
- Requires current password verification before accepting the new password.
- API: `POST /api/auth/change-password` with `{ current_password, new_password }`.

---

## 5. Employees Service

### 5.1 Overview

The Employees Service is the central HR hub where all staff data lives. It feeds into Payroll (salary figures), Communication (recipient directory), and the global Dashboard (headcount KPIs).

**Backend Router:** `/api/employees`, `/api/schedules`, `/api/pto`
**Frontend Route:** `/employees/*`

### 5.2 Employee Dashboard

**Route:** `/employees`
**API:** `GET /api/employees/dashboard`

**What the user sees:**

| KPI Card             | Data                                                                 | Business Logic                                                      |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Total Employees      | Count of all employee records for the company                        | `SELECT COUNT(*) FROM employees WHERE company_id = ?`               |
| Active Employees     | Count where `status = 'active'`                                      | Excludes inactive and terminated                                    |
| On Leave             | Count of employees with approved PTO that overlaps today             | PTO start_date ≤ today AND end_date ≥ today AND status = 'approved' |
| New Hires This Month | Count where `hire_date` is in the current month                      | Highlights recent growth                                            |
| Pending PTO Requests | Count where `status = 'pending'`                                     | Alerts managers to take action                                      |
| Open Shifts          | Count where `shift_date` is in the future and `status = 'scheduled'` | Shows upcoming scheduling needs                                     |

**Additional dashboard sections:**

- **Recent Hires:** List of last 5 employees added (name, department, hire date, avatar).
- **PTO Alerts:** Pending PTO requests awaiting approval (employee name, type, dates).
- **Upcoming Birthdays:** Next 5 employee birthdays (if birthday field is populated).
- **Department Breakdown:** Pie chart showing employee count per department.

**User Interaction:**

1. Manager opens `/employees` → sees KPIs at the top.
2. Notices "3 Pending PTO Requests" → clicks the card → redirected to `/employees/pto`.
3. Sees department breakdown chart → understands team distribution.

### 5.3 Employee Directory

**Route:** `/employees/directory`
**API:** `GET /api/employees`, `POST /api/employees`, `PUT /api/employees/:id`, `DELETE /api/employees/:id`

#### Listing & Filtering

The directory displays a paginated table of all employees with:

| Column     | Description                                      |
| ---------- | ------------------------------------------------ |
| Name       | First + last name with avatar                    |
| Email      | Work email address                               |
| Department | Engineering, Sales, Marketing, etc.              |
| Position   | Job title                                        |
| Status     | Active / Inactive / On Leave (color-coded badge) |
| Hire Date  | When they joined                                 |
| Actions    | Edit, Delete buttons                             |

**Filters available:**

- **Search bar:** Searches across first name, last name, and email (case-insensitive).
- **Department dropdown:** Filter by specific department.
- **Status dropdown:** Active, Inactive, On Leave.
- **Sort:** By name (A–Z or Z–A), hire date (newest/oldest), department.

**Pagination:** 20 employees per page, with page navigation.

#### Creating an Employee

**User Interaction:**

1. Admin/Manager clicks "Add Employee" button.
2. A dialog/modal opens with a form.
3. Required fields: First Name, Last Name, Email, Hire Date.
4. Optional fields: Phone, Department, Position, Employment Type (Full-time/Part-time/Contract), Salary Amount.
5. User fills the form and clicks "Create."
6. Backend validates (email uniqueness within company, valid dates).
7. Creates the `Employee` record + initializes a `PTOBalance` record (20 days vacation, 10 sick days for current year).
8. Employee appears in the directory. A toast notification confirms "Employee created successfully."

**Business Rules:**

- Email must be unique within the company (not globally — different companies can have the same employee email).
- Hire date cannot be in the future (more than 90 days from today).
- Salary amount, if provided, is stored as a decimal with 2-digit precision.
- When an employee is created, a PTO balance is automatically initialized for the current year.
- Default employment type is "full-time" if not specified.

#### Updating an Employee

1. User clicks "Edit" on an employee row.
2. A pre-filled form opens in a dialog.
3. User modifies fields and clicks "Save."
4. Backend validates and updates the record.
5. `updated_at` timestamp is refreshed.

**Business Rules:**

- Changing an employee's status to "terminated" does not delete the record (soft status change).
- Terminated employees are excluded from payroll runs but their historical data remains.
- Changing salary updates the amount for future payroll runs (does not retroactively affect completed runs).

#### Deleting an Employee

1. User clicks "Delete" → confirmation dialog appears.
2. "Are you sure you want to delete [Employee Name]? This action cannot be undone."
3. On confirmation → `DELETE /api/employees/:id` is called.
4. Backend cascades: deletes PTO balances, PTO requests, shifts, and payroll items for that employee.
5. Employee disappears from the directory.

**Business Rules:**

- Only Admins and Owners can delete employees.
- Managers can deactivate (change status to inactive) but not delete.
- Deletion is permanent — historical payroll data associated with this employee is also removed.

#### CSV Export

- **Button:** "Export CSV" in the directory toolbar.
- **API:** `GET /api/employees/export`
- **Output:** Downloads a `.csv` file containing all employee records for the company.
- **Columns:** First Name, Last Name, Email, Phone, Department, Position, Status, Hire Date, Employment Type, Salary.
- **Business Rule:** Export includes ALL employees (regardless of current filters). Respects company scope — only exports employees belonging to the current user's company.

### 5.4 Shift Scheduling

**Route:** `/employees/schedule`
**API:** `GET /api/schedules`, `POST /api/schedules`, `PUT /api/schedules/:id`, `DELETE /api/schedules/:id`, `GET /api/schedules/calendar`

#### Calendar View

The schedule page displays a **weekly or monthly calendar** showing all shifts for the company.

**Each shift block shows:**

- Employee name
- Start time — End time
- Status badge (Scheduled / Completed / Missed / Cancelled)
- Notes (if any)

**Filters:**

- Date range (start_date, end_date)
- Employee (filter by specific employee)
- Department (filter by department)

#### Creating a Shift

1. User clicks on a date in the calendar or clicks "Create Shift" button.
2. Form fields: Employee (dropdown), Shift Date, Start Time, End Time, Notes.
3. Backend validates: employee exists, belongs to company, dates are logical (end > start).
4. Shift is created with `status: "scheduled"`.

**Business Rules:**

- A shift cannot overlap with another shift for the same employee on the same date.
- Shifts can only be created for active employees.
- Shift dates in the past are allowed (for retroactive record-keeping).
- When a shift's date passes and status is still "scheduled," it remains scheduled until manually updated to "completed" or "missed."

#### Updating / Cancelling Shifts

- Edit: Change times, employee, notes, status.
- Cancel: Set status to "cancelled" — the shift remains in history but is visually struck through.
- Complete: Set status to "completed" — used for time tracking.

#### Auto-Assign (Professional+ Only)

- **API:** `POST /api/schedules/auto-assign`
- **Feature-gated:** Only available on Professional and Enterprise plans.
- **Business Logic:** Automatically distributes shifts among available employees based on department needs, availability (no PTO conflicts), and equitable distribution.
- **Standard plan users** see a lock icon and "Upgrade to Professional" prompt instead.

### 5.5 PTO (Paid Time Off) Management

**Route:** `/employees/pto`
**API:** `GET /api/pto`, `POST /api/pto`, `PUT /api/pto/:id`, `PUT /api/pto/:id/approve`, `PUT /api/pto/:id/reject`, `GET /api/pto/balances`

#### PTO Balances

Every employee has a `PTOBalance` record per year tracking:

| Field            | Description                            | Default |
| ---------------- | -------------------------------------- | ------- |
| `total_days`     | Total PTO days allocated for the year  | 20      |
| `used_days`      | Days consumed by approved PTO requests | 0       |
| `available_days` | `total_days - used_days`               | 20      |

**Business Rules:**

- Balances are created per calendar year.
- When a new year starts, a new balance record is created (admin can customize total_days).
- Unused days do NOT carry over by default (configurable in future version).

#### Submitting a PTO Request

**User Interaction (Employee or Manager):**

1. Navigate to `/employees/pto` → click "Request Time Off."
2. Fill in: Type (Vacation / Sick / Personal / Bereavement / Other), Start Date, End Date, Reason (optional).
3. Click "Submit."

**Backend Processing:**

1. Calculate `days_requested` = business days between start and end dates (excluding weekends).
2. Check PTO balance: `available_days >= days_requested`. If insufficient → `400 Bad Request: "Insufficient PTO balance."`.
3. Create `PTORequest` with `status: "pending"`.
4. Send notification to the employee's manager(s) and admins.

**Business Rules:**

- Start date must be today or in the future.
- End date must be >= start date.
- Employees cannot have overlapping approved PTO requests.
- Pending requests do NOT deduct from the balance (only approved ones do).

#### Approving / Rejecting PTO

**User Interaction (Manager/Admin):**

1. Navigate to `/employees/pto` → see list of pending requests.
2. Click "Approve" or "Reject" on a request.
3. Optionally add a note (e.g., "Approved — enjoy your vacation!").

**Backend Processing (Approve):**

1. Set `status: "approved"`, `reviewed_by`, `reviewed_at`.
2. Deduct `days_requested` from the employee's PTO balance (`used_days += days_requested`, `available_days -= days_requested`).
3. Send notification to the employee: "Your PTO request has been approved."

**Backend Processing (Reject):**

1. Set `status: "denied"`, `reviewed_by`, `reviewed_at`.
2. Balance is NOT affected.
3. Send notification to the employee: "Your PTO request was denied."

**Business Rules:**

- Only users with `pto:approve` permission (Managers, Admins, Owners) can approve/reject.
- Managers can only approve PTO for employees in their department.
- Admins/Owners can approve PTO for any employee.
- An approved PTO request cannot be re-rejected (must be cancelled and a new request submitted).
- If an employee's PTO balance goes to 0, further requests are rejected automatically.

---

## 6. Finance Service

### 6.1 Overview

The Finance Service provides real-time visibility into company cash flow, expense tracking, and budget management. It serves as the financial record-keeping system for the business.

**Backend Router:** `/api/transactions`, `/api/finance`
**Frontend Route:** `/finance/*`

### 6.2 Finance Dashboard

**Route:** `/finance`
**API:** `GET /api/finance/dashboard`

**KPIs Displayed:**

| KPI            | Calculation                                 | Period           |
| -------------- | ------------------------------------------- | ---------------- |
| Total Revenue  | Sum of all `income` transactions in period  | Current month    |
| Total Expenses | Sum of all `expense` transactions in period | Current month    |
| Net Profit     | Revenue - Expenses                          | Current month    |
| Profit Margin  | (Net Profit / Revenue) × 100                | Current month    |
| Revenue Change | % change vs. previous period                | Month-over-month |
| Expense Change | % change vs. previous period                | Month-over-month |
| YTD Revenue    | Sum of income transactions since Jan 1      | Year to date     |
| YTD Expenses   | Sum of expense transactions since Jan 1     | Year to date     |

**Dashboard Sections:**

- **Revenue by Month chart:** Bar chart with monthly income for the last 6–12 months.
- **Expenses by Category:** Pie chart showing where money is spent (Payroll, Office, Software, Marketing, etc.).
- **Recent Transactions:** Last 5 transactions with type, amount, category, date.
- **Budget Alerts (Professional+):** Warnings when spending in a category exceeds 80% or 95% of the budget.
- **Cash Flow Summary:** Current balance, projected end-of-month balance, daily burn rate.

**User Interaction:**

1. Finance admin opens `/finance` → instantly sees how the company is performing.
2. Notices expense change is +15% → clicks "View Details" → goes to `/finance/ledger` with an expense filter pre-applied.
3. Sees a budget alert for "Marketing at 96%" → takes action to review marketing spend.

### 6.3 Transaction Ledger

**Route:** `/finance/ledger`
**API:** `GET /api/transactions`, `POST /api/transactions`, `PUT /api/transactions/:id`, `DELETE /api/transactions/:id`

#### Listing Transactions

Table view with columns:

| Column      | Description                                     |
| ----------- | ----------------------------------------------- |
| Date        | Transaction date                                |
| Description | What the transaction was for                    |
| Category    | Expense/income category (with color-coded icon) |
| Type        | Income (green) or Expense (red)                 |
| Amount      | Dollar amount formatted with 2 decimal places   |
| Created By  | User who recorded the transaction               |
| Actions     | Edit, Delete                                    |

**Filters:**

- **Type:** Income, Expense, or All.
- **Category:** Dropdown of company's expense categories.
- **Date Range:** Start date — End date picker.
- **Amount Range:** Min amount — Max amount.
- **Search:** Free-text search in description field.

**Pagination:** 20 transactions per page.

**Summary Row:** At the top of the list, shows total income, total expenses, and net for the currently filtered view.

#### Creating a Transaction

1. User clicks "Add Transaction."
2. Form fields:
   - **Type** (required): Income or Expense (toggle or radio).
   - **Amount** (required): Decimal number, positive.
   - **Description** (required): Free text, max 500 characters.
   - **Category** (optional): Select from company's categories.
   - **Transaction Date** (required): Date picker, defaults to today.
3. Click "Save."

**Backend Processing:**

1. Validate all fields.
2. Create `Transaction` record linked to company and creating user.
3. Transaction immediately reflects in dashboard KPIs.

**Business Rules:**

- Amount must be positive (the `type` field determines if it's income or expense).
- Transaction dates can be in the past (for back-dating entries) or today. Future dates are allowed for planned transactions.
- Each transaction is scoped to the company — users from different companies never see each other's data.
- The `created_by` field automatically captures the ID of the logged-in user.

#### Updating a Transaction

- All fields can be modified.
- `updated_at` timestamp is refreshed.
- Changes immediately reflect in dashboard calculations.

#### Deleting a Transaction

- Confirmation dialog required.
- Only Admins/Owners can delete.
- Hard delete — the record is permanently removed.
- Dashboard KPIs recalculate on next load.

### 6.4 Expense Categories

**Route:** `/finance/categories`
**API:** `GET /api/finance/categories`, `POST /api/finance/categories`

**Purpose:** Organize transactions into meaningful categories for reporting and budgeting.

**Default Categories (created on company registration):**

- Payroll
- Office & Supplies
- Software & Tools
- Marketing & Advertising
- Travel & Transportation
- Utilities
- Professional Services
- Miscellaneous

**Creating a Category:**

1. User clicks "Add Category."
2. Fields: Name (required), Description (optional), Budget Limit (optional, Professional+).
3. Category appears in the list and becomes available in transaction forms.

**Business Rules:**

- Category names must be unique within a company.
- Deleting a category does not delete associated transactions — they become "uncategorized."
- Budget limit (Professional+): Monthly spending cap for that category. When exceeded, triggers a warning on the dashboard.

### 6.5 Financial Trends

**API:** `GET /api/finance/trends`

Returns multi-month income/expense data for charting. Used by the finance dashboard to render:

- Line chart: Revenue trend over the last 6 months.
- Line chart: Expense trend over the last 6 months.
- Comparison: Current month vs. same month last year (if data exists).

### 6.6 Budget Management (Professional+)

**Feature-gated:** Requires Professional or Enterprise plan.

**Standard plan users:** See a locked card with "Upgrade to Professional to unlock Budget Planning."

**Functionality for Professional+:**

- Create budgets per category for a date range (e.g., Q1 2026).
- Set warning thresholds (80%) and critical thresholds (95%).
- Dashboard shows visual progress bars per category.
- Automatic alerts when spending approaches or exceeds limits.

---

## 7. Payroll Service

### 7.1 Overview

The Payroll Service handles salary calculations, tax deductions, payment processing, and pay history. It is deeply integrated with the Employees Service (pulling salary data) and the Finance Service (creating expense transactions on payroll completion).

**Backend Router:** `/api/payroll`
**Frontend Route:** `/payroll/*`

### 7.2 Payroll Dashboard

**Route:** `/payroll`
**API:** `GET /api/payroll/dashboard`

**KPIs Displayed:**

| KPI                   | Description                                    | Calculation                                               |
| --------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| Next Payroll Date     | The `period_end` of the next draft/pending run | Nearest future payroll run                                |
| Days Until Payroll    | Calendar days until next payroll date          | `next_payroll_date - today`                               |
| Estimated Gross       | Total gross pay for the upcoming run           | Sum of all active employees' base salaries for the period |
| Estimated Net         | Gross minus estimated deductions               | Gross × 0.76 (estimate)                                   |
| YTD Payroll Total     | Total payroll paid year-to-date                | Sum of all completed payroll run amounts since Jan 1      |
| Employees in Next Run | Count of active employees                      | `SELECT COUNT(*) FROM employees WHERE status = 'active'`  |

**Dashboard Sections:**

- **Upcoming Run:** Card showing the next payroll run details (period, pay date, status, estimated total).
- **Recent Runs:** Last 3 completed payroll runs with gross/net totals.
- **Pending Items:** Any adjustments (bonuses, deductions) that need to be added to the next run.

### 7.3 Payroll Run Lifecycle

A payroll run progresses through these statuses:

```
Draft → Processing → Completed
                  └→ Failed
```

| Status         | Description                                                    | Who Can Trigger               |
| -------------- | -------------------------------------------------------------- | ----------------------------- |
| **Draft**      | Run is created but not yet processed. Adjustments can be made. | Admin/Owner creates the run   |
| **Processing** | Run is being calculated. No further edits allowed.             | Admin/Owner clicks "Process"  |
| **Completed**  | All calculations done, payments recorded.                      | System (automatic on success) |
| **Failed**     | Processing encountered an error. Can be retried.               | System (automatic on error)   |

### 7.4 Creating a Payroll Run

**User Interaction:**

1. Admin navigates to `/payroll/runs` → clicks "Create Payroll Run."
2. Form fields:
   - **Period Start** (required): Start date of the pay period.
   - **Period End** (required): End date of the pay period.
   - **Pay Date** (defaults to period end): The actual date employees get paid.
3. Click "Create."

**Backend Processing:**

1. Create `PayrollRun` with `status: "draft"`.
2. Automatically generate `PayrollItem` records for every active employee:
   - `base_salary` = employee's current salary (prorated if needed).
   - `overtime_hours` = 0 (admin can adjust).
   - `bonuses` = 0 (admin can adjust).
   - `deductions` = 0 (admin can adjust).
3. Run appears in the list as "Draft."

**Business Rules:**

- Pay periods cannot overlap with existing runs.
- Only active employees are included.
- Terminated employees are excluded even if they were active during part of the period.

### 7.5 Processing a Payroll Run

**User Interaction:**

1. Admin reviews the draft run, makes adjustments (bonuses, overtime, deductions) per employee.
2. Clicks "Process Payroll."
3. Confirmation dialog: "Are you sure? This will calculate pay for [N] employees."

**Backend Processing (`POST /api/payroll/runs/:id/process`):**

For each `PayrollItem` in the run:

```
1. gross_pay = base_salary + (overtime_hours × (base_salary / 160) × overtime_rate) + bonuses
2. tax_amount = gross_pay × 0.20  (simplified 20% tax rate)
3. total_deductions = tax_amount + deductions
4. net_amount = gross_pay - total_deductions
```

Where:

- `overtime_rate` = 1.5 (configurable per company in the future)
- `base_salary / 160` = hourly rate estimate (40 hours/week × 4 weeks)
- `0.20` = simplified flat tax rate (future: integrate with actual tax tables)

After all items are calculated:

- Sum totals: `total_gross`, `total_deductions`, `total_net`.
- Update `PayrollRun.total_amount = total_net`.
- Set `PayrollRun.status = "completed"`.
- Set `PayrollRun.processed_by` and `PayrollRun.processed_at`.

**Cross-Service Effect:**

- On completion, a **Finance Transaction** is automatically created with:
  - `type: "expense"`
  - `category: "Payroll"`
  - `amount: total_gross`
  - `description: "Payroll run [period_start] to [period_end]"`
  - This ensures payroll costs appear in the Finance dashboard automatically.

### 7.6 Payment Tracking

After a run is completed, each `PayrollItem` has a `payment_status`:

| Status    | Meaning                           |
| --------- | --------------------------------- |
| `pending` | Calculated but not yet paid       |
| `paid`    | Payment disbursed to employee     |
| `failed`  | Payment failed (bank issue, etc.) |

**Marking as Paid:**

- Admin clicks "Mark as Paid" on individual items or "Mark All as Paid" on the run.
- Updates `payment_status: "paid"` and sets `paid_at` timestamp.

### 7.7 Employee Payroll History

**Route:** `/payroll/employees`
**API:** `GET /api/payroll/employees/:id`

Shows a specific employee's complete payroll history:

- **Header:** Employee name, department, position, current salary.
- **YTD Summary:** Total gross, total deductions, total net for the current year.
- **Payment History:** Table of all payroll items for this employee across all completed runs.
- **Each row:** Pay date, gross pay, overtime, bonuses, deductions, tax, net pay, payment status.

**User Interaction:**

1. Admin navigates to `/payroll/employees`.
2. Sees a list of all employees.
3. Clicks an employee → detailed payroll history loads.
4. Can see every pay period, amounts, and whether each payment was made.

### 7.8 Tax Documents (Enterprise Only)

- **Feature-gated:** Enterprise plan only.
- **Standard/Professional users:** See a locked card.
- **Functionality:** Generate W-2 and 1099 forms at year-end. Download as PDF.
- **Status:** Planned for future release.

---

## 8. Communication Service

### 8.1 Overview

The Communication Service provides secure internal messaging for company employees. Built on MongoDB for real-time message storage and retrieval, with WebSocket support for live updates.

**Backend Router:** `/api/messages`
**Frontend Route:** `/communication/*`
**Database:** MongoDB (messages, threads, broadcasts)

### 8.2 Communication Dashboard

**Route:** `/communication`
**API:** `GET /api/communication/dashboard`

**KPIs:**

| KPI               | Description                                           |
| ----------------- | ----------------------------------------------------- |
| Unread Messages   | Count of messages where the current user has not read |
| Active Threads    | Number of threads with messages in the last 7 days    |
| Recent Broadcasts | Number of broadcasts sent in the last 30 days         |
| Storage Used      | GB of file storage consumed / plan limit              |

**Sections:**

- **Recent Messages:** Last 5 message threads with sender name, preview text, timestamp.
- **Recent Broadcasts:** Last 3 company-wide announcements.

### 8.3 Inbox / Direct Messaging

**Route:** `/communication/inbox`
**API:** `GET /api/messages`, `POST /api/messages`, `GET /api/messages/threads/:id`

#### Conversation List (Left Panel)

Displays all threads the user is a participant in:

| Item          | Data                                    |
| ------------- | --------------------------------------- |
| Avatar        | Sender avatar or group icon             |
| Name          | Participant name (direct) or group name |
| Preview       | First 50 chars of the last message      |
| Timestamp     | "2m ago," "Yesterday," "Feb 1"          |
| Unread Badge  | Blue dot or count for unread messages   |
| Online Status | Green dot for online users              |

**Sorted by:** Most recent message first.

#### Thread View (Right Panel)

When a conversation is selected:

- **Header:** Participant name(s), online status.
- **Messages:** Scrollable list of messages in chronological order.
- **Each message shows:** Sender avatar, sender name, message text, timestamp, read receipts.
- **Input Bar:** Text field + Send button + attachment icon.

#### Sending a Message

**New Direct Message:**

1. User clicks "New Message" or "Compose."
2. Selects a recipient from the employee directory dropdown.
3. Types a message.
4. Clicks Send.

**Backend Processing (`POST /api/messages`):**

1. If `thread_id` provided → append message to existing thread.
2. If `recipient_id` provided → find or create a direct thread between the two users.
3. Store message in MongoDB with `sender_id`, `content`, `sent_at`.
4. Mark as unread for the recipient.
5. Emit WebSocket event `message:new` to all thread participants.

**New Group Thread:**

1. User clicks "New Group."
2. Enters group name, selects participants.
3. Sends initial message.
4. Backend creates a new `thread` document with type "group."

#### Read Receipts

- When a user opens a thread, all unread messages are automatically marked as read.
- API: `PUT /api/messages/:id/read`
- WebSocket event `message:read` is emitted to other participants.
- UI shows: "Read by [Name] at [time]" or a double-check icon.

#### Deleting a Message

- Soft delete: sets `deleted_at` timestamp.
- Message shows as "This message was deleted" to other participants.
- Only the message sender can delete their own messages.

### 8.4 Broadcasts (Professional+)

**Feature-gated:** Requires Professional or Enterprise plan.

**Purpose:** Company-wide announcements from Admins/Managers to all employees.

**Creating a Broadcast:**

1. Admin clicks "Create Broadcast."
2. Fields: Title, Content (rich text), Priority (Low/Normal/High/Urgent), Target audience (All / specific departments / specific users).
3. Optional: Schedule for later, require acknowledgment.
4. Click "Send."

**Business Rules:**

- Only Admin, Owner, and Manager roles can create broadcasts.
- Broadcasts cannot be replied to (one-way communication).
- If acknowledgment is required, employees see a "Mark as Read" button, and the broadcast card shows read count vs. total recipients.
- Urgent broadcasts trigger a push notification to all recipients.

### 8.5 File Sharing

**API:** `GET /api/files`, `POST /api/files`
**Status:** Planned for future release.

**Planned Features:**

- Upload files in message threads.
- Shared file vault accessible from `/communication/files`.
- Storage limits based on plan (Standard: 5GB, Professional: 50GB, Enterprise: Unlimited).

### 8.6 WebSocket Real-Time Events

The communication service supports real-time interactions via WebSocket:

| Event           | Direction       | Description                     |
| --------------- | --------------- | ------------------------------- |
| `message:new`   | Server → Client | New message in a thread         |
| `message:read`  | Server → Client | Message was read by participant |
| `typing:start`  | Client → Server | User started typing             |
| `typing:stop`   | Client → Server | User stopped typing             |
| `broadcast:new` | Server → Client | New company broadcast           |

**Connection:** Authenticated via JWT token passed in WebSocket handshake.

---

## 9. Settings & Administration

### 9.1 Overview

Settings is a global module (not a service package) that provides user profile management, company configuration, security settings, and billing management.

**Backend Router:** `/api/settings`
**Frontend Route:** `/settings/*`

### 9.2 Profile Settings

**Route:** `/settings/profile`
**API:** `GET /api/auth/me`, `PUT /api/auth/me`

**Editable Fields:**

- First Name, Last Name
- Email (triggers re-verification if changed)
- Phone number
- Avatar (image upload)
- Timezone
- Language preference

**User Interaction:**

1. User navigates to Settings → Profile.
2. Sees current profile information.
3. Modifies any field and clicks "Save."
4. Backend validates and updates the user record.
5. Toast notification: "Profile updated successfully."

### 9.3 Company Settings

**Route:** `/settings/company`
**API:** `GET /api/settings/company`, `PUT /api/settings/company`
**Permission:** Admin and Owner only.

**Editable Fields:**

- Company Name
- Legal Name
- Industry
- Company Size
- Website URL
- Address (Street, City, State, ZIP, Country)
- Contact Email, Contact Phone
- Tax ID / EIN (encrypted at rest)
- Payroll Settings: Pay frequency (weekly/biweekly/monthly), default pay day, overtime threshold (hours), overtime rate multiplier.

**Business Rules:**

- Tax ID is masked in API responses (only last 4 digits shown).
- Payroll settings affect how future payroll runs are calculated.
- Changes to company name update the company record but do not affect existing data relationships.

### 9.4 User Management

**Route:** `/settings` (users section)
**API:** `GET /api/settings/users`, `POST /api/settings/users/invite`, `PUT /api/settings/users/:id`, `DELETE /api/settings/users/:id`
**Permission:** Admin and Owner only.

#### Listing Users

Table showing all users in the company:

| Column     | Data                                                   |
| ---------- | ------------------------------------------------------ |
| Name       | Full name with avatar                                  |
| Email      | Login email                                            |
| Role       | Owner / Admin / Manager / Employee (color-coded badge) |
| Status     | Active / Inactive                                      |
| Last Login | Timestamp of last login                                |
| Actions    | Edit, Delete                                           |

#### Inviting a New User

1. Admin clicks "Invite User."
2. Fields: Email, First Name, Last Name, Role (dropdown: Admin, Manager, Employee).
3. Backend creates a user account with a temporary password (or sends an invite email).
4. New user appears in the list.

**Business Rules:**

- Cannot create another Owner (only one per company).
- Admins cannot invite other Admins (only owners can promote to Admin).
- Users cannot modify their own role.
- Users cannot delete themselves.
- Deleting a user does not delete their associated employee record (the employee record's `user_id` is set to NULL).

#### Modifying a User's Role

- Owner can change any user's role (except their own).
- Admin can change Manager and Employee roles.
- Changing a user's role immediately affects their permissions on the next API request (JWT tokens encode the role at issuance, but the backend re-validates on each request).

### 9.5 Security Settings

**Route:** `/settings/security`
**API:** `POST /api/auth/change-password`

**Features:**

- **Change Password:** Current password + new password + confirmation.
- **Two-Factor Authentication (2FA):** Planned for future release. UI shows "Coming Soon" toggle.
- **Active Sessions:** Planned — show list of active login sessions with "Revoke" buttons.

### 9.6 Notification Preferences

**Route:** `/settings/notifications`
**API:** `PUT /api/settings/preferences`

**Channels:** Email and Push.

**Configurable events:**

| Event                       | Default Email | Default Push |
| --------------------------- | :-----------: | :----------: |
| Payroll Processed           |      ✅       |      ✅      |
| PTO Request Submitted       |      ✅       |      ✅      |
| PTO Request Approved/Denied |      ✅       |      ✅      |
| New Message                 |      ❌       |      ✅      |
| New Broadcast               |      ✅       |      ✅      |
| Shift Assigned              |      ❌       |      ✅      |
| Budget Alert                |      ✅       |      ✅      |

### 9.7 Appearance

**Route:** `/settings/appearance`

**Theme Options:**

- **Light mode** — default.
- **Dark mode** — dark backgrounds, light text.
- **System** — follows OS preference.

Implementation: `next-themes` library with CSS variables for theming.

### 9.8 Billing Management

**Route:** `/settings/billing`
**API:** `GET /api/settings/billing`, `PUT /api/settings/billing`
**Permission:** Owner only.
**Integration:** Stripe (planned).

**What the user sees:**

- Current plan (Standard / Professional / Enterprise) with price.
- Plan comparison table with "Upgrade" buttons.
- Current usage: members (23/50), storage (12.5/50 GB).
- Payment method on file (last 4 digits of card).
- Billing history / invoices.
- "Manage Subscription" button → redirects to Stripe Customer Portal.

---

## 10. Dashboard & Analytics

### 10.1 Home / Service Selector

**Route:** `/`
**API:** `GET /api/dashboard`

When the user logs in, they land on the **home page** which shows:

1. **Service Selector Cards:** Four large cards for each service (Employees, Finance, Payroll, Communication). Each card shows:
   - Service icon and name.
   - 2–3 key stats (e.g., "45 Active Employees," "$15,000 Net Profit," "3 Pending Requests").
   - "Open" button to navigate to the service.

2. **Global Dashboard Widgets:**
   - **Employee Stats:** Total, active, on leave, new hires.
   - **Financial Summary:** Revenue, expenses, net for current month.
   - **Payroll Overview:** Next payroll date, estimated amount.
   - **Communication:** Unread messages count.

**API Response Includes:**

- `employee_stats`: total, active, on_leave, new_hires.
- `financial_summary`: monthly_revenue, monthly_expenses, net.
- `payroll_overview`: next_run_date, estimated_total.
- `communication_stats`: unread_messages, active_threads.
- `recent_activities`: Last 10 actions across all services (employee created, transaction added, payroll processed, message sent).

### 10.2 Charts Endpoint

**API:** `GET /api/dashboard/charts`

Returns data for rendering dashboard visualizations:

- **Revenue vs. Expenses (6 months):** Array of `{month, income, expenses}` objects for a dual-axis line/bar chart.
- **Expense Category Breakdown:** Array of `{category, amount, percentage}` for a pie/donut chart.
- **Employee Growth:** Array of `{month, total_employees}` for a line chart showing headcount trend.

---

## 11. Subscription & Billing

### 11.1 Plan Architecture

Pulse offers three subscription tiers, each unlocking progressively more features:

|                               | Standard ($49/mo) | Professional ($129/mo) | Enterprise (Custom) |
| ----------------------------- | :---------------: | :--------------------: | :-----------------: |
| **Members**                   |      Up to 5      |        Up to 50        |      Unlimited      |
| **Storage**                   |       5 GB        |         50 GB          |      Unlimited      |
| **Employee Directory**        |        ✅         |           ✅           |         ✅          |
| **Basic Scheduling**          |        ✅         |           ✅           |         ✅          |
| **PTO Management**            |        ✅         |           ✅           |         ✅          |
| **Financial Ledger**          |        ✅         |           ✅           |         ✅          |
| **Standard Reports**          |        ✅         |           ✅           |         ✅          |
| **Direct Messages**           |        ✅         |           ✅           |         ✅          |
| **Shift Auto-Assign**         |        ❌         |           ✅           |         ✅          |
| **Performance Reviews**       |        ❌         |           ✅           |         ✅          |
| **AI Finance Tags**           |        ❌         |           ✅           |         ✅          |
| **Budget Planning**           |        ❌         |           ✅           |         ✅          |
| **Automated Payroll**         |        ❌         |           ✅           |         ✅          |
| **Tax Calculations**          |        ❌         |           ✅           |         ✅          |
| **Company Broadcasts**        |        ❌         |           ✅           |         ✅          |
| **Message Archive**           |        ❌         |           ✅           |         ✅          |
| **W-2/1099 Generation**       |        ❌         |           ❌           |         ✅          |
| **API Access**                |        ❌         |           ❌           |         ✅          |
| **SSO/SAML**                  |        ❌         |           ❌           |         ✅          |
| **Audit Logs**                |        ❌         |           ❌           |         ✅          |
| **Dedicated Account Manager** |        ❌         |           ❌           |         ✅          |

### 11.2 À La Carte Add-Ons

Customers on Standard can purchase individual upgrades:

| Add-On            | Price   | What It Unlocks                          |
| ----------------- | ------- | ---------------------------------------- |
| Employees Pro     | +$29/mo | Shift Logic, Performance Reviews         |
| Finance Pro       | +$29/mo | AI Tags, Budget Planning, Custom Reports |
| Payroll Pro       | +$39/mo | Automated Payroll, Tax Calculations      |
| Communication Pro | +$19/mo | Broadcasts, 50GB Storage, Archive        |
| Analytics Pack    | +$49/mo | Advanced dashboards, data exports        |
| Security Pack     | +$29/mo | SSO/SAML, 2FA enforcement, audit logs    |

### 11.3 Feature Gating — How It Works

**Backend Implementation:**

Every plan-gated endpoint is protected by a `require_feature()` decorator:

```python
@router.post("/runs/{run_id}/process")
@require_feature("payroll.automated")
async def process_payroll_run(...):
    ...
```

If the company's subscription does not include the required feature:

- HTTP `403 Forbidden` is returned.
- Error body includes: `code: "FEATURE_NOT_AVAILABLE"`, `required_plan`, `current_plan`, `upgrade_url`.

**Frontend Implementation:**

Gated features are wrapped in a `<FeatureGate>` component:

```tsx
<FeatureGate feature="payroll.automated" fallback={<UpgradePrompt />}>
  <ProcessPayrollButton />
</FeatureGate>
```

If the user's plan does not include the feature:

- The button/section is replaced with an upgrade prompt.
- Sidebar items show a lock icon.
- Clicking a locked item opens an upgrade modal with plan comparison.

**UI Indicators:**

- **Locked sidebar items:** Lock icon + "Pro" or "Enterprise" badge.
- **Inline prompts:** "Upgrade to Professional to unlock Budget Planning."
- **Usage meters:** "Members: ████████░░ 4/5" — visible in the header or settings.

### 11.4 Billing Flow (Stripe Integration — Planned)

```
User clicks "Upgrade" → POST /api/billing/checkout
  → Stripe Checkout Session created
  → User redirected to Stripe-hosted checkout page
  → User enters payment details
  → Stripe confirms payment
  → Webhook POST /api/billing/webhook received
  → Backend updates CompanySubscription record
  → User sees updated plan immediately
```

---

## 12. Real-Time Events & Notifications

### 12.1 Notification System

**API:** `GET /api/notifications`, `PUT /api/notifications/:id/read`
**Technology:** REST (polling) + WebSocket (push)

**Notification Types:**

| Type      | Trigger                     | Recipients                        |
| --------- | --------------------------- | --------------------------------- |
| `pto`     | PTO request submitted       | Managers + Admins                 |
| `pto`     | PTO request approved/denied | Requesting employee               |
| `payroll` | Payroll run completed       | All employees (their pay details) |
| `shift`   | Shift assigned/changed      | Affected employee                 |
| `message` | New direct message          | Recipient                         |
| `info`    | Broadcast published         | Target audience                   |
| `warning` | Budget threshold exceeded   | Admins                            |
| `error`   | Payment failed              | Admin + affected employee         |

**Notification Object:**

```json
{
  "id": "notif_abc123",
  "type": "pto",
  "title": "New PTO Request",
  "message": "Jane Smith requested 5 days of vacation (Feb 10-14)",
  "action_url": "/employees/pto",
  "is_read": false,
  "created_at": "2026-02-05T10:30:00Z"
}
```

**User Interaction:**

1. Bell icon in header shows unread count badge.
2. Clicking opens a dropdown with the latest notifications.
3. Clicking a notification navigates to the `action_url` and marks it as read.
4. "Mark All as Read" button clears all unread notifications.

### 12.2 WebSocket Events

The platform uses WebSocket for real-time updates without page refresh:

**Connection:**

```javascript
const socket = io("wss://api.pulse.com", {
  auth: { token: "jwt_access_token" },
  query: { company_id: "comp_abc123" },
});
```

**Key Events:**

| Event               | Payload                            | Effect                             |
| ------------------- | ---------------------------------- | ---------------------------------- |
| `message:new`       | Thread ID, message content, sender | New message appears in inbox       |
| `message:read`      | Thread ID, message ID, reader      | Read receipt appears               |
| `typing:start`      | Thread ID, user                    | "User is typing..." indicator      |
| `typing:stop`       | Thread ID, user                    | Typing indicator removed           |
| `notification:new`  | Notification object                | Badge count updates, toast appears |
| `pto:submitted`     | Request details                    | Manager sees alert                 |
| `payroll:processed` | Run summary                        | Admin sees confirmation            |

---

## 13. Cross-Service Business Logic

### 13.1 Data Flow Between Services

```
┌────────────┐    Salary Data    ┌────────────┐
│  EMPLOYEES │ ───────────────→  │  PAYROLL   │
│            │                   │            │
│  salary,   │                   │  Uses for  │
│  status,   │                   │  payroll   │
│  overtime  │                   │  calcs     │
└──────┬─────┘                   └─────┬──────┘
       │                               │
       │ Directory                     │ Expense Transaction
       │                               │
       ▼                               ▼
┌────────────┐                   ┌────────────┐
│  COMMUNIC. │                   │  FINANCE   │
│            │                   │            │
│ Recipients │                   │ Auto-entry │
│ from emp   │                   │ on payroll │
│ directory  │                   │ completion │
└────────────┘                   └────────────┘
```

### 13.2 Automatic Payroll → Finance Entry

**Trigger:** PayrollRun status changes to `completed`.

**Action:**

1. Calculate total gross pay for the run.
2. Create a new `Transaction` record:
   - `type: "expense"`
   - `category: "Payroll"`
   - `amount:` total gross pay
   - `description: "Payroll run [period_start] to [period_end]"`
   - `transaction_date:` payroll run pay date
   - `created_by:` system (or the user who processed the run)
3. This transaction immediately appears in the Finance dashboard and ledger.

**Business Rationale:** Business owners want their cash flow dashboard to reflect payroll costs without manually entering the same data twice.

### 13.3 Employee Directory → Communication Recipients

When a user composes a new message:

- The recipient picker queries the Employee/User directory for the current company.
- Only active employees and users appear in the picker.
- Terminated employees cannot receive messages.

### 13.4 Employee Status → Payroll Exclusion

When an employee's status changes to `inactive` or `terminated`:

- They are automatically excluded from future payroll runs.
- Existing completed payroll items are preserved (historical record).
- If a payroll run is in `draft` status and an employee is terminated, their draft payroll item is removed.

### 13.5 PTO → Shift Conflicts

When a PTO request is approved:

- The system checks for any shifts assigned to that employee during the PTO period.
- If conflicts exist, a notification is sent to the manager: "Employee has approved PTO that conflicts with a scheduled shift on [date]."
- The conflicting shift is NOT automatically cancelled (requires manual manager action to either cancel or reassign).

### 13.6 All Services → Notifications

Every significant action triggers a notification:

| Action              | Notification                                        |
| ------------------- | --------------------------------------------------- |
| Employee created    | Admin sees "New employee [Name] added"              |
| PTO submitted       | Manager sees "PTO request from [Name]"              |
| PTO approved/denied | Employee sees "[Approved/Denied]: Your PTO request" |
| Transaction created | N/A (no notification, appears in dashboard)         |
| Payroll processed   | All employees see "Payroll for [period] processed"  |
| New message         | Recipient sees "[Sender]: [Preview]"                |
| Broadcast sent      | All targets see "[Title]"                           |
| Budget exceeded     | Admin sees "Warning: [Category] budget at [X]%"     |

---

## 14. Security Model

### 14.1 Authentication Security

| Mechanism             | Implementation                                     |
| --------------------- | -------------------------------------------------- |
| Password Hashing      | bcrypt with automatic salt (via passlib)           |
| Token Signing         | HS256 (HMAC-SHA256) with server-side secret        |
| Token Storage         | Frontend: Zustand store + localStorage             |
| Access Token TTL      | 15 minutes                                         |
| Refresh Token TTL     | 7 days (30 days with "remember me")                |
| Token Rotation        | New refresh token issued on every refresh          |
| Password Requirements | Min 8 chars, 1 uppercase, 1 number, 1 special char |

### 14.2 Authorization (RBAC)

- Every API endpoint checks the user's role before executing.
- Role is extracted from the JWT token and validated against the database.
- Two layers of auth:
  1. **Authentication middleware** (`get_current_user`): Validates token, loads user from DB.
  2. **Role checkers** (`require_admin`, `require_manager`): Verify the user has the minimum required role.

### 14.3 Data Isolation (Multi-tenancy)

- Every database query is scoped by `company_id`.
- Users can only see data belonging to their own company.
- API endpoints automatically inject `company_id` from the authenticated user — it cannot be forged.
- MongoDB queries also filter by `company_id`.

### 14.4 API Security

| Protection       | Implementation                                         |
| ---------------- | ------------------------------------------------------ |
| CORS             | Configured for specific origins only                   |
| SQL Injection    | Prevented by SQLAlchemy ORM (parameterized queries)    |
| Input Validation | Pydantic schemas validate every request body           |
| HTTPS            | Enforced in production (Nginx/Ingress TLS termination) |
| Rate Limiting    | Per-endpoint limits (see Section 15)                   |
| Audit Logging    | Middleware logs all state-changing operations          |

### 14.5 Sensitive Data Handling

| Data               | Protection                                                 |
| ------------------ | ---------------------------------------------------------- |
| Passwords          | Hashed with bcrypt — never stored or returned in plaintext |
| Tax IDs / EINs     | Masked in API responses (last 4 digits only)               |
| Salary Information | Only visible to Admin/Owner and the employee themselves    |
| Payment Card Data  | Never stored — handled entirely by Stripe                  |
| JWT Secret Key     | Environment variable, never committed to code              |

---

## 15. Error Handling & Rate Limiting

### 15.1 Error Codes

| Code                      | HTTP | Meaning                                            |
| ------------------------- | ---- | -------------------------------------------------- |
| `VALIDATION_ERROR`        | 400  | Invalid request data (missing fields, wrong types) |
| `AUTHENTICATION_REQUIRED` | 401  | No token provided or token is invalid              |
| `TOKEN_EXPIRED`           | 401  | JWT access token has expired                       |
| `PERMISSION_DENIED`       | 403  | User's role does not have the required permission  |
| `FEATURE_NOT_AVAILABLE`   | 403  | Feature requires a higher subscription plan        |
| `NOT_FOUND`               | 404  | The requested resource does not exist              |
| `CONFLICT`                | 409  | Duplicate resource (e.g., email already taken)     |
| `RATE_LIMITED`            | 429  | Too many requests — retry after N seconds          |
| `INTERNAL_ERROR`          | 500  | Unexpected server error                            |
| `SERVICE_UNAVAILABLE`     | 503  | Service temporarily unavailable                    |

### 15.2 Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  },
  "meta": {
    "timestamp": "2026-02-06T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 15.3 Rate Limits

| Endpoint Category                    | Limit        | Window    |
| ------------------------------------ | ------------ | --------- |
| Authentication (login, register)     | 10 requests  | 1 minute  |
| Read operations (GET)                | 100 requests | 1 minute  |
| Write operations (POST, PUT, DELETE) | 30 requests  | 1 minute  |
| File uploads                         | 10 requests  | 1 minute  |
| Data exports (CSV, reports)          | 5 requests   | 5 minutes |
| WebSocket messages                   | 60 messages  | 1 minute  |

**When rate-limited:** Response includes `Retry-After` header and `retry_after` field in the error body.

---

## 16. Data Model Reference

### 16.1 PostgreSQL Tables

#### `companies`

| Column     | Type         | Description                       |
| ---------- | ------------ | --------------------------------- |
| id         | UUID (PK)    | Unique company identifier         |
| name       | VARCHAR(255) | Company display name              |
| email      | VARCHAR(255) | Company contact email             |
| phone      | VARCHAR(20)  | Company phone                     |
| address    | TEXT         | Physical address                  |
| tax_id     | VARCHAR(50)  | Tax identification number         |
| status     | VARCHAR(20)  | `active`, `inactive`, `suspended` |
| created_at | TIMESTAMP    | Record creation time              |
| updated_at | TIMESTAMP    | Last update time                  |

#### `users`

| Column          | Type                  | Description                                           |
| --------------- | --------------------- | ----------------------------------------------------- |
| id              | UUID (PK)             | Unique user identifier                                |
| company_id      | UUID (FK → companies) | Associated company                                    |
| email           | VARCHAR(255) UNIQUE   | Login email                                           |
| hashed_password | VARCHAR(255)          | bcrypt password hash                                  |
| first_name      | VARCHAR(100)          | First name                                            |
| last_name       | VARCHAR(100)          | Last name                                             |
| role            | VARCHAR(20)           | `super_admin`, `company_admin`, `manager`, `employee` |
| is_active       | BOOLEAN               | Account active state                                  |
| last_login      | TIMESTAMP             | Last login timestamp                                  |

#### `employees`

| Column          | Type                        | Description                          |
| --------------- | --------------------------- | ------------------------------------ |
| id              | UUID (PK)                   | Unique employee identifier           |
| company_id      | UUID (FK → companies)       | Associated company                   |
| user_id         | UUID (FK → users, nullable) | Linked user account                  |
| first_name      | VARCHAR(100)                | First name                           |
| last_name       | VARCHAR(100)                | Last name                            |
| email           | VARCHAR(255)                | Work email                           |
| phone           | VARCHAR(20)                 | Phone number                         |
| position        | VARCHAR(100)                | Job title                            |
| department      | VARCHAR(100)                | Department name                      |
| hire_date       | DATE                        | Date of hire                         |
| employment_type | VARCHAR(20)                 | `full-time`, `part-time`, `contract` |
| status          | VARCHAR(20)                 | `active`, `inactive`, `terminated`   |
| salary_amount   | DECIMAL(10,2)               | Current salary                       |

#### `pto_balances`

| Column         | Type                  | Description          |
| -------------- | --------------------- | -------------------- |
| id             | UUID (PK)             |                      |
| employee_id    | UUID (FK → employees) |                      |
| year           | INTEGER               | Calendar year        |
| total_days     | DECIMAL(5,2)          | Total allocated days |
| used_days      | DECIMAL(5,2)          | Days used            |
| available_days | DECIMAL(5,2)          | Days remaining       |

#### `pto_requests`

| Column         | Type                  | Description                     |
| -------------- | --------------------- | ------------------------------- |
| id             | UUID (PK)             |                                 |
| employee_id    | UUID (FK → employees) |                                 |
| start_date     | DATE                  | Leave start                     |
| end_date       | DATE                  | Leave end                       |
| days_requested | DECIMAL(5,2)          | Number of days                  |
| reason         | TEXT                  | Employee's reason               |
| status         | VARCHAR(20)           | `pending`, `approved`, `denied` |
| reviewed_by    | UUID (FK → users)     | Approver                        |
| reviewed_at    | TIMESTAMP             | Time of decision                |

#### `shifts`

| Column      | Type                  | Description                                     |
| ----------- | --------------------- | ----------------------------------------------- |
| id          | UUID (PK)             |                                                 |
| employee_id | UUID (FK → employees) |                                                 |
| shift_date  | DATE                  | Date of the shift                               |
| start_time  | TIMESTAMP             | Shift start time                                |
| end_time    | TIMESTAMP             | Shift end time                                  |
| status      | VARCHAR(20)           | `scheduled`, `completed`, `missed`, `cancelled` |
| notes       | TEXT                  | Shift notes                                     |

#### `transactions`

| Column           | Type                  | Description         |
| ---------------- | --------------------- | ------------------- |
| id               | UUID (PK)             |                     |
| company_id       | UUID (FK → companies) |                     |
| type             | VARCHAR(20)           | `income`, `expense` |
| category         | VARCHAR(100)          | Category name       |
| amount           | DECIMAL(12,2)         | Transaction amount  |
| description      | TEXT                  | Description         |
| transaction_date | DATE                  | Date of transaction |
| created_by       | UUID (FK → users)     | Recording user      |

#### `expense_categories`

| Column       | Type                  | Description          |
| ------------ | --------------------- | -------------------- |
| id           | UUID (PK)             |                      |
| company_id   | UUID (FK → companies) |                      |
| name         | VARCHAR(100)          | Category name        |
| description  | TEXT                  | Category description |
| budget_limit | DECIMAL(12,2)         | Monthly budget cap   |

#### `payroll_runs`

| Column       | Type                  | Description                                  |
| ------------ | --------------------- | -------------------------------------------- |
| id           | UUID (PK)             |                                              |
| company_id   | UUID (FK → companies) |                                              |
| period_start | DATE                  | Pay period start                             |
| period_end   | DATE                  | Pay period end                               |
| status       | VARCHAR(20)           | `draft`, `processing`, `completed`, `failed` |
| total_amount | DECIMAL(12,2)         | Total net payout                             |
| processed_by | UUID (FK → users)     | Who processed                                |
| processed_at | TIMESTAMP             | When processed                               |

#### `payroll_items`

| Column          | Type                     | Description                       |
| --------------- | ------------------------ | --------------------------------- |
| id              | UUID (PK)                |                                   |
| payroll_run_id  | UUID (FK → payroll_runs) | Parent run                        |
| employee_id     | UUID (FK → employees)    | Employee                          |
| base_salary     | DECIMAL(10,2)            | Period base salary                |
| overtime_hours  | DECIMAL(5,2)             | Overtime hours worked             |
| overtime_rate   | DECIMAL(5,2)             | Overtime multiplier (default 1.5) |
| overtime_amount | DECIMAL(10,2)            | Calculated overtime pay           |
| bonuses         | DECIMAL(10,2)            | Additional bonuses                |
| deductions      | DECIMAL(10,2)            | Deductions (insurance, etc.)      |
| tax_amount      | DECIMAL(10,2)            | Calculated tax                    |
| net_amount      | DECIMAL(10,2)            | Take-home pay                     |
| payment_status  | VARCHAR(20)              | `pending`, `paid`, `failed`       |
| paid_at         | TIMESTAMP                | When payment was made             |

### 16.2 MongoDB Collections

#### `messages`

```json
{
  "_id": "ObjectId",
  "thread_id": "ObjectId",
  "company_id": "UUID",
  "sender_id": "UUID",
  "content": "String",
  "content_type": "text | file | image | system",
  "attachments": [{ "name": "...", "url": "...", "type": "...", "size": 0 }],
  "read_by": [{ "user_id": "UUID", "read_at": "ISODate" }],
  "reactions": [{ "emoji": "👍", "user_id": "UUID" }],
  "deleted_at": "ISODate | null",
  "created_at": "ISODate"
}
```

#### `threads`

```json
{
  "_id": "ObjectId",
  "company_id": "UUID",
  "type": "direct | group",
  "name": "String (for groups)",
  "participants": [
    { "user_id": "UUID", "role": "admin | member", "last_read_at": "ISODate" }
  ],
  "last_message_at": "ISODate",
  "created_at": "ISODate"
}
```

#### `broadcasts`

```json
{
  "_id": "ObjectId",
  "company_id": "UUID",
  "title": "String",
  "content": "String",
  "priority": "low | normal | high | urgent",
  "target": { "type": "all | departments | selected", "ids": ["UUID"] },
  "require_acknowledgment": "Boolean",
  "acknowledgments": [{ "user_id": "UUID", "acknowledged_at": "ISODate" }],
  "sent_at": "ISODate",
  "created_by": "UUID"
}
```

### 16.3 Redis Usage

| Key Pattern                    | Purpose               | TTL       |
| ------------------------------ | --------------------- | --------- |
| `session:{user_id}`            | Active session data   | 24 hours  |
| `rate_limit:{ip}:{endpoint}`   | Rate limit counters   | 1 minute  |
| `cache:dashboard:{company_id}` | Cached dashboard KPIs | 5 minutes |
| `cache:employees:{company_id}` | Employee list cache   | 2 minutes |

---

## 17. Technology Stack

### 17.1 Frontend

| Technology            | Version         | Purpose                             |
| --------------------- | --------------- | ----------------------------------- |
| Next.js               | 14 (App Router) | React framework with SSR/SSG        |
| TypeScript            | 5.x             | Type safety                         |
| Tailwind CSS          | 4.x             | Utility-first styling               |
| shadcn/ui + Radix UI  | Latest          | Accessible component library        |
| TanStack React Query  | 5.x             | Server state management, caching    |
| Zustand               | 4.x             | Client state (auth store)           |
| React Hook Form + Zod | Latest          | Form management + schema validation |
| Recharts              | Latest          | Data visualization (charts)         |
| next-themes           | Latest          | Theme switching (light/dark/system) |
| Lucide React          | Latest          | Icon library                        |
| Socket.IO Client      | Latest          | WebSocket real-time events          |
| Sonner                | Latest          | Toast notifications                 |
| date-fns              | Latest          | Date formatting and manipulation    |

### 17.2 Backend

| Technology           | Version    | Purpose                     |
| -------------------- | ---------- | --------------------------- |
| FastAPI              | 0.110+     | Async Python web framework  |
| Python               | 3.11+      | Programming language        |
| SQLAlchemy           | 2.0        | PostgreSQL ORM              |
| Pydantic             | 2.6        | Request/response validation |
| python-jose          | 3.3        | JWT token handling          |
| passlib + bcrypt     | 1.7.4      | Password hashing            |
| Alembic              | 1.13       | Database migrations         |
| Motor + Beanie       | 3.4 / 1.25 | MongoDB async driver + ODM  |
| Uvicorn              | 0.27       | ASGI server                 |
| Redis (via aioredis) | Latest     | Caching and sessions        |

### 17.3 Infrastructure

| Technology              | Version | Purpose                            |
| ----------------------- | ------- | ---------------------------------- |
| PostgreSQL              | 16      | Primary relational database        |
| MongoDB                 | 7       | Document database for messaging    |
| Redis                   | 7       | Caching, sessions, rate limiting   |
| Docker + Docker Compose | Latest  | Containerization                   |
| Kubernetes              | Latest  | Orchestration (production)         |
| Nginx                   | Latest  | Reverse proxy, static file serving |

---

## 18. Deployment & Infrastructure

### 18.1 Environment Configuration

```bash
# Core
DATABASE_URL=postgresql://user:pass@postgres:5432/pulse
MONGODB_URL=mongodb://mongodb:27017/pulse
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=<32+ char random string>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# External Services (Planned)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG....

# App
CORS_ORIGINS=["https://use.pulse.com"]
DEBUG=False
```

### 18.2 Docker Compose Services

| Service    | Image               | Ports | Purpose              |
| ---------- | ------------------- | ----- | -------------------- |
| `backend`  | Custom (Dockerfile) | 8000  | FastAPI API server   |
| `frontend` | Custom (Dockerfile) | 3000  | Next.js application  |
| `landing`  | Custom (Dockerfile) | 8080  | Eleventy static site |
| `postgres` | postgres:16-alpine  | 5432  | Primary database     |
| `mongodb`  | mongo:7             | 27017 | Messaging database   |
| `redis`    | redis:7-alpine      | 6379  | Cache and sessions   |

### 18.3 Kubernetes Architecture

Deployed to a self-hosted Kubernetes cluster with:

| Resource          | Description                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Namespace         | `pulse` — isolates all resources                                                        |
| ConfigMap         | Environment variables (non-sensitive)                                                     |
| Secrets           | Passwords, JWT secret, API keys                                                           |
| Deployments       | Backend (2 replicas), Frontend (2 replicas), Landing (1 replica)                          |
| Services          | ClusterIP for internal communication                                                      |
| Ingress           | Routes `pulse.com` → Landing, `use.pulse.com` → Frontend, `api.pulse.com` → Backend |
| PersistentVolumes | PostgreSQL data, MongoDB data, Redis data                                                 |
| NodePort          | Dev access — Frontend: 30300, Backend: 30800                                              |

### 18.4 Access Points

| URL                                 | Service  | Purpose             |
| ----------------------------------- | -------- | ------------------- |
| `https://pulse.com`               | Landing  | Marketing site      |
| `https://use.pulse.com`           | Frontend | Application         |
| `https://api.pulse.com/api/v1`    | Backend  | REST API            |
| `https://api.pulse.com/api/docs`  | Backend  | Swagger UI docs     |
| `https://api.pulse.com/api/redoc` | Backend  | ReDoc documentation |
| `wss://api.pulse.com`             | Backend  | WebSocket events    |

---

## Appendix A: Complete API Endpoint Reference

### Authentication (9 endpoints)

| Method | Endpoint                    | Description                 |
| ------ | --------------------------- | --------------------------- |
| POST   | `/api/auth/register`        | Register company + admin    |
| POST   | `/api/auth/login`           | User login                  |
| POST   | `/api/auth/logout`          | Invalidate tokens           |
| POST   | `/api/auth/refresh`         | Refresh access token        |
| POST   | `/api/auth/forgot-password` | Request password reset      |
| POST   | `/api/auth/reset-password`  | Reset password with token   |
| GET    | `/api/auth/me`              | Get current user profile    |
| PUT    | `/api/auth/me`              | Update current user profile |
| POST   | `/api/auth/change-password` | Change password             |

### Employees (7 endpoints)

| Method | Endpoint                   | Description                   |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/api/employees`           | List employees (with filters) |
| POST   | `/api/employees`           | Create employee               |
| GET    | `/api/employees/:id`       | Get employee details          |
| PUT    | `/api/employees/:id`       | Update employee               |
| DELETE | `/api/employees/:id`       | Delete employee               |
| GET    | `/api/employees/dashboard` | Dashboard KPIs                |
| GET    | `/api/employees/export`    | Export to CSV                 |

### Schedules (6 endpoints)

| Method | Endpoint                     | Description               |
| ------ | ---------------------------- | ------------------------- |
| GET    | `/api/schedules`             | List shifts               |
| POST   | `/api/schedules`             | Create shift              |
| PUT    | `/api/schedules/:id`         | Update shift              |
| DELETE | `/api/schedules/:id`         | Delete shift              |
| GET    | `/api/schedules/calendar`    | Calendar view             |
| POST   | `/api/schedules/auto-assign` | Auto-assign shifts (Pro+) |

### PTO (6 endpoints)

| Method | Endpoint               | Description        |
| ------ | ---------------------- | ------------------ |
| GET    | `/api/pto`             | List PTO requests  |
| POST   | `/api/pto`             | Submit PTO request |
| PUT    | `/api/pto/:id`         | Update PTO request |
| PUT    | `/api/pto/:id/approve` | Approve PTO        |
| PUT    | `/api/pto/:id/reject`  | Reject PTO         |
| GET    | `/api/pto/balances`    | Get PTO balances   |

### Finance (11 endpoints)

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/transactions`       | List transactions       |
| POST   | `/api/transactions`       | Create transaction      |
| GET    | `/api/transactions/:id`   | Get transaction         |
| PUT    | `/api/transactions/:id`   | Update transaction      |
| DELETE | `/api/transactions/:id`   | Delete transaction      |
| GET    | `/api/finance/dashboard`  | Dashboard KPIs          |
| GET    | `/api/finance/categories` | List categories         |
| POST   | `/api/finance/categories` | Create category         |
| GET    | `/api/finance/reports`    | Generate reports (Pro+) |
| GET    | `/api/finance/budgets`    | List budgets (Pro+)     |
| POST   | `/api/finance/budgets`    | Create budget (Pro+)    |

### Payroll (10 endpoints)

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/api/payroll/dashboard`        | Dashboard KPIs             |
| GET    | `/api/payroll/runs`             | List payroll runs          |
| POST   | `/api/payroll/runs`             | Create payroll run         |
| GET    | `/api/payroll/runs/:id`         | Get run details            |
| PUT    | `/api/payroll/runs/:id`         | Update run                 |
| POST   | `/api/payroll/runs/:id/process` | Process run (Pro+)         |
| POST   | `/api/payroll/runs/:id/approve` | Approve run                |
| GET    | `/api/payroll/history`          | Payment history            |
| GET    | `/api/payroll/employees/:id`    | Employee payroll           |
| GET    | `/api/payroll/tax-documents`    | Tax documents (Enterprise) |

### Communication (10 endpoints)

| Method | Endpoint                     | Description             |
| ------ | ---------------------------- | ----------------------- |
| GET    | `/api/messages`              | List conversations      |
| POST   | `/api/messages`              | Send message            |
| GET    | `/api/messages/threads/:id`  | Get thread              |
| PUT    | `/api/messages/:id/read`     | Mark as read            |
| DELETE | `/api/messages/:id`          | Delete message          |
| GET    | `/api/messages/unread-count` | Unread count            |
| GET    | `/api/broadcasts`            | List broadcasts (Pro+)  |
| POST   | `/api/broadcasts`            | Create broadcast (Pro+) |
| GET    | `/api/files`                 | List shared files       |
| POST   | `/api/files`                 | Upload file             |

### Settings & Billing (17 endpoints)

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/api/users/me`               | Get profile               |
| PUT    | `/api/users/me`               | Update profile            |
| PUT    | `/api/users/me/avatar`        | Update avatar             |
| PUT    | `/api/users/me/password`      | Change password           |
| PUT    | `/api/users/me/notifications` | Update notification prefs |
| GET    | `/api/company`                | Get company details       |
| PUT    | `/api/company`                | Update company            |
| PUT    | `/api/company/logo`           | Update company logo       |
| GET    | `/api/company/members`        | List members              |
| POST   | `/api/company/members/invite` | Invite member             |
| DELETE | `/api/company/members/:id`    | Remove member             |
| GET    | `/api/billing/subscription`   | Get subscription          |
| GET    | `/api/billing/plans`          | List available plans      |
| POST   | `/api/billing/checkout`       | Create checkout session   |
| POST   | `/api/billing/portal`         | Get customer portal URL   |
| GET    | `/api/billing/invoices`       | List invoices             |
| GET    | `/api/billing/usage`          | Get usage stats           |

### Dashboard (3 endpoints)

| Method | Endpoint                 | Description         |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/dashboard`         | Main dashboard KPIs |
| GET    | `/api/dashboard/charts`  | Chart data          |
| GET    | `/api/dashboard/summary` | Quick summary       |

**Total: 79 API endpoints**

---

## Appendix B: User Interaction Flows

### B.1 New Business Onboarding

```
1. Owner visits pulse.com → clicks "Get Started"
2. Fills registration form (company name, admin details, plan)
3. Redirected to home page (/) with welcome message
4. Clicks "Employees" service → Dashboard shows 0 employees
5. Clicks "Add Employee" → fills form for first hire
6. Repeats for all team members
7. Navigates to Finance → adds first transaction
8. Sets up payroll → creates first payroll run
9. Invites managers to the platform via Settings → Users
```

### B.2 Manager's Daily Workflow

```
1. Manager logs in → lands on home page
2. Sees "3 Pending PTO Requests" on the Employees card → clicks it
3. Reviews PTO requests → approves 2, denies 1
4. Checks Employees Dashboard → notices a shift gap tomorrow
5. Creates a new shift for an available employee
6. Switches to Communication → sees 5 unread messages
7. Responds to a team question
8. Checks Finance Dashboard → monthly expenses look normal
9. Logs out
```

### B.3 Employee's Self-Service

```
1. Employee logs in → sees limited home page
2. Goes to Employees → views own profile
3. Clicks "Request Time Off" → submits a vacation request
4. Checks schedule → sees upcoming shifts
5. Opens Communication → reads messages, replies to team thread
6. Goes to Payroll (own stub view) → downloads last pay stub
7. Settings → updates phone number, changes theme to dark mode
```

### B.4 Payroll Processing (Admin)

```
1. Admin navigates to Payroll → Dashboard shows "Next payroll: Feb 15"
2. Clicks "Create Payroll Run" → selects period Feb 1-15
3. Reviews auto-generated employee list and salaries
4. Adds a $5,000 bonus for one employee
5. Adds 10 overtime hours for two warehouse employees
6. Clicks "Process Payroll" → confirms the action
7. System calculates: gross, taxes (20%), deductions, net for each employee
8. Run status changes to "Completed"
9. Finance ledger auto-gains a "Payroll" expense entry for the total
10. Employees are notified via notification system
11. Admin goes to each payroll item → clicks "Mark as Paid"
```

### B.5 Financial Review (Owner)

```
1. Owner navigates to Finance
2. Dashboard shows: $125K revenue, $85K expenses, $40K net profit
3. Notices Marketing is at 96% of budget → clicks the alert
4. Filters ledger by category "Marketing" → reviews individual transactions
5. Decides to reduce Q2 marketing budget
6. Goes to Finance → Categories → adjusts budget limit for Marketing
7. Exports full monthly transactions as CSV for the accountant
```

---

_This document serves as the single source of truth for the Pulse platform. All development, testing, and product decisions should reference this specification._
