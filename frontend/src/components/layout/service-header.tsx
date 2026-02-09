"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Bell, Settings, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/utils";

const services = [
    { name: "Employees", href: "/employees", id: "employees" },
    { name: "Finance", href: "/finance", id: "finance" },
    { name: "Payroll", href: "/payroll", id: "payroll" },
    { name: "Communication", href: "/communication", id: "communication" },
];

export function ServiceHeader() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const queryClient = useQueryClient();

    const activeService = services.find((s) => pathname?.startsWith(s.href));

    const { data: unreadCount } = useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: () => apiClient.getUnreadNotificationCount(),
        refetchInterval: 30000,
    });

    const { data: notifications } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => apiClient.getNotifications(),
    });

    const markAllRead = useMutation({
        mutationFn: () => apiClient.markAllNotificationsAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const unread = unreadCount?.unread_count ?? 0;
    const notifList = Array.isArray(notifications) ? notifications : notifications?.notifications ?? [];
    const tier = user?.company?.subscription_tier || user?.company?.plan || "free";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mr-6">
                    <Building2 className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">StyrCan</span>
                </Link>

                {/* Service Tabs */}
                <nav className="flex items-center gap-1 flex-1">
                    {services.map((service) => {
                        const isActive = pathname?.startsWith(service.href);
                        return (
                            <Link key={service.id} href={service.href}>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    size="sm"
                                    className="h-9"
                                >
                                    {service.name}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    {/* Plan Badge */}
                    <Badge variant="secondary" className="hidden md:flex capitalize">
                        {tier}
                    </Badge>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unread > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="flex items-center justify-between px-2">
                                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                                {unread > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => markAllRead.mutate()}
                                    >
                                        Mark all read
                                    </Button>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            {notifList.length === 0 ? (
                                <div className="p-4 text-sm text-center text-muted-foreground">
                                    No notifications
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    {notifList.slice(0, 8).map((n: any) => (
                                        <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-default">
                                            <span className={`text-sm ${!n.is_read ? "font-semibold" : ""}`}>
                                                {n.title || n.message}
                                            </span>
                                            {n.created_at && (
                                                <span className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(n.created_at)}
                                                </span>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <User className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>{user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}` || "User"}</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {user?.email || "user@example.com"}
                                    </span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => logout()}>
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Settings Icon */}
                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
