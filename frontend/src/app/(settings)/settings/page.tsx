"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to profile as the default settings page
        router.replace("/settings/profile");
    }, [router]);

    return null;
}
