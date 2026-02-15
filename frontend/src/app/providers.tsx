"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    const pathname = usePathname();
    const router = useRouter();

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const hasHydrated = useAuthStore((s) => s.hasHydrated);

    // Public routes that do not require authentication
    const publicRoutes = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
    ];

    useEffect(() => {
        if (!hasHydrated) return; // wait for auth store to hydrate
        if (!pathname) return;

        const isPublic = publicRoutes.some((p) => pathname.startsWith(p));

        // If user is NOT authenticated and trying to access a protected route → redirect to login
        if (!isAuthenticated && !isPublic) {
            const redirect = encodeURIComponent(pathname + (location.search || ""));
            router.replace(`/login?redirect=${redirect}`);
            return;
        }

        // If user IS authenticated and is on an auth page → send to home
        if (isAuthenticated && isPublic) {
            router.replace("/");
            return;
        }
    }, [isAuthenticated, hasHydrated, pathname, router]);

    // Prevent rendering children for protected routes if not authenticated or not hydrated
    const isPublic = pathname ? publicRoutes.some((p) => pathname.startsWith(p)) : false;
    const shouldShowContent = hasHydrated && (isPublic || isAuthenticated);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {shouldShowContent ? (
                    children
                ) : (
                    <div className="flex h-screen items-center justify-center bg-zinc-50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium text-zinc-500 animate-pulse uppercase tracking-widest">
                                Loading Pulse...
                            </p>
                        </div>
                    </div>
                )}
                <Toaster position="top-right" richColors />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
