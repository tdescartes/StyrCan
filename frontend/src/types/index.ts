// User types
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    company_id: string;
    is_active: boolean;
    created_at: string;
    last_login?: string;
}

export type UserRole = "owner" | "admin" | "manager" | "employee";

// Company types
export interface Company {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    industry?: string;
    subscription_tier: string;
    is_active: boolean;
    created_at: string;
}

// Employee types
export interface Employee {
    id: string;
    company_id: string;
    user_id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    hire_date: string;
    employment_type: EmploymentType;
    status: EmployeeStatus;
    salary_amount?: number;
    created_at: string;
    updated_at: string;
}

export type EmploymentType = "full-time" | "part-time" | "contract";
export type EmployeeStatus = "active" | "inactive" | "terminated";

// PTO types
export interface PTOBalance {
    id: string;
    employee_id: string;
    year: number;
    total_days: number;
    used_days: number;
    available_days: number;
}

export interface PTORequest {
    id: string;
    employee_id: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason?: string;
    status: PTOStatus;
    reviewed_by?: string;
    reviewed_at?: string;
    created_at: string;
}

export type PTOStatus = "pending" | "approved" | "denied";

// Shift types
export interface Shift {
    id: string;
    employee_id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    status: ShiftStatus;
    notes?: string;
}

export type ShiftStatus = "scheduled" | "completed" | "missed" | "cancelled";

// Financial types
export interface Transaction {
    id: string;
    company_id: string;
    type: TransactionType;
    category?: string;
    amount: number;
    description?: string;
    transaction_date: string;
    created_by?: string;
    created_at: string;
}

export type TransactionType = "income" | "expense";

export interface ExpenseCategory {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    budget_limit?: number;
}

// Payroll types
export interface PayrollRun {
    id: string;
    company_id: string;
    period_start: string;
    period_end: string;
    status: PayrollStatus;
    total_amount?: number;
    processed_by?: string;
    processed_at?: string;
    created_at: string;
}

export type PayrollStatus = "draft" | "processing" | "completed" | "failed";

export interface PayrollItem {
    id: string;
    payroll_run_id: string;
    employee_id: string;
    base_salary: number;
    overtime_hours: number;
    overtime_amount: number;
    bonuses: number;
    deductions: number;
    tax_amount: number;
    net_amount: number;
    payment_status: PaymentStatus;
    payment_date?: string;
}

export type PaymentStatus = "pending" | "paid" | "failed";

// Messaging types
export interface Message {
    id: string;
    sender_id: string;
    recipient_id?: string;
    company_id: string;
    message_type: MessageType;
    thread_id?: string;
    subject?: string;
    content: string;
    attachments: Attachment[];
    status: MessageStatus;
    is_read: boolean;
    sent_at: string;
    read_at?: string;
}

export type MessageType = "direct" | "broadcast" | "group";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface Attachment {
    name: string;
    url: string;
    type: string;
    size: number;
}

// Notification types
export interface Notification {
    id: string;
    user_id: string;
    company_id: string;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, unknown>;
    is_read: boolean;
    action_url?: string;
    created_at: string;
    read_at?: string;
}

export type NotificationType =
    | "info"
    | "warning"
    | "error"
    | "success"
    | "payroll"
    | "pto"
    | "shift"
    | "message";

// API Response types
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ApiError {
    detail: string;
    status_code: number;
}

// Auth types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    company_name: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

// Dashboard types
export interface DashboardStats {
    total_employees: number;
    active_employees: number;
    pending_pto_requests: number;
    monthly_revenue: number;
    monthly_expenses: number;
    upcoming_payroll?: number;
    unread_messages: number;
    unread_notifications: number;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    [key: string]: string | number;
}
