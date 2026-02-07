"use client";

import {
    LayoutDashboard,
    Users,
    Calendar,
    Clock,
    Star,
} from "lucide-react";
import { ServiceSidebar } from "@/components/layout/service-sidebar";

const employeesSidebarItems = [
    {
        title: "Dashboard",
        href: "/employees",
        icon: LayoutDashboard,
        description: "Overview & KPIs",
    },
    {
        title: "Directory",
        href: "/employees/directory",
        icon: Users,
        description: "Employee list",
    },
    {
        title: "Schedule",
        href: "/employees/schedule",
        icon: Calendar,
        description: "Shift scheduling",
    },
    {
        title: "Time Off",
        href: "/employees/pto",
        icon: Clock,
        description: "PTO requests",
    },
    {
        title: "Reviews",
        href: "/employees/reviews",
        icon: Star,
        description: "Performance reviews",
    },
];

export default function EmployeesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-3.5rem)]">
            <ServiceSidebar
                items={employeesSidebarItems}
                serviceTitle="Employees"
                serviceIcon={Users}
            />
            <main className="flex-1 overflow-auto">
                <div className="container py-6">{children}</div>
            </main>
        </div>
    );
}
