"use client";

import { useState } from "react";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    MoreHorizontal,
    User,
    DollarSign,
    Calendar,
    MessageSquare,
    AlertCircle,
    Info,
    Settings,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Notification } from "@/types";

// Mock data
const mockNotifications: Notification[] = [
    {
        id: "1",
        user_id: "u1",
        company_id: "c1",
        type: "payroll",
        title: "Payroll Processing Complete",
        message: "March 2024 payroll has been processed successfully. 24 employees paid.",
        data: {},
        is_read: false,
        created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
        id: "2",
        user_id: "u1",
        company_id: "c1",
        type: "info",
        title: "New Employee Onboarded",
        message: "Sarah Johnson has completed their onboarding process.",
        data: {},
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: "3",
        user_id: "u1",
        company_id: "c1",
        type: "message",
        title: "New Message",
        message: "You have a new message from Michael Chen.",
        data: {},
        is_read: true,
        created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        id: "4",
        user_id: "u1",
        company_id: "c1",
        type: "warning",
        title: "Large Transaction Alert",
        message: "A transaction of $5,200.00 was recorded from ABC Corp.",
        data: {},
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: "5",
        user_id: "u1",
        company_id: "c1",
        type: "info",
        title: "System Update",
        message: "StyrCan has been updated to version 2.1.0 with new features.",
        data: {},
        is_read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        id: "6",
        user_id: "u1",
        company_id: "c1",
        type: "warning",
        title: "Action Required",
        message: "Please review and approve pending expense reports.",
        data: {},
        is_read: false,
        created_at: new Date(Date.now() - 259200000).toISOString(),
    },
];

const notificationTypes = [
    { value: "all", label: "All" },
    { value: "payroll", label: "Payroll" },
    { value: "employee", label: "Employee" },
    { value: "financial", label: "Financial" },
    { value: "message", label: "Messages" },
    { value: "system", label: "System" },
    { value: "alert", label: "Alerts" },
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [selectedType, setSelectedType] = useState("all");

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const filteredNotifications = notifications.filter(
        (n) => selectedType === "all" || n.type === selectedType
    );

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "payroll":
                return <DollarSign className="h-4 w-4" />;
            case "employee":
                return <User className="h-4 w-4" />;
            case "financial":
                return <DollarSign className="h-4 w-4" />;
            case "message":
                return <MessageSquare className="h-4 w-4" />;
            case "system":
                return <Settings className="h-4 w-4" />;
            case "alert":
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case "payroll":
                return "bg-green-500/10 text-green-500";
            case "employee":
                return "bg-blue-500/10 text-blue-500";
            case "financial":
                return "bg-purple-500/10 text-purple-500";
            case "message":
                return "bg-indigo-500/10 text-indigo-500";
            case "system":
                return "bg-gray-500/10 text-gray-500";
            case "alert":
                return "bg-red-500/10 text-red-500";
            default:
                return "bg-gray-500/10 text-gray-500";
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(
            notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter((n) => n.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated with your latest activities
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {notificationTypes.map((type) => (
                    <Button
                        key={type.value}
                        variant={selectedType === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType(type.value)}
                    >
                        {type.label}
                        {type.value === "all" && unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 px-1">
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>

            {/* Notifications List */}
            <Card>
                <CardContent className="p-0">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No notifications</p>
                            <p className="text-sm text-muted-foreground">
                                You're all caught up!
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
                                        !notification.is_read && "bg-accent/50"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg",
                                            getNotificationColor(notification.type)
                                        )}
                                    >
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{notification.title}</p>
                                            {!notification.is_read && (
                                                <span className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatRelativeTime(new Date(notification.created_at))}
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {!notification.is_read && (
                                                <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Mark as read
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => deleteNotification(notification.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
