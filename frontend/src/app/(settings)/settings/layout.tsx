"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    User,
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

const settingsSidebarItems = [
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
        title: "Billing",
        href: "/settings/billing",
        icon: CreditCard,
        description: "Subscription",
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



    return (
        <>
            <ServiceHeader />
            <div className="flex h-[calc(100vh-4rem)]">
                <ServiceSidebar
                    items={settingsSidebarItems}
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
