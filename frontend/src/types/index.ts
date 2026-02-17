// User types
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    avatar?: string;
    role: UserRole;
    company_id: string;
    company?: Company;
    employee_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    last_login?: string;
}

export type UserRole = "employee" | "manager" | "company_admin" | "super_admin";

// Company types
export interface Company {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    status: 'active' | 'inactive' | 'suspended';
    created_at: string;
    updated_at?: string;
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
    position: string;
    department: string;
    hire_date: string;
    termination_date?: string;
    status: EmployeeStatus;
    salary: string;
    created_at: string;
    updated_at?: string;
}

export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";

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
    reason: string;
    notes?: string;
    status: PTOStatus;
    reviewed_by?: string;
    reviewed_at?: string;
    reviewer_notes?: string;
    created_at: string;
    updated_at?: string;
}

export type PTOStatus = "pending" | "approved" | "denied" | "cancelled";

// Shift types
export interface Shift {
    id: string;
    employee_id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    total_hours: number;
    status: ShiftStatus;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export type ShiftStatus = "scheduled" | "completed" | "missed" | "cancelled";

// Financial types
export interface Transaction {
    id: string;
    company_id: string;
    type: TransactionType;
    amount: string;
    category: string;
    description: string;
    transaction_date: string;
    reference_number?: string;
    created_by: string;
    created_at: string;
    updated_at?: string;
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
    total_amount: string;
    processed_by?: string;
    processed_at?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export type PayrollStatus = "draft" | "processing" | "completed" | "failed" | "cancelled";

export interface PayrollItem {
    id: string;
    payroll_run_id: string;
    employee_id: string;
    base_salary: string;
    overtime_hours: string;
    overtime_amount: string;
    bonuses: string;
    deductions: string;
    tax_amount: string;
    net_amount: string;
    payment_status: PaymentStatus;
    payment_date?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export type PaymentStatus = "pending" | "paid" | "failed";

// Messaging types
export interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    company_id: string;
    message_type: MessageType;
    thread_id?: string;
    subject: string;
    content: string;
    attachments?: Attachment[];
    status: MessageStatus;
    is_read: boolean;
    sent_at: string;
    delivered_at?: string;
    read_at?: string;
}

export type MessageType = "direct" | "announcement" | "system";
export type MessageStatus = "sent" | "delivered" | "read";

export interface Attachment {
    name: string;
    url: string;
    size?: number;
    type?: string;
}

// Notification types
export interface Notification {
    id: string;
    user_id: string;
    company_id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
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
    name: string;  // company name
    email: string; // company email
    admin_first_name: string;
    admin_last_name: string;
    admin_email: string;
    admin_password: string;
    phone?: string;
    address?: string;
    tax_id?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface AuthResponse {
    user: User;
    company: Company;
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

// Self-service (My Data) types
export interface MyProfileResponse {
    employee: Employee;
    pto_balance: PTOBalance | null;
    upcoming_shifts: Shift[];
    pending_pto_requests: PTORequest[];
}

export interface MyScheduleResponse {
    shifts: Shift[];
    total: number;
}

export interface MyPTOResponse {
    balance: PTOBalance | null;
    requests: PTORequest[];
    total_requests: number;
}

export interface PayrollItemDetail {
    id: string;
    payroll_run_id: string;
    base_salary: string;
    overtime_hours: string;
    overtime_amount: string;
    bonuses: string;
    deductions: string;
    tax_amount: string;
    net_amount: string;
    payment_status: string;
    period_start: string | null;
    period_end: string | null;
}

export interface MyPayrollResponse {
    payroll_items: PayrollItemDetail[];
    summary: {
        total_gross: string;
        total_tax: string;
        total_net: string;
        pay_periods: number;
    };
}
