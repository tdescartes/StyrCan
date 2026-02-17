"use client";

import {
    LayoutDashboard,
    Users,
    Calendar,
    Clock,
    Star,
    UserCircle,
} from "lucide-react";
import { ServiceSidebar } from "@/components/layout/service-sidebar";
import { useRoleAccess } from "@/hooks/use-role-access";
import { UserRole } from "@/types";

type SidebarItem = {
    title: string;
    href: string;
    icon: typeof LayoutDashboard;
    description: string;
    minRole?: UserRole;
    maxRole?: UserRole;
};

const employeesSidebarItems: SidebarItem[] = [
    // Self-service items (employee only sees these)
    {
        title: "My Profile",
        href: "/employees",
        icon: UserCircle,
        description: "Your employee info",
        maxRole: "employee",
    },
    {
        title: "My Schedule",
        href: "/employees/schedule",
        icon: Calendar,
        description: "Your shifts",
        maxRole: "employee",
    },
    {
        title: "My Time Off",
        href: "/employees/pto",
        icon: Clock,
        description: "Your PTO requests",
        maxRole: "employee",
    },
    // Management items (manager+ sees these)
    {
        title: "Dashboard",
        href: "/employees",
        icon: LayoutDashboard,
        description: "Overview & KPIs",
        minRole: "manager",
    },
    {
        title: "Directory",
        href: "/employees/directory",
        icon: Users,
        description: "Employee list",
        minRole: "manager",
    },
    {
        title: "Schedule",
        href: "/employees/schedule",
        icon: Calendar,
        description: "Shift scheduling",
        minRole: "manager",
    },
    {
        title: "Time Off",
        href: "/employees/pto",
        icon: Clock,
        description: "PTO requests",
        minRole: "manager",
    },
    {
        title: "Reviews",
        href: "/employees/reviews",
        icon: Star,
        description: "Performance reviews",
        minRole: "manager",
    },
];

const ROLE_HIERARCHY: Record<UserRole, number> = {
    employee: 0,
    manager: 1,
    company_admin: 2,
    super_admin: 3,
};

export default function EmployeesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role } = useRoleAccess();
    const roleLevel = ROLE_HIERARCHY[role];

    const visibleItems = employeesSidebarItems.filter((item) => {
        if (item.minRole && roleLevel < ROLE_HIERARCHY[item.minRole]) return false;
        if (item.maxRole && roleLevel > ROLE_HIERARCHY[item.maxRole]) return false;
        return true;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ServiceSidebar
                items={visibleItems}
                serviceTitle="Employees"
                serviceIcon={Users}
            />
            <main className="flex-1 overflow-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6 md:px-8">{children}</div>
            </main>
        </div>
    );
}
