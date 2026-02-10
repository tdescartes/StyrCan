"""Finance management router with transactions and expense categories."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid

from ..database import get_db
from ..models import Transaction, ExpenseCategory
from ..models.user import User
from ..schemas.finance import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate,
    ExpenseCategoryResponse,
    ExpenseCategoryListResponse,
    FinancialSummary,
    CategorySummary,
    FinancialTrendsResponse,
    MonthlyTrend,
    TransactionType,
)
from ..auth import get_current_user, require_manager, require_admin

router = APIRouter()


# ============== Dashboard ==============

@router.get("/dashboard", response_model=dict)
async def get_finance_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get finance dashboard KPIs."""
    company_id = current_user.company_id
    today = date.today()
    month_start = today.replace(day=1)
    
    # Current month income
    current_month_income = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "income",
        Transaction.transaction_date >= month_start
    ).scalar()
    
    # Current month expenses
    current_month_expenses = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= month_start
    ).scalar()
    
    # Year to date income
    year_start = today.replace(month=1, day=1)
    ytd_income = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "income",
        Transaction.transaction_date >= year_start
    ).scalar()
    
    # Year to date expenses
    ytd_expenses = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= year_start
    ).scalar()
    
    # Top expense categories this month
    top_expenses = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.company_id == company_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= month_start
    ).group_by(Transaction.category).order_by(
        func.sum(Transaction.amount).desc()
    ).limit(5).all()
    
    return {
        "current_month_income": Decimal(str(current_month_income)),
        "current_month_expenses": Decimal(str(current_month_expenses)),
        "current_month_net": Decimal(str(current_month_income)) - Decimal(str(current_month_expenses)),
        "ytd_income": Decimal(str(ytd_income)),
        "ytd_expenses": Decimal(str(ytd_expenses)),
        "ytd_net": Decimal(str(ytd_income)) - Decimal(str(ytd_expenses)),
        "top_expense_categories": [
            {"category": cat or "Uncategorized", "total": Decimal(str(total))}
            for cat, total in top_expenses
        ]
    }


# ============== Transactions ==============

@router.get("/transactions", response_model=TransactionListResponse)
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    type: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all transactions for the current user's company."""
    query = db.query(Transaction).filter(
        Transaction.company_id == current_user.company_id
    )
    
    if type:
        query = query.filter(Transaction.type == type)
    
    if category:
        query = query.filter(Transaction.category == category)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(Transaction.description.ilike(search_term))
    
    total = query.count()
    transactions = query.order_by(
        Transaction.transaction_date.desc()
    ).offset(skip).limit(limit).all()
    
    return TransactionListResponse(
        transactions=[TransactionResponse.model_validate(t) for t in transactions],
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction."""
    transaction = Transaction(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        created_by=current_user.id,
        **transaction_data.model_dump()
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return TransactionResponse.model_validate(transaction)


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific transaction."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.company_id == current_user.company_id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return TransactionResponse.model_validate(transaction)


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update a transaction."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.company_id == current_user.company_id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    update_data = transaction_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    db.commit()
    db.refresh(transaction)
    
    return TransactionResponse.model_validate(transaction)


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete a transaction."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.company_id == current_user.company_id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    db.delete(transaction)
    db.commit()


# ============== Expense Categories ==============

@router.get("/categories", response_model=ExpenseCategoryListResponse)
async def get_expense_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all expense categories for the company."""
    categories = db.query(ExpenseCategory).filter(
        ExpenseCategory.company_id == current_user.company_id
    ).all()
    
    return ExpenseCategoryListResponse(
        categories=[ExpenseCategoryResponse.model_validate(c) for c in categories],
        total=len(categories)
    )


@router.post("/categories", response_model=ExpenseCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_expense_category(
    category_data: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new expense category."""
    # Check if category name already exists
    existing = db.query(ExpenseCategory).filter(
        ExpenseCategory.company_id == current_user.company_id,
        ExpenseCategory.name == category_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    category = ExpenseCategory(
        id=str(uuid.uuid4()),
        company_id=current_user.company_id,
        **category_data.model_dump()
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return ExpenseCategoryResponse.model_validate(category)


@router.put("/categories/{category_id}", response_model=ExpenseCategoryResponse)
async def update_expense_category(
    category_id: str,
    category_data: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update an expense category."""
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == category_id,
        ExpenseCategory.company_id == current_user.company_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return ExpenseCategoryResponse.model_validate(category)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete an expense category (admin only)."""
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == category_id,
        ExpenseCategory.company_id == current_user.company_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    db.delete(category)
    db.commit()


# ============== Financial Summary & Analytics ==============

@router.get("/summary", response_model=FinancialSummary)
async def get_financial_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get financial summary for a period."""
    if not start_date:
        start_date = date.today().replace(day=1)  # First day of current month
    
    if not end_date:
        end_date = date.today()
    
    # Get income total
    income_result = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == current_user.company_id,
        Transaction.type == "income",
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).scalar()
    
    # Get expense total
    expense_result = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.company_id == current_user.company_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).scalar()
    
    total_income = Decimal(str(income_result))
    total_expenses = Decimal(str(expense_result))
    
    # Get income by category
    income_by_cat = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count")
    ).filter(
        Transaction.company_id == current_user.company_id,
        Transaction.type == "income",
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Transaction.category).all()
    
    # Get expenses by category
    expenses_by_cat = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count")
    ).filter(
        Transaction.company_id == current_user.company_id,
        Transaction.type == "expense",
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).group_by(Transaction.category).all()
    
    return FinancialSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        net_balance=total_income - total_expenses,
        income_by_category=[
            CategorySummary(
                category=cat or "Uncategorized",
                total=Decimal(str(total)),
                count=count
            )
            for cat, total, count in income_by_cat
        ],
        expenses_by_category=[
            CategorySummary(
                category=cat or "Uncategorized",
                total=Decimal(str(total)),
                count=count
            )
            for cat, total, count in expenses_by_cat
        ],
        period_start=start_date,
        period_end=end_date
    )


@router.get("/trends", response_model=FinancialTrendsResponse)
async def get_financial_trends(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get monthly financial trends for the specified number of months."""
    trends = []
    today = date.today()
    
    for i in range(months - 1, -1, -1):
        # Calculate month start and end
        month_date = today.replace(day=1) - timedelta(days=i * 30)
        month_start = month_date.replace(day=1)
        
        # Get last day of month
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
        
        # Get income for month
        income = db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.company_id == current_user.company_id,
            Transaction.type == "income",
            Transaction.transaction_date >= month_start,
            Transaction.transaction_date <= month_end
        ).scalar()
        
        # Get expenses for month
        expenses = db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.company_id == current_user.company_id,
            Transaction.type == "expense",
            Transaction.transaction_date >= month_start,
            Transaction.transaction_date <= month_end
        ).scalar()
        
        income_dec = Decimal(str(income))
        expenses_dec = Decimal(str(expenses))
        
        trends.append(MonthlyTrend(
            month=month_start.strftime("%Y-%m"),
            income=income_dec,
            expenses=expenses_dec,
            net=income_dec - expenses_dec
        ))
    
    return FinancialTrendsResponse(
        trends=trends,
        period_months=months
    )
