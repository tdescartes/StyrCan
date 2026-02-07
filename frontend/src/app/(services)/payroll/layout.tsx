"use client";

import {
    LayoutDashboard,
    Play,
    History,
    FileCheck,
    User,
    Wallet,
} from "lucide-react";
import { ServiceSidebar } from "@/components/layout/service-sidebar";

const payrollSidebarItems = [
    {
        title: "Dashboard",
        href: "/payroll",
        icon: LayoutDashboard,
        description: "Payroll overview",
    },
    {
        title: "Payroll Runs",
        href: "/payroll/runs",
        icon: Play,
        description: "Process payroll",
    },
    {
        title: "History",
        href: "/payroll/history",
        icon: History,
        description: "Past payments",
    },
    {
        title: "Tax Documents",
        href: "/payroll/taxes",
        icon: FileCheck,
        description: "W-2, 1099",
    },
    {
        title: "By Employee",
        href: "/payroll/employees",
        icon: User,
        description: "Employee breakdown",
    },
];

export default function PayrollLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-3.5rem)]">
            <ServiceSidebar
                items={payrollSidebarItems}
                serviceTitle="Payroll"
                serviceIcon={Wallet}
            />
            <main className="flex-1 overflow-auto">
                <div className="container py-6">{children}</div>
            </main>
        </div>
    );
}
