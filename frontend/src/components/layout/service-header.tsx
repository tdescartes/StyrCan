"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Bell, Settings, User } from "lucide-react";
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

const services = [
    { name: "Employees", href: "/employees", id: "employees" },
    { name: "Finance", href: "/finance", id: "finance" },
    { name: "Payroll", href: "/payroll", id: "payroll" },
    { name: "Communication", href: "/communication", id: "communication" },
];

export function ServiceHeader() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const activeService = services.find((s) => pathname?.startsWith(s.href));

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
                    <Badge variant="secondary" className="hidden md:flex">
                        Professional
                    </Badge>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-2 text-sm text-muted-foreground">
                                No new notifications
                            </div>
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
