"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Unhandled error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-center text-muted-foreground max-w-md">
                An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            <div className="flex gap-2">
                <Button onClick={reset}>Try Again</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")}>
                    Go Home
                </Button>
            </div>
        </div>
    );
}
