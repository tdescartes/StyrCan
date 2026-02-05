"""Finance-related Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


# Enums
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


# Transaction Schemas
class TransactionBase(BaseModel):
    type: TransactionType
    category: Optional[str] = Field(None, max_length=100)
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None
    transaction_date: date


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: Optional[TransactionType] = None
    category: Optional[str] = Field(None, max_length=100)
    amount: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = None
    transaction_date: Optional[date] = None


class TransactionResponse(TransactionBase):
    id: str
    company_id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    skip: int
    limit: int


# Expense Category Schemas
class ExpenseCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    budget_limit: Optional[Decimal] = Field(None, ge=0)


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    budget_limit: Optional[Decimal] = Field(None, ge=0)


class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: str
    company_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpenseCategoryListResponse(BaseModel):
    categories: List[ExpenseCategoryResponse]
    total: int


# Financial Summary Schemas
class CategorySummary(BaseModel):
    category: str
    total: Decimal
    count: int


class FinancialSummary(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_balance: Decimal
    income_by_category: List[CategorySummary]
    expenses_by_category: List[CategorySummary]
    period_start: date
    period_end: date


class MonthlyTrend(BaseModel):
    month: str
    income: Decimal
    expenses: Decimal
    net: Decimal


class FinancialTrendsResponse(BaseModel):
    trends: List[MonthlyTrend]
    period_months: int
