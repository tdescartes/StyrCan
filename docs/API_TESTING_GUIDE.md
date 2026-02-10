# StyrCan API Testing Guide

**Base URL:** `http://localhost:8000`

**API Documentation:** `http://localhost:8000/api/docs` (Swagger UI)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Employees](#employees)
4. [Finances](#finances)
5. [Payroll](#payroll)
6. [Messaging](#messaging)
7. [Notifications](#notifications)
8. [Settings](#settings)
9. [Common Response Codes](#common-response-codes)

---

## Authentication

### 1. Register Company

**Endpoint:** `POST /api/auth/register`

**Authentication:** None (Public)

**Request Body:**

```json
{
  "name": "My Company",
  "email": "company@example.com",
  "phone": "555-0123",
  "address": "123 Main St",
  "tax_id": "12-3456789",
  "admin_first_name": "John",
  "admin_last_name": "Doe",
  "admin_email": "john@example.com",
  "admin_password": "SecurePass123!"
}
```

**Success Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company_id": "uuid",
    "role": "company_admin",
    "is_active": true,
    "last_login": "2026-02-09T12:00:00",
    "created_at": "2026-02-09T12:00:00"
  },
  "company": {
    "id": "uuid",
    "name": "My Company",
    "email": "company@example.com",
    "phone": "555-0123",
    "address": "123 Main St",
    "tax_id": "12-3456789",
    "status": "active",
    "created_at": "2026-02-09T12:00:00"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Error Responses:**

- `400`: Company or user email already exists
- `422`: Validation error (invalid email, password too short, etc.)

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Authentication:** None (Public)

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company_id": "uuid",
    "role": "company_admin",
    "is_active": true,
    "last_login": "2026-02-09T12:00:00",
    "created_at": "2026-02-09T12:00:00"
  },
  "company": {...},
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Error Responses:**

- `401`: Incorrect email or password
- `403`: User account is inactive

---

### 3. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Authentication:** None (uses refresh token)

**Request Body:**

```json
{
  "refresh_token": "eyJ..."
}
```

**Success Response (200):**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Error Responses:**

- `401`: Invalid or expired refresh token

---

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (Bearer token)

**Headers:**

```
Authorization: Bearer eyJ...
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company_id": "uuid",
  "role": "company_admin",
  "is_active": true,
  "last_login": "2026-02-09T12:00:00",
  "created_at": "2026-02-09T12:00:00"
}
```

---

### 5. Update Profile

**Endpoint:** `PUT /api/auth/me`

**Authentication:** Required

**Request Body:**

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  ...
}
```

---

### 6. Change Password

**Endpoint:** `POST /api/auth/change-password`

**Authentication:** Required

**Request Body:**

```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

- `400`: Passwords don't match or current password incorrect

---

### 7. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Authentication:** None

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent",
  "reset_token": "eyJ..."
}
```

**Note:** `reset_token` is included for development only

---

### 8. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Authentication:** None (uses reset token)

**Request Body:**

```json
{
  "token": "eyJ...",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

---

### 9. Logout

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Success Response (200):**

```json
{
  "message": "Successfully logged out"
}
```

**Note:** Client should discard tokens after logout

---

## Dashboard

### 1. Get Dashboard Summary

**Endpoint:** `GET /api/dashboard`

**Authentication:** Required

**Success Response (200):**

```json
{
  "employee_stats": {
    "total": 50,
    "active": 45,
    "on_leave": 3,
    "new_this_month": 5
  },
  "financial_stats": {
    "total_income": "150000.00",
    "total_expenses": "80000.00",
    "net_profit": "70000.00",
    "profit_margin": 46.67
  },
  "payroll_stats": {
    "last_run_amount": "120000.00",
    "last_run_date": "2026-01-31",
    "pending_payments": 2,
    "total_this_year": "240000.00"
  },
  "pto_stats": {
    "pending_requests": 5,
    "approved_this_month": 8,
    "total_days_used": "120.5"
  },
  "upcoming_shifts": [
    {
      "employee_name": "John Doe",
      "date": "2026-02-10",
      "start_time": "2026-02-10T09:00:00",
      "end_time": "2026-02-10T17:00:00"
    }
  ],
  "recent_activities": []
}
```

---

### 2. Get Financial Charts

**Endpoint:** `GET /api/dashboard/charts/financial`

**Authentication:** Required

**Query Parameters:**

- `months` (optional): Number of months to include (default: 12)

**Success Response (200):**

```json
{
  "income_by_month": [
    { "label": "Jan 2026", "value": "50000.00" },
    { "label": "Feb 2026", "value": "55000.00" }
  ],
  "expenses_by_month": [
    { "label": "Jan 2026", "value": "30000.00" },
    { "label": "Feb 2026", "value": "35000.00" }
  ],
  "expenses_by_category": [
    { "label": "Salaries", "value": "40000.00" },
    { "label": "Operations", "value": "15000.00" }
  ]
}
```

---

## Employees

### 1. Get Employee Dashboard

**Endpoint:** `GET /api/employees/dashboard`

**Authentication:** Required

**Success Response (200):**

```json
{
  "total_employees": 50,
  "active_employees": 45,
  "on_leave": 3,
  "pending_pto_requests": 5,
  "recent_hires": 5,
  "departments": [
    { "name": "Engineering", "count": 20 },
    { "name": "Sales", "count": 15 }
  ]
}
```

---

### 2. List Employees

**Endpoint:** `GET /api/employees`

**Authentication:** Required

**Query Parameters:**

- `skip` (default: 0): Number of records to skip
- `limit` (default: 50, max: 100): Number of records to return
- `status` (optional): Filter by status (active, on_leave, terminated)
- `department` (optional): Filter by department
- `search` (optional): Search by name or email

**Success Response (200):**

```json
{
  "employees": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "user_id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "555-0123",
      "department": "Engineering",
      "position": "Software Engineer",
      "hire_date": "2025-01-15",
      "status": "active",
      "salary": "75000.00",
      "created_at": "2025-01-15T12:00:00"
    }
  ],
  "total": 50,
  "skip": 0,
  "limit": 50
}
```

---

### 3. Create Employee

**Endpoint:** `POST /api/employees`

**Authentication:** Required (Manager or Admin)

**Request Body:**

```json
{
  "user_id": "uuid",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "555-0124",
  "department": "Sales",
  "position": "Sales Manager",
  "hire_date": "2026-02-01",
  "salary": "80000.00",
  "status": "active"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "company_id": "uuid",
  "user_id": "uuid",
  "first_name": "Jane",
  "last_name": "Smith",
  ...
}
```

**Error Responses:**

- `400`: Employee with email already exists
- `403`: Insufficient permissions

---

### 4. Get Employee Details

**Endpoint:** `GET /api/employees/{employee_id}`

**Authentication:** Required

**Success Response (200):**

```json
{
  "employee": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    ...
  },
  "pto_balance": {
    "id": "uuid",
    "employee_id": "uuid",
    "year": 2026,
    "total_days": 20,
    "used_days": 5,
    "available_days": 15
  },
  "recent_pto_requests": [],
  "upcoming_shifts": []
}
```

---

### 5. Update Employee

**Endpoint:** `PUT /api/employees/{employee_id}`

**Authentication:** Required (Manager or Admin)

**Request Body:**

```json
{
  "department": "Engineering",
  "position": "Senior Software Engineer",
  "salary": "90000.00"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "department": "Engineering",
  "position": "Senior Software Engineer",
  ...
}
```

---

### 6. Delete Employee

**Endpoint:** `DELETE /api/employees/{employee_id}`

**Authentication:** Required (Manager or Admin)

**Success Response (204):** No content

---

### 7. Get PTO Requests

**Endpoint:** `GET /api/employees/pto-requests`

**Authentication:** Required

**Query Parameters:**

- `skip`, `limit`: Pagination
- `status`: Filter by status (pending, approved, rejected)
- `employee_id` (optional): Filter by specific employee

**Success Response (200):**

```json
{
  "requests": [
    {
      "id": "uuid",
      "employee_id": "uuid",
      "start_date": "2026-03-01",
      "end_date": "2026-03-05",
      "days_requested": 5,
      "reason": "Vacation",
      "status": "pending",
      "created_at": "2026-02-09T12:00:00"
    }
  ],
  "total": 10,
  "skip": 0,
  "limit": 50
}
```

---

### 8. Create PTO Request

**Endpoint:** `POST /api/employees/pto-requests`

**Authentication:** Required

**Request Body:**

```json
{
  "employee_id": "uuid",
  "start_date": "2026-03-01",
  "end_date": "2026-03-05",
  "reason": "Family vacation",
  "notes": "Optional notes"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "employee_id": "uuid",
  "start_date": "2026-03-01",
  "end_date": "2026-03-05",
  "days_requested": 5,
  "reason": "Family vacation",
  "status": "pending",
  "created_at": "2026-02-09T12:00:00"
}
```

---

### 9. Update PTO Request

**Endpoint:** `PUT /api/employees/pto-requests/{request_id}`

**Authentication:** Required (Manager or Admin for status changes)

**Request Body:**

```json
{
  "status": "approved",
  "reviewer_notes": "Enjoy your vacation!"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "status": "approved",
  "reviewed_at": "2026-02-09T12:00:00",
  "reviewed_by": "uuid",
  ...
}
```

---

### 10. Delete PTO Request

**Endpoint:** `DELETE /api/employees/pto-requests/{request_id}`

**Authentication:** Required

**Success Response (204):** No content

---

### 11. Get Shifts

**Endpoint:** `GET /api/employees/shifts`

**Authentication:** Required

**Query Parameters:**

- `skip`, `limit`: Pagination
- `employee_id` (optional): Filter by employee
- `start_date`, `end_date` (optional): Date range filter
- `status` (optional): scheduled, completed, cancelled

**Success Response (200):**

```json
{
  "shifts": [
    {
      "id": "uuid",
      "employee_id": "uuid",
      "shift_date": "2026-02-10",
      "start_time": "2026-02-10T09:00:00",
      "end_time": "2026-02-10T17:00:00",
      "total_hours": 8,
      "status": "scheduled",
      "notes": "Morning shift"
    }
  ],
  "total": 50,
  "skip": 0,
  "limit": 50
}
```

---

### 12. Create Shift

**Endpoint:** `POST /api/employees/shifts`

**Authentication:** Required (Manager or Admin)

**Request Body:**

```json
{
  "employee_id": "uuid",
  "shift_date": "2026-02-12",
  "start_time": "2026-02-12T09:00:00",
  "end_time": "2026-02-12T17:00:00",
  "notes": "Cover for Jane"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "employee_id": "uuid",
  "shift_date": "2026-02-12",
  "total_hours": 8,
  "status": "scheduled",
  ...
}
```

---

### 13. Update Shift

**Endpoint:** `PUT /api/employees/shifts/{shift_id}`

**Authentication:** Required (Manager or Admin)

**Request Body:**

```json
{
  "start_time": "2026-02-12T10:00:00",
  "end_time": "2026-02-12T18:00:00",
  "status": "completed"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "total_hours": 8,
  "status": "completed",
  ...
}
```

---

### 14. Delete Shift

**Endpoint:** `DELETE /api/employees/shifts/{shift_id}`

**Authentication:** Required (Manager or Admin)

**Success Response (204):** No content

---

## Finances

### 1. Get Finance Dashboard

**Endpoint:** `GET /api/finances/dashboard`

**Authentication:** Required

**Success Response (200):**

```json
{
  "current_month_income": "50000.00",
  "current_month_expenses": "30000.00",
  "current_month_net": "20000.00",
  "ytd_income": "500000.00",
  "ytd_expenses": "300000.00",
  "ytd_net": "200000.00",
  "top_expense_categories": [
    { "category": "Salaries", "total": "40000.00" },
    { "category": "Rent", "total": "10000.00" }
  ]
}
```

---

### 2. List Transactions

**Endpoint:** `GET /api/finances/transactions`

**Authentication:** Required

**Query Parameters:**

- `skip`, `limit`: Pagination
- `type` (optional): income or expense
- `category` (optional): Filter by category
- `start_date`, `end_date` (optional): Date range
- `search` (optional): Search in description

**Success Response (200):**

```json
{
  "transactions": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "type": "income",
      "amount": "5000.00",
      "category": "Sales",
      "description": "Monthly subscription revenue",
      "transaction_date": "2026-02-01",
      "reference_number": "INV-001",
      "created_by": "uuid",
      "created_at": "2026-02-01T12:00:00"
    }
  ],
  "total": 100,
  "skip": 0,
  "limit": 50
}
```

---

### 3. Create Transaction

**Endpoint:** `POST /api/finances/transactions`

**Authentication:** Required

**Request Body:**

```json
{
  "type": "expense",
  "amount": "1500.00",
  "category": "Office Supplies",
  "description": "Monthly office supplies",
  "transaction_date": "2026-02-09",
  "reference_number": "PO-123"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "type": "expense",
  "amount": "1500.00",
  ...
}
```

---

### 4. Get Transaction

**Endpoint:** `GET /api/finances/transactions/{transaction_id}`

**Authentication:** Required

**Success Response (200):**

```json
{
  "id": "uuid",
  "type": "expense",
  "amount": "1500.00",
  "category": "Office Supplies",
  ...
}
```

---

### 5. Update Transaction

**Endpoint:** `PUT /api/finances/transactions/{transaction_id}`

**Authentication:** Required

**Request Body:**

```json
{
  "amount": "1600.00",
  "description": "Updated description"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "amount": "1600.00",
  ...
}
```

---

### 6. Delete Transaction

**Endpoint:** `DELETE /api/finances/transactions/{transaction_id}`

**Authentication:** Required

**Success Response (204):** No content

---

### 7. Get Financial Summary

**Endpoint:** `GET /api/finances/summary`

**Authentication:** Required

**Query Parameters:**

- `start_date`, `end_date`: Date range (required)

**Success Response (200):**

```json
{
  "total_income": "100000.00",
  "total_expenses": "60000.00",
  "net_profit": "40000.00",
  "profit_margin": 40.0,
  "transaction_count": 150,
  "average_transaction": "666.67"
}
```

---

### 8. List Expense Categories

**Endpoint:** `GET /api/finances/expense-categories`

**Authentication:** Required

**Success Response (200):**

```json
{
  "categories": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "name": "Office Supplies",
      "description": "Pens, paper, etc.",
      "is_active": true,
      "created_at": "2026-01-01T12:00:00"
    }
  ],
  "total": 10
}
```

---

### 9. Create Expense Category

**Endpoint:** `POST /api/finances/expense-categories`

**Authentication:** Required (Manager or Admin)

**Request Body:**

```json
{
  "name": "Software Licenses",
  "description": "Annual software subscriptions"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "name": "Software Licenses",
  "is_active": true,
  ...
}
```

---

## Payroll

### 1. Get Payroll Dashboard

**Endpoint:** `GET /api/payroll/dashboard`

**Authentication:** Required

**Success Response (200):**

```json
{
  "current_payroll": {
    "id": "uuid",
    "period_start": "2026-02-01",
    "period_end": "2026-02-15",
    "status": "draft",
    "total_amount": "0.00"
  },
  "upcoming_payroll": null,
  "ytd_total_payroll": "240000.00",
  "employees_paid_this_year": 45,
  "recent_payroll_runs": []
}
```

---

### 2. List Payroll Runs

**Endpoint:** `GET /api/payroll/runs`

**Authentication:** Required

**Query Parameters:**

- `skip`, `limit`: Pagination
- `status_filter` (optional): draft, pending, processing, completed, cancelled
- `year` (optional): Filter by year

**Success Response (200):**

```json
{
  "payroll_runs": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "period_start": "2026-01-01",
      "period_end": "2026-01-15",
      "status": "completed",
      "total_amount": "120000.00",
      "processed_at": "2026-01-16T12:00:00",
      "created_at": "2026-01-01T12:00:00"
    }
  ],
  "total": 12,
  "skip": 0,
  "limit": 50
}
```

---

### 3. Create Payroll Run

**Endpoint:** `POST /api/payroll/runs`

**Authentication:** Required (Manager or Admin)

**Request Body:**

```json
{
  "period_start": "2026-02-16",
  "period_end": "2026-02-28"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "period_start": "2026-02-16",
  "period_end": "2026-02-28",
  "status": "draft",
  ...
}
```

**Error Responses:**

- `400`: Payroll run already exists for this period

---

### 4. Get Payroll Run Details

**Endpoint:** `GET /api/payroll/runs/{run_id}`

**Authentication:** Required

**Success Response (200):**

```json
{
  "payroll_run": {
    "id": "uuid",
    "period_start": "2026-02-01",
    "period_end": "2026-02-15",
    "status": "completed",
    "total_amount": "120000.00"
  },
  "items": [
    {
      "payroll_item": {
        "id": "uuid",
        "employee_id": "uuid",
        "base_salary": "5000.00",
        "overtime_pay": "500.00",
        "bonus": "1000.00",
        "deductions": "200.00",
        "tax_amount": "1200.00",
        "net_pay": "5100.00",
        "payment_status": "paid"
      },
      "employee_name": "John Doe",
      "employee_email": "john@example.com",
      "department": "Engineering"
    }
  ],
  "summary": {
    "total_base_salary": "100000.00",
    "total_overtime": "5000.00",
    "total_bonus": "10000.00",
    "total_deductions": "3000.00",
    "total_tax": "20000.00",
    "total_net_pay": "92000.00"
  }
}
```

---

### 5. Update Payroll Run

**Endpoint:** `PUT /api/payroll/runs/{run_id}`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "status": "processing"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "status": "processing",
  ...
}
```

---

### 6. Delete Payroll Run

**Endpoint:** `DELETE /api/payroll/runs/{run_id}`

**Authentication:** Required (Admin only)

**Success Response (204):** No content

**Error Responses:**

- `400`: Cannot delete completed payroll run

---

### 7. Process Payroll

**Endpoint:** `POST /api/payroll/runs/{run_id}/process`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "items": [
    {
      "employee_id": "uuid",
      "base_salary": "5000.00",
      "overtime_pay": "500.00",
      "bonus": "1000.00",
      "deductions": "200.00",
      "tax_amount": "1200.00"
    }
  ]
}
```

**Success Response (200):**

```json
{
  "payroll_run": {...},
  "items_created": 45,
  "total_amount": "120000.00"
}
```

---

### 8. List Payroll Items

**Endpoint:** `GET /api/payroll/items`

**Authentication:** Required

**Query Parameters:**

- `run_id` (optional): Filter by payroll run
- `employee_id` (optional): Filter by employee
- `skip`, `limit`: Pagination

**Success Response (200):**

```json
{
  "items": [
    {
      "id": "uuid",
      "payroll_run_id": "uuid",
      "employee_id": "uuid",
      "base_salary": "5000.00",
      "overtime_pay": "500.00",
      "bonus": "1000.00",
      "deductions": "200.00",
      "tax_amount": "1200.00",
      "net_pay": "5100.00",
      "payment_status": "pending"
    }
  ],
  "total": 45
}
```

---

### 9. Update Payment Status

**Endpoint:** `PATCH /api/payroll/items/{item_id}/payment-status`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "payment_status": "paid",
  "payment_date": "2026-02-16",
  "payment_method": "Direct Deposit"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "payment_status": "paid",
  "payment_date": "2026-02-16",
  ...
}
```

---

## Messaging

### 1. Send Message

**Endpoint:** `POST /api/messages/send`

**Authentication:** Required

**Request Body:**

```json
{
  "recipient_id": "uuid",
  "message_type": "direct",
  "thread_id": "optional-thread-id",
  "subject": "Meeting Tomorrow",
  "content": "Don't forget our meeting at 2 PM",
  "attachments": [
    {
      "name": "document.pdf",
      "url": "https://example.com/document.pdf"
    }
  ]
}
```

**Success Response (200):**

```json
{
  "id": "mongodb-id",
  "sender_id": "uuid",
  "recipient_id": "uuid",
  "company_id": "uuid",
  "message_type": "direct",
  "thread_id": "thread-id",
  "subject": "Meeting Tomorrow",
  "content": "Don't forget our meeting at 2 PM",
  "attachments": [],
  "status": "sent",
  "is_read": false,
  "sent_at": "2026-02-09T12:00:00",
  "read_at": null
}
```

---

### 2. Get Inbox

**Endpoint:** `GET /api/messages/inbox`

**Authentication:** Required

**Query Parameters:**

- `skip` (default: 0)
- `limit` (default: 50, max: 100)
- `unread_only` (default: false): Show only unread messages

**Success Response (200):**

```json
[
  {
    "id": "mongodb-id",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "subject": "Meeting Tomorrow",
    "content": "Don't forget our meeting",
    "is_read": false,
    "sent_at": "2026-02-09T12:00:00"
  }
]
```

---

### 3. Get Sent Messages

**Endpoint:** `GET /api/messages/sent`

**Authentication:** Required

**Query Parameters:**

- `skip`, `limit`: Pagination

**Success Response (200):**

```json
[
  {
    "id": "mongodb-id",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "subject": "Meeting Tomorrow",
    "status": "read",
    ...
  }
]
```

---

### 4. Get Thread

**Endpoint:** `GET /api/messages/thread/{thread_id}`

**Authentication:** Required

**Success Response (200):**

```json
[
  {
    "id": "mongodb-id",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "thread_id": "thread-id",
    "content": "First message",
    "sent_at": "2026-02-09T10:00:00"
  },
  {
    "id": "mongodb-id",
    "sender_id": "uuid",
    "recipient_id": "uuid",
    "thread_id": "thread-id",
    "content": "Reply message",
    "sent_at": "2026-02-09T11:00:00"
  }
]
```

---

### 5. Mark as Read

**Endpoint:** `PATCH /api/messages/{message_id}/read`

**Authentication:** Required

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Message marked as read"
}
```

---

### 6. Delete Message

**Endpoint:** `DELETE /api/messages/{message_id}`

**Authentication:** Required

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Message deleted"
}
```

---

## Notifications

### 1. Create Notification

**Endpoint:** `POST /api/notifications/create`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "user_id": "uuid",
  "type": "info",
  "title": "System Update",
  "message": "System will be under maintenance tonight",
  "data": {},
  "action_url": "/settings"
}
```

**Success Response (200):**

```json
{
  "id": "mongodb-id",
  "user_id": "uuid",
  "company_id": "uuid",
  "type": "info",
  "title": "System Update",
  "message": "System will be under maintenance tonight",
  "is_read": false,
  "created_at": "2026-02-09T12:00:00"
}
```

---

### 2. Get Notifications

**Endpoint:** `GET /api/notifications`

**Authentication:** Required

**Query Parameters:**

- `skip`, `limit`: Pagination
- `unread_only` (default: false)
- `type_filter` (optional): info, warning, error, success, payroll, pto, shift, message

**Success Response (200):**

```json
[
  {
    "id": "mongodb-id",
    "user_id": "uuid",
    "type": "payroll",
    "title": "Payroll Processed",
    "message": "Your payroll for February has been processed",
    "is_read": false,
    "action_url": "/payroll",
    "created_at": "2026-02-09T12:00:00",
    "read_at": null
  }
]
```

---

### 3. Mark Notification as Read

**Endpoint:** `PATCH /api/notifications/{notification_id}/read`

**Authentication:** Required

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Notification marked as read"
}
```

---

### 4. Mark All as Read

**Endpoint:** `POST /api/notifications/mark-all-read`

**Authentication:** Required

**Success Response (200):**

```json
{
  "status": "success",
  "count": 12
}
```

---

### 5. Delete Notification

**Endpoint:** `DELETE /api/notifications/{notification_id}`

**Authentication:** Required

**Success Response (200):**

```json
{
  "status": "success",
  "message": "Notification deleted"
}
```

---

### 6. Get Unread Count

**Endpoint:** `GET /api/notifications/unread-count`

**Authentication:** Required

**Success Response (200):**

```json
{
  "unread_count": 5
}
```

---

## Settings

### 1. Get Company Settings

**Endpoint:** `GET /api/settings/company`

**Authentication:** Required

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "My Company",
  "email": "company@example.com",
  "phone": "555-0123",
  "address": "123 Main St",
  "tax_id": "12-3456789",
  "status": "active",
  "created_at": "2026-01-01T12:00:00"
}
```

---

### 2. Update Company Settings

**Endpoint:** `PUT /api/settings/company`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "name": "Updated Company Name",
  "phone": "555-9999",
  "address": "456 New Street"
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "Updated Company Name",
  "phone": "555-9999",
  ...
}
```

---

### 3. List Company Users

**Endpoint:** `GET /api/settings/users`

**Authentication:** Required (Admin only)

**Success Response (200):**

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "employee",
      "is_active": true,
      "last_login": "2026-02-09T12:00:00"
    }
  ],
  "total": 15
}
```

---

### 4. Invite User

**Endpoint:** `POST /api/settings/users/invite`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "employee"
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "employee",
  "is_active": true
}
```

**Note:** In production, this sends an invitation email with temporary password

---

### 5. Update User

**Endpoint:** `PUT /api/settings/users/{user_id}`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "role": "manager",
  "is_active": true
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "role": "manager",
  "is_active": true,
  ...
}
```

---

### 6. Delete User

**Endpoint:** `DELETE /api/settings/users/{user_id}`

**Authentication:** Required (Admin only)

**Success Response (204):** No content

**Note:** Cannot delete yourself

---

## Common Response Codes

### Success Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **204 No Content**: Request succeeded with no response body

### Client Error Codes

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error

### Server Error Codes

- **500 Internal Server Error**: Unexpected server error

---

## Authentication Headers

All authenticated endpoints require the following header:

```
Authorization: Bearer {access_token}
```

Example:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Testing with PowerShell

### Example: Register and Login

```powershell
# Register
$registerBody = @{
    name = "Test Company"
    email = "test@example.com"
    admin_first_name = "John"
    admin_last_name = "Doe"
    admin_email = "john@example.com"
    admin_password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/register' -Method Post -Body $registerBody -ContentType 'application/json'
$token = $response.access_token

# Use the token for authenticated requests
$headers = @{
    Authorization = "Bearer $token"
}

$dashboard = Invoke-RestMethod -Uri 'http://localhost:8000/api/dashboard' -Headers $headers
$dashboard
```

---

## Testing with curl

### Example: Create Employee

```bash
curl -X POST "http://localhost:8000/api/employees" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "department": "Engineering",
    "position": "Developer",
    "hire_date": "2026-02-01",
    "salary": "75000.00"
  }'
```

---

## Notes

1. **UUID Issue**: There's currently a Pydantic validation issue where UUIDs from the database are not being converted to strings. This affects responses that include model data. **Fix in progress**.

2. **MongoDB Fields**: Some endpoints use MongoDB for logging and messaging. These use MongoDB ObjectIds which are returned as strings.

3. **Dates**: All dates are in ISO 8601 format (YYYY-MM-DD for dates, YYYY-MM-DDTHH:MM:SS for datetimes).

4. **Decimal Fields**: Financial amounts are returned as strings to preserve precision (e.g., "5000.00").

5. **Pagination**: Most list endpoints support pagination with `skip` and `limit` query parameters.

6. **Role-Based Access**: Some endpoints require specific roles:
   - `employee`: Basic access
   - `manager`: Can manage employees, shifts, PTO
   - `company_admin`: Full access to all company data
   - `super_admin`: System-level access

---

## Known Issues

1. **UUID Serialization**: Model responses may fail due to UUID not being converted to string. Need to ensure all IDs are strings in model definitions.

2. **CORS**: CORS is configured for `localhost:3000`, `localhost:3001`, and `127.0.0.1:3000`.

3. **bcrypt Version**: Using bcrypt 4.0.1 for compatibility with passlib 1.7.4.

---

## Frontend Integration Checklist

- [ ] Update API client base URL to `http://localhost:8000`
- [ ] Store access token in localStorage or secure cookie
- [ ] Include Bearer token in all authenticated requests
- [ ] Handle 401 responses by redirecting to login
- [ ] Implement token refresh logic
- [ ] Handle validation errors (422) and display to user
- [ ] Convert string decimals to numbers for display
- [ ] Format dates appropriately for user's locale
- [ ] Implement pagination controls for list endpoints
- [ ] Handle loading states during API calls
- [ ] Display error messages from API responses

---

**Last Updated:** February 9, 2026
**API Version:** 1.0.0
**Backend Status:** Development (Debug mode enabled)
