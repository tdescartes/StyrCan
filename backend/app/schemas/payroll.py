"""Payroll-related Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


# Enums
class PayrollStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


# Payroll Run Schemas
class PayrollRunBase(BaseModel):
    period_start: date
    period_end: date


class PayrollRunCreate(PayrollRunBase):
    pass


class PayrollRunUpdate(BaseModel):
    status: Optional[PayrollStatus] = None


class PayrollRunResponse(PayrollRunBase):
    id: str
    company_id: str
    status: PayrollStatus
    total_amount: Optional[Decimal] = None
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayrollRunListResponse(BaseModel):
    payroll_runs: List[PayrollRunResponse]
    total: int
    skip: int
    limit: int


# Payroll Item Schemas
class PayrollItemBase(BaseModel):
    base_salary: Decimal = Field(..., ge=0)
    overtime_hours: Decimal = Field(default=0, ge=0)
    overtime_rate: Decimal = Field(default=1.5, ge=1)
    bonus: Decimal = Field(default=0, ge=0)
    deductions: Decimal = Field(default=0, ge=0)
    tax_amount: Decimal = Field(default=0, ge=0)


class PayrollItemCreate(PayrollItemBase):
    employee_id: str


class PayrollItemUpdate(BaseModel):
    base_salary: Optional[Decimal] = Field(None, ge=0)
    overtime_hours: Optional[Decimal] = Field(None, ge=0)
    overtime_rate: Optional[Decimal] = Field(None, ge=1)
    bonus: Optional[Decimal] = Field(None, ge=0)
    deductions: Optional[Decimal] = Field(None, ge=0)
    tax_amount: Optional[Decimal] = Field(None, ge=0)
    payment_status: Optional[PaymentStatus] = None


class PayrollItemResponse(PayrollItemBase):
    id: str
    payroll_run_id: str
    employee_id: str
    net_pay: Decimal
    payment_status: PaymentStatus
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayrollItemWithEmployee(PayrollItemResponse):
    employee_name: str
    employee_email: str
    department: Optional[str] = None


class PayrollRunDetailResponse(PayrollRunResponse):
    items: List[PayrollItemWithEmployee] = []
    total_base_salary: Decimal = Decimal(0)
    total_overtime: Decimal = Decimal(0)
    total_bonus: Decimal = Decimal(0)
    total_deductions: Decimal = Decimal(0)
    total_tax: Decimal = Decimal(0)
    total_net_pay: Decimal = Decimal(0)


# Payroll Processing Request
class ProcessPayrollRequest(BaseModel):
    include_all_employees: bool = True
    employee_ids: Optional[List[str]] = None


# Employee Payroll History
class EmployeePayrollSummary(BaseModel):
    employee_id: str
    employee_name: str
    total_earned: Decimal
    total_deductions: Decimal
    total_tax: Decimal
    net_received: Decimal
    payroll_count: int


class PayrollHistoryResponse(BaseModel):
    items: List[PayrollItemResponse]
    total: int
    summary: EmployeePayrollSummary
