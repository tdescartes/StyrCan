"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export interface SidebarItem {
    title: string;
    href: string;
    icon: LucideIcon;
    description?: string;
    badge?: string;
}

interface ServiceSidebarProps {
    items: SidebarItem[];
    serviceTitle: string;
    serviceIcon: LucideIcon;
}

export function ServiceSidebar({
    items,
    serviceTitle,
    serviceIcon: ServiceIcon,
}: ServiceSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex w-64 border-r bg-muted/40">
            <div className="flex flex-col w-full">
                {/* Service Title */}
                <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <ServiceIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">{serviceTitle}</h2>
                            <p className="text-xs text-muted-foreground">Service Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <nav className="flex flex-col gap-1">
                        {items.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/" && pathname?.startsWith(item.href));

                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start gap-3 h-11",
                                            isActive && "bg-secondary font-medium"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="flex-1 text-left">{item.title}</span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t">
                    <div className="text-xs text-muted-foreground">
                        <Link
                            href="/settings"
                            className="hover:text-foreground transition-colors"
                        >
                            Settings & Support
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
