"use client";

import { ClipboardList } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function ReviewsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
                <p className="text-muted-foreground">Manage employee performance evaluations</p>
            </div>

            <Card>
                <CardContent className="py-16 text-center">
                    <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">Coming Soon</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        Performance reviews are currently under development. You&apos;ll be able to
                        create review cycles, provide feedback, set goals, and track employee
                        development here.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
}
