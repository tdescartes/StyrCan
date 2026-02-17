"use client";

import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types";

/**
 * Feature keys for role-based access control.
 * Each maps to a set of allowed roles in FEATURE_PERMISSIONS.
 */
export type Feature =
    | "employees:list"
    | "employees:create"
    | "employees:edit"
    | "employees:delete"
    | "employees:view-salary"
    | "schedule:manage"
    | "schedule:view-all"
    | "pto:approve"
    | "pto:request"
    | "payroll:run"
    | "payroll:view-all"
    | "payroll:view-own"
    | "finance:view"
    | "finance:manage"
    | "reports:view"
    | "reports:generate"
    | "settings:company"
    | "settings:team"
    | "settings:billing"
    | "communication:broadcast"
    | "communication:threads";

/**
 * Maps each feature to the roles that can access it.
 */
const FEATURE_PERMISSIONS: Record<Feature, UserRole[]> = {
    "employees:list":        ["super_admin", "company_admin", "manager"],
    "employees:create":      ["super_admin", "company_admin", "manager"],
    "employees:edit":        ["super_admin", "company_admin", "manager"],
    "employees:delete":      ["super_admin", "company_admin"],
    "employees:view-salary": ["super_admin", "company_admin"],
    "schedule:manage":       ["super_admin", "company_admin", "manager"],
    "schedule:view-all":     ["super_admin", "company_admin", "manager"],
    "pto:approve":           ["super_admin", "company_admin", "manager"],
    "pto:request":           ["super_admin", "company_admin", "manager", "employee"],
    "payroll:run":           ["super_admin", "company_admin"],
    "payroll:view-all":      ["super_admin", "company_admin"],
    "payroll:view-own":      ["super_admin", "company_admin", "manager", "employee"],
    "finance:view":          ["super_admin", "company_admin", "manager"],
    "finance:manage":        ["super_admin", "company_admin"],
    "reports:view":          ["super_admin", "company_admin", "manager"],
    "reports:generate":      ["super_admin", "company_admin"],
    "settings:company":      ["super_admin", "company_admin"],
    "settings:team":         ["super_admin", "company_admin"],
    "settings:billing":      ["super_admin", "company_admin"],
    "communication:broadcast": ["super_admin", "company_admin", "manager"],
    "communication:threads": ["super_admin", "company_admin", "manager", "employee"],
};

/**
 * Role hierarchy for comparison. Higher number = more privilege.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
    employee: 0,
    manager: 1,
    company_admin: 2,
    super_admin: 3,
};

export function useRoleAccess() {
    const user = useAuthStore((s) => s.user);

    const role: UserRole = user?.role ?? "employee";
    const employeeId = user?.employee_id ?? null;

    const isEmployee = role === "employee";
    const isManager = role === "manager";
    const isAdmin = role === "company_admin" || role === "super_admin";
    const isSuperAdmin = role === "super_admin";

    /**
     * Check whether the current user can access a given feature.
     */
    function canAccess(feature: Feature): boolean {
        const allowedRoles = FEATURE_PERMISSIONS[feature];
        return allowedRoles?.includes(role) ?? false;
    }

    /**
     * Check whether the current user's role is at least the given level.
     */
    function hasMinRole(minRole: UserRole): boolean {
        return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
    }

    return {
        role,
        employeeId,
        isEmployee,
        isManager,
        isAdmin,
        isSuperAdmin,
        canAccess,
        hasMinRole,
    };
}
