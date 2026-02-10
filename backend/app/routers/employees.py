"""Employee management router with CRUD operations, PTO, and shifts."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, date
import uuid

from ..database import get_db
from ..models import Employee, PTOBalance, PTORequest, Shift, User
from ..schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    EmployeeDetailResponse,
    PTOBalanceCreate,
    PTOBalanceUpdate,
    PTOBalanceResponse,
    PTORequestCreate,
    PTORequestUpdate,
    PTORequestResponse,
    PTORequestListResponse,
    ShiftCreate,
    ShiftUpdate,
    ShiftResponse,
    ShiftListResponse,
    EmployeeStatus,
    PTOStatus,
    ShiftStatus,
)
from ..auth import get_current_user, require_admin, require_manager

router = APIRouter()


# ============== Dashboard ==============

@router.get("/dashboard", response_model=dict)
async def get_employees_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee dashboard KPIs."""
    company_id = current_user.company_id
    
    # Total employees
    total_employees = db.query(func.count(Employee.id)).filter(
        Employee.company_id == company_id
    ).scalar()
    
    # Active employees
    active_employees = db.query(func.count(Employee.id)).filter(
        Employee.company_id == company_id,
        Employee.status == "active"
    ).scalar()
    
    # On leave
    on_leave = db.query(func.count(Employee.id)).filter(
        Employee.company_id == company_id,
        Employee.status == "on_leave"
    ).scalar()
    
    # Pending PTO requests
    pending_pto = db.query(func.count(PTORequest.id)).join(Employee).filter(
        Employee.company_id == company_id,
        PTORequest.status == "pending"
    ).scalar()
    
    # Employees by department
    dept_counts = db.query(
        Employee.department,
        func.count(Employee.id).label('count')
    ).filter(
        Employee.company_id == company_id,
        Employee.status == "active"
    ).group_by(Employee.department).all()
    
    departments = [
        {"name": dept, "count": count} 
        for dept, count in dept_counts if dept
    ]
    
    # Recent hires (last 30 days)
    from datetime import timedelta
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_hires = db.query(func.count(Employee.id)).filter(
        Employee.company_id == company_id,
        Employee.hire_date >= thirty_days_ago
    ).scalar()
    
    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "on_leave": on_leave,
        "pending_pto_requests": pending_pto,
        "recent_hires": recent_hires,
        "departments": departments
    }


# ============== Employee CRUD ==============

@router.get("", response_model=EmployeeListResponse)
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all employees for the current user's company."""
    query = db.query(Employee).filter(Employee.company_id == current_user.company_id)
    
    if status:
        query = query.filter(Employee.status == status)
    
    if department:
        query = query.filter(Employee.department == department)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_term)) |
            (Employee.last_name.ilike(search_term)) |
            (Employee.email.ilike(search_term))
        )
    
    total = query.count()
    employees = query.offset(skip).limit(limit).all()
    
    return EmployeeListResponse(
        employees=[EmployeeResponse.model_validate(emp) for emp in employees],
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new employee."""
    # Check if email already exists
    existing = db.query(Employee).filter(
        Employee.email == employee_data.email,
        Employee.company_id == current_user.company_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee with this email already exists"
        )

    employee = Employee(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        **employee_data.model_dump()
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    
    # Create default PTO balance for current year
    current_year = datetime.now().year
    pto_balance = PTOBalance(
        id=str(uuid.uuid4()),
        employee_id=employee.id,
        year=current_year,
        total_days=20,  # Default PTO days
        used_days=0,
        available_days=20
    )
    db.add(pto_balance)
    db.commit()
    
    return EmployeeResponse.model_validate(employee)


@router.get("/{employee_id}", response_model=EmployeeDetailResponse)
async def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee details including PTO and shifts."""
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return EmployeeDetailResponse.model_validate(employee)


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update an employee."""
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Update only provided fields
    update_data = employee_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    db.commit()
    db.refresh(employee)
    
    return EmployeeResponse.model_validate(employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete an employee (admin only)."""
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    db.delete(employee)
    db.commit()


# ============== PTO Balance ==============

@router.get("/{employee_id}/pto-balance", response_model=PTOBalanceResponse)
async def get_employee_pto_balance(
    employee_id: str,
    year: int = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee's PTO balance for a specific year."""
    if year is None:
        year = datetime.now().year
    
    # Verify employee belongs to company
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    pto_balance = db.query(PTOBalance).filter(
        PTOBalance.employee_id == employee_id,
        PTOBalance.year == year
    ).first()
    
    if not pto_balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PTO balance not found for year {year}"
        )
    
    return PTOBalanceResponse.model_validate(pto_balance)


@router.put("/{employee_id}/pto-balance", response_model=PTOBalanceResponse)
async def update_pto_balance(
    employee_id: str,
    balance_data: PTOBalanceUpdate,
    year: int = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update employee's PTO balance."""
    if year is None:
        year = datetime.now().year
    
    pto_balance = db.query(PTOBalance).filter(
        PTOBalance.employee_id == employee_id,
        PTOBalance.year == year
    ).first()
    
    if not pto_balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PTO balance not found for year {year}"
        )
    
    update_data = balance_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pto_balance, field, value)
    
    # Recalculate available days
    pto_balance.available_days = pto_balance.total_days - pto_balance.used_days
    
    db.commit()
    db.refresh(pto_balance)
    
    return PTOBalanceResponse.model_validate(pto_balance)


# ============== PTO Requests ==============

@router.get("/{employee_id}/pto-requests", response_model=PTORequestListResponse)
async def get_employee_pto_requests(
    employee_id: str,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee's PTO requests."""
    query = db.query(PTORequest).filter(PTORequest.employee_id == employee_id)
    
    if status_filter:
        query = query.filter(PTORequest.status == status_filter)
    
    requests = query.order_by(PTORequest.created_at.desc()).all()
    
    return PTORequestListResponse(
        requests=[PTORequestResponse.model_validate(req) for req in requests],
        total=len(requests)
    )


@router.post("/{employee_id}/pto-requests", response_model=PTORequestResponse, status_code=status.HTTP_201_CREATED)
async def create_pto_request(
    employee_id: str,
    request_data: PTORequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a PTO request for an employee."""
    # Verify employee exists
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Calculate days requested
    days_diff = (request_data.end_date - request_data.start_date).days + 1
    
    # Check PTO balance
    current_year = request_data.start_date.year
    pto_balance = db.query(PTOBalance).filter(
        PTOBalance.employee_id == employee_id,
        PTOBalance.year == current_year
    ).first()
    
    if pto_balance and pto_balance.available_days < days_diff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient PTO balance. Available: {pto_balance.available_days}, Requested: {days_diff}"
        )
    
    pto_request = PTORequest(
        id=str(uuid.uuid4()),
        employee_id=employee_id,
        start_date=request_data.start_date,
        end_date=request_data.end_date,
        days_requested=days_diff,
        reason=request_data.reason,
        status="pending"
    )
    
    db.add(pto_request)
    db.commit()
    db.refresh(pto_request)
    
    return PTORequestResponse.model_validate(pto_request)


@router.get("/pto-requests/pending", response_model=PTORequestListResponse)
async def get_pending_pto_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get all pending PTO requests for the company (managers only)."""
    requests = db.query(PTORequest).join(Employee).filter(
        Employee.company_id == current_user.company_id,
        PTORequest.status == "pending"
    ).order_by(PTORequest.created_at.desc()).all()
    
    return PTORequestListResponse(
        requests=[PTORequestResponse.model_validate(req) for req in requests],
        total=len(requests)
    )


@router.put("/pto-requests/{request_id}", response_model=PTORequestResponse)
async def update_pto_request(
    request_id: str,
    request_data: PTORequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Approve or deny a PTO request (managers only)."""
    pto_request = db.query(PTORequest).filter(PTORequest.id == request_id).first()

    if not pto_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PTO request not found"
        )
    
    # Verify employee belongs to manager's company
    employee = db.query(Employee).filter(
        Employee.id == pto_request.employee_id,
        Employee.company_id == current_user.company_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this request"
        )
    
    old_status = pto_request.status
    pto_request.status = request_data.status
    pto_request.reviewed_by = current_user.id
    pto_request.reviewed_at = datetime.utcnow()
    
    # Update PTO balance if approved
    if request_data.status == "approved" and old_status == "pending":
        pto_balance = db.query(PTOBalance).filter(
            PTOBalance.employee_id == pto_request.employee_id,
            PTOBalance.year == pto_request.start_date.year
        ).first()
        
        if pto_balance:
            pto_balance.used_days += pto_request.days_requested
            pto_balance.available_days = pto_balance.total_days - pto_balance.used_days
    
    db.commit()
    db.refresh(pto_request)
    
    return PTORequestResponse.model_validate(pto_request)


# ============== Shifts ==============

@router.get("/{employee_id}/shifts", response_model=ShiftListResponse)
async def get_employee_shifts(
    employee_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee's shifts within a date range."""
    query = db.query(Shift).filter(Shift.employee_id == employee_id)
    
    if start_date:
        query = query.filter(Shift.shift_date >= start_date)
    
    if end_date:
        query = query.filter(Shift.shift_date <= end_date)
    
    shifts = query.order_by(Shift.shift_date.asc()).all()
    
    return ShiftListResponse(
        shifts=[ShiftResponse.model_validate(s) for s in shifts],
        total=len(shifts)
    )


@router.post("/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(
    shift_data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new shift."""
    # Verify employee belongs to company
    employee = db.query(Employee).filter(
        Employee.id == shift_data.employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    shift = Shift(
        id=str(uuid.uuid4()),
        **shift_data.model_dump()
    )
    
    db.add(shift)
    db.commit()
    db.refresh(shift)
    
    return ShiftResponse.model_validate(shift)


@router.get("/shifts", response_model=ShiftListResponse)
async def get_all_shifts(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all shifts for the company."""
    query = db.query(Shift).join(Employee).filter(
        Employee.company_id == current_user.company_id
    )
    
    if start_date:
        query = query.filter(Shift.shift_date >= start_date)
    
    if end_date:
        query = query.filter(Shift.shift_date <= end_date)
    
    if department:
        query = query.filter(Employee.department == department)
    
    shifts = query.order_by(Shift.shift_date.asc()).all()
    
    return ShiftListResponse(
        shifts=[ShiftResponse.model_validate(s) for s in shifts],
        total=len(shifts)
    )


@router.put("/shifts/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: str,
    shift_data: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update a shift."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    # Verify shift belongs to company
    employee = db.query(Employee).filter(
        Employee.id == shift.employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this shift"
        )
    
    update_data = shift_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shift, field, value)
    
    db.commit()
    db.refresh(shift)
    
    return ShiftResponse.model_validate(shift)


@router.delete("/shifts/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete a shift."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    # Verify shift belongs to company
    employee = db.query(Employee).filter(
        Employee.id == shift.employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this shift"
        )
    
    db.delete(shift)
    db.commit()


@router.get("/export", response_model=dict)
async def export_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export employees to CSV format."""
    import csv
    from io import StringIO
    
    employees = db.query(Employee).filter(
        Employee.company_id == current_user.company_id
    ).all()
    
    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'First Name', 'Last Name', 'Email', 'Phone',
        'Position', 'Department', 'Hire Date', 'Employment Type',
        'Status', 'Salary'
    ])
    
    # Write data
    for emp in employees:
        writer.writerow([
            emp.id, emp.first_name, emp.last_name, emp.email, emp.phone,
            emp.position, emp.department, emp.hire_date, emp.employment_type,
            emp.status, emp.salary_amount
        ])
    
    csv_data = output.getvalue()
    output.close()
    
    return {
        "success": True,
        "data": csv_data,
        "filename": f"employees_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    }
