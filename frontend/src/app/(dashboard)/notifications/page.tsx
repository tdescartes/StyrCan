"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Loader2,
    Info,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    DollarSign,
    Calendar,
    Clock,
    MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { Notification, NotificationType } from "@/types";
import { formatDistanceToNow } from "date-fns";

const typeConfig: Record<
    NotificationType,
    { icon: React.ReactNode; color: string }
> = {
    info: {
        icon: <Info className="h-4 w-4" />,
        color: "text-blue-500 bg-blue-50",
    },
    warning: {
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-amber-500 bg-amber-50",
    },
    error: {
        icon: <XCircle className="h-4 w-4" />,
        color: "text-red-500 bg-red-50",
    },
    success: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: "text-green-500 bg-green-50",
    },
    payroll: {
        icon: <DollarSign className="h-4 w-4" />,
        color: "text-emerald-500 bg-emerald-50",
    },
    pto: {
        icon: <Calendar className="h-4 w-4" />,
        color: "text-violet-500 bg-violet-50",
    },
    shift: {
        icon: <Clock className="h-4 w-4" />,
        color: "text-orange-500 bg-orange-50",
    },
    message: {
        icon: <MessageSquare className="h-4 w-4" />,
        color: "text-sky-500 bg-sky-50",
    },
};

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const { data, isLoading } = useQuery({
        queryKey: ["notifications", filter],
        queryFn: () =>
            apiClient.getNotifications({
                limit: 50,
                unread_only: filter === "unread",
            }),
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => apiClient.markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => apiClient.markAllNotificationsAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("All notifications marked as read");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Notification deleted");
        },
    });

    // Normalize the response — API may return array or { notifications: [...] }
    const notifications: Notification[] = Array.isArray(data)
        ? data
        : data && typeof data === "object" && "notifications" in data
          ? ((data as Record<string, unknown>).notifications as Notification[]) ?? []
          : [];

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                            : "You're all caught up"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={filter}
                        onValueChange={(v) => setFilter(v as "all" | "unread")}
                    >
                        <SelectTrigger className="w-[130px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="unread">Unread only</SelectItem>
                        </SelectContent>
                    </Select>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            <CheckCheck className="mr-1 h-4 w-4" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <CardTitle className="text-lg">No notifications</CardTitle>
                        <CardDescription className="mt-1">
                            {filter === "unread"
                                ? "No unread notifications. Switch to 'All' to see everything."
                                : "When something important happens, you'll see it here."}
                        </CardDescription>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => {
                        const cfg = typeConfig[n.type] || typeConfig.info;
                        return (
                            <Card
                                key={n.id}
                                className={`transition-colors ${!n.is_read ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                            >
                                <CardContent className="flex items-start gap-4 py-4">
                                    <div
                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.color}`}
                                    >
                                        {cfg.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p
                                                className={`text-sm leading-snug ${!n.is_read ? "font-semibold" : ""}`}
                                            >
                                                {n.title}
                                            </p>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(n.created_at), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                        </div>
                                        {n.message && n.message !== n.title && (
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {n.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        {!n.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                title="Mark as read"
                                                onClick={() => markReadMutation.mutate(n.id)}
                                                disabled={markReadMutation.isPending}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            title="Delete"
                                            onClick={() => deleteMutation.mutate(n.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
