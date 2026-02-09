"use client";

import { MessageSquare } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";

export default function ThreadsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Threads</h1>
                <p className="text-muted-foreground">Organized conversation threads</p>
            </div>

            <Card>
                <CardContent className="py-16 text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">Coming Soon</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        Threaded conversations are under development. You&apos;ll be able to
                        create topic-based threads, tag team members, and keep discussions
                        organized here.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
}
