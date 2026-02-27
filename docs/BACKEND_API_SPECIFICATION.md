# Pulse Backend API Specification

> **Version:** 1.0.0  
> **Last Updated:** February 5, 2026  
> **Status:** Implementation Ready  
> **Frontend Alignment:** Service-Oriented Architecture (4 Service Packages)

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication Service](#2-authentication-service)
3. [Employees Service API](#3-employees-service-api)
4. [Finance Service API](#4-finance-service-api)
5. [Payroll Service API](#5-payroll-service-api)
6. [Communication Service API](#6-communication-service-api)
7. [Settings & Billing API](#7-settings--billing-api)
8. [Database Schema](#8-database-schema)
9. [Subscription & Feature Gating](#9-subscription--feature-gating)
10. [Real-time Events (WebSocket)](#10-real-time-events-websocket)
11. [Error Handling](#11-error-handling)
12. [Rate Limiting](#12-rate-limiting)

---

## 1. API Overview

### Base Configuration

| Property       | Value                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| **Base URL**   | `http://localhost:8000/api` (development) / `https://api.pulse.com/api` (production) |
| **Protocol**   | HTTP (dev) / HTTPS (production)                                                      |
| **Format**     | JSON                                                                                 |
| **Encoding**   | UTF-8                                                                                |
| **Versioning** | No version prefix                                                                    |

### Authentication Headers

```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
Accept: application/json
```

> **Note:** Company context is extracted from the JWT token — no separate `X-Company-ID` header is needed.

### Response Patterns

The API does **not** use a single standard response wrapper. Response shapes vary by endpoint type:

- **Auth endpoints** (`/auth/login`, `/auth/register`, `/auth/me`): Return Pydantic models directly as flat JSON objects.
- **Mutation endpoints** (create, update, delete): Return `{"success": true, "message": "..."}` or `{"status": "success", "message": "..."}` patterns.
- **File endpoints**: Return `{"success": true, "file": {...}}`.
- **List endpoints**: Return Pydantic response models or JSON arrays directly.

**Example — Login Response (POST `/auth/login`):**

```json
{
  "user": {
    "id": "...",
    "company_id": "...",
    "email": "admin@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "company_admin",
    "is_active": true,
    "employee_id": null,
    "last_login": "2026-02-05T10:30:00Z",
    "created_at": "2026-02-05T10:00:00Z"
  },
  "company": {
    "id": "...",
    "name": "Acme Corp",
    "email": "admin@company.com",
    "phone": null,
    "address": null,
    "tax_id": null,
    "status": "active",
    "created_at": "2026-02-05T10:00:00Z"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Error Response:**

```json
{
  "detail": "Invalid email or password"
}
```

---

## 2. Authentication Service

### Endpoints Overview

| Method | Endpoint                | Description                  | Auth Required       |
| ------ | ----------------------- | ---------------------------- | ------------------- |
| POST   | `/auth/register`        | Register new company & admin | No                  |
| POST   | `/auth/login`           | User login                   | No                  |
| POST   | `/auth/logout`          | Invalidate tokens            | Yes                 |
| POST   | `/auth/refresh`         | Refresh access token         | Yes (refresh token) |
| POST   | `/auth/forgot-password` | Request password reset       | No                  |
| POST   | `/auth/reset-password`  | Reset password with token    | No                  |
| GET    | `/auth/me`              | Get current user profile     | Yes                 |
| PUT    | `/auth/me`              | Update current user profile  | Yes                 |
| POST   | `/auth/change-password` | Change password              | Yes                 |

---

### 2.1 Register Company & Admin

**POST** `/auth/register`

Creates a new company and the initial admin user.

**Request Body:**

```json
{
  "name": "Acme Corp",
  "email": "admin@acmecorp.com",
  "phone": "+1-555-123-4567",
  "address": "123 Main St",
  "tax_id": "12-3456789",
  "admin_first_name": "John",
  "admin_last_name": "Doe",
  "admin_email": "admin@acmecorp.com",
  "admin_password": "SecurePassword123!"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "...",
    "company_id": "...",
    "email": "admin@acmecorp.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "company_admin",
    "is_active": true,
    "employee_id": null,
    "last_login": null,
    "created_at": "2026-02-05T10:30:00Z"
  },
  "company": {
    "id": "...",
    "name": "Acme Corp",
    "email": "admin@acmecorp.com",
    "phone": "+1-555-123-4567",
    "address": "123 Main St",
    "tax_id": "12-3456789",
    "status": "active",
    "created_at": "2026-02-05T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### 2.2 Login

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "admin@acmecorp.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "...",
    "company_id": "...",
    "email": "admin@acmecorp.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "company_admin",
    "is_active": true,
    "employee_id": null,
    "last_login": "2026-02-05T10:30:00Z",
    "created_at": "2026-02-05T10:00:00Z"
  },
  "company": {
    "id": "...",
    "name": "Acme Corp",
    "email": "admin@acmecorp.com",
    "phone": null,
    "address": null,
    "tax_id": null,
    "status": "active",
    "created_at": "2026-02-05T10:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### 2.3 Refresh Token

**POST** `/auth/refresh`

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

### 2.4 Forgot Password

**POST** `/auth/forgot-password`

**Request Body:**

```json
{
  "email": "admin@acmecorp.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a reset link has been sent."
  }
}
```

---

### 2.5 Reset Password

**POST** `/auth/reset-password`

**Request Body:**

```json
{
  "token": "reset_token_abc123",
  "new_password": "NewSecurePassword456!",
  "confirm_password": "NewSecurePassword456!"
}
```

---

## 3. Employees Service API

> **Frontend Routes:** `/employees/*`  
> **Feature Package:** Employees Service

### Endpoints Overview

| Method | Endpoint               | Description          | Permission         |
| ------ | ---------------------- | -------------------- | ------------------ |
| GET    | `/employees`           | List employees       | `employees:read`   |
| POST   | `/employees`           | Create employee      | `employees:write`  |
| GET    | `/employees/:id`       | Get employee details | `employees:read`   |
| PUT    | `/employees/:id`       | Update employee      | `employees:write`  |
| DELETE | `/employees/:id`       | Delete employee      | `employees:delete` |
| GET    | `/employees/dashboard` | Dashboard KPIs       | `employees:read`   |
| GET    | `/employees/export`    | Export to CSV        | `employees:export` |

#### Schedule Endpoints

| Method | Endpoint                 | Description               | Permission         |
| ------ | ------------------------ | ------------------------- | ------------------ |
| GET    | `/schedules`             | List shifts               | `schedules:read`   |
| POST   | `/schedules`             | Create shift              | `schedules:write`  |
| PUT    | `/schedules/:id`         | Update shift              | `schedules:write`  |
| DELETE | `/schedules/:id`         | Delete shift              | `schedules:delete` |
| GET    | `/schedules/calendar`    | Calendar view             | `schedules:read`   |
| POST   | `/schedules/auto-assign` | Auto-assign shifts ⭐ Pro | `schedules:auto`   |

#### PTO/Time Off Endpoints

| Method | Endpoint           | Description        | Permission    |
| ------ | ------------------ | ------------------ | ------------- |
| GET    | `/pto`             | List PTO requests  | `pto:read`    |
| POST   | `/pto`             | Submit PTO request | `pto:write`   |
| PUT    | `/pto/:id`         | Update PTO request | `pto:write`   |
| PUT    | `/pto/:id/approve` | Approve PTO        | `pto:approve` |
| PUT    | `/pto/:id/reject`  | Reject PTO         | `pto:approve` |
| GET    | `/pto/balances`    | Get PTO balances   | `pto:read`    |

#### Reviews Endpoints (Professional+)

| Method | Endpoint       | Description        | Permission      |
| ------ | -------------- | ------------------ | --------------- |
| GET    | `/reviews`     | List reviews       | `reviews:read`  |
| POST   | `/reviews`     | Create review      | `reviews:write` |
| GET    | `/reviews/:id` | Get review details | `reviews:read`  |
| PUT    | `/reviews/:id` | Update review      | `reviews:write` |

---

### 3.1 List Employees

**GET** `/employees`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (default: 1) |
| `per_page` | int | Items per page (default: 20, max: 100) |
| `search` | string | Search by name or email |
| `department` | string | Filter by department |
| `status` | string | Filter: `active`, `inactive`, `on_leave` |
| `sort_by` | string | Sort field: `name`, `hire_date`, `department` |
| `sort_order` | string | `asc` or `desc` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "emp_abc123",
      "first_name": "Jane",
      "last_name": "Smith",
      "full_name": "Jane Smith",
      "email": "jane.smith@acmecorp.com",
      "phone": "+1-555-987-6543",
      "department": "Engineering",
      "position": "Senior Developer",
      "status": "active",
      "hire_date": "2024-03-15",
      "avatar_url": "https://storage.pulse.com/avatars/emp_abc123.jpg",
      "manager": {
        "id": "emp_def456",
        "full_name": "Bob Johnson"
      },
      "pto_balance": {
        "vacation": 15,
        "sick": 10,
        "personal": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 45,
    "total_pages": 3
  }
}
```

---

### 3.2 Create Employee

**POST** `/employees`

**Request Body:**

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@acmecorp.com",
  "phone": "+1-555-987-6543",
  "department": "Engineering",
  "position": "Senior Developer",
  "hire_date": "2024-03-15",
  "salary": 95000,
  "salary_type": "annual", // annual | hourly
  "manager_id": "emp_def456",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "emergency_contact": {
    "name": "John Smith",
    "relationship": "spouse",
    "phone": "+1-555-111-2222"
  },
  "pto_policy": {
    "vacation_days": 15,
    "sick_days": 10,
    "personal_days": 3
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "emp_abc123",
    "first_name": "Jane",
    "last_name": "Smith",
    // ... full employee object
    "created_at": "2026-02-05T10:30:00Z"
  }
}
```

---

### 3.3 Employee Dashboard KPIs

**GET** `/employees/dashboard`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_employees": 45,
      "active_employees": 42,
      "on_leave": 3,
      "new_hires_this_month": 2,
      "pending_pto_requests": 5,
      "open_shifts": 8,
      "upcoming_reviews": 3
    },
    "recent_hires": [
      {
        "id": "emp_new123",
        "full_name": "Alice Brown",
        "department": "Marketing",
        "hire_date": "2026-01-20",
        "avatar_url": "..."
      }
    ],
    "pto_alerts": [
      {
        "employee_id": "emp_abc123",
        "employee_name": "Jane Smith",
        "type": "vacation",
        "start_date": "2026-02-10",
        "end_date": "2026-02-14",
        "status": "pending"
      }
    ],
    "upcoming_birthdays": [
      {
        "employee_id": "emp_xyz789",
        "employee_name": "Bob Johnson",
        "birthday": "2026-02-08"
      }
    ],
    "department_breakdown": [
      { "department": "Engineering", "count": 15 },
      { "department": "Sales", "count": 10 },
      { "department": "Marketing", "count": 8 },
      { "department": "HR", "count": 5 },
      { "department": "Finance", "count": 7 }
    ]
  }
}
```

---

### 3.4 Schedule / Shift Management

**GET** `/schedules/calendar`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | date | Start of range (ISO 8601) |
| `end_date` | date | End of range (ISO 8601) |
| `employee_id` | string | Filter by employee |
| `department` | string | Filter by department |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "shifts": [
      {
        "id": "shift_abc123",
        "employee_id": "emp_xyz789",
        "employee_name": "Jane Smith",
        "date": "2026-02-06",
        "start_time": "09:00",
        "end_time": "17:00",
        "break_minutes": 60,
        "location": "Main Office",
        "status": "scheduled", // scheduled | completed | no_show
        "notes": "Cover for Bob"
      }
    ],
    "summary": {
      "total_shifts": 150,
      "total_hours": 1200,
      "coverage_gaps": [
        {
          "date": "2026-02-08",
          "shift_type": "morning",
          "department": "Support"
        }
      ]
    }
  }
}
```

---

### 3.5 PTO Request Management

**POST** `/pto`

**Request Body:**

```json
{
  "type": "vacation", // vacation | sick | personal | bereavement | other
  "start_date": "2026-02-10",
  "end_date": "2026-02-14",
  "reason": "Family vacation",
  "half_day_start": false,
  "half_day_end": false
}
```

**PUT** `/pto/:id/approve`

**Request Body:**

```json
{
  "notes": "Approved. Enjoy your vacation!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "pto_abc123",
    "employee_id": "emp_xyz789",
    "type": "vacation",
    "start_date": "2026-02-10",
    "end_date": "2026-02-14",
    "days_requested": 5,
    "status": "approved",
    "approved_by": "usr_admin123",
    "approved_at": "2026-02-05T11:00:00Z",
    "notes": "Approved. Enjoy your vacation!"
  }
}
```

---

## 4. Finance Service API

> **Frontend Routes:** `/finance/*`  
> **Feature Package:** Finance Service

### Endpoints Overview

| Method | Endpoint              | Description             | Permission        |
| ------ | --------------------- | ----------------------- | ----------------- |
| GET    | `/transactions`       | List transactions       | `finance:read`    |
| POST   | `/transactions`       | Create transaction      | `finance:write`   |
| GET    | `/transactions/:id`   | Get transaction         | `finance:read`    |
| PUT    | `/transactions/:id`   | Update transaction      | `finance:write`   |
| DELETE | `/transactions/:id`   | Delete transaction      | `finance:delete`  |
| GET    | `/finance/dashboard`  | Dashboard KPIs          | `finance:read`    |
| GET    | `/finance/categories` | List categories         | `finance:read`    |
| POST   | `/finance/categories` | Create category         | `finance:write`   |
| GET    | `/finance/reports`    | Generate reports ⭐ Pro | `finance:reports` |
| GET    | `/finance/budgets`    | List budgets ⭐ Pro     | `budgets:read`    |
| POST   | `/finance/budgets`    | Create budget ⭐ Pro    | `budgets:write`   |

---

### 4.1 List Transactions (Ledger)

**GET** `/transactions`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `per_page` | int | Items per page |
| `type` | string | `income`, `expense`, `transfer` |
| `category_id` | string | Filter by category |
| `start_date` | date | From date |
| `end_date` | date | To date |
| `min_amount` | decimal | Minimum amount |
| `max_amount` | decimal | Maximum amount |
| `search` | string | Search description |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "type": "expense",
      "amount": 1500.00,
      "currency": "USD",
      "description": "Office supplies",
      "category": {
        "id": "cat_xyz789",
        "name": "Office & Supplies",
        "icon": "📦",
        "color": "#3B82F6"
      },
      "date": "2026-02-01",
      "payment_method": "company_card",
      "vendor": "Staples",
      "receipt_url": "https://storage.pulse.com/receipts/txn_abc123.pdf",
      "tags": ["Q1", "operations"],
      "created_by": "usr_xyz789",
      "created_at": "2026-02-01T14:30:00Z",
      "ai_tags": ["office", "supplies", "recurring"]  // Pro feature
    }
  ],
  "pagination": { ... },
  "summary": {
    "total_income": 50000.00,
    "total_expenses": 35000.00,
    "net_balance": 15000.00
  }
}
```

---

### 4.2 Create Transaction

**POST** `/transactions`

**Request Body:**

```json
{
  "type": "expense",
  "amount": 1500.0,
  "currency": "USD",
  "description": "Office supplies for Q1",
  "category_id": "cat_xyz789",
  "date": "2026-02-01",
  "payment_method": "company_card",
  "vendor": "Staples",
  "receipt": "<base64_encoded_file>", // Optional
  "tags": ["Q1", "operations"],
  "recurring": {
    "enabled": true,
    "frequency": "monthly", // weekly | monthly | quarterly | yearly
    "end_date": "2026-12-31"
  }
}
```

---

### 4.3 Finance Dashboard KPIs

**GET** `/finance/dashboard`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | `week`, `month`, `quarter`, `year` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_revenue": 125000.0,
      "total_expenses": 85000.0,
      "net_profit": 40000.0,
      "profit_margin": 32.0,
      "revenue_change": 12.5, // % vs previous period
      "expense_change": -5.2,
      "pending_invoices": 3,
      "overdue_invoices": 1
    },
    "cash_flow": {
      "current_balance": 250000.0,
      "projected_end_of_month": 275000.0,
      "burn_rate": 2800.0 // daily average
    },
    "revenue_by_month": [
      { "month": "2026-01", "amount": 45000.0 },
      { "month": "2026-02", "amount": 50000.0 }
    ],
    "expenses_by_category": [
      { "category": "Payroll", "amount": 45000.0, "percentage": 52.9 },
      { "category": "Office", "amount": 12000.0, "percentage": 14.1 },
      { "category": "Software", "amount": 8000.0, "percentage": 9.4 },
      { "category": "Marketing", "amount": 10000.0, "percentage": 11.8 },
      { "category": "Other", "amount": 10000.0, "percentage": 11.8 }
    ],
    "recent_transactions": [
      // Last 5 transactions
    ],
    "budget_alerts": [
      {
        "category": "Marketing",
        "budget": 15000.0,
        "spent": 14500.0,
        "percentage": 96.7,
        "status": "warning"
      }
    ]
  }
}
```

---

### 4.4 Budget Management (Professional+)

**GET** `/finance/budgets`

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "budget_abc123",
      "name": "Q1 2026 Operating Budget",
      "period": {
        "start": "2026-01-01",
        "end": "2026-03-31"
      },
      "total_budget": 100000.0,
      "total_spent": 65000.0,
      "remaining": 35000.0,
      "categories": [
        {
          "category_id": "cat_payroll",
          "category_name": "Payroll",
          "budget": 50000.0,
          "spent": 45000.0,
          "remaining": 5000.0,
          "percentage": 90.0
        }
      ],
      "status": "on_track" // on_track | warning | over_budget
    }
  ]
}
```

**POST** `/finance/budgets`

**Request Body:**

```json
{
  "name": "Q1 2026 Operating Budget",
  "period": {
    "start": "2026-01-01",
    "end": "2026-03-31"
  },
  "categories": [
    { "category_id": "cat_payroll", "amount": 50000.0 },
    { "category_id": "cat_office", "amount": 15000.0 },
    { "category_id": "cat_software", "amount": 10000.0 },
    { "category_id": "cat_marketing", "amount": 15000.0 },
    { "category_id": "cat_other", "amount": 10000.0 }
  ],
  "alerts": {
    "warning_threshold": 80, // Alert at 80% spent
    "critical_threshold": 95
  }
}
```

---

## 5. Payroll Service API

> **Frontend Routes:** `/payroll/*`  
> **Feature Package:** Payroll Service

### Endpoints Overview

| Method | Endpoint                    | Description                 | Permission        |
| ------ | --------------------------- | --------------------------- | ----------------- |
| GET    | `/payroll/dashboard`        | Dashboard KPIs              | `payroll:read`    |
| GET    | `/payroll/runs`             | List payroll runs           | `payroll:read`    |
| POST   | `/payroll/runs`             | Create payroll run          | `payroll:write`   |
| GET    | `/payroll/runs/:id`         | Get run details             | `payroll:read`    |
| PUT    | `/payroll/runs/:id`         | Update run                  | `payroll:write`   |
| POST   | `/payroll/runs/:id/process` | Process run ⭐ Pro          | `payroll:process` |
| POST   | `/payroll/runs/:id/approve` | Approve run                 | `payroll:approve` |
| GET    | `/payroll/history`          | Payment history             | `payroll:read`    |
| GET    | `/payroll/employees/:id`    | Employee payroll            | `payroll:read`    |
| GET    | `/payroll/tax-documents`    | Tax documents ⭐ Enterprise | `payroll:taxes`   |

---

### 5.1 Payroll Dashboard

**GET** `/payroll/dashboard`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "kpis": {
      "next_payroll_date": "2026-02-15",
      "days_until_payroll": 10,
      "estimated_gross": 125000.0,
      "estimated_net": 95000.0,
      "estimated_taxes": 30000.0,
      "employees_in_next_run": 45,
      "pending_adjustments": 3,
      "ytd_payroll_total": 250000.0
    },
    "upcoming_run": {
      "id": "run_upcoming",
      "period": {
        "start": "2026-02-01",
        "end": "2026-02-15"
      },
      "pay_date": "2026-02-15",
      "status": "draft",
      "employees": 45,
      "estimated_total": 125000.0
    },
    "recent_runs": [
      {
        "id": "run_abc123",
        "period": { "start": "2026-01-16", "end": "2026-01-31" },
        "pay_date": "2026-01-31",
        "status": "completed",
        "total_gross": 120000.0,
        "total_net": 92000.0
      }
    ],
    "pending_items": [
      {
        "type": "bonus",
        "employee_name": "Jane Smith",
        "amount": 5000.0,
        "reason": "Q1 performance bonus"
      }
    ]
  }
}
```

---

### 5.2 List Payroll Runs

**GET** `/payroll/runs`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `draft`, `pending`, `approved`, `processing`, `completed`, `failed` |
| `year` | int | Filter by year |
| `page` | int | Page number |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "run_abc123",
      "period": {
        "start": "2026-01-16",
        "end": "2026-01-31"
      },
      "pay_date": "2026-01-31",
      "status": "completed",
      "type": "regular", // regular | off_cycle | bonus
      "summary": {
        "employee_count": 45,
        "total_hours": 3600,
        "gross_pay": 120000.0,
        "total_deductions": 28000.0,
        "total_taxes": 25000.0,
        "employer_taxes": 9500.0,
        "net_pay": 92000.0
      },
      "created_by": "usr_admin123",
      "approved_by": "usr_owner456",
      "processed_at": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

### 5.3 Create Payroll Run

**POST** `/payroll/runs`

**Request Body:**

```json
{
  "period": {
    "start": "2026-02-01",
    "end": "2026-02-15"
  },
  "pay_date": "2026-02-15",
  "type": "regular",
  "include_employees": "all", // all | selected
  "employee_ids": [], // If selected
  "adjustments": [
    {
      "employee_id": "emp_xyz789",
      "type": "bonus",
      "amount": 5000.0,
      "description": "Q1 performance bonus",
      "taxable": true
    }
  ]
}
```

---

### 5.4 Payroll Run Details

**GET** `/payroll/runs/:id`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "run_abc123",
    "period": { "start": "2026-01-16", "end": "2026-01-31" },
    "pay_date": "2026-01-31",
    "status": "completed",
    "summary": {
      "employee_count": 45,
      "gross_pay": 120000.0,
      "net_pay": 92000.0
    },
    "employees": [
      {
        "employee_id": "emp_xyz789",
        "employee_name": "Jane Smith",
        "department": "Engineering",
        "pay_type": "salary",
        "hours_worked": 80,
        "regular_pay": 4000.0,
        "overtime_pay": 0,
        "bonus": 500.0,
        "gross_pay": 4500.0,
        "deductions": {
          "federal_tax": 675.0,
          "state_tax": 225.0,
          "social_security": 279.0,
          "medicare": 65.25,
          "health_insurance": 150.0,
          "401k": 180.0
        },
        "total_deductions": 1574.25,
        "net_pay": 2925.75,
        "payment_method": "direct_deposit",
        "bank_last_four": "1234"
      }
    ],
    "tax_summary": {
      "federal_withholding": 15000.0,
      "state_withholding": 5000.0,
      "social_security_employee": 7440.0,
      "social_security_employer": 7440.0,
      "medicare_employee": 1740.0,
      "medicare_employer": 1740.0,
      "futa": 420.0,
      "suta": 2100.0
    }
  }
}
```

---

### 5.5 Process Payroll Run (Professional+)

**POST** `/payroll/runs/:id/process`

Initiates automatic payment processing via integrated payment provider.

**Request Body:**

```json
{
  "confirm": true,
  "notify_employees": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "run_abc123",
    "status": "processing",
    "processing_started_at": "2026-02-15T08:00:00Z",
    "estimated_completion": "2026-02-15T12:00:00Z",
    "payment_batch_id": "batch_xyz789"
  }
}
```

---

### 5.6 Employee Payroll History

**GET** `/payroll/employees/:employee_id`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "emp_xyz789",
      "full_name": "Jane Smith",
      "department": "Engineering",
      "position": "Senior Developer",
      "pay_type": "salary",
      "salary": 95000.0,
      "pay_frequency": "biweekly"
    },
    "ytd_summary": {
      "gross_pay": 45000.0,
      "federal_tax": 6750.0,
      "state_tax": 2250.0,
      "social_security": 2790.0,
      "medicare": 652.5,
      "other_deductions": 3300.0,
      "net_pay": 29257.5
    },
    "payment_history": [
      {
        "run_id": "run_abc123",
        "pay_date": "2026-01-31",
        "gross_pay": 4500.0,
        "net_pay": 2925.75,
        "stub_url": "https://storage.pulse.com/paystubs/..."
      }
    ],
    "tax_documents": [
      {
        "type": "W-2",
        "year": 2025,
        "status": "available",
        "download_url": "https://storage.pulse.com/tax-docs/..."
      }
    ]
  }
}
```

---

## 6. Communication Service API

> **Frontend Routes:** `/communication/*`  
> **Feature Package:** Communication Service

### Endpoints Overview

| Method | Endpoint                 | Description             | Permission         |
| ------ | ------------------------ | ----------------------- | ------------------ |
| GET    | `/messages`              | List conversations      | `messages:read`    |
| POST   | `/messages`              | Send message            | `messages:write`   |
| GET    | `/messages/threads/:id`  | Get thread              | `messages:read`    |
| PUT    | `/messages/:id/read`     | Mark as read            | `messages:write`   |
| DELETE | `/messages/:id`          | Delete message          | `messages:delete`  |
| GET    | `/messages/unread-count` | Unread count            | `messages:read`    |
| GET    | `/broadcasts`            | List broadcasts ⭐ Pro  | `broadcasts:read`  |
| POST   | `/broadcasts`            | Create broadcast ⭐ Pro | `broadcasts:write` |
| GET    | `/files`                 | List shared files       | `files:read`       |
| POST   | `/files`                 | Upload file             | `files:write`      |

---

### 6.1 Communication Dashboard

**GET** `/communication/dashboard`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "kpis": {
      "unread_messages": 12,
      "active_threads": 8,
      "recent_broadcasts": 2,
      "shared_files": 45,
      "storage_used": 1.2, // GB
      "storage_limit": 5 // GB (plan dependent)
    },
    "recent_messages": [
      {
        "thread_id": "thread_abc123",
        "last_message": {
          "id": "msg_xyz789",
          "sender": {
            "id": "usr_abc123",
            "name": "John Doe",
            "avatar_url": "..."
          },
          "preview": "Can you review the Q1 report...",
          "sent_at": "2026-02-05T09:30:00Z",
          "is_read": false
        },
        "participants": [
          { "id": "usr_abc123", "name": "John Doe" },
          { "id": "usr_xyz789", "name": "Jane Smith" }
        ]
      }
    ],
    "recent_broadcasts": [
      {
        "id": "broadcast_abc123",
        "title": "Company Holiday Schedule",
        "priority": "normal",
        "sent_by": "HR Team",
        "sent_at": "2026-02-01T10:00:00Z",
        "read_count": 42,
        "total_recipients": 45
      }
    ]
  }
}
```

---

### 6.2 List Conversations (Inbox)

**GET** `/messages`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | `direct`, `group`, `all` |
| `unread_only` | boolean | Show only unread |
| `search` | string | Search messages |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "thread_id": "thread_abc123",
      "type": "direct",
      "participants": [
        {
          "user_id": "usr_xyz789",
          "name": "Jane Smith",
          "avatar_url": "...",
          "online": true
        }
      ],
      "last_message": {
        "id": "msg_latest",
        "content": "Thanks for the update!",
        "sent_at": "2026-02-05T10:15:00Z",
        "sender_id": "usr_xyz789"
      },
      "unread_count": 2,
      "is_muted": false,
      "is_pinned": false
    }
  ]
}
```

---

### 6.3 Get Thread Messages

**GET** `/messages/threads/:thread_id`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `before` | string | Message ID for pagination |
| `limit` | int | Number of messages (default: 50) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "thread": {
      "id": "thread_abc123",
      "type": "direct",
      "participants": [ ... ],
      "created_at": "2026-01-15T10:00:00Z"
    },
    "messages": [
      {
        "id": "msg_abc123",
        "content": "Hey, can you check the Q1 report?",
        "content_type": "text",  // text | file | image | system
        "sender": {
          "id": "usr_abc123",
          "name": "John Doe",
          "avatar_url": "..."
        },
        "sent_at": "2026-02-05T09:30:00Z",
        "edited_at": null,
        "read_by": [
          { "user_id": "usr_xyz789", "read_at": "2026-02-05T09:31:00Z" }
        ],
        "reactions": [
          { "emoji": "👍", "count": 1, "users": ["usr_xyz789"] }
        ],
        "attachments": []
      }
    ],
    "has_more": true
  }
}
```

---

### 6.4 Send Message

**POST** `/messages`

**Request Body (Text Message):**

```json
{
  "thread_id": "thread_abc123", // Existing thread
  "content": "Here's the updated report!",
  "attachments": []
}
```

**Request Body (New Direct Message):**

```json
{
  "recipient_id": "usr_xyz789",
  "content": "Hi! Do you have a moment?",
  "attachments": []
}
```

**Request Body (New Group):**

```json
{
  "type": "group",
  "name": "Project Alpha Team",
  "participant_ids": ["usr_abc123", "usr_xyz789", "usr_def456"],
  "content": "Welcome to the project team!",
  "attachments": []
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg_new123",
      "thread_id": "thread_abc123",
      "content": "Here's the updated report!",
      "sender": { ... },
      "sent_at": "2026-02-05T10:30:00Z"
    }
  }
}
```

---

### 6.5 Broadcasts (Professional+)

**POST** `/broadcasts`

**Request Body:**

```json
{
  "title": "Company Holiday Schedule",
  "content": "Please note the updated holiday schedule for 2026...",
  "priority": "normal", // low | normal | high | urgent
  "target": "all", // all | departments | selected
  "department_ids": [], // If target is departments
  "user_ids": [], // If target is selected
  "schedule": {
    "send_at": "2026-02-06T09:00:00Z", // null for immediate
    "timezone": "America/New_York"
  },
  "require_acknowledgment": true,
  "attachments": []
}
```

---

### 6.6 File Sharing

**GET** `/files`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | `document`, `image`, `video`, `other` |
| `shared_by` | string | User ID filter |
| `search` | string | Search filename |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "file_abc123",
      "name": "Q1-Report-2026.pdf",
      "type": "document",
      "mime_type": "application/pdf",
      "size": 2456789, // bytes
      "url": "https://storage.pulse.com/files/...",
      "thumbnail_url": "https://storage.pulse.com/thumbs/...",
      "uploaded_by": {
        "id": "usr_abc123",
        "name": "John Doe"
      },
      "uploaded_at": "2026-02-01T10:00:00Z",
      "shared_in": [
        { "thread_id": "thread_abc123", "thread_name": "Project Alpha" }
      ]
    }
  ],
  "storage": {
    "used": 1200000000, // bytes
    "limit": 5000000000, // bytes (5GB for Standard)
    "percentage": 24.0
  }
}
```

**POST** `/files`

**Request (multipart/form-data):**

```
file: <binary>
thread_id: thread_abc123  // Optional
description: Q1 Financial Report
```

---

## 7. Settings & Billing API

> **Frontend Routes:** `/settings/*`  
> **Global Module**

### Endpoints Overview

#### Profile Endpoints

| Method | Endpoint                  | Description               |
| ------ | ------------------------- | ------------------------- |
| GET    | `/users/me`               | Get profile               |
| PUT    | `/users/me`               | Update profile            |
| PUT    | `/users/me/avatar`        | Update avatar             |
| PUT    | `/users/me/password`      | Change password           |
| PUT    | `/users/me/notifications` | Update notification prefs |

#### Company Endpoints

| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| GET    | `/company`                | Get company details |
| PUT    | `/company`                | Update company      |
| PUT    | `/company/logo`           | Update logo         |
| GET    | `/company/members`        | List members        |
| POST   | `/company/members/invite` | Invite member       |
| DELETE | `/company/members/:id`    | Remove member       |

#### Billing Endpoints

| Method | Endpoint                | Description             |
| ------ | ----------------------- | ----------------------- |
| GET    | `/billing/subscription` | Get subscription        |
| GET    | `/billing/plans`        | List available plans    |
| POST   | `/billing/checkout`     | Create checkout session |
| POST   | `/billing/portal`       | Get customer portal URL |
| GET    | `/billing/invoices`     | List invoices           |
| GET    | `/billing/usage`        | Get usage stats         |

---

### 7.1 User Profile

**GET** `/users/me`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "john.doe@acmecorp.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+1-555-123-4567",
    "avatar_url": "https://storage.pulse.com/avatars/...",
    "role": "admin",
    "permissions": [
      "employees:*",
      "finance:*",
      "payroll:*",
      "messages:*",
      "settings:*"
    ],
    "company": {
      "id": "comp_abc123",
      "name": "Acme Corp",
      "role": "admin"
    },
    "preferences": {
      "theme": "system",
      "language": "en",
      "timezone": "America/New_York",
      "date_format": "MM/DD/YYYY",
      "notifications": {
        "email": {
          "payroll_processed": true,
          "pto_requests": true,
          "new_messages": false
        },
        "push": {
          "payroll_processed": true,
          "pto_requests": true,
          "new_messages": true
        }
      }
    },
    "created_at": "2024-01-15T10:00:00Z",
    "last_login": "2026-02-05T09:00:00Z"
  }
}
```

---

### 7.2 Company Settings

**GET** `/company`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "comp_abc123",
    "name": "Acme Corp",
    "legal_name": "Acme Corporation Inc.",
    "slug": "acme-corp",
    "logo_url": "https://storage.pulse.com/logos/...",
    "industry": "technology",
    "size": "11-50",
    "founded": 2020,
    "website": "https://acmecorp.com",
    "address": {
      "street": "123 Business Ave",
      "suite": "Suite 500",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "contact": {
      "email": "contact@acmecorp.com",
      "phone": "+1-555-000-0000"
    },
    "tax_info": {
      "ein": "**-***1234", // Masked
      "tax_year_end": "12-31"
    },
    "payroll_settings": {
      "pay_frequency": "biweekly",
      "default_pay_day": "friday",
      "overtime_after": 40,
      "overtime_rate": 1.5
    },
    "member_count": 23,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### 7.3 Billing & Subscription

**GET** `/billing/subscription`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "plan_professional",
      "name": "Professional",
      "price": 129.0,
      "currency": "USD",
      "interval": "month",
      "member_limit": 50
    },
    "status": "active",
    "current_period": {
      "start": "2026-02-01T00:00:00Z",
      "end": "2026-02-28T23:59:59Z"
    },
    "usage": {
      "members": {
        "current": 23,
        "limit": 50,
        "percentage": 46.0
      },
      "storage": {
        "current_gb": 12.5,
        "limit_gb": 50,
        "percentage": 25.0
      }
    },
    "add_ons": [
      {
        "id": "addon_analytics",
        "name": "Analytics Pack",
        "price": 49.0,
        "status": "active"
      }
    ],
    "payment_method": {
      "type": "card",
      "brand": "visa",
      "last_four": "4242",
      "exp_month": 12,
      "exp_year": 2027
    },
    "billing_email": "billing@acmecorp.com",
    "next_invoice": {
      "date": "2026-03-01",
      "amount": 178.0
    },
    "cancel_at_period_end": false
  }
}
```

---

### 7.4 Available Plans

**GET** `/billing/plans`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_standard",
        "name": "Standard",
        "description": "Essential tools for small teams",
        "price": {
          "monthly": 49.0,
          "yearly": 490.0 // 2 months free
        },
        "currency": "USD",
        "member_limit": 5,
        "storage_gb": 5,
        "features": [
          "employee_directory",
          "basic_scheduling",
          "financial_ledger",
          "standard_reports",
          "direct_messages",
          "email_support"
        ],
        "popular": false
      },
      {
        "id": "plan_professional",
        "name": "Professional",
        "description": "Complete solution for growing businesses",
        "price": {
          "monthly": 129.0,
          "yearly": 1290.0
        },
        "currency": "USD",
        "member_limit": 50,
        "storage_gb": 50,
        "features": [
          "all_standard_features",
          "shift_logic_auto",
          "performance_reviews",
          "ai_finance_tags",
          "budget_planning",
          "automated_payroll",
          "tax_calculations",
          "direct_deposit",
          "broadcasts",
          "message_archive",
          "priority_support"
        ],
        "popular": true
      },
      {
        "id": "plan_enterprise",
        "name": "Enterprise",
        "description": "Tailored solutions for large organizations",
        "price": "custom",
        "member_limit": "unlimited",
        "storage_gb": "unlimited",
        "features": [
          "all_professional_features",
          "advanced_analytics",
          "w2_1099_generation",
          "api_access",
          "custom_integrations",
          "sso_saml",
          "audit_logs",
          "dedicated_account_manager",
          "sla_guarantee"
        ],
        "popular": false,
        "contact_sales": true
      }
    ],
    "add_ons": [
      {
        "id": "addon_employees_pro",
        "name": "Employees Pro",
        "description": "Shift Logic, Performance Reviews, Advanced Scheduling",
        "price": 29.0,
        "requires_plan": ["standard"]
      },
      {
        "id": "addon_finance_pro",
        "name": "Finance Pro",
        "description": "AI Finance Tags, Budget Planning, Custom Reports",
        "price": 29.0,
        "requires_plan": ["standard"]
      },
      {
        "id": "addon_payroll_pro",
        "name": "Payroll Pro",
        "description": "Automated Payroll, Tax Calculations, Direct Deposit",
        "price": 39.0,
        "requires_plan": ["standard"]
      },
      {
        "id": "addon_analytics",
        "name": "Analytics Pack",
        "description": "Advanced dashboards, data exports, trend analysis",
        "price": 49.0,
        "requires_plan": ["standard", "professional"]
      }
    ]
  }
}
```

---

### 7.5 Create Checkout Session

**POST** `/billing/checkout`

**Request Body:**

```json
{
  "plan_id": "plan_professional",
  "interval": "yearly",
  "add_on_ids": ["addon_analytics"],
  "success_url": "https://app.pulse.com/settings/billing?success=true",
  "cancel_url": "https://app.pulse.com/settings/billing?canceled=true"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "checkout_url": "https://checkout.stripe.com/c/pay/cs_live_...",
    "session_id": "cs_live_abc123"
  }
}
```

---

## 8. Database Schema

### Core Tables

```sql
-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    slug VARCHAR(100) UNIQUE NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    logo_url TEXT,
    website TEXT,
    address JSONB,
    contact JSONB,
    tax_info JSONB,  -- Encrypted
    payroll_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'employee',  -- admin, manager, employee
    permissions TEXT[],
    preferences JSONB,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),  -- Nullable for non-system users
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id UUID REFERENCES employees(id),
    hire_date DATE,
    termination_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    salary DECIMAL(12,2),
    salary_type VARCHAR(20),  -- annual, hourly
    address JSONB,
    emergency_contact JSONB,
    pto_policy JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules/Shifts
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 0,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PTO Requests
CREATE TABLE pto_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- vacation, sick, personal, etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(4,1),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (Finance)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- income, expense, transfer
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    category_id UUID REFERENCES categories(id),
    date DATE NOT NULL,
    payment_method VARCHAR(50),
    vendor VARCHAR(255),
    receipt_url TEXT,
    tags TEXT[],
    ai_tags TEXT[],
    recurring_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (Finance)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),  -- income, expense
    icon VARCHAR(10),
    color VARCHAR(7),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets (Finance)
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount DECIMAL(12,2),
    category_allocations JSONB,
    alert_settings JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Runs
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'regular',
    status VARCHAR(50) DEFAULT 'draft',
    summary JSONB,
    tax_summary JSONB,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    payment_batch_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Items (per employee per run)
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    hours_worked DECIMAL(6,2),
    regular_pay DECIMAL(12,2),
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    gross_pay DECIMAL(12,2),
    deductions JSONB,
    total_deductions DECIMAL(12,2),
    net_pay DECIMAL(12,2),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    plan_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    payment_method JSONB,
    add_ons TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_transactions_company_date ON transactions(company_id, date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_schedules_company_date ON schedules(company_id, date);
CREATE INDEX idx_payroll_runs_company ON payroll_runs(company_id);
CREATE INDEX idx_pto_requests_employee ON pto_requests(employee_id);
```

### MongoDB Collections (Messaging)

```javascript
// messages collection
{
  _id: ObjectId,
  thread_id: ObjectId,
  company_id: UUID,
  sender_id: UUID,
  content: String,
  content_type: "text" | "file" | "image" | "system",
  attachments: [{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  read_by: [{
    user_id: UUID,
    read_at: ISODate
  }],
  reactions: [{
    emoji: String,
    user_id: UUID,
    created_at: ISODate
  }],
  edited_at: ISODate,
  deleted_at: ISODate,
  created_at: ISODate
}

// threads collection
{
  _id: ObjectId,
  company_id: UUID,
  type: "direct" | "group",
  name: String,  // For group chats
  participants: [{
    user_id: UUID,
    role: "admin" | "member",
    joined_at: ISODate,
    muted: Boolean,
    last_read_at: ISODate
  }],
  last_message_at: ISODate,
  created_by: UUID,
  created_at: ISODate,
  updated_at: ISODate
}

// broadcasts collection
{
  _id: ObjectId,
  company_id: UUID,
  title: String,
  content: String,
  priority: "low" | "normal" | "high" | "urgent",
  target: {
    type: "all" | "departments" | "selected",
    department_ids: [UUID],
    user_ids: [UUID]
  },
  attachments: [...],
  require_acknowledgment: Boolean,
  acknowledgments: [{
    user_id: UUID,
    acknowledged_at: ISODate
  }],
  scheduled_at: ISODate,
  sent_at: ISODate,
  created_by: UUID,
  created_at: ISODate
}

// Indexes
db.messages.createIndex({ thread_id: 1, created_at: -1 })
db.messages.createIndex({ company_id: 1 })
db.threads.createIndex({ company_id: 1, "participants.user_id": 1 })
db.threads.createIndex({ last_message_at: -1 })
db.broadcasts.createIndex({ company_id: 1, sent_at: -1 })
```

---

## 9. Subscription & Feature Gating

### Feature Keys

```python
FEATURE_KEYS = {
    # Employees Service
    "employees.directory": ["standard", "professional", "enterprise"],
    "employees.scheduling.basic": ["standard", "professional", "enterprise"],
    "employees.scheduling.auto_assign": ["professional", "enterprise"],
    "employees.pto": ["standard", "professional", "enterprise"],
    "employees.reviews": ["professional", "enterprise"],

    # Finance Service
    "finance.ledger": ["standard", "professional", "enterprise"],
    "finance.categories": ["standard", "professional", "enterprise"],
    "finance.reports.standard": ["standard", "professional", "enterprise"],
    "finance.ai_tags": ["professional", "enterprise"],
    "finance.budgets": ["professional", "enterprise"],
    "finance.analytics": ["enterprise"],

    # Payroll Service
    "payroll.view": ["standard", "professional", "enterprise"],
    "payroll.manual": ["standard", "professional", "enterprise"],
    "payroll.automated": ["professional", "enterprise"],
    "payroll.tax_calculations": ["professional", "enterprise"],
    "payroll.direct_deposit": ["professional", "enterprise"],
    "payroll.tax_documents": ["enterprise"],

    # Communication Service
    "comms.messages": ["standard", "professional", "enterprise"],
    "comms.groups": ["standard", "professional", "enterprise"],
    "comms.broadcasts": ["professional", "enterprise"],
    "comms.file_sharing": ["standard", "professional", "enterprise"],
    "comms.archive": ["professional", "enterprise"],

    # Platform
    "api.access": ["enterprise"],
    "sso.saml": ["enterprise"],
    "audit.logs": ["enterprise"],
}
```

### Feature Gating Middleware

```python
# middleware/feature_gate.py

from functools import wraps
from fastapi import HTTPException, status

def require_feature(feature_key: str):
    """Decorator to gate endpoints by feature access."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user and subscription from request context
            request = kwargs.get('request')
            subscription = request.state.subscription

            if not has_feature_access(subscription, feature_key):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "FEATURE_NOT_AVAILABLE",
                        "message": f"This feature requires an upgrade",
                        "feature": feature_key,
                        "required_plan": get_minimum_plan(feature_key),
                        "current_plan": subscription.plan_id,
                        "upgrade_url": "/settings/billing"
                    }
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def has_feature_access(subscription, feature_key: str) -> bool:
    """Check if subscription has access to feature."""
    allowed_plans = FEATURE_KEYS.get(feature_key, [])

    # Check base plan
    if subscription.plan_id in allowed_plans:
        return True

    # Check add-ons
    for addon in subscription.add_ons:
        if feature_key in ADDON_FEATURES.get(addon, []):
            return True

    return False
```

### Usage in Routes

```python
# routers/payroll.py

@router.post("/runs/{run_id}/process")
@require_feature("payroll.automated")
async def process_payroll_run(
    run_id: UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    """Process payroll run - Professional+ only"""
    # ... implementation
```

---

## 10. Real-time Events (WebSocket)

### Connection

```javascript
// WebSocket connection with authentication
const socket = io("wss://api.pulse.com", {
  auth: {
    token: "jwt_access_token",
  },
  query: {
    company_id: "comp_abc123",
  },
});
```

### Event Types

#### Message Events

```javascript
// Incoming message
socket.on("message:new", {
  thread_id: "thread_abc123",
  message: {
    id: "msg_xyz789",
    content: "Hello!",
    sender: { id: "usr_abc123", name: "John" },
    sent_at: "2026-02-05T10:30:00Z",
  },
});

// Message read receipt
socket.on("message:read", {
  thread_id: "thread_abc123",
  message_id: "msg_xyz789",
  user_id: "usr_abc123",
  read_at: "2026-02-05T10:31:00Z",
});

// Typing indicator
socket.on("typing:start", {
  thread_id: "thread_abc123",
  user: { id: "usr_abc123", name: "John" },
});

socket.on("typing:stop", {
  thread_id: "thread_abc123",
  user_id: "usr_abc123",
});
```

#### Notification Events

```javascript
// PTO request submitted
socket.on("pto:submitted", {
  request_id: "pto_abc123",
  employee_name: "Jane Smith",
  type: "vacation",
  dates: "Feb 10-14, 2026",
});

// Payroll processed
socket.on("payroll:processed", {
  run_id: "run_abc123",
  pay_date: "2026-02-15",
  employee_count: 45,
});

// New broadcast
socket.on("broadcast:new", {
  id: "broadcast_abc123",
  title: "Company Update",
  priority: "high",
});
```

### Emitting Events

```javascript
// Send message
socket.emit(
  "message:send",
  {
    thread_id: "thread_abc123",
    content: "Hello!",
    attachments: [],
  },
  (response) => {
    if (response.success) {
      console.log("Message sent:", response.message_id);
    }
  },
);

// Start typing
socket.emit("typing:start", { thread_id: "thread_abc123" });

// Mark messages as read
socket.emit("message:read", {
  thread_id: "thread_abc123",
  message_ids: ["msg_1", "msg_2"],
});
```

---

## 11. Error Handling

### Error Codes

| Code                      | HTTP Status | Description                               |
| ------------------------- | ----------- | ----------------------------------------- |
| `VALIDATION_ERROR`        | 400         | Invalid request data                      |
| `AUTHENTICATION_REQUIRED` | 401         | No/invalid token                          |
| `TOKEN_EXPIRED`           | 401         | JWT token expired                         |
| `PERMISSION_DENIED`       | 403         | Insufficient permissions                  |
| `FEATURE_NOT_AVAILABLE`   | 403         | Feature requires upgrade                  |
| `NOT_FOUND`               | 404         | Resource not found                        |
| `CONFLICT`                | 409         | Resource conflict (e.g., duplicate email) |
| `RATE_LIMITED`            | 429         | Too many requests                         |
| `INTERNAL_ERROR`          | 500         | Server error                              |
| `SERVICE_UNAVAILABLE`     | 503         | Service temporarily unavailable           |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_format"
      },
      {
        "field": "salary",
        "message": "Must be a positive number",
        "code": "invalid_value"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-05T10:30:00Z",
    "request_id": "req_abc123",
    "documentation_url": "https://docs.pulse.com/errors/VALIDATION_ERROR"
  }
}
```

---

## 12. Rate Limiting

### Limits by Endpoint Category

| Category           | Limit        | Window    |
| ------------------ | ------------ | --------- |
| Authentication     | 10 requests  | 1 minute  |
| Read operations    | 100 requests | 1 minute  |
| Write operations   | 30 requests  | 1 minute  |
| File uploads       | 10 requests  | 1 minute  |
| Exports            | 5 requests   | 5 minutes |
| WebSocket messages | 60 messages  | 1 minute  |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707134400
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 45
  }
}
```

---

## Appendix A: API Client Integration

### Frontend API Client Configuration

```typescript
// lib/api/client.ts

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.pulse.com/api/v1";

class APIClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<APIResponse<T>> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(data.error);
    }

    return data;
  }

  // Service-specific methods
  employees = {
    list: (params?: EmployeeListParams) =>
      this.request<Employee[]>(`/employees?${new URLSearchParams(params)}`),
    create: (data: CreateEmployeeDTO) =>
      this.request<Employee>("/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    // ... more methods
  };

  finance = {
    transactions: {
      list: (params?: TransactionListParams) =>
        this.request<Transaction[]>(
          `/transactions?${new URLSearchParams(params)}`,
        ),
      create: (data: CreateTransactionDTO) =>
        this.request<Transaction>("/transactions", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
    // ... more methods
  };

  // ... payroll, communication, settings
}

export const api = new APIClient(API_BASE_URL);
```

---

## Appendix B: Deployment Configuration

### Environment Variables

```bash
# Backend .env
DATABASE_URL=postgresql://user:pass@localhost:5432/pulse
MONGODB_URL=mongodb://localhost:27017/pulse
REDIS_URL=redis://localhost:6379/0

JWT_SECRET=your-super-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=pulse-storage

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=...
```

### Docker Compose Services

```yaml
services:
  api:
    build: ./backend
    environment:
      - DATABASE_URL
      - MONGODB_URL
      - REDIS_URL
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - mongodb
      - redis

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: pulse
      POSTGRES_USER: pulse
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

---

## Document History

| Version | Date       | Author     | Changes               |
| ------- | ---------- | ---------- | --------------------- |
| 1.0.0   | 2026-02-05 | Pulse Team | Initial specification |

---

**Next Steps:**

1. Review API specification with frontend team
2. Update existing backend routers to match spec
3. Implement missing endpoints
4. Add feature gating middleware
5. Set up Stripe billing integration
6. Configure WebSocket server
7. Write API integration tests
