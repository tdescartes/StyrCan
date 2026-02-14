"""Payroll management router with payroll runs and processing."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

from ..database import get_db
from ..models import PayrollRun, PayrollItem, Employee
from ..models.user import User
from ..schemas.payroll import (
    PayrollRunCreate,
    PayrollRunUpdate,
    PayrollRunResponse,
    PayrollRunListResponse,
    PayrollRunDetailResponse,
    PayrollItemCreate,
    PayrollItemUpdate,
    PayrollItemResponse,
    PayrollItemWithEmployee,
    ProcessPayrollRequest,
    PayrollHistoryResponse,
    EmployeePayrollSummary,
    PayrollStatus,
    PaymentStatus,
)
from ..auth import get_current_user, require_manager, require_admin

router = APIRouter()


# ============== Dashboard ==============

@router.get("/dashboard", response_model=dict)
async def get_payroll_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll dashboard KPIs."""
    company_id = current_user.company_id
    today = date.today()
    current_month = today.replace(day=1)
    
    # Current month payroll
    current_payroll = db.query(PayrollRun).filter(
        PayrollRun.company_id == company_id,
        PayrollRun.period_start >= current_month
    ).first()
    
    # Upcoming payroll (next month)
    next_month = (current_month.replace(day=28) + timedelta(days=4)).replace(day=1)
    upcoming_payroll = db.query(PayrollRun).filter(
        PayrollRun.company_id == company_id,
        PayrollRun.period_start >= next_month
    ).first()
    
    # Total this year
    year_start = today.replace(month=1, day=1)
    ytd_total = db.query(
        func.coalesce(func.sum(PayrollRun.total_amount), 0)
    ).filter(
        PayrollRun.company_id == company_id,
        PayrollRun.period_start >= year_start,
        PayrollRun.status == "completed"
    ).scalar()
    
    # Number of employees paid
    employees_count = db.query(func.count(func.distinct(PayrollItem.employee_id))).join(
        PayrollRun
    ).filter(
        PayrollRun.company_id == company_id,
        PayrollRun.status == "completed",
        PayrollItem.payment_status == "paid"
    ).scalar()
    
    # Recent payroll runs
    recent_runs = db.query(PayrollRun).filter(
        PayrollRun.company_id == company_id
    ).order_by(PayrollRun.created_at.desc()).limit(5).all()
    
    return {
        "current_payroll": PayrollRunResponse.model_validate(current_payroll) if current_payroll else None,
        "upcoming_payroll": PayrollRunResponse.model_validate(upcoming_payroll) if upcoming_payroll else None,
        "ytd_total_payroll": Decimal(str(ytd_total)),
        "employees_paid_this_year": employees_count,
        "recent_payroll_runs": [PayrollRunResponse.model_validate(pr) for pr in recent_runs]
    }


# ============== Payroll Runs ==============

@router.get("/runs", response_model=PayrollRunListResponse)
async def get_payroll_runs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status_filter: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payroll runs for the company."""
    query = db.query(PayrollRun).filter(
        PayrollRun.company_id == current_user.company_id
    )
    
    if status_filter:
        query = query.filter(PayrollRun.status == status_filter)
    
    if year:
        query = query.filter(
            func.extract('year', PayrollRun.period_start) == year
        )
    
    total = query.count()
    payroll_runs = query.order_by(
        PayrollRun.period_end.desc()
    ).offset(skip).limit(limit).all()
    
    return PayrollRunListResponse(
        payroll_runs=[PayrollRunResponse.model_validate(pr) for pr in payroll_runs],
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("/runs", response_model=PayrollRunResponse, status_code=status.HTTP_201_CREATED)
async def create_payroll_run(
    payroll_data: PayrollRunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new payroll run (draft)."""
    # Check for overlapping periods
    existing = db.query(PayrollRun).filter(
        PayrollRun.company_id == current_user.company_id,
        PayrollRun.period_start <= payroll_data.period_end,
        PayrollRun.period_end >= payroll_data.period_start,
        PayrollRun.status != "cancelled"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A payroll run already exists for this period"
        )
    
    payroll_run = PayrollRun(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        period_start=payroll_data.period_start,
        period_end=payroll_data.period_end,
        status="draft"
    )
    
    db.add(payroll_run)
    db.commit()
    db.refresh(payroll_run)
    
    return PayrollRunResponse.model_validate(payroll_run)


@router.get("/runs/{run_id}", response_model=PayrollRunDetailResponse)
async def get_payroll_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll run details with all items."""
    payroll_run = db.query(PayrollRun).filter(
        PayrollRun.id == run_id,
        PayrollRun.company_id == current_user.company_id
    ).first()
    
    if not payroll_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found"
        )
    
    # Get items with employee details
    items_query = db.query(
        PayrollItem,
        Employee.first_name,
        Employee.last_name,
        Employee.email,
        Employee.department
    ).join(Employee).filter(
        PayrollItem.payroll_run_id == run_id
    ).all()
    
    items = []
    total_base_salary = Decimal(0)
    total_overtime = Decimal(0)
    total_bonus = Decimal(0)
    total_deductions = Decimal(0)
    total_tax = Decimal(0)
    total_net_pay = Decimal(0)
    
    for item, first_name, last_name, email, department in items_query:
        items.append(PayrollItemWithEmployee(
            id=item.id,
            payroll_run_id=item.payroll_run_id,
            employee_id=item.employee_id,
            base_salary=item.base_salary,
            overtime_hours=item.overtime_hours,
            overtime_rate=item.overtime_rate,
            bonus=item.bonus,
            deductions=item.deductions,
            tax_amount=item.tax_amount,
            net_pay=item.net_pay,
            payment_status=item.payment_status,
            paid_at=item.paid_at,
            created_at=item.created_at,
            updated_at=item.updated_at,
            employee_name=f"{first_name} {last_name}",
            employee_email=email,
            department=department
        ))
        
        total_base_salary += item.base_salary
        total_overtime += (item.overtime_hours * item.base_salary / 160 * item.overtime_rate)
        total_bonus += item.bonus
        total_deductions += item.deductions
        total_tax += item.tax_amount
        total_net_pay += item.net_pay
    
    return PayrollRunDetailResponse(
        id=payroll_run.id,
        company_id=payroll_run.company_id,
        period_start=payroll_run.period_start,
        period_end=payroll_run.period_end,
        status=payroll_run.status,
        total_amount=payroll_run.total_amount,
        processed_by=payroll_run.processed_by,
        processed_at=payroll_run.processed_at,
        created_at=payroll_run.created_at,
        updated_at=payroll_run.updated_at,
        items=items,
        total_base_salary=total_base_salary,
        total_overtime=total_overtime,
        total_bonus=total_bonus,
        total_deductions=total_deductions,
        total_tax=total_tax,
        total_net_pay=total_net_pay
    )


@router.post("/runs/{run_id}/process", response_model=PayrollRunDetailResponse)
async def process_payroll(
    run_id: str,
    process_data: ProcessPayrollRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Process a payroll run - calculate payroll for all employees."""
    payroll_run = db.query(PayrollRun).filter(
        PayrollRun.id == run_id,
        PayrollRun.company_id == current_user.company_id
    ).first()
    
    if not payroll_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found"
        )
    
    if payroll_run.status not in ["draft", "failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot process payroll in {payroll_run.status} status"
        )
    
    # Update status to processing
    payroll_run.status = "processing"
    db.commit()
    
    try:
        # Get employees to process
        employee_query = db.query(Employee).filter(
            Employee.company_id == current_user.company_id,
            Employee.status == "active"
        )
        
        if not process_data.include_all_employees and process_data.employee_ids:
            employee_query = employee_query.filter(
                Employee.id.in_(process_data.employee_ids)
            )
        
        employees = employee_query.all()
        
        # Delete existing items for this run
        db.query(PayrollItem).filter(
            PayrollItem.payroll_run_id == run_id
        ).delete()
        
        total_amount = Decimal(0)
        
        # Create payroll items for each employee
        for employee in employees:
            if not employee.salary_amount:
                continue
            
            base_salary = employee.salary_amount
            overtime_hours = Decimal(0)  # Would come from shift tracking
            overtime_rate = Decimal("1.5")
            bonus = Decimal(0)
            
            # Calculate overtime pay
            hourly_rate = base_salary / 160  # Assuming 160 hours/month
            overtime_pay = overtime_hours * hourly_rate * overtime_rate
            
            # Calculate gross pay
            gross_pay = base_salary + overtime_pay + bonus
            
            # Calculate tax (simplified - 20% flat rate)
            tax_amount = gross_pay * Decimal("0.20")
            
            # Calculate deductions (simplified)
            deductions = Decimal(0)
            
            # Calculate net pay
            net_pay = gross_pay - tax_amount - deductions
            
            payroll_item = PayrollItem(
                id=str(uuid.uuid4()),
                company_id=current_user.company_id,
                payroll_run_id=run_id,
                employee_id=employee.id,
                base_salary=base_salary,
                overtime_hours=overtime_hours,
                overtime_rate=overtime_rate,
                bonus=bonus,
                deductions=deductions,
                tax_amount=tax_amount,
                net_pay=net_pay,
                payment_status="pending"
            )
            
            db.add(payroll_item)
            total_amount += net_pay
        
        # Update payroll run
        payroll_run.status = "completed"
        payroll_run.total_amount = total_amount
        payroll_run.processed_by = current_user.id
        payroll_run.processed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(payroll_run)
        
    except Exception as e:
        payroll_run.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process payroll: {str(e)}"
        )
    
    # Return the detailed response
    return await get_payroll_run(run_id, db, current_user)


@router.put("/runs/{run_id}", response_model=PayrollRunResponse)
async def update_payroll_run(
    run_id: str,
    update_data: PayrollRunUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update payroll run status (admin only)."""
    payroll_run = db.query(PayrollRun).filter(
        PayrollRun.id == run_id,
        PayrollRun.company_id == current_user.company_id
    ).first()
    
    if not payroll_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found"
        )
    
    if update_data.status:
        payroll_run.status = update_data.status
    
    db.commit()
    db.refresh(payroll_run)
    
    return PayrollRunResponse.model_validate(payroll_run)


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a payroll run (admin only, draft status only)."""
    payroll_run = db.query(PayrollRun).filter(
        PayrollRun.id == run_id,
        PayrollRun.company_id == current_user.company_id
    ).first()
    
    if not payroll_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found"
        )
    
    if payroll_run.status not in ["draft", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft or cancelled payroll runs"
        )
    
    # Delete associated items first
    db.query(PayrollItem).filter(
        PayrollItem.payroll_run_id == run_id
    ).delete()
    
    db.delete(payroll_run)
    db.commit()


# ============== Payroll Items ==============

@router.get("/runs/{run_id}/items", response_model=List[PayrollItemWithEmployee])
async def get_payroll_items(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all items for a payroll run."""
    # Verify run belongs to company
    payroll_run = db.query(PayrollRun).filter(
        PayrollRun.id == run_id,
        PayrollRun.company_id == current_user.company_id
    ).first()
    
    if not payroll_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll run not found"
        )
    
    items_query = db.query(
        PayrollItem,
        Employee.first_name,
        Employee.last_name,
        Employee.email,
        Employee.department
    ).join(Employee).filter(
        PayrollItem.payroll_run_id == run_id
    ).all()
    
    return [
        PayrollItemWithEmployee(
            id=item.id,
            payroll_run_id=item.payroll_run_id,
            employee_id=item.employee_id,
            base_salary=item.base_salary,
            overtime_hours=item.overtime_hours,
            overtime_rate=item.overtime_rate,
            bonus=item.bonus,
            deductions=item.deductions,
            tax_amount=item.tax_amount,
            net_pay=item.net_pay,
            payment_status=item.payment_status,
            paid_at=item.paid_at,
            created_at=item.created_at,
            updated_at=item.updated_at,
            employee_name=f"{first_name} {last_name}",
            employee_email=email,
            department=department
        )
        for item, first_name, last_name, email, department in items_query
    ]


@router.put("/items/{item_id}", response_model=PayrollItemResponse)
async def update_payroll_item(
    item_id: str,
    update_data: PayrollItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update a payroll item."""
    # Single query with company verification
    item = db.query(PayrollItem).filter(
        PayrollItem.id == item_id,
        PayrollItem.company_id == current_user.company_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll item not found"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(item, field, value)
    
    # Recalculate net pay if financial fields changed
    if any(f in update_dict for f in ['base_salary', 'overtime_hours', 'overtime_rate', 'bonus', 'deductions', 'tax_amount']):
        hourly_rate = item.base_salary / 160
        overtime_pay = item.overtime_hours * hourly_rate * item.overtime_rate
        gross_pay = item.base_salary + overtime_pay + item.bonus
        item.net_pay = gross_pay - item.tax_amount - item.deductions
    
    # Update paid_at if marked as paid
    if update_data.payment_status == PaymentStatus.PAID and item.paid_at is None:
        item.paid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(item)
    
    return PayrollItemResponse.model_validate(item)


@router.post("/items/{item_id}/mark-paid", response_model=PayrollItemResponse)
async def mark_item_paid(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Mark a payroll item as paid."""
    # Single query with company verification
    item = db.query(PayrollItem).filter(
        PayrollItem.id == item_id,
        PayrollItem.company_id == current_user.company_id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll item not found"
        )
    
    item.payment_status = "paid"
    item.paid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(item)
    
    return PayrollItemResponse.model_validate(item)


# ============== Employee Payroll History ==============

@router.get("/employees/{employee_id}/history", response_model=PayrollHistoryResponse)
async def get_employee_payroll_history(
    employee_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(12, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payroll history for a specific employee."""
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
    
    # Get payroll items
    items = db.query(PayrollItem).join(PayrollRun).filter(
        PayrollItem.employee_id == employee_id,
        PayrollRun.status == "completed"
    ).order_by(PayrollRun.period_end.desc()).offset(skip).limit(limit).all()
    
    total = db.query(PayrollItem).join(PayrollRun).filter(
        PayrollItem.employee_id == employee_id,
        PayrollRun.status == "completed"
    ).count()
    
    # Calculate summary
    summary_result = db.query(
        func.sum(PayrollItem.base_salary + PayrollItem.bonus).label("total_earned"),
        func.sum(PayrollItem.deductions).label("total_deductions"),
        func.sum(PayrollItem.tax_amount).label("total_tax"),
        func.sum(PayrollItem.net_pay).label("net_received"),
        func.count(PayrollItem.id).label("count")
    ).join(PayrollRun).filter(
        PayrollItem.employee_id == employee_id,
        PayrollRun.status == "completed"
    ).first()
    
    return PayrollHistoryResponse(
        items=[PayrollItemResponse.model_validate(item) for item in items],
        total=total,
        summary=EmployeePayrollSummary(
            employee_id=employee_id,
            employee_name=f"{employee.first_name} {employee.last_name}",
            total_earned=Decimal(str(summary_result.total_earned or 0)),
            total_deductions=Decimal(str(summary_result.total_deductions or 0)),
            total_tax=Decimal(str(summary_result.total_tax or 0)),
            net_received=Decimal(str(summary_result.net_received or 0)),
            payroll_count=summary_result.count or 0
        )
    )
