"use client";

import {
    LayoutDashboard,
    Play,
    History,
    FileCheck,
    User,
    Wallet,
    CreditCard,
    Receipt,
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

const ROLE_HIERARCHY: Record<UserRole, number> = {
    employee: 0,
    manager: 1,
    company_admin: 2,
    super_admin: 3,
};

const payrollSidebarItems: SidebarItem[] = [
    // Self-service (employee)
    {
        title: "My Pay Stubs",
        href: "/payroll",
        icon: Receipt,
        description: "Your pay history",
        maxRole: "employee",
    },
    // Management (admin+)
    {
        title: "Dashboard",
        href: "/payroll",
        icon: LayoutDashboard,
        description: "Payroll overview",
        minRole: "manager",
    },
    {
        title: "Payroll Runs",
        href: "/payroll/runs",
        icon: Play,
        description: "Process payroll",
        minRole: "company_admin",
    },
    {
        title: "History",
        href: "/payroll/history",
        icon: History,
        description: "Past payments",
        minRole: "manager",
    },
    {
        title: "Tax Documents",
        href: "/payroll/taxes",
        icon: FileCheck,
        description: "W-2, 1099",
        minRole: "manager",
    },
    {
        title: "By Employee",
        href: "/payroll/employees",
        icon: User,
        description: "Employee breakdown",
        minRole: "manager",
    },
];

export default function PayrollLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role } = useRoleAccess();
    const roleLevel = ROLE_HIERARCHY[role];

    const visibleItems = payrollSidebarItems.filter((item) => {
        if (item.minRole && roleLevel < ROLE_HIERARCHY[item.minRole]) return false;
        if (item.maxRole && roleLevel > ROLE_HIERARCHY[item.maxRole]) return false;
        return true;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ServiceSidebar
                items={visibleItems}
                serviceTitle="Payroll"
                serviceIcon={CreditCard}
            />
            <main className="flex-1 overflow-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6 md:px-8">{children}</div>
            </main>
        </div>
    );
}
