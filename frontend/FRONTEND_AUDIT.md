# Pulse Frontend — Comprehensive Audit Report

> **Generated**: June 2025  
> **Framework**: Next.js 14+ (App Router) · React 18 · TypeScript  
> **State**: Zustand (persist) · TanStack Query (React Query)  
> **Forms**: react-hook-form + Zod  
> **UI**: shadcn/ui · Tailwind CSS · Lucide icons  
> **Real-time**: WebSocket (custom hook)

---

## Table of Contents

1. [Directory Structure](#1-directory-structure)
2. [Architecture Overview](#2-architecture-overview)
3. [Page-by-Page Inventory](#3-page-by-page-inventory)
4. [Components Inventory](#4-components-inventory)
5. [API Client Coverage](#5-api-client-coverage)
6. [Backend Endpoint Coverage Matrix](#6-backend-endpoint-coverage-matrix)
7. [Bugs & Issues Found](#7-bugs--issues-found)
8. [Missing Features & "Coming Soon" Placeholders](#8-missing-features--coming-soon-placeholders)
9. [Recommendations](#9-recommendations)

---

## 1. Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx              # Root layout (Inter font, <Providers>)
│   ├── page.tsx                # Main dashboard (326 lines)
│   ├── providers.tsx           # QueryClient + ThemeProvider + auth guard
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # 404 page
│   ├── globals.css             # Tailwind + CSS variables (light/dark)
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (dashboard)/
│   │   └── reports/page.tsx    # Financial & payroll PDF report generation
│   │
│   ├── (legal)/
│   │   ├── layout.tsx          # Centered container layout
│   │   ├── privacy/page.tsx    # Privacy policy (static, 452 lines)
│   │   └── terms/page.tsx      # Terms of service (static, 366 lines)
│   │
│   ├── (services)/
│   │   ├── layout.tsx          # ServiceHeader wrapper
│   │   ├── employees/
│   │   │   ├── layout.tsx      # ServiceSidebar (Dashboard, Directory, Schedule, Time Off, Reviews)
│   │   │   ├── page.tsx        # Employee CRUD dashboard (606 lines)
│   │   │   ├── loading.tsx     # Loading skeleton
│   │   │   ├── directory/page.tsx   # Read-only employee directory
│   │   │   ├── pto/page.tsx         # PTO request management
│   │   │   ├── schedule/page.tsx    # Weekly shift calendar
│   │   │   └── reviews/page.tsx     # ⚠️ COMING SOON placeholder
│   │   │
│   │   ├── finance/
│   │   │   ├── layout.tsx      # ServiceSidebar (Dashboard, Ledger, Budget, Reports, Categories)
│   │   │   ├── page.tsx        # Finance dashboard + transactions (610 lines)
│   │   │   ├── loading.tsx
│   │   │   ├── ledger/page.tsx      # Transaction CRUD with table
│   │   │   ├── budget/page.tsx      # Budget tracking per category
│   │   │   ├── categories/page.tsx  # Expense category CRUD
│   │   │   └── reports/page.tsx     # Financial trends & charts
│   │   │
│   │   ├── payroll/
│   │   │   ├── layout.tsx      # ServiceSidebar (Dashboard, Runs, History, Tax Docs, By Employee)
│   │   │   ├── page.tsx        # Payroll dashboard + run management (681 lines)
│   │   │   ├── loading.tsx
│   │   │   ├── runs/page.tsx        # Dedicated payroll runs table
│   │   │   ├── employees/page.tsx   # Per-employee payroll history
│   │   │   ├── history/page.tsx     # Completed runs archive
│   │   │   └── taxes/page.tsx       # ⚠️ COMING SOON placeholder
│   │   │
│   │   └── communication/
│   │       ├── layout.tsx      # ServiceSidebar (Dashboard, Inbox, Broadcasts, Threads, Files)
│   │       ├── page.tsx        # Full chat interface (502 lines)
│   │       ├── loading.tsx
│   │       ├── inbox/page.tsx       # Enhanced inbox with employee name resolution
│   │       ├── broadcast/page.tsx   # ⚠️ COMING SOON placeholder
│   │       ├── threads/page.tsx     # ⚠️ COMING SOON placeholder
│   │       └── files/page.tsx       # ⚠️ COMING SOON placeholder
│   │
│   └── (settings)/
│       └── settings/
│           ├── layout.tsx      # Settings sidebar (Profile, Company, Security, Notifications, Appearance, Billing)
│           ├── page.tsx        # Redirects to /settings/profile
│           ├── loading.tsx
│           ├── profile/page.tsx          # Profile edit form
│           ├── company/page.tsx          # Company info display + edit
│           ├── security/page.tsx         # Password change + full 2FA flow
│           ├── notifications/page.tsx    # Notification toggle preferences
│           ├── appearance/page.tsx       # Theme switcher (light/dark/system)
│           └── billing/page.tsx          # Subscription plans + invoices + Stripe integration
│
├── components/
│   ├── examples/
│   │   └── EmployeeListExample.tsx  # ⚠️ Demo component (references non-existent pulse-client)
│   ├── files/
│   │   └── file-upload-zone.tsx     # Drag-and-drop file upload zone
│   ├── layout/
│   │   ├── service-header.tsx       # Global header (nav tabs, notifications, user menu)
│   │   └── service-sidebar.tsx      # Reusable sidebar with active state
│   ├── providers/
│   │   └── websocket-provider.tsx   # WebSocket context provider
│   ├── tables/
│   │   └── data-table.tsx           # TanStack Table with sort/filter/pagination
│   └── ui/                          # shadcn/ui component library (17 files)
│       ├── avatar.tsx, badge.tsx, button.tsx, card.tsx, checkbox.tsx
│       ├── dialog.tsx, dropdown-menu.tsx, input.tsx, label.tsx
│       ├── progress.tsx, scroll-area.tsx, select.tsx, skeleton.tsx
│       ├── sonner.tsx, switch.tsx, table.tsx, textarea.tsx
│
├── hooks/
│   ├── use-toast.ts             # Sonner toast wrapper with variant support
│   └── use-websocket.ts         # WebSocket hook (auto-reconnect, ping, auth-gated)
│
├── lib/
│   ├── api/
│   │   ├── client.ts            # Main ApiClient class (751 lines) — ALL endpoints
│   │   ├── api-test.ts          # Test/demo script (994 lines)
│   │   └── README.md
│   └── utils.ts                 # cn(), formatCurrency(), formatDate(), formatRelativeTime(), etc.
│
├── stores/
│   └── auth-store.ts            # Zustand + persist: user, company, login/logout/register, company context validation
│
└── types/
    └── index.ts                 # All shared TypeScript interfaces
```

---

## 2. Architecture Overview

### Authentication Flow

- **Login** → `POST /api/auth/login` → stores `access_token` + `refresh_token` in `localStorage`
- **Token refresh** → automatic 401 retry in `ApiClient.request()` via `POST /api/auth/refresh`
- **Auth guard** in `providers.tsx` → redirects unauthenticated users to `/login` for all non-public routes
- **Company context** → `X-Company-ID` header injected on every request; validated on store rehydration

### Data Fetching Pattern

- All pages use **TanStack Query** (`useQuery` / `useMutation`)
- Default `staleTime: 60_000`, `refetchOnWindowFocus: false`
- Cache invalidation via `queryClient.invalidateQueries()` after mutations

### Layout Hierarchy

```
RootLayout (layout.tsx)
  └─ Providers (QueryClient + Theme + AuthGuard)
       ├─ (auth)/* — No ServiceHeader, standalone forms
       ├─ (legal)/* — Minimal centered layout
       ├─ (dashboard)/reports — No specific layout (inherits root)
       └─ (services)/* — ServiceHeader + ServiceSidebar per service
            └─ (settings)/* — ServiceHeader + Settings sidebar
```

### State Management

- **Zustand** (`auth-store.ts`): user, company, auth tokens, hydration state
- **React Query cache**: all server data (employees, transactions, messages, etc.)
- **No other global stores** — all page state is local `useState`

---

## 3. Page-by-Page Inventory

### 3.1 Main Dashboard (`/`)

| Feature                                           | API Endpoints Used               |
| ------------------------------------------------- | -------------------------------- |
| KPI cards (employees, revenue, payroll, messages) | `GET /api/dashboard`             |
| Unread message count badge                        | `GET /api/messages/unread-count` |
| Recent activity feed                              | Included in dashboard response   |
| Quick action buttons                              | Navigation only                  |
| 4 service cards with live stats                   | Included in dashboard response   |

### 3.2 Auth Pages

| Page            | Route              | API Endpoint                    | Status                        |
| --------------- | ------------------ | ------------------------------- | ----------------------------- |
| Login           | `/login`           | `POST /api/auth/login`          | ✅ Working                    |
| Register        | `/register`        | `POST /api/auth/register`       | ✅ Working                    |
| Forgot Password | `/forgot-password` | `POST /auth/forgot-password`    | ⚠️ Bug: missing `/api` prefix |
| Reset Password  | `/reset-password`  | `POST /api/auth/reset-password` | ✅ Working                    |

### 3.3 Employees Service

| Page      | Route                  | API Endpoints Used                                         | Status            |
| --------- | ---------------------- | ---------------------------------------------------------- | ----------------- |
| Dashboard | `/employees`           | `getEmployees()`, `createEmployee()`, `deleteEmployee()`   | ✅ Full CRUD      |
| Directory | `/employees/directory` | `getEmployees({limit:100})`                                | ✅ Read-only      |
| PTO       | `/employees/pto`       | `getPTORequests()`, `getEmployees()`, `updatePTORequest()` | ✅ Approve/Reject |
| Schedule  | `/employees/schedule`  | `getShifts()`, `getEmployees()`, `createShift()`           | ✅ Week calendar  |
| Reviews   | `/employees/reviews`   | None                                                       | 🚧 Coming Soon    |

**Missing vs Backend:**

- ❌ `GET /employees/{id}` — No individual employee detail page
- ❌ `PUT /employees/{id}` — No inline edit (only create + delete)
- ❌ `GET /employees/{id}/pto-balance` — PTO balance not shown
- ❌ `PUT /employees/{id}/pto-balance` — Cannot adjust PTO balance
- ❌ `POST /employees/{id}/pto-requests` — Cannot create PTO requests (only approve/reject)
- ❌ `PUT /shifts/{id}` — Cannot edit existing shifts
- ❌ `DELETE /shifts/{id}` — Cannot delete shifts
- ❌ `GET /employees/dashboard` — Employee service dashboard endpoint not used
- ❌ `GET /employees/export` — Backend has CSV export endpoint, frontend does client-side CSV

### 3.4 Finance Service

| Page       | Route                 | API Endpoints Used                                                                         | Status          |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------ | --------------- |
| Dashboard  | `/finance`            | `getTransactions()`, `getFinancialSummary()`, `createTransaction()`, `deleteTransaction()` | ✅ Full         |
| Ledger     | `/finance/ledger`     | `getTransactions()`, `createTransaction()`, `updateTransaction()`, `deleteTransaction()`   | ✅ Full CRUD    |
| Budget     | `/finance/budget`     | `getExpenseCategories()`, `getFinancialSummary()`                                          | ✅ Read-only    |
| Categories | `/finance/categories` | Full CRUD on `ExpenseCategory`                                                             | ✅ Full CRUD    |
| Reports    | `/finance/reports`    | `getFinancialTrends()`, `getFinancialSummary()`                                            | ✅ Trends chart |

**Missing vs Backend:**

- ❌ `GET /finances/dashboard` — Service-specific dashboard endpoint not used
- ❌ `GET /finances/transactions/{id}` — No individual transaction detail view

### 3.5 Payroll Service

| Page        | Route                | API Endpoints Used                                                                                            | Status         |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------------------------- | -------------- |
| Dashboard   | `/payroll`           | `getPayrollRuns()`, `getPayrollRunItems()`, `createPayrollRun()`, `processPayrollRun()`, `deletePayrollRun()` | ✅ Full        |
| Runs        | `/payroll/runs`      | Same as dashboard + `getPayrollRun()` detail                                                                  | ✅ Full        |
| By Employee | `/payroll/employees` | `getEmployees()`, `getEmployeePayrollHistory()`                                                               | ✅ History     |
| History     | `/payroll/history`   | `getPayrollRuns({status:"completed"})`                                                                        | ✅ Filtered    |
| Taxes       | `/payroll/taxes`     | None                                                                                                          | 🚧 Coming Soon |

**Missing vs Backend:**

- ❌ `GET /payroll/dashboard` — Service-specific dashboard endpoint not used
- ❌ `PUT /payroll/runs/{id}` — Cannot edit run metadata (only process/delete)
- ❌ `PUT /payroll/items/{id}` — Cannot edit individual payroll items
- ❌ `POST /payroll/items/{id}/mark-paid` — Cannot mark individual items paid

### 3.6 Communication Service

| Page      | Route                      | API Endpoints Used                                                                                   | Status         |
| --------- | -------------------------- | ---------------------------------------------------------------------------------------------------- | -------------- |
| Dashboard | `/communication`           | `getInbox()`, `getSentMessages()`, `getUnreadMessageCount()`, `markMessageAsRead()`, `sendMessage()` | ✅ Full chat   |
| Inbox     | `/communication/inbox`     | Same + `getEmployees()` for name resolution                                                          | ✅ Enhanced    |
| Broadcast | `/communication/broadcast` | None                                                                                                 | 🚧 Coming Soon |
| Threads   | `/communication/threads`   | None                                                                                                 | 🚧 Coming Soon |
| Files     | `/communication/files`     | None                                                                                                 | 🚧 Coming Soon |

**Missing vs Backend:**

- ❌ `GET /messages/thread/{thread_id}` — Thread view not implemented
- ❌ `DELETE /messages/{id}` — Cannot delete messages
- ❌ File upload integration for message attachments

### 3.7 Settings

| Page          | Route                     | API Endpoints Used                                                                       | Status      |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| Profile       | `/settings/profile`       | `updateProfile()` (PUT /api/auth/me)                                                     | ✅ Working  |
| Company       | `/settings/company`       | `getCompanySettings()`, `updateCompanySettings()`                                        | ✅ Full     |
| Security      | `/settings/security`      | `changePassword()`, `get2FAStatus()`, `setup2FA()`, `verify2FA()`, `disable2FA()`        | ✅ Full 2FA |
| Notifications | `/settings/notifications` | `getNotificationPreferences()`, `updateNotificationPreferences()`                        | ✅ Working  |
| Appearance    | `/settings/appearance`    | `next-themes` (client-side only)                                                         | ✅ Working  |
| Billing       | `/settings/billing`       | `getSubscription()`, `getInvoices()`, `createCheckoutSession()`, `createPortalSession()` | ✅ Stripe   |

**Missing vs Backend:**

- ❌ `GET /settings/users` — No team/user management page
- ❌ `POST /settings/users/invite` — Cannot invite users
- ❌ `PUT /settings/users/{id}` — Cannot edit user roles
- ❌ `DELETE /settings/users/{id}` — Cannot remove users
- ❌ `GET /settings/billing` (the settings billing info endpoint, different from billing router)
- ❌ `POST /settings/billing/change-plan` — Frontend uses billing router's checkout instead
- ❌ `GET /billing/payment-method` — Payment method display not shown
- ❌ `GET /billing/usage` — Usage stats not shown
- ❌ `GET /billing/dashboard` — Billing dashboard endpoint not used

### 3.8 Reports (`/reports`)

| Feature                     | API Endpoints Used          | Status     |
| --------------------------- | --------------------------- | ---------- |
| Financial report generation | `generateFinancialReport()` | ✅ Working |
| Payroll report generation   | `generatePayrollReport()`   | ✅ Working |
| List existing reports       | `listReports()`             | ✅ Working |
| Download report             | `getReportDownloadUrl()`    | ✅ Working |

### 3.9 ServiceHeader (Global)

| Feature                      | API Endpoints Used                                                                   | Status     |
| ---------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| Notification bell + dropdown | `getUnreadNotificationCount()`, `getNotifications()`, `markAllNotificationsAsRead()` | ✅ Working |
| Service tab navigation       | N/A                                                                                  | ✅ Working |
| User menu + logout           | `logout()`                                                                           | ✅ Working |
| Company badge                | From auth store                                                                      | ✅ Working |

---

## 4. Components Inventory

| Component              | File                                                      | Purpose                                                       | API Integration                                                                      |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ServiceHeader`        | `components/layout/service-header.tsx` (209 lines)        | Global nav bar, notifications dropdown, user menu             | `getNotifications()`, `getUnreadNotificationCount()`, `markAllNotificationsAsRead()` |
| `ServiceSidebar`       | `components/layout/service-sidebar.tsx`                   | Reusable sidebar with icon items, active states, locked items | None (presentational)                                                                |
| `FileUploadZone`       | `components/files/file-upload-zone.tsx` (315 lines)       | Drag-and-drop file upload with validation, progress           | Receives `onUpload` callback                                                         |
| `DataTable`            | `components/tables/data-table.tsx`                        | TanStack Table with sorting, filtering, pagination            | None (receives data as props)                                                        |
| `WebSocketProvider`    | `components/providers/websocket-provider.tsx`             | React context for WebSocket state                             | Uses `useWebSocket` hook                                                             |
| `EmployeeListExample`  | `components/examples/EmployeeListExample.tsx` (477 lines) | ⚠️ Demo component                                             | Import from non-existent `@/lib/api/pulse-client`                                    |
| **17 shadcn/ui files** | `components/ui/*`                                         | Standard UI primitives                                        | None                                                                                 |

---

## 5. API Client Coverage

The `ApiClient` class at `lib/api/client.ts` (751 lines) defines these method groups:

| Group                  | Methods Defined                                                                                                                 | Used by Pages                                                               | Used by Header |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------- |
| **Auth**               | `login`, `register`, `refreshToken`, `getCurrentUser`, `logout`, `changePassword`, `updateProfile`                              | ✅ All used                                                                 | —              |
| **2FA**                | `get2FAStatus`, `setup2FA`, `verify2FA`, `disable2FA`                                                                           | ✅ All used (security page)                                                 | —              |
| **Employees**          | `getEmployees`, `createEmployee`, `updateEmployee`, `deleteEmployee`                                                            | ⚠️ `updateEmployee` never called from UI                                    | —              |
| **PTO**                | `getPTORequests`, `createPTORequest`, `updatePTORequest`                                                                        | ⚠️ `createPTORequest` never called                                          | —              |
| **Shifts**             | `getShifts`, `createShift`                                                                                                      | ✅ All used                                                                 | —              |
| **Transactions**       | `getTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction`, `getFinancialSummary`, `getFinancialTrends`   | ✅ All used                                                                 | —              |
| **Finance Dashboard**  | `getFinanceDashboard`                                                                                                           | ❌ Never called                                                             | —              |
| **Categories**         | CRUD on expense categories                                                                                                      | ✅ All used                                                                 | —              |
| **Payroll**            | `getPayrollDashboard`, runs CRUD, `processPayrollRun`, `getPayrollRunItems`, `markPayrollItemPaid`, `getEmployeePayrollHistory` | ⚠️ `getPayrollDashboard`, `markPayrollItemPaid` never called                | —              |
| **Messages**           | `getInbox`, `getSentMessages`, `getThread`, `sendMessage`, `markMessageAsRead`, `getUnreadMessageCount`                         | ⚠️ `getThread` never called                                                 | —              |
| **Notifications**      | `getNotifications`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `getUnreadNotificationCount`                        | ⚠️ `markNotificationAsRead` not called (only mark-all)                      | ✅ Header      |
| **Dashboard**          | `getDashboard`, `getDashboardStats`, `getDashboardCharts`, `getQuickSummary`                                                    | ⚠️ Only `getDashboard` used                                                 | —              |
| **Settings**           | `getCompanySettings`, `updateCompanySettings`, `getCompanyUsers`, `inviteUser`, `updateUser`, `deleteUser`                      | ⚠️ `getCompanyUsers`, `inviteUser`, `updateUser`, `deleteUser` never called | —              |
| **Billing**            | `getSubscription`, `getInvoices`, `createCheckoutSession`, `createPortalSession`, `getBillingInfo`, `changePlan`                | ⚠️ `getBillingInfo`, `changePlan` never called                              | —              |
| **Notification Prefs** | `getNotificationPreferences`, `updateNotificationPreferences`                                                                   | ✅ All used                                                                 | —              |
| **Files**              | `uploadFile`, `uploadMultipleFiles`, `listFiles`, `getFileDownloadUrl`, `deleteFile`                                            | ❌ None called (files page is Coming Soon)                                  | —              |
| **Reports**            | `generateFinancialReport`, `generatePayrollReport`, `listReports`, `getReportDownloadUrl`                                       | ✅ All used                                                                 | —              |

---

## 6. Backend Endpoint Coverage Matrix

### Legend

- ✅ Frontend page calls this endpoint
- 🔧 API client method exists but no page uses it
- ❌ No frontend coverage at all

### Auth Router (`/api/auth`)

| Endpoint                | Frontend Status                                |
| ----------------------- | ---------------------------------------------- |
| `POST /register`        | ✅ Register page                               |
| `POST /login`           | ✅ Login page                                  |
| `POST /refresh`         | ✅ Auto-refresh in ApiClient                   |
| `GET /me`               | ✅ Auth store hydration                        |
| `POST /logout`          | ✅ Auth store + header menu                    |
| `POST /forgot-password` | ⚠️ Called but with WRONG PATH (missing `/api`) |
| `POST /reset-password`  | ✅ Reset password page                         |
| `POST /change-password` | ✅ Security settings                           |
| `PUT /me`               | ✅ Profile settings                            |
| `POST /2fa/setup`       | ✅ Security settings                           |
| `POST /2fa/verify`      | ✅ Security settings                           |
| `POST /2fa/disable`     | ✅ Security settings                           |
| `GET /2fa/status`       | ✅ Security settings                           |

### Employees Router (`/api/employees`)

| Endpoint                    | Frontend Status                                      |
| --------------------------- | ---------------------------------------------------- |
| `GET /dashboard`            | 🔧 Method exists, never called                       |
| `GET /` (list)              | ✅ Employee page + directory                         |
| `POST /` (create)           | ✅ Employee page                                     |
| `GET /{id}`                 | 🔧 Not used (no detail page)                         |
| `PUT /{id}`                 | 🔧 Method exists, never called                       |
| `DELETE /{id}`              | ✅ Employee page                                     |
| `GET /{id}/pto-balance`     | ❌ Not in API client                                 |
| `PUT /{id}/pto-balance`     | ❌ Not in API client                                 |
| `GET /{id}/pto-requests`    | ❌ Not in API client (uses general getPTORequests)   |
| `POST /{id}/pto-requests`   | 🔧 Method exists, never called                       |
| `GET /pto-requests/pending` | ✅ Via getPTORequests in PTO page                    |
| `PUT /pto-requests/{id}`    | ✅ PTO page (approve/reject)                         |
| `GET /{id}/shifts`          | ❌ Not in API client (uses general getShifts)        |
| `POST /shifts`              | ✅ Schedule page                                     |
| `GET /shifts`               | ✅ Schedule page                                     |
| `PUT /shifts/{id}`          | ❌ Not in API client                                 |
| `DELETE /shifts/{id}`       | ❌ Not in API client                                 |
| `GET /export`               | ❌ Not in API client (frontend does client-side CSV) |

### Finances Router (`/api/finances`)

| Endpoint                    | Frontend Status                         |
| --------------------------- | --------------------------------------- |
| `GET /dashboard`            | 🔧 Method exists, never called          |
| `GET /transactions`         | ✅ Finance page + ledger                |
| `POST /transactions`        | ✅ Finance page + ledger                |
| `GET /transactions/{id}`    | ❌ Not in API client                    |
| `PUT /transactions/{id}`    | ✅ Ledger page                          |
| `DELETE /transactions/{id}` | ✅ Finance page + ledger                |
| `GET /categories`           | ✅ Categories page + budget             |
| `POST /categories`          | ✅ Categories page                      |
| `PUT /categories/{id}`      | ✅ Categories page                      |
| `DELETE /categories/{id}`   | ✅ Categories page                      |
| `GET /summary`              | ✅ Finance dashboard + budget + reports |
| `GET /trends`               | ✅ Finance reports page                 |

### Payroll Router (`/api/payroll`)

| Endpoint                      | Frontend Status                |
| ----------------------------- | ------------------------------ |
| `GET /dashboard`              | 🔧 Method exists, never called |
| `GET /runs`                   | ✅ Payroll pages               |
| `POST /runs`                  | ✅ Payroll pages               |
| `GET /runs/{id}`              | ✅ Runs detail dialog          |
| `POST /runs/{id}/process`     | ✅ Payroll pages               |
| `PUT /runs/{id}`              | ❌ Not in API client           |
| `DELETE /runs/{id}`           | ✅ Payroll pages               |
| `GET /runs/{id}/items`        | ✅ Payroll pages               |
| `PUT /items/{id}`             | ❌ Not in API client           |
| `POST /items/{id}/mark-paid`  | 🔧 Method exists, never called |
| `GET /employees/{id}/history` | ✅ Payroll employees page      |

### Messaging Router (`/api/messages`)

| Endpoint                  | Frontend Status                |
| ------------------------- | ------------------------------ |
| `POST /send`              | ✅ Communication pages         |
| `GET /inbox`              | ✅ Communication pages         |
| `GET /sent`               | ✅ Communication pages         |
| `GET /thread/{thread_id}` | 🔧 Method exists, never called |
| `PATCH /{id}/read`        | ✅ Communication pages         |
| `DELETE /{id}`            | ❌ Not in API client           |
| `GET /unread-count`       | ✅ Dashboard + communication   |

### Notifications Router (`/api/notifications`)

| Endpoint              | Frontend Status                                       |
| --------------------- | ----------------------------------------------------- |
| `POST /create`        | ❌ Not in API client (admin-only)                     |
| `GET /`               | ✅ ServiceHeader                                      |
| `PATCH /{id}/read`    | 🔧 Method exists, not called (using mark-all instead) |
| `POST /mark-all-read` | ✅ ServiceHeader                                      |
| `DELETE /{id}`        | ❌ Not in API client                                  |
| `GET /unread-count`   | ✅ ServiceHeader                                      |

### Dashboard Router (`/api/dashboard`)

| Endpoint             | Frontend Status                |
| -------------------- | ------------------------------ |
| `GET /`              | ✅ Main dashboard page         |
| `GET /charts`        | 🔧 Method exists, never called |
| `GET /summary/quick` | 🔧 Method exists, never called |

### Settings Router (`/api/settings`)

| Endpoint                         | Frontend Status                |
| -------------------------------- | ------------------------------ |
| `GET /company`                   | ✅ Company settings page       |
| `PUT /company`                   | ✅ Company settings page       |
| `GET /users`                     | 🔧 Method exists, never called |
| `POST /users/invite`             | 🔧 Method exists, never called |
| `PUT /users/{id}`                | 🔧 Method exists, never called |
| `DELETE /users/{id}`             | 🔧 Method exists, never called |
| `GET /billing`                   | 🔧 Method exists, never called |
| `POST /billing/change-plan`      | 🔧 Method exists, never called |
| `GET /notifications/preferences` | ✅ Notifications settings      |
| `PUT /notifications/preferences` | ✅ Notifications settings      |

### Billing Router (`/api/billing`)

| Endpoint              | Frontend Status        |
| --------------------- | ---------------------- |
| `POST /checkout`      | ✅ Billing page        |
| `POST /portal`        | ✅ Billing page        |
| `GET /subscription`   | ✅ Billing page        |
| `GET /invoices`       | ✅ Billing page        |
| `GET /payment-method` | ❌ Not in API client   |
| `GET /usage`          | ❌ Not in API client   |
| `GET /dashboard`      | ❌ Not in API client   |
| `POST /webhooks`      | N/A (server-to-server) |

### Files Router (`/api/files`)

| Endpoint                    | Frontend Status                |
| --------------------------- | ------------------------------ |
| `POST /upload`              | 🔧 Method exists, never called |
| `POST /upload/multiple`     | 🔧 Method exists, never called |
| `GET /list`                 | 🔧 Method exists, never called |
| `GET /download/{file_key}`  | 🔧 Method exists, never called |
| `DELETE /delete/{file_key}` | 🔧 Method exists, never called |
| `GET /metadata/{file_key}`  | ❌ Not in API client           |

### Reports Router (`/api/reports`)

| Endpoint                   | Frontend Status |
| -------------------------- | --------------- |
| `POST /financial`          | ✅ Reports page |
| `POST /payroll`            | ✅ Reports page |
| `GET /list`                | ✅ Reports page |
| `GET /download/{file_key}` | ✅ Reports page |

### WebSocket (`/api/notifications/ws`)

| Feature              | Frontend Status                                  |
| -------------------- | ------------------------------------------------ |
| WebSocket connection | ✅ `use-websocket.ts` hook + `WebSocketProvider` |
| `GET /stats`         | ❌ Not in API client                             |

---

## 7. Bugs & Issues Found

### Critical

1. **Forgot Password — Wrong API Path**  
   In `app/(auth)/forgot-password/page.tsx`, the call is:

   ```ts
   await apiClient.post("/auth/forgot-password", { email });
   ```

   This bypasses the `request()` method's base URL handling. It should be:

   ```ts
   await apiClient.post("/api/auth/forgot-password", { email });
   ```

   Or use a dedicated `apiClient` method like `forgotPassword(email)`.

2. **EmployeeListExample — Broken Imports**  
   `components/examples/EmployeeListExample.tsx` imports from:
   - `@/lib/api/pulse-client` — **file does not exist**
   - `@/lib/api/types` — **file does not exist**

   This component will cause a compilation error if used.

### Medium

3. **Employee Update Not Wired**  
   `apiClient.updateEmployee()` exists but no page provides an "Edit Employee" UI. The employee page only has Create and Delete. Users cannot modify employee details after creation.

4. **WebSocketProvider Not Used**  
   `WebSocketProvider` is defined in `components/providers/websocket-provider.tsx` but is **not** included in `app/providers.tsx`. The WebSocket context is therefore never provided to the component tree. Real-time notifications depend on pages individually using the hook.

5. **Notification Mark-As-Read**  
   Individual notification marking (`markNotificationAsRead()`) exists in the API client but the ServiceHeader only offers "Mark all read". There's no way to mark a single notification as read.

6. **Dashboard Stats/Charts Endpoints Unused**  
   `getDashboardStats()`, `getDashboardCharts()`, `getQuickSummary()` methods exist in the API client but are never called. The dashboard only uses `getDashboard()`.

### Low

7. **Client-side CSV Export vs Backend Export**  
   The employees page does CSV export client-side, but the backend has a dedicated `GET /employees/export` endpoint that could produce a more complete export.

8. **PTO Creation Missing**  
   Users can approve/reject PTO requests but cannot create new PTO requests from the frontend. The `createPTORequest()` method exists but is unused.

9. **Date-fns Dependency**  
   The reports page imports `format` from `date-fns`, while all other pages use custom `formatDate()`/`formatRelativeTime()` from `lib/utils.ts`. Inconsistent date formatting approach.

---

## 8. Missing Features & "Coming Soon" Placeholders

### Coming Soon Pages (No API Integration)

| Page                   | Route                      | Backend Support                                 |
| ---------------------- | -------------------------- | ----------------------------------------------- |
| Employee Reviews       | `/employees/reviews`       | ❌ No backend endpoints exist for reviews       |
| Payroll Taxes          | `/payroll/taxes`           | ❌ No backend endpoints exist for tax documents |
| Broadcast Messages     | `/communication/broadcast` | ❌ No backend broadcast endpoint                |
| Threaded Conversations | `/communication/threads`   | ✅ Backend has `GET /messages/thread/{id}`      |
| Shared Files           | `/communication/files`     | ✅ Backend has full file CRUD                   |

### Missing Frontend Pages (Backend Ready)

| Feature                         | Backend Endpoints Available             | Frontend Status                                        |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| **Team/User Management**        | `GET/POST/PUT/DELETE /settings/users/*` | ❌ No page exists — API client methods exist but no UI |
| **Employee Detail View**        | `GET /employees/{id}`                   | ❌ No individual employee page                         |
| **Employee Edit**               | `PUT /employees/{id}`                   | ❌ No edit form wired                                  |
| **PTO Balance Management**      | `GET/PUT /employees/{id}/pto-balance`   | ❌ Not even in API client                              |
| **PTO Request Creation**        | `POST /employees/{id}/pto-requests`     | 🔧 API client has method, no UI                        |
| **Shift Edit/Delete**           | `PUT/DELETE /shifts/{id}`               | ❌ Not in API client                                   |
| **Individual Transaction View** | `GET /transactions/{id}`                | ❌ Not in API client                                   |
| **Payroll Item Edit**           | `PUT /items/{id}`                       | ❌ Not in API client                                   |
| **Mark Payroll Item Paid**      | `POST /items/{id}/mark-paid`            | 🔧 API client has method, no UI                        |
| **Delete Messages**             | `DELETE /messages/{id}`                 | ❌ Not in API client                                   |
| **Delete Notifications**        | `DELETE /notifications/{id}`            | ❌ Not in API client                                   |
| **Billing Usage Stats**         | `GET /billing/usage`                    | ❌ Not in API client                                   |
| **Billing Payment Method**      | `GET /billing/payment-method`           | ❌ Not in API client                                   |
| **File Metadata**               | `GET /files/metadata/{key}`             | ❌ Not in API client                                   |

---

## 9. Recommendations

### Priority 1 — Fix Bugs

1. Fix the forgot-password API path (add `/api` prefix)
2. Fix or remove `EmployeeListExample.tsx` (broken imports)
3. Wire `WebSocketProvider` into `providers.tsx`

### Priority 2 — Complete Core Features

4. Add Employee Edit form (backend `PUT /employees/{id}` is ready)
5. Add PTO Request Creation flow
6. Build Team/User Management page under `/settings/team` — backend CRUD is fully ready
7. Build Communication Threads page using `getThread()`
8. Build Communication Files page using file upload/list endpoints

### Priority 3 — Use Existing Endpoints

9. Use backend's `GET /employees/export` instead of client-side CSV
10. Use `getFinanceDashboard()` / `getPayrollDashboard()` for richer service dashboards
11. Add shift editing and deletion
12. Add individual notification mark-as-read
13. Add `markPayrollItemPaid()` UI to payroll run detail

### Priority 4 — New Backend Features Needed

14. Employee Reviews system (no backend exists)
15. Tax document management (no backend exists)
16. Broadcast messaging system (no backend exists)

---

## Summary Statistics

| Metric                            | Count                            |
| --------------------------------- | -------------------------------- |
| **Total pages**                   | 34                               |
| **Fully functional pages**        | 26                               |
| **Coming Soon placeholders**      | 5                                |
| **Static pages** (legal)          | 3                                |
| **Total components**              | 23 (6 custom + 17 UI primitives) |
| **Backend endpoints**             | 99                               |
| **Endpoints used by frontend UI** | ~54 (55%)                        |
| **API client methods defined**    | ~60                              |
| **API client methods with no UI** | ~15 (25%)                        |
| **Bugs found**                    | 9 (2 critical, 3 medium, 4 low)  |
