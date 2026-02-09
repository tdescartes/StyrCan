"use client";

import { FolderOpen } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";

export default function FilesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Shared Files</h1>
                <p className="text-muted-foreground">Files shared in conversations</p>
            </div>

            <Card>
                <CardContent className="py-16 text-center">
                    <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">Coming Soon</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                        File sharing is under development. You&apos;ll be able to upload,
                        share, and manage documents, images, and other files with your team
                        here.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
}
