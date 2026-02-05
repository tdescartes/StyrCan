"""Employee-related Pydantic schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


# Enums
class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"


class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"


class PTOStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    CANCELLED = "cancelled"


class ShiftStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    MISSED = "missed"
    CANCELLED = "cancelled"


# Employee Schemas
class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    position: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    employment_type: Optional[EmploymentType] = EmploymentType.FULL_TIME
    salary_amount: Optional[Decimal] = Field(None, ge=0)


class EmployeeCreate(EmployeeBase):
    hire_date: date
    user_id: Optional[str] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    position: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    employment_type: Optional[EmploymentType] = None
    status: Optional[EmployeeStatus] = None
    salary_amount: Optional[Decimal] = Field(None, ge=0)


class EmployeeResponse(EmployeeBase):
    id: str
    company_id: str
    user_id: Optional[str] = None
    hire_date: date
    status: EmployeeStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    employees: List[EmployeeResponse]
    total: int
    skip: int
    limit: int


# PTO Balance Schemas
class PTOBalanceBase(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    total_days: Decimal = Field(..., ge=0)


class PTOBalanceCreate(PTOBalanceBase):
    employee_id: str


class PTOBalanceUpdate(BaseModel):
    total_days: Optional[Decimal] = Field(None, ge=0)
    used_days: Optional[Decimal] = Field(None, ge=0)


class PTOBalanceResponse(PTOBalanceBase):
    id: str
    employee_id: str
    used_days: Decimal
    available_days: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# PTO Request Schemas
class PTORequestBase(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = None


class PTORequestCreate(PTORequestBase):
    pass


class PTORequestUpdate(BaseModel):
    status: PTOStatus
    reviewed_by: Optional[str] = None


class PTORequestResponse(PTORequestBase):
    id: str
    employee_id: str
    days_requested: Decimal
    status: PTOStatus
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PTORequestListResponse(BaseModel):
    requests: List[PTORequestResponse]
    total: int


# Shift Schemas
class ShiftBase(BaseModel):
    shift_date: date
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None


class ShiftCreate(ShiftBase):
    employee_id: str


class ShiftUpdate(BaseModel):
    shift_date: Optional[date] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[ShiftStatus] = None
    notes: Optional[str] = None


class ShiftResponse(ShiftBase):
    id: str
    employee_id: str
    status: ShiftStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShiftListResponse(BaseModel):
    shifts: List[ShiftResponse]
    total: int


# Employee with related data
class EmployeeDetailResponse(EmployeeResponse):
    pto_balances: List[PTOBalanceResponse] = []
    pto_requests: List[PTORequestResponse] = []
    shifts: List[ShiftResponse] = []
