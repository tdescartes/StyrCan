"""Dashboard router for aggregated analytics and KPIs."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
from pydantic import BaseModel
from typing import List

from ..database import get_db
from ..models import Employee, Transaction, PayrollRun, PayrollItem, PTORequest, Shift
from ..auth import get_current_user

router = APIRouter()


# Response schemas
class EmployeeStats(BaseModel):
    total: int
    active: int
    on_leave: int
    new_this_month: int


class FinancialStats(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_profit: Decimal
    profit_margin: float


class PayrollStats(BaseModel):
    last_run_amount: Optional[Decimal]
    last_run_date: Optional[date]
    pending_payments: int
    total_this_year: Decimal


class PTOStats(BaseModel):
    pending_requests: int
    approved_this_month: int
    total_days_used: Decimal


class UpcomingShift(BaseModel):
    employee_name: str
    date: date
    start_time: datetime
    end_time: datetime


class RecentActivity(BaseModel):
    type: str
    description: str
    timestamp: datetime


class DashboardResponse(BaseModel):
    employee_stats: EmployeeStats
    financial_stats: FinancialStats
    payroll_stats: PayrollStats
    pto_stats: PTOStats
    upcoming_shifts: List[UpcomingShift]
    recent_activities: List[RecentActivity]


class ChartDataPoint(BaseModel):
    label: str
    value: Decimal


class FinancialChartData(BaseModel):
    income_by_month: List[ChartDataPoint]
    expenses_by_month: List[ChartDataPoint]
    expenses_by_category: List[ChartDataPoint]


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard summary data for the company."""
    company_id = current_user["company_id"]
    today = date.today()
    month_start = today.replace(day=1)
    year_start = today.replace(month=1, day=1)
    
    # Employee Stats
    total_employees = db.query(Employee).filter(
        Employee.company_id == company_id
    ).count()
    
    active_employees = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.status == "active"
    ).count()
    
    on_leave_employees = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.status == "on_leave"
    ).count()
    
    new_employees = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.hire_date >= month_start
    ).count()
    
    # Financial Stats (current month)
    income_result = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "income",
        Transaction.transaction_date >= month_start
    ).scalar()
    
    expenses_result = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= month_start
    ).scalar()
    
    total_income = Decimal(str(income_result))
    total_expenses = Decimal(str(expenses_result))
    net_profit = total_income - total_expenses
    profit_margin = float(net_profit / total_income * 100) if total_income > 0 else 0.0
    
    # Payroll Stats
    last_payroll = db.query(PayrollRun).filter(
        PayrollRun.company_id == company_id,
        PayrollRun.status == "completed"
    ).order_by(PayrollRun.processed_at.desc()).first()
    
    pending_payments = db.query(PayrollItem).join(PayrollRun).filter(
        PayrollRun.company_id == company_id,
        PayrollItem.payment_status == "pending"
    ).count()
    
    yearly_payroll = db.query(
        func.coalesce(func.sum(PayrollItem.net_pay), 0)
    ).join(PayrollRun).filter(
        PayrollRun.company_id == company_id,
        PayrollRun.status == "completed",
        PayrollRun.period_start >= year_start
    ).scalar()
    
    # PTO Stats
    pending_pto = db.query(PTORequest).join(Employee).filter(
        Employee.company_id == company_id,
        PTORequest.status == "pending"
    ).count()
    
    approved_pto = db.query(PTORequest).join(Employee).filter(
        Employee.company_id == company_id,
        PTORequest.status == "approved",
        PTORequest.reviewed_at >= month_start
    ).count()
    
    pto_days_used = db.query(
        func.coalesce(func.sum(PTORequest.days_requested), 0)
    ).join(Employee).filter(
        Employee.company_id == company_id,
        PTORequest.status == "approved",
        PTORequest.start_date >= year_start
    ).scalar()
    
    # Upcoming Shifts (next 7 days)
    week_ahead = today + timedelta(days=7)
    upcoming_shifts_query = db.query(
        Shift, Employee.first_name, Employee.last_name
    ).join(Employee).filter(
        Employee.company_id == company_id,
        Shift.shift_date >= today,
        Shift.shift_date <= week_ahead,
        Shift.status == "scheduled"
    ).order_by(Shift.shift_date.asc()).limit(10).all()
    
    upcoming_shifts = [
        UpcomingShift(
            employee_name=f"{first_name} {last_name}",
            date=shift.shift_date,
            start_time=shift.start_time,
            end_time=shift.end_time
        )
        for shift, first_name, last_name in upcoming_shifts_query
    ]
    
    # Recent Activities (mock for now - would need an activity log table)
    recent_activities = []
    
    # Add recent transactions
    recent_transactions = db.query(Transaction).filter(
        Transaction.company_id == company_id
    ).order_by(Transaction.created_at.desc()).limit(3).all()
    
    for txn in recent_transactions:
        recent_activities.append(RecentActivity(
            type="transaction",
            description=f"{'Income' if txn.type == 'income' else 'Expense'}: ${txn.amount} - {txn.description or txn.category}",
            timestamp=txn.created_at
        ))
    
    # Add recent PTO requests
    recent_pto = db.query(PTORequest).join(Employee).filter(
        Employee.company_id == company_id
    ).order_by(PTORequest.created_at.desc()).limit(2).all()
    
    for pto in recent_pto:
        recent_activities.append(RecentActivity(
            type="pto",
            description=f"PTO request ({pto.status}): {pto.days_requested} days",
            timestamp=pto.created_at
        ))
    
    # Sort by timestamp
    recent_activities.sort(key=lambda x: x.timestamp, reverse=True)
    recent_activities = recent_activities[:5]
    
    return DashboardResponse(
        employee_stats=EmployeeStats(
            total=total_employees,
            active=active_employees,
            on_leave=on_leave_employees,
            new_this_month=new_employees
        ),
        financial_stats=FinancialStats(
            total_income=total_income,
            total_expenses=total_expenses,
            net_profit=net_profit,
            profit_margin=round(profit_margin, 2)
        ),
        payroll_stats=PayrollStats(
            last_run_amount=last_payroll.total_amount if last_payroll else None,
            last_run_date=last_payroll.period_end if last_payroll else None,
            pending_payments=pending_payments,
            total_this_year=Decimal(str(yearly_payroll))
        ),
        pto_stats=PTOStats(
            pending_requests=pending_pto,
            approved_this_month=approved_pto,
            total_days_used=Decimal(str(pto_days_used))
        ),
        upcoming_shifts=upcoming_shifts,
        recent_activities=recent_activities
    )


@router.get("/charts", response_model=FinancialChartData)
async def get_dashboard_charts(
    months: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get chart data for the dashboard."""
    company_id = current_user["company_id"]
    today = date.today()
    
    income_by_month = []
    expenses_by_month = []
    
    for i in range(months - 1, -1, -1):
        # Calculate month boundaries
        month_date = (today.replace(day=1) - timedelta(days=i * 30))
        month_start = month_date.replace(day=1)
        
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
        
        month_label = month_start.strftime("%b %Y")
        
        # Get income
        income = db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.company_id == company_id,
            Transaction.type == "income",
            Transaction.transaction_date >= month_start,
            Transaction.transaction_date <= month_end
        ).scalar()
        
        income_by_month.append(ChartDataPoint(
            label=month_label,
            value=Decimal(str(income))
        ))
        
        # Get expenses
        expenses = db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.company_id == company_id,
            Transaction.type == "expense",
            Transaction.transaction_date >= month_start,
            Transaction.transaction_date <= month_end
        ).scalar()
        
        expenses_by_month.append(ChartDataPoint(
            label=month_label,
            value=Decimal(str(expenses))
        ))
    
    # Get expenses by category (current year)
    year_start = today.replace(month=1, day=1)
    expenses_by_cat = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= year_start
    ).group_by(Transaction.category).all()
    
    expenses_by_category = [
        ChartDataPoint(
            label=cat or "Uncategorized",
            value=Decimal(str(total))
        )
        for cat, total in expenses_by_cat
    ]
    
    return FinancialChartData(
        income_by_month=income_by_month,
        expenses_by_month=expenses_by_month,
        expenses_by_category=expenses_by_category
    )


@router.get("/summary/quick")
async def get_quick_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a quick summary for widgets."""
    company_id = current_user["company_id"]
    today = date.today()
    month_start = today.replace(day=1)
    
    # Quick counts
    active_employees = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.status == "active"
    ).count()
    
    pending_pto = db.query(PTORequest).join(Employee).filter(
        Employee.company_id == company_id,
        PTORequest.status == "pending"
    ).count()
    
    # Today's shifts
    todays_shifts = db.query(Shift).join(Employee).filter(
        Employee.company_id == company_id,
        Shift.shift_date == today
    ).count()
    
    # This month's revenue
    monthly_income = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "income",
        Transaction.transaction_date >= month_start
    ).scalar()
    
    return {
        "active_employees": active_employees,
        "pending_pto_requests": pending_pto,
        "todays_shifts": todays_shifts,
        "monthly_revenue": float(monthly_income)
    }
