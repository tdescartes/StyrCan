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

const financeSidebarItems = [
    {
        title: "Dashboard",
        href: "/finance",
        icon: LayoutDashboard,
        description: "Financial overview",
    },
    {
        title: "Ledger",
        href: "/finance/ledger",
        icon: BookOpen,
        description: "Transactions",
    },
    {
        title: "Budget",
        href: "/finance/budget",
        icon: PiggyBank,
        description: "Budget planning",
    },
    {
        title: "Reports",
        href: "/finance/reports",
        icon: FileText,
        description: "Financial reports",
    },
    {
        title: "Categories",
        href: "/finance/categories",
        icon: Tags,
        description: "Expense categories",
    },
];

export default function FinanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-3.5rem)]">
            <ServiceSidebar
                items={financeSidebarItems}
                serviceTitle="Finance"
                serviceIcon={DollarSign}
            />
            <main className="flex-1 overflow-auto">
                <div className="container py-6">{children}</div>
            </main>
        </div>
    );
}
