"use client";

import {
    LayoutDashboard,
    Inbox,
    Megaphone,
    MessageSquare,
    FolderOpen,
} from "lucide-react";
import { ServiceSidebar } from "@/components/layout/service-sidebar";
import { useRoleAccess } from "@/hooks/use-role-access";
import { UserRole } from "@/types";

type SidebarItem = {
    title: string;
    href: string;
    icon: typeof LayoutDashboard;
    description: string;
    badge?: string;
    minRole?: UserRole;
};

const ROLE_HIERARCHY: Record<UserRole, number> = {
    employee: 0,
    manager: 1,
    company_admin: 2,
    super_admin: 3,
};

const communicationSidebarItems: SidebarItem[] = [
    {
        title: "Dashboard",
        href: "/communication",
        icon: LayoutDashboard,
        description: "Comms overview",
    },
    {
        title: "Inbox",
        href: "/communication/inbox",
        icon: Inbox,
        description: "Messages",
        badge: "12",
    },
    {
        title: "Broadcasts",
        href: "/communication/broadcast",
        icon: Megaphone,
        description: "Announcements",
        minRole: "manager",
    },
    {
        title: "Threads",
        href: "/communication/threads",
        icon: MessageSquare,
        description: "Conversations",
    },
    {
        title: "Files",
        href: "/communication/files",
        icon: FolderOpen,
        description: "Shared files",
    },
];

export default function CommunicationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role } = useRoleAccess();
    const roleLevel = ROLE_HIERARCHY[role];

    const visibleItems = communicationSidebarItems.filter((item) => {
        if (item.minRole && roleLevel < ROLE_HIERARCHY[item.minRole]) return false;
        return true;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ServiceSidebar
                items={visibleItems}
                serviceTitle="Communication"
                serviceIcon={MessageSquare}
            />
            <main className="flex-1 overflow-auto">
                <div className="max-w-[1600px] mx-auto px-6 py-6 md:px-8">{children}</div>
            </main>
        </div>
    );
}
