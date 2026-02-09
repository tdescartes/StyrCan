"use client";

import { FileCheck } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";

export default function TaxDocumentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tax Documents</h1>
                <p className="text-muted-foreground">W-2, 1099, and other tax forms</p>
            </div>

            <Card>
                <CardContent className="py-16 text-center">
                    <FileCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">Coming Soon</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        Tax document generation is currently under development. You&apos;ll be
                        able to generate W-2s, 1099s, and other required tax forms for your
                        employees here.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
}
