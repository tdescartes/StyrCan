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
        <div className="flex h-[calc(100vh-4rem)]">
            <ServiceSidebar
                items={financeSidebarItems}
                serviceTitle="Finance"
                serviceIcon={PiggyBank}
            />
            <main className="flex-1 overflow-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6 md:px-8">{children}</div>
            </main>
        </div>
    );
}
