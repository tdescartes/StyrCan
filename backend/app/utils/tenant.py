"""Tenant isolation utilities for multi-tenancy."""

from typing import Optional, Any
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth.security import get_current_user
from ..models.user import User


def get_company_context(current_user: User = Depends(get_current_user)) -> str:
    """
    Extract company_id from authenticated user.
    
    This is the PRIMARY way to get company context in route handlers.
    Use this dependency in EVERY endpoint that needs company filtering.
    
    Usage:
        @router.get("/employees")
        async def get_employees(
            company_id: str = Depends(get_company_context),
            db: Session = Depends(get_db)
        ):
            employees = db.query(Employee).filter(
                Employee.company_id == company_id
            ).all()
            return employees
    
    Returns:
        Company UUID string
    
    Raises:
        HTTPException 403: If user has no company_id (should never happen)
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no company association"
        )
    
    return current_user.company_id


def validate_resource_ownership(
    resource: Any,
    company_id: str,
    resource_type: str = "resource"
) -> None:
    """
    Validate that a resource belongs to the specified company.
    
    This function ensures cross-company access is prevented for
    UPDATE and DELETE operations.
    
    Usage:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(404, "Employee not found")
        
        validate_resource_ownership(employee, current_user.company_id, "employee")
        
        # Now safe to update/delete
        employee.status = "inactive"
        db.commit()
    
    Args:
        resource: Database model instance with company_id attribute
        company_id: Current user's company_id
        resource_type: Human-readable resource name for error messages
    
    Raises:
        HTTPException 403: If resource does not belong to the company
        HTTPException 500: If resource has no company_id attribute
    """
    # Verify resource has company_id
    if not hasattr(resource, 'company_id'):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resource type '{resource_type}' does not support multi-tenancy"
        )
    
    # Verify ownership
    if resource.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: {resource_type} belongs to a different company"
        )


class ValidateCompanyAccess:
    """
    Dependency class for validating resource ownership.
    
    Usage as a dependency:
        validate_access = ValidateCompanyAccess("employee")
        
        @router.put("/employees/{employee_id}")
        async def update_employee(
            employee_id: str,
            employee: Employee = Depends(validate_access),
            db: Session = Depends(get_db)
        ):
            # employee is already validated
            employee.status = "inactive"
            db.commit()
            return employee
    """
    
    def __init__(self, resource_name: str, model_class: Any = None):
        """
        Initialize validator.
        
        Args:
            resource_name: Human-readable resource name for errors
            model_class: SQLAlchemy model class (if provided, enables auto-fetch)
        """
        self.resource_name = resource_name
        self.model_class = model_class
    
    def __call__(
        self,
        resource_id: str,
        company_id: str = Depends(get_company_context),
        db: Session = Depends(get_db)
    ) -> Any:
        """
        Fetch and validate resource ownership.
        
        Args:
            resource_id: ID of the resource to validate
            company_id: Current user's company ID (auto-injected)
            db: Database session (auto-injected)
        
        Returns:
            The validated resource instance
        
        Raises:
            HTTPException 404: If resource not found
            HTTPException 403: If resource belongs to different company
        """
        if not self.model_class:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="ValidateCompanyAccess requires model_class to be set"
            )
        
        # Fetch resource
        resource = db.query(self.model_class).filter(
            self.model_class.id == resource_id
        ).first()
        
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.resource_name.capitalize()} not found"
            )
        
        # Validate ownership
        validate_resource_ownership(resource, company_id, self.resource_name)
        
        return resource


def ensure_company_filter(query, model_class: Any, company_id: str):
    """
    Add company_id filter to a query if not already present.
    
    This is a safety helper to ensure queries are always scoped to company.
    
    Usage:
        query = db.query(Employee)
        query = ensure_company_filter(query, Employee, current_user.company_id)
        employees = query.all()
    
    Args:
        query: SQLAlchemy query object
        model_class: Model class being queried
        company_id: Company ID to filter by
    
    Returns:
        Modified query with company_id filter
    """
    # Check if model has company_id
    if not hasattr(model_class, 'company_id'):
        return query
    
    # Add filter
    return query.filter(model_class.company_id == company_id)


async def log_cross_company_attempt(
    user_id: str,
    company_id: str,
    resource_type: str,
    resource_id: str,
    attempted_company_id: Optional[str] = None,
    request: Optional[Request] = None
):
    """
    Log suspicious cross-company access attempts.
    
    This function records security events to MongoDB for audit trails.
    
    Args:
        user_id: User attempting access
        company_id: User's legitimate company_id
        resource_type: Type of resource (e.g., "employee", "transaction")
        resource_id: ID of resource they tried to access
        attempted_company_id: Company ID of the resource (if known)
        request: FastAPI request object for IP/user agent
    """
    from ..mongo_models import AuditLog, AuditAction
    from datetime import datetime
    
    details = {
        "resource_type": resource_type,
        "resource_id": resource_id,
        "user_company_id": company_id,
        "attempted_company_id": attempted_company_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if request:
        details["ip_address"] = request.client.host if request.client else None
        details["user_agent"] = request.headers.get("user-agent")
        details["path"] = str(request.url.path)
        details["method"] = request.method
    
    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        company_id=company_id,
        action=AuditAction.READ,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=details.get("ip_address"),
        user_agent=details.get("user_agent"),
        details=details,
        success=False,
        error_message="Attempted cross-company access"
    )
    
    try:
        await audit.insert()
    except Exception as e:
        # Don't fail the request if audit logging fails
        print(f"⚠️  Failed to log cross-company attempt: {str(e)}")
