# Multi-Tenancy Architecture Documentation

## 🎯 Overview

This application implements a **strict multi-tenancy architecture** where each company operates as an isolated entity. Users can only access data within their own company, with no cross-company data visibility or access.

---

## 🏛️ Architecture Layers

### 1. **Data Isolation Layer (Database)**

#### PostgreSQL

- Every business entity table includes a `company_id` foreign key
- All queries **MUST** filter by `company_id`
- Composite indexes optimize company-scoped queries
- Unique constraints are scoped per company (e.g., employee email)

#### MongoDB

- All documents include a required `company_id` field
- Compound indexes with `company_id` as the first field
- Helper functions enforce company filtering

### 2. **Authentication & Token Management**

#### JWT Payload Structure

```json
{
  "sub": "user_uuid",
  "company_id": "company_uuid",
  "role": "company_admin|manager|employee",
  "exp": 1234567890
}
```

#### Token Flow

1. User logs in → Backend validates credentials
2. Backend looks up user's `company_id`
3. JWT token generated with embedded `company_id`
4. Frontend stores token + company data
5. All subsequent requests include JWT with company context

### 3. **Tenant Middleware (Backend)**

**File:** `backend/app/middleware/tenant.py`

The middleware intercepts every API request (except public endpoints):

1. Extracts JWT token from `Authorization` header
2. Decodes token and extracts `company_id`, `user_id`, `role`
3. Injects values into `request.state` for easy access
4. Validates `X-Company-ID` header matches token (if present)
5. **Blocks request with 403 Forbidden** if mismatch detected

#### Protected Endpoints

All endpoints except:

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/refresh`
- `/docs`, `/redoc`, `/openapi.json`, `/health`

### 4. **Security Layer (Backend Dependencies)**

**File:** `backend/app/auth/security.py`

#### Key Functions

**`get_current_user()`**

- Validates JWT token
- Fetches user from database
- Verifies `company_id` in token matches user's company
- Ensures company still exists
- Returns authenticated user or raises 401/403

**`get_company_context()`**

- Dependency injection helper
- Extracts `company_id` from authenticated user
- Use in ALL endpoints that need company filtering

**`validate_company_access()`**

- Validates a resource belongs to user's company
- Use when accessing resources by ID
- Raises 403 if company mismatch

#### Role-Based Access Control

```python
require_admin = RoleChecker(["company_admin", "super_admin"])
require_manager = RoleChecker(["manager", "company_admin", "super_admin"])
require_employee = RoleChecker(["employee", "manager", "company_admin", "super_admin"])
```

### 5. **API Router Pattern (Backend)**

**Pattern for ALL endpoints:**

```python
from fastapi import APIRouter, Depends
from ..auth import get_current_user, get_company_context
from ..models import Employee

router = APIRouter()

@router.get("/employees")
async def list_employees(
    company_id: str = Depends(get_company_context),  # ← CRITICAL
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List employees - automatically scoped to user's company."""
    employees = db.query(Employee).filter(
        Employee.company_id == company_id  # ← ALWAYS filter by company_id
    ).all()

    return {"employees": employees}
```

**Key Rules:**

1. ✅ **ALWAYS** use `Depends(get_company_context)` or `Depends(get_current_user)`
2. ✅ **ALWAYS** filter queries by `company_id`
3. ✅ Validate resource ownership before updates/deletes
4. ❌ **NEVER** allow cross-company queries

### 6. **MongoDB Query Helpers**

**File:** `backend/app/utils/mongo_helpers.py`

#### Helper Functions

**`find_by_company()`**

```python
# Find all audit logs for a company
logs = await find_by_company(
    AuditLog,
    company_id="123-456",
    filters={"action": "login"},
    sort="-timestamp",
    limit=100
)
```

**`create_with_company()`**

```python
# Create document with company_id auto-injected
notification = await create_with_company(
    Notification,
    company_id=user.company_id,
    data={
        "user_id": user.id,
        "title": "Welcome",
        "message": "Your account is active"
    }
)
```

**`validate_company_access_for_document()`**

```python
# Validate document belongs to company
notification = await Notification.get(notif_id)
validate_company_access_for_document(notification, user.company_id)
```

### 7. **Frontend API Client**

**File:** `frontend/src/lib/api/client.ts`

#### Header Injection

Every authenticated request includes:

```typescript
headers: {
  "Authorization": "Bearer <jwt_token>",
  "X-Company-ID": "<company_uuid>",  // Redundant check
  "Content-Type": "application/json"
}
```

#### Company Context Extraction

```typescript
private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    // Extract company ID from auth storage
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
        const authData = JSON.parse(authStorage);
        if (authData?.state?.company?.id) {
            headers["X-Company-ID"] = authData.state.company.id;
        }
    }

    return headers;
}
```

### 8. **Frontend Auth Store**

**File:** `frontend/src/stores/auth-store.ts`

#### State Management

```typescript
interface AuthState {
  user: User | null;
  company: Company | null; // ← Company data stored
  isAuthenticated: boolean;
  validateCompanyContext: () => boolean; // ← Validation function
}
```

#### Company Context Validation

```typescript
validateCompanyContext: () => {
  const { user, company } = useAuthStore.getState();

  // Must have both user and company
  if (!user || !company) return false;

  // User must belong to loaded company
  if (user.company_id !== company.id) {
    console.error("Company context mismatch!");
    clearAuth(); // Force logout
    window.location.href = "/login?error=company_mismatch";
    return false;
  }

  return true;
};
```

### 9. **Frontend UI Components**

**File:** `frontend/src/components/layout/service-header.tsx`

#### Company Display

- Company name displayed in header badge (desktop)
- Company name shown in user dropdown menu
- Provides visual confirmation of current tenant context

---

## 🔒 Security Enforcement Points

### Registration Flow

1. User registers → Creates **Company + Admin User**
2. Company gets unique UUID
3. Admin user assigned to company
4. JWT includes company_id
5. No way to join another company (closed tenant system)

### Data Access Control

**Rule:** `company_id` MUST be in WHERE clause for ALL queries

**Enforcement:**

- Custom dependencies inject company context
- Middleware validates company headers
- Audit logging tracks access patterns
- Alerts on suspicious cross-company attempts

### Cross-Company Prevention

| Scenario                                            | Result            |
| --------------------------------------------------- | ----------------- |
| User A (Company X) accesses Employee from Company Y | ❌ 403 Forbidden  |
| User B (Company Y) accesses Payroll from Company X  | ❌ 403 Forbidden  |
| Admin (Company X) modifies Finance from Company Y   | ❌ 403 Forbidden  |
| User within own company                             | ✅ Access Granted |

---

## 📊 Database Schema

### Company Table

```sql
CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Child Tables (Example: Employees)

```sql
CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    -- ... other fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Composite index for optimized queries
    INDEX idx_employees_company_status (company_id, status, created_at),
    -- Email unique per company
    UNIQUE INDEX idx_employees_company_email (company_id, email)
);
```

### Composite Indexes (Migration 003)

All tables have optimized indexes for company-scoped queries:

- `(company_id, status, created_at)` - For filtered lists
- `(company_id, email)` - For unique constraints within company
- `(company_id, employee_id, date)` - For relationship queries

---

## 🚀 Implementation Guide

### Adding a New Entity

#### 1. Database Model (SQLAlchemy)

```python
from sqlalchemy import Column, String, ForeignKey
from ..database import Base
from .base import TimestampMixin

class NewEntity(Base, TimestampMixin):
    __tablename__ = "new_entities"

    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"),
                       nullable=False, index=True)  # ← REQUIRED
    name = Column(String(255), nullable=False)

    # Relationship
    company = relationship("Company", back_populates="new_entities")
```

#### 2. Router Endpoint

```python
from fastapi import APIRouter, Depends
from ..auth import get_company_context, get_current_user

router = APIRouter()

@router.get("")
async def list_entities(
    company_id: str = Depends(get_company_context),  # ← ALWAYS include
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entities = db.query(NewEntity).filter(
        NewEntity.company_id == company_id  # ← ALWAYS filter
    ).all()
    return {"entities": entities}

@router.post("")
async def create_entity(
    data: EntityCreate,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)  # ← Role check if needed
):
    entity = NewEntity(
        id=str(uuid.uuid4()),
        company_id=company_id,  # ← Inject company_id
        **data.model_dump()
    )
    db.add(entity)
    db.commit()
    return entity

@router.get("/{entity_id}")
async def get_entity(
    entity_id: str,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    entity = db.query(NewEntity).filter(
        NewEntity.id == entity_id,
        NewEntity.company_id == company_id  # ← VALIDATE ownership
    ).first()

    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    return entity
```

#### 3. Frontend API Client

```typescript
// Add to ApiClient class in client.ts
async getEntities(): Promise<{ entities: Entity[] }> {
    return this.get("/api/entities");  // Headers auto-injected
}

async createEntity(data: EntityCreate): Promise<Entity> {
    return this.post("/api/entities", data);
}
```

### MongoDB Document

```python
from beanie import Document
from datetime import datetime

class NewDocument(Document):
    company_id: str  # ← REQUIRED
    user_id: str
    name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "new_documents"
        indexes = [
            "company_id",
            [("company_id", 1), ("timestamp", -1)]  # ← Compound index
        ]
```

**Usage:**

```python
# Use helper functions
from ..utils.mongo_helpers import find_by_company, create_with_company

# Query
docs = await find_by_company(
    NewDocument,
    company_id=user.company_id,
    filters={"status": "active"}
)

# Create
doc = await create_with_company(
    NewDocument,
    company_id=user.company_id,
    data={"name": "Example", "user_id": user.id}
)
```

---

## 🧪 Testing Multi-Tenancy

### Test Cases

#### 1. **Cross-Company Access Prevention**

```python
# User from Company A tries to access Company B's employee
response = client.get(
    f"/api/employees/{company_b_employee_id}",
    headers={"Authorization": f"Bearer {company_a_token}"}
)
assert response.status_code == 404  # Not found (company scope)
```

#### 2. **Company Context Validation**

```python
# Token with company A, header with company B
response = client.get(
    "/api/employees",
    headers={
        "Authorization": f"Bearer {company_a_token}",
        "X-Company-ID": company_b_id
    }
)
assert response.status_code == 403  # Forbidden (mismatch)
```

#### 3. **Data Isolation**

```python
# Create employee in Company A
emp_a = create_employee(company_a, "Alice")

# Query from Company B
employees_b = query_employees(company_b_user)

# Should not see Company A's employee
assert emp_a.id not in [e.id for e in employees_b]
```

---

## 🎨 User Experience

### Company Registration

1. User visits registration page
2. Enters company info + admin credentials
3. Backend creates Company + Admin User atomically
4. User immediately logged in with full company context
5. Dashboard shows company-specific data only

### Employee Experience

1. Employee logs in with email/password
2. JWT issued with company_id embedded
3. All API calls automatically scoped to their company
4. UI displays company name in header
5. No visibility into other companies

### Admin Experience

1. Full control within their company
2. Can manage users, employees, finances
3. Cannot cross company boundaries
4. Can customize company settings
5. Audit logs track all actions

---

## 📈 Performance Optimization

### Database Indexes

All company-scoped queries use composite indexes:

```sql
-- Optimal: Uses index efficiently
SELECT * FROM employees
WHERE company_id = ? AND status = ?
ORDER BY created_at DESC;

-- Index: (company_id, status, created_at)
```

### Query Patterns

- **Filter first:** Always filter by `company_id` first
- **Use indexes:** Queries leverage composite indexes
- **Limit results:** Pagination prevents large result sets
- **Cache wisely:** Cache per company, not globally

### MongoDB Performance

```python
# Optimal query with compound index
await AuditLog.find({
    "company_id": company_id,  # First in index
    "action": "login",
    "timestamp": {"$gte": start_date}
}).sort("-timestamp").limit(100).to_list()

# Index: [("company_id", 1), ("timestamp", -1)]
```

---

## 🔧 Maintenance & Monitoring

### Audit Logging

All company-scoped operations logged to MongoDB:

```python
audit_log = AuditLog(
    user_id=user.id,
    company_id=user.company_id,
    action="update",
    resource_type="employee",
    resource_id=employee.id,
    changes={"salary": {"old": 50000, "new": 55000}},
    timestamp=datetime.utcnow()
)
await audit_log.insert()
```

### Monitoring Alerts

- Company ID mismatch attempts
- Cross-company access attempts
- Failed authentication with wrong company
- Unusual query patterns

### Health Checks

```python
# Verify company isolation
async def verify_tenant_isolation():
    companies = await get_all_companies()
    for company in companies:
        employee_count = count_employees(company.id)
        accessible = query_employees_as_user(other_company_user)
        assert len(accessible) == 0, "Cross-company leak detected!"
```

---

## 🚨 Common Pitfalls & Solutions

### ❌ Forgot to Filter by Company

```python
# WRONG
employees = db.query(Employee).all()  # Returns ALL companies!
```

```python
# CORRECT
employees = db.query(Employee).filter(
    Employee.company_id == current_user.company_id
).all()
```

### ❌ Missing Company Context Dependency

```python
# WRONG
@router.get("/employees")
async def list_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()  # No company filter!
```

```python
# CORRECT
@router.get("/employees")
async def list_employees(
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    return db.query(Employee).filter(
        Employee.company_id == company_id
    ).all()
```

### ❌ Not Validating Resource Ownership

```python
# WRONG
@router.delete("/employees/{emp_id}")
async def delete_employee(emp_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == emp_id).first()
    db.delete(employee)  # Could delete from another company!
```

```python
# CORRECT
@router.delete("/employees/{emp_id}")
async def delete_employee(
    emp_id: str,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.id == emp_id,
        Employee.company_id == company_id  # Validate ownership
    ).first()

    if not employee:
        raise HTTPException(404, "Employee not found")

    db.delete(employee)
    db.commit()
```

---

## 📚 Additional Resources

- **PostgreSQL Row-Level Security:** [Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- **Multi-Tenancy Patterns:** [Martin Fowler](https://martinfowler.com/articles/multi-tenant.html)
- **JWT Best Practices:** [Auth0 Guide](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-best-practices)
- **FastAPI Security:** [Official Docs](https://fastapi.tiangolo.com/tutorial/security/)

---

## 🎯 Implementation Checklist

When adding a new feature, ensure:

- [ ] Database model has `company_id` foreign key
- [ ] Composite indexes include `company_id`
- [ ] Router endpoints use `get_company_context()` dependency
- [ ] All queries filter by `company_id`
- [ ] Resource ownership validated on updates/deletes
- [ ] MongoDB documents include `company_id`
- [ ] Frontend API client auto-injects headers
- [ ] Tests verify cross-company isolation
- [ ] Audit logs include company context
- [ ] Documentation updated

---

## 📞 Support

For questions or issues with multi-tenancy implementation:

1. Review this documentation
2. Check existing router implementations as examples
3. Test thoroughly with multiple companies
4. Monitor audit logs for anomalies

---

**Last Updated:** February 14, 2026  
**Version:** 1.0  
**Maintainer:** Development Team
