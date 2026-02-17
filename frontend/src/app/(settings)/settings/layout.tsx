"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    User,
    Users,
    Building2,
    Shield,
    Bell,
    Palette,
    CreditCard,
    Settings as SettingsIcon,
    Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ServiceHeader } from "@/components/layout/service-header";
import { ServiceSidebar } from "@/components/layout/service-sidebar";
import { useRoleAccess } from "@/hooks/use-role-access";
import { UserRole } from "@/types";

type SidebarItem = {
    title: string;
    href: string;
    icon: typeof User;
    description: string;
    minRole?: UserRole;
};

const ROLE_HIERARCHY: Record<UserRole, number> = {
    employee: 0,
    manager: 1,
    company_admin: 2,
    super_admin: 3,
};

const settingsSidebarItems: SidebarItem[] = [
    {
        title: "Profile",
        href: "/settings/profile",
        icon: User,
        description: "Personal info",
    },
    {
        title: "Company",
        href: "/settings/company",
        icon: Building2,
        description: "Company settings",
        minRole: "company_admin",
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: Shield,
        description: "Password & 2FA",
    },
    {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
        description: "Preferences",
    },
    {
        title: "Appearance",
        href: "/settings/appearance",
        icon: Palette,
        description: "Theme",
    },
    {
        title: "Team",
        href: "/settings/team",
        icon: Users,
        description: "Manage users",
        minRole: "company_admin",
    },
    {
        title: "Billing",
        href: "/settings/billing",
        icon: CreditCard,
        description: "Subscription",
        minRole: "company_admin",
    },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, hasHydrated } = useAuthStore();
    const { role } = useRoleAccess();
    const roleLevel = ROLE_HIERARCHY[role];

    const visibleItems = settingsSidebarItems.filter((item) => {
        if (item.minRole && roleLevel < ROLE_HIERARCHY[item.minRole]) return false;
        return true;
    });



    return (
        <>
            <ServiceHeader />
            <div className="flex h-[calc(100vh-4rem)]">
                <ServiceSidebar
                    items={visibleItems}
                    serviceTitle="Settings"
                    serviceIcon={SettingsIcon}
                />
                <main className="flex-1 overflow-auto">
                    <div className="max-w-[1600px] mx-auto px-6 py-6 md:px-8">{children}</div>
                </main>
            </div>
        </>
    );
}
