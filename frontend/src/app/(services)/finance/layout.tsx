"use client";

import {
    LayoutDashboard,
    BookOpen,
    PiggyBank,
    FileText,
    Tags,
    DollarSign,
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
};

const ROLE_HIERARCHY: Record<UserRole, number> = {
    employee: 0,
    manager: 1,
    company_admin: 2,
    super_admin: 3,
};

const financeSidebarItems: SidebarItem[] = [
    {
        title: "Dashboard",
        href: "/finance",
        icon: LayoutDashboard,
        description: "Financial overview",
        minRole: "manager",
    },
    {
        title: "Ledger",
        href: "/finance/ledger",
        icon: BookOpen,
        description: "Transactions",
        minRole: "manager",
    },
    {
        title: "Budget",
        href: "/finance/budget",
        icon: PiggyBank,
        description: "Budget planning",
        minRole: "company_admin",
    },
    {
        title: "Reports",
        href: "/finance/reports",
        icon: FileText,
        description: "Financial reports",
        minRole: "company_admin",
    },
    {
        title: "Categories",
        href: "/finance/categories",
        icon: Tags,
        description: "Expense categories",
        minRole: "company_admin",
    },
];

export default function FinanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role } = useRoleAccess();
    const roleLevel = ROLE_HIERARCHY[role];

    const visibleItems = financeSidebarItems.filter((item) => {
        if (item.minRole && roleLevel < ROLE_HIERARCHY[item.minRole]) return false;
        return true;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ServiceSidebar
                items={visibleItems}
                serviceTitle="Finance"
                serviceIcon={PiggyBank}
            />
            <main className="flex-1 overflow-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6 md:px-8">{children}</div>
            </main>
        </div>
    );
}
