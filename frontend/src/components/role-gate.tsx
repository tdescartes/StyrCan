"use client";

import { useRoleAccess, Feature } from "@/hooks/use-role-access";
import { UserRole } from "@/types";
import { ReactNode } from "react";

interface RoleGateProps {
    children: ReactNode;
    /** Show children only if user can access this feature */
    feature?: Feature;
    /** Show children only if user has at least this role level */
    minRole?: UserRole;
    /** Show children only for these specific roles */
    allowedRoles?: UserRole[];
    /** Content to show when access is denied (defaults to nothing) */
    fallback?: ReactNode;
}

/**
 * Conditionally renders children based on the current user's role.
 *
 * Usage examples:
 *   <RoleGate feature="employees:create">
 *     <Button>Add Employee</Button>
 *   </RoleGate>
 *
 *   <RoleGate minRole="manager">
 *     <AdminPanel />
 *   </RoleGate>
 *
 *   <RoleGate allowedRoles={["company_admin", "super_admin"]}>
 *     <DangerZone />
 *   </RoleGate>
 */
export function RoleGate({
    children,
    feature,
    minRole,
    allowedRoles,
    fallback = null,
}: RoleGateProps) {
    const { role, canAccess, hasMinRole } = useRoleAccess();

    let allowed = true;

    if (feature) {
        allowed = canAccess(feature);
    }

    if (allowed && minRole) {
        allowed = hasMinRole(minRole);
    }

    if (allowed && allowedRoles) {
        allowed = allowedRoles.includes(role);
    }

    return allowed ? <>{children}</> : <>{fallback}</>;
}
