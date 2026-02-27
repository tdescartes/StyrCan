# Multi-Tenancy Architecture Guide

> **Pulse** — FastAPI + Next.js SaaS Business Management Platform

This document is the authoritative reference for understanding and working with Pulse's multi-tenancy architecture. Every engineer who touches data access must read this guide.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Security Model](#2-security-model)
3. [Database Schema](#3-database-schema)
4. [Backend Patterns](#4-backend-patterns)
5. [Frontend Integration](#5-frontend-integration)
6. [Adding New Entities](#6-adding-new-entities)
7. [Testing Multi-Tenancy](#7-testing-multi-tenancy)

---

## 1. Architecture Overview

### Strategy: Shared-Database, Shared-Schema

Pulse uses a **single PostgreSQL database** with a **single schema** where every tenant-scoped table includes a `company_id` column. All tenants coexist in the same tables, and isolation is enforced at the **application layer** through query filtering.

```
┌──────────────────────────────────────────────────────────┐
│                     PostgreSQL                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  companies table (tenant registry)               │    │
│  │  ┌──────────┬──────────┬──────────┐              │    │
│  │  │ id (PK)  │ name     │ status   │  ...         │    │
│  │  ├──────────┼──────────┼──────────┤              │    │
│  │  │ comp-001 │ Acme Inc │ active   │              │    │
│  │  │ comp-002 │ Beta LLC │ active   │              │    │
│  │  └──────────┴──────────┴──────────┘              │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  employees table                                 │    │
│  │  ┌──────────┬────────────┬─────────────┐         │    │
│  │  │ id (PK)  │ company_id │ first_name  │  ...    │    │
│  │  ├──────────┼────────────┼─────────────┤         │    │
│  │  │ emp-001  │ comp-001   │ Alice       │         │    │
│  │  │ emp-002  │ comp-002   │ Bob         │         │    │
│  │  └──────────┴────────────┴─────────────┘         │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  (same pattern for users, transactions, payroll, ...)    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                      MongoDB                             │
│  audit_logs, chat_messages, notifications,               │
│  analytics_events, document_metadata                     │
│  — all documents carry a company_id field                │
└──────────────────────────────────────────────────────────┘
```

### Why Shared-Database, Shared-Schema?

| Concern                    | Decision Rationale                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Operational simplicity** | One database to back up, migrate, and monitor. No per-tenant provisioning.                                                                                                                     |
| **Cost efficiency**        | Single connection pool; no idle databases consuming resources.                                                                                                                                 |
| **Schema evolution**       | Alembic migrations run once and apply to all tenants instantly.                                                                                                                                |
| **Scalable enough**        | B-tree indexes on `company_id` keep queries fast up to millions of rows.                                                                                                                       |
| **Trade-off accepted**     | No physical isolation between tenants — isolation is purely application-enforced. This means a bug in query filtering could leak data across tenants. The security model below mitigates this. |

### High-Level Request Flow

```
Browser ──► Next.js Frontend
               │
               │  fetch() with Authorization: Bearer <JWT>
               │              + X-Company-ID header
               ▼
         FastAPI Backend
               │
               ├─► TenantContextMiddleware
               │      • Decodes JWT (extracts company_id, user_id, role)
               │      • Injects into request.state
               │      • Validates X-Company-ID header matches token
               │
               ├─► get_current_user() dependency
               │      • Full JWT validation (signature + expiry)
               │      • Loads User from PostgreSQL
               │      • Confirms user.company_id == token.company_id
               │      • Checks company is active, user is active
               │
               ├─► get_company_context() dependency
               │      • Returns current_user.company_id
               │
               ├─► Route handler
               │      • Uses company_id to filter ALL queries
               │      • .filter(Model.company_id == company_id)
               │
               ├─► PostgreSQL  (company_id column filtering)
               └─► MongoDB     (company_id field filtering)
```

---

## 2. Security Model

### JWT Token Claims

When a user logs in or registers, the backend issues a JWT containing tenant context:

```python
# backend/app/auth/security.py — create_access_token()
access_token = create_access_token(data={
    "sub": str(user.id),           # User UUID
    "company_id": str(company.id), # Tenant UUID  ← KEY CLAIM
    "role": user.role              # e.g. "company_admin", "employee"
})
```

**Decoded JWT payload:**

```json
{
  "sub": "a1b2c3d4-...",
  "company_id": "e5f6g7h8-...",
  "role": "company_admin",
  "exp": 1740700000,
  "type": "access"
}
```

Both access tokens and refresh tokens carry `company_id`. This means:

- The tenant context is **cryptographically bound** to the token.
- There is no way to change tenant without obtaining a new token.
- An `X-Company-ID` header is sent by the frontend for **redundant validation** — the middleware rejects requests where the header differs from the token.

### TenantContextMiddleware

Located in `backend/app/middleware/tenant.py`, this Starlette middleware runs **before** route handlers on every non-public request:

| Step             | What it does                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------- |
| 1. Check path    | Skip public endpoints (`/api/auth/login`, `/api/auth/register`, `/docs`, `/health`, etc.) |
| 2. Extract token | Parse `Authorization: Bearer <token>` header                                              |
| 3. Decode JWT    | Decode with `jose.jwt` (expiry NOT checked here — auth dependency does that)              |
| 4. Inject state  | Set `request.state.company_id`, `request.state.user_id`, `request.state.user_role`        |
| 5. Header check  | Compare `X-Company-ID` header to `company_id` from token — **403 on mismatch**            |
| 6. Audit alerts  | Log security events to MongoDB if mismatch is detected                                    |

**Mismatch response (HTTP 403):**

```json
{
  "detail": "Company context mismatch. This incident has been logged.",
  "error_code": "COMPANY_MISMATCH"
}
```

### get_current_user() — Full Authentication

Defined in `backend/app/auth/security.py`, this is the **authoritative** authentication dependency. It performs:

1. **JWT signature + expiry validation** via `decode_token()`
2. **User lookup** — `db.query(User).filter(User.id == user_id)`
3. **Company match** — confirms `token.company_id == user.company_id` (catches stale tokens after company reassignment)
4. **Company exists & active** — loads `Company` row, checks `status == "active"`
5. **User active** — checks `user.is_active`

If any check fails: `401 Unauthorized` or `403 Forbidden`.

### get_company_context() — Tenant ID Extraction

```python
def get_company_context(current_user: User = Depends(get_current_user)) -> str:
    if not current_user.company_id:
        raise HTTPException(403, "User has no company association")
    return current_user.company_id
```

This is the **primary dependency** used by route handlers to obtain the tenant-scoped `company_id`. It chains through `get_current_user`, meaning every call to `get_company_context` also authenticates the user.

### Role-Based Access Control

```python
# backend/app/auth/security.py
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(403, "Insufficient permissions")
        return user

# Pre-built role dependencies
require_admin = RoleChecker(["company_admin", "super_admin"])
require_manager = RoleChecker(["manager", "company_admin", "super_admin"])
require_employee = RoleChecker(["employee", "manager", "company_admin", "super_admin"])
```

Roles are **within** the tenant context — a `company_admin` of Company A has zero access to Company B data.

### Defense-in-Depth Summary

| Layer               | Mechanism                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **JWT token**       | `company_id` is cryptographically signed into access & refresh tokens                                             |
| **Middleware**      | `TenantContextMiddleware` validates header/token consistency, logs mismatches                                     |
| **Auth dependency** | `get_current_user()` checks token ↔ DB ↔ company ↔ active status                                                  |
| **Route filtering** | Every query includes `.filter(Model.company_id == company_id)`                                                    |
| **Frontend**        | `X-Company-ID` header sent for server-side cross-check; `validateCompanyContext()` catches client-side mismatches |
| **Audit trail**     | MongoDB `AuditLog` records security events with full request metadata                                             |

---

## 3. Database Schema

### PostgreSQL — company_id Patterns

The `companies` table is the **tenant registry**. Every other tenant-scoped table references it via a `company_id` foreign key:

```python
# The tenant root table
class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True)     # UUID
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    address = Column(Text)
    tax_id = Column(String(50))
    status = Column(String(20), default="active")  # active | inactive | suspended
    stripe_customer_id = Column(String(255), unique=True, nullable=True, index=True)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)
```

**Standard tenant-scoped column pattern:**

```python
company_id = Column(
    String(36),
    ForeignKey("companies.id", ondelete="CASCADE"),
    nullable=False,
    index=True          # ← ALWAYS index for query performance
)
```

### Tenant-Scoped Tables

| Table                | Key Foreign Keys                                          | Notes                                    |
| -------------------- | --------------------------------------------------------- | ---------------------------------------- |
| `users`              | `company_id → companies.id`                               | Authentication; email is globally unique |
| `employees`          | `company_id → companies.id`, `user_id → users.id`         | Core HR entity                           |
| `pto_balances`       | `company_id → companies.id`, `employee_id → employees.id` | Per-year tracking                        |
| `pto_requests`       | `company_id → companies.id`, `employee_id → employees.id` | Approval workflow                        |
| `shifts`             | `company_id → companies.id`, `employee_id → employees.id` | Scheduling                               |
| `transactions`       | `company_id → companies.id`                               | Financial records                        |
| `expense_categories` | `company_id → companies.id`                               | Accounting                               |
| `payroll_runs`       | `company_id → companies.id`                               | Payroll batches                          |
| `payroll_items`      | `company_id → companies.id`, `employee_id → employees.id` | Individual payslips                      |
| `messages`           | `company_id → companies.id`                               | Internal messaging                       |

### Cascade Deletes

All tenant-scoped foreign keys use `ondelete="CASCADE"`. Deleting a company row automatically removes all associated data:

```python
ForeignKey("companies.id", ondelete="CASCADE")
```

Company-level relationships also declare cascading:

```python
# In Company model
employees = relationship("Employee", back_populates="company", cascade="all, delete-orphan")
```

### Index Strategy

Every `company_id` column **must** be indexed. For tables with frequent filtered queries, add compound indexes:

```sql
-- Implicit from index=True on the column
CREATE INDEX ix_employees_company_id ON employees (company_id);

-- Recommended compound indexes
CREATE INDEX ix_employees_company_status ON employees (company_id, status);
CREATE INDEX ix_shifts_company_date ON shifts (company_id, shift_date);
```

### MongoDB — company_id on Documents

All MongoDB document models include a `company_id` field with appropriate indexes:

```python
# Example: AuditLog document
class AuditLog(Document):
    user_id: Optional[str] = None
    company_id: Optional[str] = None   # ← Tenant scope
    action: AuditAction
    resource_type: str
    ...

    class Settings:
        name = "audit_logs"
        indexes = [
            "company_id",
            [("company_id", 1), ("timestamp", -1)],  # ← Compound index
        ]
```

**MongoDB collections with `company_id`:**

| Collection          | company_id       | Notes                                       |
| ------------------- | ---------------- | ------------------------------------------- |
| `audit_logs`        | `Optional[str]`  | Some system events may lack company context |
| `chat_messages`     | `str` (required) | Always scoped                               |
| `notifications`     | `str` (required) | Always scoped                               |
| `analytics_events`  | `str` (required) | Always scoped                               |
| `document_metadata` | `str` (required) | Always scoped                               |
| `application_logs`  | `Optional[str]`  | System logs may not have tenant context     |

---

## 4. Backend Patterns

### Router Pattern — PostgreSQL Queries

Every route handler that accesses tenant data **must** use `get_company_context()` or `get_current_user()` as a dependency and include `company_id` in all queries.

**Listing resources:**

```python
@router.get("/dashboard", response_model=dict)
async def get_employees_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id

    total_employees = db.query(func.count(Employee.id)).filter(
        Employee.company_id == company_id       # ← REQUIRED
    ).scalar()

    active_employees = db.query(func.count(Employee.id)).filter(
        Employee.company_id == company_id,      # ← REQUIRED
        Employee.status == "active"
    ).scalar()

    # ... all queries scoped to company_id
```

**Using `get_company_context()`:**

```python
@router.get("")
async def list_resources(
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    return db.query(YourModel).filter(
        YourModel.company_id == company_id
    ).all()
```

**Creating a resource (inject `company_id`):**

```python
@router.post("", status_code=201)
async def create_resource(
    data: ResourceCreate,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    resource = YourModel(
        id=str(uuid.uuid4()),
        company_id=company_id,     # ← Inject tenant context
        **data.model_dump()
    )
    db.add(resource)
    db.commit()
    return resource
```

**Updating/deleting a resource (validate ownership):**

```python
@router.put("/{resource_id}")
async def update_resource(
    resource_id: str,
    data: ResourceUpdate,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    resource = db.query(YourModel).filter(
        YourModel.id == resource_id,
        YourModel.company_id == company_id   # ← Ownership check
    ).first()

    if not resource:
        raise HTTPException(404, "Not found")   # 404 hides existence from other tenants

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(resource, key, value)
    db.commit()
    return resource
```

> **Important:** Always return `404 Not Found` (not `403 Forbidden`) when a resource exists but belongs to another tenant. This prevents information leakage — an attacker cannot distinguish "does not exist" from "exists but not yours".

### MongoDB Query Patterns

Use the helper functions from `backend/app/utils/mongo_helpers.py`:

```python
from ..utils.mongo_helpers import find_by_company, create_with_company

# List documents scoped to tenant
documents = await find_by_company(
    YourDocument,
    company_id=user.company_id,
    filters={"status": "active"},
    sort="-created_at",
    limit=50
)

# Create a document with tenant context
document = await create_with_company(
    YourDocument,
    company_id=user.company_id,
    data={"name": "Example", "user_id": user.id}
)
```

**Audit logging with tenant context:**

```python
audit = AuditLog(
    user_id=current_user.id,
    company_id=current_user.company_id,   # ← ALWAYS include
    action=AuditAction.CREATE,
    resource_type="employee",
    resource_id=new_employee.id,
    details={"name": new_employee.full_name}
)
await audit.insert()
```

### Cross-Cutting: Registration Flow

The `/api/auth/register` endpoint is the only place where a new `company_id` is created. It:

1. Creates a `Company` row
2. Creates the first `User` (role = `company_admin`) with `company_id` set to the new company
3. Issues JWT tokens containing the new `company_id`

```python
# backend/app/routers/auth.py — register_company()

company = Company(id=str(uuid.uuid4()), name=..., status="active")
db.add(company)
db.flush()

admin_user = User(
    id=str(uuid.uuid4()),
    company_id=company.id,    # ← Bind user to new company
    role="company_admin",
    ...
)
db.add(admin_user)
db.commit()

access_token = create_access_token(data={
    "sub": str(admin_user.id),
    "company_id": str(company.id),   # ← Embed in token
    "role": admin_user.role
})
```

---

## 5. Frontend Integration

### API Client — Automatic Header Injection

The `ApiClient` class in `frontend/src/lib/api/client.ts` automatically attaches tenant context to every request:

```typescript
private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

    // Redundant X-Company-ID header for server-side validation
    try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
            const authData = JSON.parse(authStorage);
            if (authData?.state?.company?.id) {
                headers["X-Company-ID"] = authData.state.company.id;
            }
        }
    } catch {
        // Silently fail
    }

    return headers;
}
```

Every `fetch()` call through `apiClient` includes:

| Header                        | Source                                   | Purpose                                                          |
| ----------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `Authorization: Bearer <JWT>` | `localStorage.access_token`              | Primary authentication + tenant context (via `company_id` claim) |
| `X-Company-ID: <uuid>`        | `auth-storage` (Zustand persisted state) | Redundant validation — middleware rejects mismatches             |

### Auth Store (Zustand)

The `useAuthStore` in `frontend/src/stores/auth-store.ts` manages authentication state:

```typescript
interface AuthState {
  user: User | null;
  company: Company | null; // Currently loaded tenant
  isAuthenticated: boolean;
  hasHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  validateCompanyContext: () => boolean; // ← Security check
  clearAuth: () => void;
}
```

**Key behaviors:**

- **Login/Register:** Stores `access_token` and `refresh_token` in `localStorage`, sets `user` and `company` in Zustand state.
- **Token refresh:** `ApiClient.attemptTokenRefresh()` is called automatically on 401 responses; refreshed tokens replace the old ones in `localStorage`.
- **Company context validation:** On state hydration (page load), `validateCompanyContext()` checks that `user.company_id === company.id`. On mismatch, it forces a **logout and redirect**:

```typescript
validateCompanyContext: () => {
  const state = useAuthStore.getState();
  if (!state.user || !state.company) return false;

  if (state.user.company_id !== state.company.id) {
    console.error("❌ Company context mismatch detected!");
    state.clearAuth();
    window.location.href = "/login?error=company_mismatch";
    return false;
  }
  return true;
};
```

- **Persistence:** Zustand `persist` middleware stores `user` and `company` in `localStorage` under the key `auth-storage`. The `onRehydrateStorage` callback re-validates company context every time the page loads.

### Frontend ↔ Backend Flow Summary

```
1. User logs in via <LoginForm>
2. auth-store.login() calls apiClient.login({ email, password })
3. Backend returns { user, company, access_token, refresh_token }
4. Tokens stored in localStorage; user/company stored in Zustand
5. Subsequent requests:
   - apiClient.getAuthHeaders() appends Authorization + X-Company-ID
   - Backend middleware validates headers
   - Route handler uses company_id for query filtering
6. On page reload:
   - Zustand rehydrates from localStorage
   - validateCompanyContext() runs automatically
   - If mismatch → forced logout
```

---

## 6. Adding New Entities

Follow this checklist when adding a new tenant-scoped table and endpoint.

### Step 1: SQLAlchemy Model

Create in `backend/app/models/`:

```python
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin

class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True)
    company_id = Column(
        String(36),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True                   # ← NEVER forget the index
    )
    invoice_number = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="draft")

    # Relationship back to Company
    company = relationship("Company", back_populates="invoices")
```

### Step 2: Register Relationship on Company

In `backend/app/models/company.py`:

```python
class Company(Base, TimestampMixin):
    # ... existing fields ...
    invoices = relationship("Invoice", back_populates="company", cascade="all, delete-orphan")
```

### Step 3: Export from Models Package

In `backend/app/models/__init__.py`:

```python
from .invoice import Invoice
```

### Step 4: Create Pydantic Schemas

In `backend/app/schemas/invoice.py`:

```python
from pydantic import BaseModel
from typing import Optional

class InvoiceCreate(BaseModel):
    invoice_number: str
    amount: float
    status: Optional[str] = "draft"
    # NOTE: Do NOT include company_id — it's injected server-side

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: str
    company_id: str
    invoice_number: str
    amount: float
    status: str

    model_config = {"from_attributes": True}
```

> **Never** include `company_id` as a client-writable field in `Create` or `Update` schemas. It must always be injected from `get_company_context()`.

### Step 5: Create Router

In `backend/app/routers/invoices.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from ..database import get_db
from ..models import Invoice
from ..schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from ..auth import get_company_context

router = APIRouter()

@router.get("", response_model=list[InvoiceResponse])
async def list_invoices(
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    return db.query(Invoice).filter(
        Invoice.company_id == company_id
    ).all()

@router.post("", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    invoice = Invoice(
        id=str(uuid.uuid4()),
        company_id=company_id,
        **data.model_dump()
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == company_id
    ).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    data: InvoiceUpdate,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == company_id
    ).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(invoice, key, value)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == company_id
    ).first()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice deleted"}
```

### Step 6: Register Router in main.py

```python
from .routers import invoices
app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])
```

### Step 7: Create Alembic Migration

```bash
cd backend
alembic revision --autogenerate -m "add invoices table"
alembic upgrade head
```

### Step 8: MongoDB Document (if applicable)

If the entity needs MongoDB documents (e.g., for audit, analytics, or unstructured data):

```python
# backend/app/mongo_models.py
class InvoiceEvent(Document):
    company_id: str                    # ← REQUIRED
    invoice_id: str
    event_type: str
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "invoice_events"
        indexes = [
            "company_id",
            [("company_id", 1), ("timestamp", -1)],
        ]
```

Register in `connect_mongodb()` → `init_beanie()` → `document_models` list.

### Checklist Summary

- [ ] Model has `company_id` FK → `companies.id` with `ondelete="CASCADE"` and `index=True`
- [ ] `Company` model has reverse relationship with `cascade="all, delete-orphan"`
- [ ] Model exported from `models/__init__.py`
- [ ] `Create`/`Update` schemas **exclude** `company_id`
- [ ] Router uses `Depends(get_company_context)` or `Depends(get_current_user)`
- [ ] **ALL** queries include `.filter(Model.company_id == company_id)`
- [ ] CREATE injects `company_id` from dependency
- [ ] UPDATE/DELETE filter by both `id` AND `company_id`
- [ ] Cross-tenant lookup returns `404` (not `403`)
- [ ] Router registered in `main.py` with prefix
- [ ] Alembic migration created and applied
- [ ] MongoDB documents (if any) include `company_id` and compound indexes
- [ ] MongoDB document model registered in `init_beanie()`

---

## 7. Testing Multi-Tenancy

### What to Verify

Every feature involving tenant data must pass these tests:

#### Data Isolation

| Test                                         | Expected Outcome                                              |
| -------------------------------------------- | ------------------------------------------------------------- |
| Company A lists resources                    | Sees only Company A data                                      |
| Company A fetches Company B's resource by ID | `404 Not Found`                                               |
| Company A updates Company B's resource by ID | `404 Not Found`                                               |
| Company A deletes Company B's resource by ID | `404 Not Found`                                               |
| Company A creates a resource                 | `company_id` is set to Company A's ID (not from request body) |

#### Token Security

| Test                                           | Expected Outcome                        |
| ---------------------------------------------- | --------------------------------------- |
| Request with expired token                     | `401 Unauthorized`                      |
| Request with tampered `company_id` in token    | `401 Unauthorized` (signature invalid)  |
| Valid token + mismatched `X-Company-ID` header | `403 Forbidden` with `COMPANY_MISMATCH` |
| Token for deactivated company                  | `403 Forbidden`                         |
| Token for deactivated user                     | `403 Forbidden`                         |

#### Edge Cases

| Test                                           | Expected Outcome                                                |
| ---------------------------------------------- | --------------------------------------------------------------- |
| User reassigned to new company, uses old token | `401 Unauthorized` (company mismatch in `get_current_user`)     |
| Company deleted while user has valid token     | `403 Forbidden`                                                 |
| Query with no `company_id` filter (bug)        | Should be caught in code review — there's no runtime safety net |

### Practical Test Setup

```python
import pytest
import uuid

@pytest.fixture
def company_a(db):
    """Create test Company A."""
    company = Company(id=str(uuid.uuid4()), name="Company A", email="a@test.com", status="active")
    db.add(company)
    db.commit()
    return company

@pytest.fixture
def company_b(db):
    """Create test Company B."""
    company = Company(id=str(uuid.uuid4()), name="Company B", email="b@test.com", status="active")
    db.add(company)
    db.commit()
    return company

@pytest.fixture
def user_a(db, company_a):
    """Create user belonging to Company A."""
    user = User(
        id=str(uuid.uuid4()),
        company_id=company_a.id,
        email="admin@a.com",
        hashed_password=get_password_hash("password"),
        first_name="Admin", last_name="A",
        role="company_admin", is_active=True
    )
    db.add(user)
    db.commit()
    return user

def token_for(user):
    """Generate a valid JWT for the given user."""
    return create_access_token(data={
        "sub": user.id,
        "company_id": user.company_id,
        "role": user.role
    })


class TestMultiTenancyIsolation:
    """Verify tenant isolation on the employees endpoint."""

    def test_list_only_own_employees(self, client, db, company_a, company_b, user_a):
        # Seed employees for both companies
        emp_a = Employee(id=str(uuid.uuid4()), company_id=company_a.id, ...)
        emp_b = Employee(id=str(uuid.uuid4()), company_id=company_b.id, ...)
        db.add_all([emp_a, emp_b])
        db.commit()

        # Request as Company A user
        resp = client.get("/api/employees", headers={
            "Authorization": f"Bearer {token_for(user_a)}"
        })
        assert resp.status_code == 200
        ids = [e["id"] for e in resp.json()]
        assert emp_a.id in ids
        assert emp_b.id not in ids     # ← CRITICAL

    def test_cannot_access_other_company_resource(self, client, db, company_b, user_a):
        emp_b = Employee(id=str(uuid.uuid4()), company_id=company_b.id, ...)
        db.add(emp_b)
        db.commit()

        resp = client.get(f"/api/employees/{emp_b.id}", headers={
            "Authorization": f"Bearer {token_for(user_a)}"
        })
        assert resp.status_code == 404   # ← Not 403

    def test_company_id_injected_on_create(self, client, db, company_a, user_a):
        resp = client.post("/api/employees", json={...}, headers={
            "Authorization": f"Bearer {token_for(user_a)}"
        })
        assert resp.status_code == 201
        assert resp.json()["company_id"] == company_a.id

    def test_header_mismatch_blocked(self, client, user_a, company_b):
        resp = client.get("/api/employees", headers={
            "Authorization": f"Bearer {token_for(user_a)}",
            "X-Company-ID": company_b.id     # ← Mismatch!
        })
        assert resp.status_code == 403
        assert resp.json()["error_code"] == "COMPANY_MISMATCH"
```

### Common Pitfalls

| Pitfall                                          | Consequence                           | Prevention                                             |
| ------------------------------------------------ | ------------------------------------- | ------------------------------------------------------ |
| **Forgot `.filter(company_id == ...)`**          | Data leaks across tenants             | Code review checklist; grep for unfiltered queries     |
| **Accepted `company_id` from request body**      | Attacker injects another tenant's ID  | Create schemas must exclude `company_id`               |
| **Used `403` instead of `404` for cross-tenant** | Reveals that a resource exists        | Always use `404` for ownership failures                |
| **Joined tables without re-filtering**           | Parent is scoped but child leaks      | Add `company_id` filter on every joined table          |
| **Background task without company context**      | Celery task queries all tenants       | Pass `company_id` explicitly to task arguments         |
| **MongoDB query without `company_id`**           | Aggregations return cross-tenant data | Always include `company_id` in the query filter        |
| **Globally unique constraint on tenant data**    | One tenant's data blocks another      | Use compound unique constraints: `(company_id, field)` |

---

## Related Documentation

- [MULTI_TENANCY_QUICK_REFERENCE.md](MULTI_TENANCY_QUICK_REFERENCE.md) — Developer cheat sheet with copy-paste patterns
- [RBAC_AND_DB_CONSOLIDATION.md](RBAC_AND_DB_CONSOLIDATION.md) — Role-based access and database consolidation details
- [BACKEND_API_SPECIFICATION.md](BACKEND_API_SPECIFICATION.md) — Full API endpoint reference

## Key Source Files

| File                                | Purpose                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `backend/app/middleware/tenant.py`  | `TenantContextMiddleware` — JWT extraction, header validation, security logging |
| `backend/app/auth/security.py`      | `get_current_user()`, `get_company_context()`, `RoleChecker`, JWT creation      |
| `backend/app/models/company.py`     | `Company` model — tenant root entity                                            |
| `backend/app/models/user.py`        | `User` model with `company_id` FK                                               |
| `backend/app/mongodb.py`            | MongoDB connection, Beanie initialization                                       |
| `backend/app/mongo_models.py`       | MongoDB document models (all include `company_id`)                              |
| `frontend/src/lib/api/client.ts`    | `ApiClient` — auto-injects `Authorization` + `X-Company-ID` headers             |
| `frontend/src/stores/auth-store.ts` | `useAuthStore` — Zustand store with `validateCompanyContext()`                  |
