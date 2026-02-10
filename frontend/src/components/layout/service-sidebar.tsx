"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SidebarItem {
    title: string;
    href: string;
    icon: LucideIcon;
    description?: string;
    badge?: string;
    locked?: boolean;
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
        <aside className="hidden md:flex w-64 border-r border-zinc-200 bg-white">
            <div className="flex flex-col w-full">
                {/* Service Title */}
                <div className="p-6 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-sm bg-zinc-100">
                            <ServiceIcon className="h-5 w-5 text-zinc-900" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm">{serviceTitle}</h2>
                            <p className="text-xs text-zinc-500">Service Dashboard</p>
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
                                <Link
                                    key={item.href}
                                    href={item.locked ? "#" : item.href}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-zinc-100 text-black shadow-inner"
                                            : "text-zinc-500 hover:text-black hover:bg-zinc-50",
                                        item.locked && "opacity-60 cursor-not-allowed"
                                    )}
                                    onClick={(e) => item.locked && e.preventDefault()}
                                >
                                    <Icon className={cn(
                                        "w-4 h-4 shrink-0 transition-colors",
                                        isActive ? "text-black" : "text-zinc-400 group-hover:text-black"
                                    )} />
                                    <span className="flex-1 text-left">{item.title}</span>
                                    {item.badge && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm bg-black text-white">
                                            {item.badge}
                                        </span>
                                    )}
                                    {item.locked && <Lock className="w-3 h-3 text-amber-500" />}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-black rounded-r-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100">
                    <div className="text-xs text-zinc-500">
                        <Link
                            href="/settings"
                            className="hover:text-black transition-colors font-medium"
                        >
                            Settings & Support
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
