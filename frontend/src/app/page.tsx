"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  DollarSign,
  Wallet,
  MessageSquare,
  Building2,
  TrendingUp,
  Calendar,
  Mail,
  Loader2,
  Settings,
  User,
  LogOut,
  CreditCard,
  PiggyBank,
  Clock,
  Plus,
  Megaphone,
  ExternalLink,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ServiceCardSkeleton, ActivityListSkeleton } from "@/components/ui/skeleton";

const services = [
  {
    id: "employees",
    name: "Employees",
    icon: Users,
    description: "Manage staff, PTO, and schedules.",
    href: "/employees",
    stat: { label: "Active", count: 0 },
    warning: { label: "On Leave", count: 0 },
  },
  {
    id: "finance",
    name: "Finance",
    icon: PiggyBank,
    description: "Track cash flow and expenses.",
    href: "/finance",
    stat: { label: "Revenue", amount: 0 },
  },
  {
    id: "payroll",
    name: "Payroll",
    icon: CreditCard,
    description: "Process salaries and taxes.",
    href: "/payroll",
    warning: { label: "Run Due", date: "" },
  },
  {
    id: "communication",
    name: "Communication",
    icon: MessageSquare,
    description: "Team chat and announcements.",
    href: "/communication",
    stat: { label: "Unread", count: 0 },
  },
];

const fallbackActivities = [
  { text: 'No recent activity yet', user: 'System', time: 'Just now', icon: Activity },
];

const activityIconMap: Record<string, typeof CreditCard> = {
  transaction: DollarSign,
  payroll: CreditCard,
  pto: Clock,
  shift: Calendar,
  employee: Users,
};

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, hasHydrated, pathname, router]);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.getDashboard(),
    retry: false,
    enabled: hasHydrated && isAuthenticated,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: () => apiClient.getUnreadMessageCount(),
    retry: false,
    enabled: hasHydrated && isAuthenticated,
  });

  const kpis = dashboard?.kpis ?? dashboard;

  // Update service cards with real data
  const updatedServices = services.map(service => {
    if (service.id === 'employees') {
      return {
        ...service,
        stat: { label: "Active", count: kpis?.employee_stats?.active ?? 0 },
        warning: { label: "On Leave", count: kpis?.employee_stats?.on_leave ?? 0 },
      };
    }
    if (service.id === 'finance') {
      return {
        ...service,
        stat: { label: "Revenue", amount: Number(kpis?.financial_stats?.total_income ?? 0) },
      };
    }
    if (service.id === 'communication') {
      return {
        ...service,
        stat: { label: "Unread", count: unreadData?.unread_count ?? 0 },
      };
    }
    return service;
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 md:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">PULSE</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-bold border border-zinc-300 hover:bg-zinc-300 transition-colors">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User"}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
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
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8 md:px-8">
        {/* Welcome Section */}
        <div className="flex justify-between items-end border-b border-zinc-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              Welcome back, {user?.first_name || 'User'}.
            </h1>
            <p className="text-zinc-500 mt-2">
              Here is your daily overview for {user?.company?.name || 'your company'}.
            </p>
          </div>
          <Button variant="secondary" className="hidden md:flex">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Site
          </Button>
        </div>

        {/* Service Cards */}
        {dashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {updatedServices.map((service) => {
              const Icon = service.icon;
              return (
                <Link key={service.id} href={service.href}>
                  <div className="group bg-white p-6 border border-zinc-200 rounded-sm shadow-sm hover:border-black transition-all cursor-pointer h-full">
                    <div className="w-10 h-10 bg-zinc-100 rounded-sm flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{service.name}</h3>
                    <p className="text-xs text-zinc-500 mb-4">{service.description}</p>
                    <div className="flex gap-2 text-xs font-medium text-zinc-600">
                      {service.stat && (
                        <span className="bg-zinc-50 px-2 py-1 rounded-sm border border-zinc-100">
                          {service.stat.count !== undefined
                            ? `${service.stat.count} ${service.stat.label}`
                            : `${formatCurrency(service.stat.amount || 0)} ${service.stat.label}`
                          }
                        </span>
                      )}
                      {service.warning && 'count' in service.warning && service.warning.count > 0 && (
                        <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-sm border border-rose-100">
                          {service.warning.count} {service.warning.label}
                        </span>
                      )}
                      {service.warning && 'date' in service.warning && service.warning.date && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-sm border border-amber-100">
                          {service.warning.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b border-zinc-100">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dashboardLoading ? (
                <ActivityListSkeleton items={4} />
              ) : (
                <div className="divide-y divide-zinc-100">
                  {(kpis?.recent_activities?.length ? kpis.recent_activities : fallbackActivities).map((item: any, i: number) => {
                    const IconComponent = item.icon ?? activityIconMap[item.type] ?? Activity;
                    return (
                      <div key={i} className="p-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900">{item.text ?? item.description}</p>
                          <p className="text-xs text-zinc-500">
                            {item.user ?? item.type}{item.time ? ` • ${item.time}` : item.timestamp ? ` • ${formatRelativeTime(item.timestamp)}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-zinc-100">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/employees/directory">
                  <Button variant="secondary" className="w-full justify-start h-auto py-3 px-4">
                    <Plus className="w-4 h-4 mr-2 opacity-80" />
                    Add Employee
                  </Button>
                </Link>
                <Link href="/finance/ledger">
                  <Button variant="secondary" className="w-full justify-start h-auto py-3 px-4">
                    <DollarSign className="w-4 h-4 mr-2 opacity-80" />
                    Log Expense
                  </Button>
                </Link>
                <Link href="/payroll/runs">
                  <Button variant="secondary" className="w-full justify-start h-auto py-3 px-4">
                    <CreditCard className="w-4 h-4 mr-2 opacity-80" />
                    Run Payroll
                  </Button>
                </Link>
                <Link href="/communication/broadcast">
                  <Button variant="secondary" className="w-full justify-start h-auto py-3 px-4">
                    <Megaphone className="w-4 h-4 mr-2 opacity-80" />
                    Broadcast
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
