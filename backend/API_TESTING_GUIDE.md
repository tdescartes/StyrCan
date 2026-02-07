# StyrCan Backend - API Testing Guide

Quick reference for testing the StyrCan backend API with example requests.

## 🚀 Getting Started

### Start the Server

```bash
uvicorn app.main:app --reload
```

Server will be running at: **http://localhost:8000**

API Documentation: **http://localhost:8000/api/docs**

---

## 📍 Test Endpoints

### 1. Health Check

```bash
curl http://localhost:8000/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "app": "StyrCan",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 🔐 Authentication Flow

### 1. Register Company & Admin User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "email": "contact@acmecorp.com",
    "phone": "+1-555-0123",
    "address": "123 Business St, New York, NY 10001",
    "tax_id": "12-3456789",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "john.doe@acmecorp.com",
    "admin_password": "SecurePassword123!"
  }'
```

**Save the tokens from the response!**

---

### 2. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@acmecorp.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**

```json
{
  "user": {
    "id": "user_123",
    "email": "john.doe@acmecorp.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "company_admin"
  },
  "company": {
    "id": "company_123",
    "name": "Acme Corporation"
  },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

**Export token for subsequent requests:**

```bash
export TOKEN="your_access_token_here"
```

---

### 3. Get Current User

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Update Profile

```bash
curl -X PUT http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jonathan",
    "last_name": "Doe"
  }'
```

---

### 5. Change Password

```bash
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "SecurePassword123!",
    "new_password": "NewSecurePassword456!",
    "confirm_password": "NewSecurePassword456!"
  }'
```

---

## 👥 Employee Management

### 1. Create Employee

```bash
curl -X POST http://localhost:8000/api/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@acmecorp.com",
    "phone": "+1-555-0124",
    "position": "Software Engineer",
    "department": "Engineering",
    "hire_date": "2026-01-15",
    "employment_type": "full_time",
    "salary_amount": 85000.00
  }'
```

---

### 2. List Employees

```bash
curl -X GET "http://localhost:8000/api/employees?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**With Filters:**

```bash
curl -X GET "http://localhost:8000/api/employees?department=Engineering&status=active" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Get Employee Dashboard

```bash
curl -X GET http://localhost:8000/api/employees/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Create PTO Request

```bash
curl -X POST "http://localhost:8000/api/employees/{employee_id}/pto-requests" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2026-03-01",
    "end_date": "2026-03-05",
    "reason": "Family vacation"
  }'
```

---

### 5. Create Shift

```bash
curl -X POST http://localhost:8000/api/employees/shifts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "employee_id_here",
    "shift_date": "2026-02-10",
    "start_time": "2026-02-10T09:00:00",
    "end_time": "2026-02-10T17:00:00",
    "notes": "Regular shift"
  }'
```

---

### 6. Export Employees

```bash
curl -X GET http://localhost:8000/api/employees/export \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💰 Finance Management

### 1. Create Income Transaction

```bash
curl -X POST http://localhost:8000/api/finances/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "income",
    "category": "Sales",
    "amount": 5000.00,
    "description": "Project payment from Client ABC",
    "transaction_date": "2026-02-05"
  }'
```

---

### 2. Create Expense Transaction

```bash
curl -X POST http://localhost:8000/api/finances/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "category": "Office Supplies",
    "amount": 250.00,
    "description": "Office supplies purchase",
    "transaction_date": "2026-02-05"
  }'
```

---

### 3. List Transactions

```bash
curl -X GET "http://localhost:8000/api/finances/transactions?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**With Filters:**

```bash
curl -X GET "http://localhost:8000/api/finances/transactions?type=expense&start_date=2026-01-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Get Finance Dashboard

```bash
curl -X GET http://localhost:8000/api/finances/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Get Financial Summary

```bash
curl -X GET "http://localhost:8000/api/finances/summary?start_date=2026-01-01&end_date=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Get Financial Trends

```bash
curl -X GET "http://localhost:8000/api/finances/trends?months=6" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. Create Expense Category

```bash
curl -X POST http://localhost:8000/api/finances/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing",
    "description": "Marketing and advertising expenses",
    "budget_limit": 10000.00
  }'
```

---

## 💵 Payroll Management

### 1. Create Payroll Run

```bash
curl -X POST http://localhost:8000/api/payroll/runs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2026-02-01",
    "period_end": "2026-02-28"
  }'
```

**Save the payroll run ID from the response!**

---

### 2. Process Payroll

```bash
curl -X POST "http://localhost:8000/api/payroll/runs/{run_id}/process" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "include_all_employees": true
  }'
```

---

### 3. Get Payroll Run Details

```bash
curl -X GET "http://localhost:8000/api/payroll/runs/{run_id}" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. List Payroll Runs

```bash
curl -X GET "http://localhost:8000/api/payroll/runs?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Get Payroll Dashboard

```bash
curl -X GET http://localhost:8000/api/payroll/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Get Employee Payroll History

```bash
curl -X GET "http://localhost:8000/api/payroll/employees/{employee_id}/history" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. Mark Payroll Item as Paid

```bash
curl -X POST "http://localhost:8000/api/payroll/items/{item_id}/mark-paid" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💬 Communication

### 1. Send Message

```bash
curl -X POST http://localhost:8000/api/messages/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "user_id_here",
    "message_type": "direct",
    "subject": "Weekly Team Meeting",
    "content": "Hi team, reminder about our weekly meeting tomorrow at 10 AM.",
    "thread_id": null
  }'
```

---

### 2. Get Inbox

```bash
curl -X GET "http://localhost:8000/api/messages/inbox?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Get Unread Only:**

```bash
curl -X GET "http://localhost:8000/api/messages/inbox?unread_only=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Get Sent Messages

```bash
curl -X GET "http://localhost:8000/api/messages/sent?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Get Thread Messages

```bash
curl -X GET "http://localhost:8000/api/messages/thread/{thread_id}" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Mark Message as Read

```bash
curl -X PATCH "http://localhost:8000/api/messages/{message_id}/read" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Get Unread Count

```bash
curl -X GET http://localhost:8000/api/messages/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Dashboard & Analytics

### 1. Get Complete Dashboard

```bash
curl -X GET http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Get Dashboard Charts

```bash
curl -X GET "http://localhost:8000/api/dashboard/charts?months=6" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Get Quick Summary

```bash
curl -X GET http://localhost:8000/api/dashboard/summary/quick \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚙️ Settings & Administration

### 1. Get Company Information

```bash
curl -X GET http://localhost:8000/api/settings/company \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Update Company Information

```bash
curl -X PUT http://localhost:8000/api/settings/company \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation Inc.",
    "phone": "+1-555-9999",
    "address": "456 New Business Ave, New York, NY 10001"
  }'
```

---

### 3. List Company Users

```bash
curl -X GET http://localhost:8000/api/settings/users \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Invite User

```bash
curl -X POST http://localhost:8000/api/settings/users/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@acmecorp.com",
    "first_name": "Alice",
    "last_name": "Johnson",
    "role": "manager"
  }'
```

---

### 5. Update User

```bash
curl -X PUT "http://localhost:8000/api/settings/users/{user_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "company_admin",
    "is_active": true
  }'
```

---

### 6. Get Billing Information

```bash
curl -X GET http://localhost:8000/api/settings/billing \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. Get Notification Preferences

```bash
curl -X GET http://localhost:8000/api/settings/notifications/preferences \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testing with Postman

### Import Collection

1. Open Postman
2. Click "Import"
3. Create new collection: "StyrCan API"
4. Set collection variable:
   - Key: `baseUrl`
   - Value: `http://localhost:8000`
5. Set authorization (Bearer Token) at collection level
6. Add requests using examples above

### Environment Variables

```json
{
  "baseUrl": "http://localhost:8000",
  "token": "{{access_token}}",
  "companyId": "{{company_id}}",
  "userId": "{{user_id}}"
}
```

---

## 🐛 Common Issues

### 1. 401 Unauthorized

- Token expired → Use refresh token endpoint
- Invalid token → Re-login
- Missing Authorization header

### 2. 403 Forbidden

- Insufficient permissions
- Check user role (admin, manager, employee)

### 3. 400 Bad Request

- Invalid JSON format
- Missing required fields
- Validation errors (check response for details)

### 4. 404 Not Found

- Invalid employee_id, run_id, etc.
- Resource doesn't exist
- Check IDs in URL

### 5. 500 Internal Server Error

- Database connection issues
- Check logs: `logs/app.log`

---

## 📝 Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

### Paginated Response

```json
{
  "items": [ ... ],
  "total": 100,
  "skip": 0,
  "limit": 20
}
```

---

## 🔗 API Documentation

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 💡 Tips

1. **Use Swagger UI** for interactive testing
2. **Save tokens** after login for subsequent requests
3. **Check response status codes** for debugging
4. **Use query parameters** for filtering and pagination
5. **Set proper Content-Type** headers for JSON requests
6. **Export token as environment variable** for command-line testing

---

**Happy Testing! 🚀**
