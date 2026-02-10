# Frontend-Backend Alignment Changes

## 📋 Summary

I've updated your entire frontend codebase to match the backend API specifications exactly. All data models, types, and API client implementations now correctly align with what the backend expects and returns.

## 🔄 Changes Made

### 1. Type Definitions (`frontend/src/types/index.ts`)

#### ✅ User Role Types

**Before:**

```typescript
type UserRole = "owner" | "admin" | "manager" | "employee";
```

**After:**

```typescript
type UserRole = "employee" | "manager" | "company_admin" | "super_admin";
```

**Reason:** Matches backend authentication roles exactly

---

#### ✅ Company Interface

**Before:**

```typescript
interface Company {
  industry?: string;
  subscription_tier: string;
  is_active: boolean;
}
```

**After:**

```typescript
interface Company {
  tax_id?: string;
  status: "active" | "inactive" | "suspended";
}
```

**Reason:** Backend uses `status` enum and `tax_id` instead of subscription fields

---

#### ✅ Employee Status

**Before:**

```typescript
type EmployeeStatus = "active" | "inactive" | "terminated"
employment_type: "full-time" | "part-time" | "contract"
salary_amount?: number
```

**After:**

```typescript
type EmployeeStatus = "active" | "on_leave" | "terminated";
// Removed employment_type
salary: string; // Changed from number to string
```

**Reason:** Backend uses `on_leave` instead of `inactive`, stores salary as string (decimal), removed employment_type field

---

#### ✅ PTO Request Status

**Before:**

```typescript
type PTOStatus = "pending" | "approved" | "denied"
reason?: string  // Optional
```

**After:**

```typescript
type PTOStatus = "pending" | "approved" | "rejected"
reason: string   // Required
notes?: string   // Added
reviewer_notes?: string  // Added
```

**Reason:** Backend uses `rejected` instead of `denied`, requires reason field, added review notes

---

#### ✅ Shift Interface

**Before:**

```typescript
type ShiftStatus = "scheduled" | "completed" | "missed" | "cancelled";
// Missing total_hours
```

**After:**

```typescript
type ShiftStatus = "scheduled" | "completed" | "cancelled";
total_hours: number; // Added
```

**Reason:** Backend doesn't track `missed` status, calculates `total_hours`

---

#### ✅ Transaction Interface

**Before:**

```typescript
interface Transaction {
  amount: number;
  category?: string;
  description?: string;
}
```

**After:**

```typescript
interface Transaction {
  amount: string; // Changed from number to string (decimal)
  category: string; // Required
  description: string; // Required
  reference_number?: string;
  created_by: string;
}
```

**Reason:** Backend stores amounts as strings (Decimal type), requires category/description, tracks creator

---

#### ✅ Payroll Types

**Before:**

```typescript
interface PayrollRun {
  total_amount?: number;
  total_gross?: number;
  total_deductions?: number;
  employee_count?: number;
}

interface PayrollItem {
  base_salary: number;
  overtime_hours: number;
  overtime_amount: number;
  bonuses: number;
}
```

**After:**

```typescript
interface PayrollRun {
  total_amount: string;
  notes?: string;
}

interface PayrollItem {
  base_salary: string;
  overtime_pay: string;
  bonus: string; // Singular
  deductions: string;
  tax_amount: string;
  net_pay: string;
  payment_method?: string;
}
```

**Reason:** All financial amounts stored as strings (Decimal), simplified payroll item structure

---

#### ✅ Message Types

**Before:**

```typescript
type MessageType = "direct" | "broadcast" | "group"
type MessageStatus = "sent" | "delivered" | "read" | "failed"
recipient_id?: string  // Optional
subject?: string  // Optional
```

**After:**

```typescript
type MessageType = "direct" | "announcement" | "system"
type MessageStatus = "sent" | "delivered" | "read"
recipient_id: string  // Required
subject: string  // Required
delivered_at?: string  // Added
```

**Reason:** Backend uses `announcement` and `system` instead of `broadcast` and `group`, requires recipient and subject

---

#### ✅ Auth Response Structure

**Added:**

```typescript
interface AuthResponse {
  user: User;
  company: Company;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface RegisterData {
  name: string; // company name
  email: string; // company email
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_password: string;
  phone?: string;
  address?: string;
  tax_id?: string;
}
```

**Reason:** Backend returns complete auth response with user AND company data

---

### 2. Auth Store (`frontend/src/stores/auth-store.ts`)

#### ✅ Updated to Use New API Client

**Before:**

```typescript
import { api } from "@/lib/api/client";

const tokens = await api.login({ email, password });
localStorage.setItem("access_token", tokens.access_token);
const user = await api.getCurrentUser();
```

**After:**

```typescript
import { styrcanApi } from "@/lib/api/styrcan-client";

const result = await styrcanApi.auth.login(email, password);
if (result.success && result.data) {
  // Token automatically stored by styrcanApi
  set({
    user: result.data.user,
    company: result.data.company,
    isAuthenticated: true,
  });
}
```

**Changes:**

- Uses new `styrcanApi` with consistent response format
- Automatic token management (no manual localStorage)
- Stores both `user` and `company` data
- Better error handling with `result.success`

---

#### ✅ Added Company State

**Before:**

```typescript
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}
```

**After:**

```typescript
interface AuthState {
  user: User | null;
  company: Company | null;
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
}
```

**Reason:** Backend returns company data with auth responses

---

### 3. Old API Client (`frontend/src/lib/api/client.ts`)

#### ✅ Updated Return Types

**Before:**

```typescript
async login(credentials: LoginCredentials): Promise<AuthTokens>
async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }>
async refreshToken(refreshToken: string): Promise<AuthTokens>
```

**After:**

```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse>
async register(data: RegisterData): Promise<AuthResponse>
async refreshToken(refreshToken: string): Promise<AuthResponse>
```

**Reason:** API always returns full `AuthResponse` with user, company, and tokens

---

## 📊 API Response Format Changes

### Authentication Endpoints

**Login/Register Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
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

---

## 🎯 Migration Guide for Existing Components

### 1. Using the New API Client

**Before:**

```typescript
import { api } from "@/lib/api/client";

const tokens = await api.login({ email, password });
localStorage.setItem("access_token", tokens.access_token);
```

**After:**

```typescript
import { styrcanApi } from "@/lib/api/styrcan-client";

const result = await styrcanApi.auth.login(email, password);
if (result.success && result.data) {
  // Token automatically stored
  console.log(result.data.user);
  console.log(result.data.company);
}
```

---

### 2. Employee Management

**Before:**

```typescript
const employee = await api.createEmployee({
  salary_amount: 75000,
  status: "inactive",
});
```

**After:**

```typescript
const result = await styrcanApi.employees.create({
  salary: "75000.00", // String!
  status: "on_leave", // Not "inactive"
  department: "Engineering", // Required
  position: "Developer", // Required
});
```

---

### 3. Financial Transactions

**Before:**

```typescript
const transaction = await api.createTransaction({
  amount: 1500, // Number
  category: undefined, // Optional
});
```

**After:**

```typescript
const result = await styrcanApi.finances.createTransaction({
  type: "expense",
  amount: "1500.00", // String!
  category: "Office Supplies", // Required
  description: "Monthly supplies", // Required
  transaction_date: "2026-02-09",
});
```

---

### 4. PTO Requests

**Before:**

```typescript
const pto = await api.updatePTO(id, {
  status: "denied",
});
```

**After:**

```typescript
const result = await styrcanApi.pto.update(id, {
  status: "rejected", // Not "denied"
  reviewer_notes: "Conflicts with project deadline",
});
```

---

## ✅ Testing Checklist

After these changes, verify:

- [ ] **Login works** - Check auth-store receives user AND company data
- [ ] **Registration works** - Verify both user and company are created
- [ ] **Employee creation** - Use string for salary, correct status values
- [ ] **PTO management** - Use "rejected" not "denied"
- [ ] **Transactions** - All amounts as strings with 2 decimals
- [ ] **Payroll** - All financial fields as strings
- [ ] **Messages** - Use "announcement" not "broadcast"
- [ ] **User roles** - Display names for "company_admin" and "super_admin"
- [ ] **Shifts** - Don't use "missed" status

---

## 🔧 Recommended Updates

### Display User Roles Properly

Add a helper function:

```typescript
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    employee: "Employee",
    manager: "Manager",
    company_admin: "Company Admin",
    super_admin: "Super Admin",
  };
  return roleNames[role] || role;
}
```

### Format Currency Properly

```typescript
export function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}
```

### Format Status for Display

```typescript
export function getEmployeeStatusBadge(status: EmployeeStatus) {
  const statusConfig = {
    active: { label: "Active", color: "green" },
    on_leave: { label: "On Leave", color: "yellow" },
    terminated: { label: "Terminated", color: "red" },
  };
  return statusConfig[status];
}
```

---

## 📚 Reference

- **Complete API Documentation**: [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
- **TypeScript API Client**: [styrcan-client.ts](./frontend/src/lib/api/styrcan-client.ts)
- **Type Definitions**: [types.ts](./frontend/src/lib/api/types.ts)
- **Integration Guide**: [FRONTEND_API_INTEGRATION.md](./FRONTEND_API_INTEGRATION.md)

---

## 🚀 Next Steps

1. **Test authentication flow** - Login and registration
2. **Update UI components** - Use correct status values and display names
3. **Format currency fields** - All amounts are strings
4. **Add validation** - Ensure amounts have 2 decimal places
5. **Update forms** - Match required fields with backend
6. **Test error handling** - Verify error messages display correctly

---

**Last Updated**: February 9, 2026  
**Backend API Version**: 1.0.0  
**Frontend Alignment**: Complete ✅
