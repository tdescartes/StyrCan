"use client";

import {
    User,
    Building2,
    Shield,
    Bell,
    Palette,
    CreditCard,
    Settings as SettingsIcon,
} from "lucide-react";
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
    return (
        <>
            <ServiceHeader />
            <div className="flex h-[calc(100vh-3.5rem)]">
                <ServiceSidebar
                    items={settingsSidebarItems}
                    serviceTitle="Settings"
                    serviceIcon={SettingsIcon}
                />
                <main className="flex-1 overflow-auto">
                    <div className="container py-6">{children}</div>
                </main>
            </div>
        </>
    );
}
