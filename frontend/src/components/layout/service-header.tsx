"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Bell, Settings, User, Zap } from "lucide-react";
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
    { name: "Home", href: "/", id: "home" },
    { name: "Employees", href: "/employees", id: "employees" },
    { name: "Finance", href: "/finance", id: "finance" },
    { name: "Payroll", href: "/payroll", id: "payroll" },
    { name: "Communication", href: "/communication", id: "communication" },
];

export function ServiceHeader() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const queryClient = useQueryClient();

    const activeService = services.find((s) => {
        if (s.href === "/") return pathname === "/";
        return pathname?.startsWith(s.href);
    });

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
    const notifList = (Array.isArray(notifications)
        ? notifications
        : (notifications && typeof notifications === 'object' && 'notifications' in notifications
            ? (notifications.notifications ?? [])
            : [])) as any[];
    const tier = "Standard";

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white shadow-sm">
            <div className="max-w-[1600px] mx-auto flex h-16 items-center px-6 md:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mr-8">
                    <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-sm">
                        <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">PULSE</span>
                </Link>

                {/* Service Tabs */}
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {services.map((service) => {
                        const isActive = service.href === "/"
                            ? pathname === "/"
                            : pathname?.startsWith(service.href);
                        return (
                            <Link key={service.id} href={service.href}>
                                <button
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${isActive
                                        ? "bg-black text-white"
                                        : "text-zinc-500 hover:text-black hover:bg-zinc-100"
                                        }`}
                                >
                                    {service.name}
                                </button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
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
                                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider">Notifications</DropdownMenuLabel>
                                {unread > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => markAllRead.mutate()}
                                    >
                                        Mark all read
                                    </Button>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            {notifList.length === 0 ? (
                                <div className="p-4 text-sm text-center text-zinc-500">
                                    No notifications
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    {notifList.slice(0, 8).map((n: any) => (
                                        <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-default">
                                            <span className={`text-sm ${!n.is_read ? "font-bold" : ""}`}>
                                                {n.title || n.message}
                                            </span>
                                            {n.created_at && (
                                                <span className="text-xs text-zinc-500">
                                                    {formatRelativeTime(n.created_at)}
                                                </span>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Settings Icon */}
                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-bold border border-zinc-300 hover:bg-zinc-300 transition-colors">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span className="font-bold">{user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}` || "User"}</span>
                                    <span className="text-xs text-zinc-500 font-normal">
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
                </div>
            </div>
        </header>
    );
}
