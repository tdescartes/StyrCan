# Multi-Tenancy Quick Reference

## 🚀 Quick Start for Developers

### ✅ **The Golden Rules**

1. **ALWAYS use `get_company_context()` dependency**
2. **ALWAYS filter by `company_id`**
3. **NEVER query without company scope**
4. **ALWAYS validate resource ownership**

---

## 📋 Cheat Sheet

### **Backend Router Pattern**

```python
from fastapi import APIRouter, Depends
from ..auth import get_company_context, get_current_user
from ..models import YourModel

router = APIRouter()

# LIST - Get all resources for company
@router.get("")
async def list_resources(
    company_id: str = Depends(get_company_context),  # ← Required
    db: Session = Depends(get_db)
):
    return db.query(YourModel).filter(
        YourModel.company_id == company_id  # ← Required
    ).all()

# GET ONE - Get specific resource
@router.get("/{resource_id}")
async def get_resource(
    resource_id: str,
    company_id: str = Depends(get_company_context),  # ← Required
    db: Session = Depends(get_db)
):
    resource = db.query(YourModel).filter(
        YourModel.id == resource_id,
        YourModel.company_id == company_id  # ← Validates ownership
    ).first()

    if not resource:
        raise HTTPException(404, "Not found")

    return resource

# CREATE - New resource
@router.post("")
async def create_resource(
    data: ResourceCreate,
    company_id: str = Depends(get_company_context),  # ← Required
    db: Session = Depends(get_db)
):
    resource = YourModel(
        id=str(uuid.uuid4()),
        company_id=company_id,  # ← Inject company_id
        **data.model_dump()
    )
    db.add(resource)
    db.commit()
    return resource

# UPDATE - Modify resource
@router.put("/{resource_id}")
async def update_resource(
    resource_id: str,
    data: ResourceUpdate,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    resource = db.query(YourModel).filter(
        YourModel.id == resource_id,
        YourModel.company_id == company_id  # ← Validate ownership
    ).first()

    if not resource:
        raise HTTPException(404, "Not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(resource, key, value)

    db.commit()
    return resource

# DELETE - Remove resource
@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    resource = db.query(YourModel).filter(
        YourModel.id == resource_id,
        YourModel.company_id == company_id  # ← Validate ownership
    ).first()

    if not resource:
        raise HTTPException(404, "Not found")

    db.delete(resource)
    db.commit()
    return {"message": "Deleted successfully"}
```

---

### **MongoDB Pattern**

```python
from ..utils.mongo_helpers import find_by_company, create_with_company
from ..mongo_models import YourDocument

# LIST
documents = await find_by_company(
    YourDocument,
    company_id=user.company_id,
    filters={"status": "active"},
    sort="-created_at",
    limit=50
)

# CREATE
document = await create_with_company(
    YourDocument,
    company_id=user.company_id,
    data={"name": "Example", "user_id": user.id}
)

# VALIDATE
from ..utils.mongo_helpers import validate_company_access_for_document
doc = await YourDocument.get(doc_id)
validate_company_access_for_document(doc, user.company_id)
```

---

### **Database Model Template**

```python
from sqlalchemy import Column, String, ForeignKey
from ..database import Base
from .base import TimestampMixin

class YourModel(Base, TimestampMixin):
    __tablename__ = "your_table"

    id = Column(String(36), primary_key=True)
    company_id = Column(
        String(36),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True  # ← Always index
    )
    name = Column(String(255), nullable=False)

    # Relationship
    company = relationship("Company", back_populates="your_models")
```

---

### **Frontend API Call**

```typescript
// client.ts - Headers auto-injected
async getResources(): Promise<Resource[]> {
    return this.get("/api/resources");  // ← Company context automatic
}

async createResource(data: ResourceCreate): Promise<Resource> {
    return this.post("/api/resources", data);
}
```

---

## ⚠️ Common Mistakes

### ❌ **DON'T DO THIS:**

```python
# WRONG - No company filtering
employees = db.query(Employee).all()

# WRONG - No company dependency
@router.get("/employees")
async def list_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()

# WRONG - No ownership validation
@router.delete("/employee/{id}")
async def delete_employee(id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == id).first()
    db.delete(employee)  # Could delete from another company!
```

### ✅ **DO THIS INSTEAD:**

```python
# CORRECT - Always filter by company
employees = db.query(Employee).filter(
    Employee.company_id == current_user.company_id
).all()

# CORRECT - Use dependency
@router.get("/employees")
async def list_employees(
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    return db.query(Employee).filter(
        Employee.company_id == company_id
    ).all()

# CORRECT - Validate ownership
@router.delete("/employee/{id}")
async def delete_employee(
    id: str,
    company_id: str = Depends(get_company_context),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.id == id,
        Employee.company_id == company_id  # ← Validate!
    ).first()

    if not employee:
        raise HTTPException(404, "Not found")

    db.delete(employee)
    db.commit()
```

---

## 🔍 Testing Checklist

When implementing a new feature:

- [ ] Model has `company_id` foreign key
- [ ] Router uses `get_company_context()` dependency
- [ ] All queries filter by `company_id`
- [ ] CREATE injects `company_id`
- [ ] UPDATE validates ownership with `company_id` filter
- [ ] DELETE validates ownership with `company_id` filter
- [ ] MongoDB documents include `company_id`
- [ ] Indexes include `company_id`
- [ ] Test with two companies - verify isolation
- [ ] Test cross-company access returns 404/403
- [ ] Audit logs include company context

---

## 🎯 File Locations

**Backend:**

- Security helpers: `backend/app/auth/security.py`
- Tenant middleware: `backend/app/middleware/tenant.py`
- MongoDB helpers: `backend/app/utils/mongo_helpers.py`
- Example routers: `backend/app/routers/employees.py`

**Frontend:**

- API client: `frontend/src/lib/api/client.ts`
- Auth store: `frontend/src/stores/auth-store.ts`
- Header component: `frontend/src/components/layout/service-header.tsx`

**Documentation:**

- Full guide: `docs/MULTI_TENANCY_ARCHITECTURE.md`
- Summary: `docs/MULTI_TENANCY_IMPLEMENTATION_SUMMARY.md`

---

## 📞 Need Help?

1. **Check existing routers** for examples
2. **Review documentation** in `docs/` folder
3. **Test with multiple companies** to verify isolation
4. **Monitor audit logs** for security issues

---

**Remember:** When in doubt, ALWAYS filter by company_id! 🔒
