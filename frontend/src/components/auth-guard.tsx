"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (isLoading) return;

        const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

        if (!isAuthenticated && !isPublic) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }

        if (isAuthenticated && isPublic) {
            const params = new URLSearchParams(window.location.search);
            router.replace(params.get("redirect") || "/");
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    // On protected pages, don't render until authenticated
    if (!isAuthenticated && !isPublic) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // On public pages, don't render if authenticated (redirect is happening)
    if (isAuthenticated && isPublic) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <>{children}</>;
}
