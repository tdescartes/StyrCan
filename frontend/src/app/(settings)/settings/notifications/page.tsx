"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

const prefFields = [
    {
        id: "email_notifications",
        label: "Email notifications",
        description: "Receive notifications via email",
    },
    {
        id: "new_messages",
        label: "New messages",
        description: "Get notified when you receive a new message",
    },
    {
        id: "payroll_processed",
        label: "Payroll processed",
        description: "Get notified when payroll is completed",
    },
    {
        id: "pto_requests",
        label: "PTO request updates",
        description: "Get notified when PTO requests are approved or denied",
    },
    {
        id: "employee_updates",
        label: "Employee updates",
        description: "Get notified about employee profile changes",
    },
] as const;

type PrefKey = (typeof prefFields)[number]["id"];

export default function NotificationsPage() {
    const { data: prefs, isLoading } = useQuery({
        queryKey: ["settings", "notification-preferences"],
        queryFn: () => apiClient.getNotificationPreferences(),
    });

    const [local, setLocal] = useState<Record<PrefKey, boolean> | null>(null);

    useEffect(() => {
        if (prefs && !local) {
            setLocal(prefs as Record<PrefKey, boolean>);
        }
    }, [prefs, local]);

    const saveMutation = useMutation({
        mutationFn: (data: Record<string, boolean>) =>
            apiClient.updateNotificationPreferences(data),
        onSuccess: () => toast.success("Notification preferences saved"),
        onError: (err: any) => toast.error(err.message || "Failed to save"),
    });

    const toggle = (id: PrefKey) => {
        setLocal((prev) => (prev ? { ...prev, [id]: !prev[id] } : prev));
    };

    const handleSave = () => {
        if (local) saveMutation.mutate(local);
    };

    if (isLoading || !local) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">Configure how you receive notifications</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Choose which notifications you want to receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {prefFields.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between space-x-4"
                        >
                            <div className="flex-1">
                                <Label htmlFor={item.id} className="font-medium">
                                    {item.label}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                            <Switch
                                id={item.id}
                                checked={local[item.id]}
                                onCheckedChange={() => toggle(item.id)}
                            />
                        </div>
                    ))}
                    <div className="pt-4 border-t">
                        <Button onClick={handleSave} disabled={saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Preferences
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
