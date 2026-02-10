"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ServiceHeader } from "@/components/layout/service-header";

interface ServicesLayoutProps {
    children: React.ReactNode;
}

export default function ServicesLayout({ children }: ServicesLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, hasHydrated } = useAuthStore();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (hasHydrated && !isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
    }, [hasHydrated, isAuthenticated, pathname, router]);

    // Show loading while hydrating or redirecting
    if (!hasHydrated || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <ServiceHeader />
            {children}
        </>
    );
}
