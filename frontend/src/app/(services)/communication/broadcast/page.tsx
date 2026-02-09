"use client";

import { Megaphone } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";

export default function BroadcastPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
                <p className="text-muted-foreground">Company-wide announcements</p>
            </div>

            <Card>
                <CardContent className="py-16 text-center">
                    <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">Coming Soon</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        Broadcast messaging is under development. You&apos;ll be able to send
                        company-wide announcements, department-specific updates, and track
                        read receipts here.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
}
