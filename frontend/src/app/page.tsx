"use client";

import Link from "next/link";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const services = [
  {
    id: "employees",
    name: "Employees",
    icon: Users,
    description: "Manage your team, schedules, and time-off requests",
    href: "/employees",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    features: ["Directory", "Schedule", "Time Off", "Reviews"],
  },
  {
    id: "finance",
    name: "Finance",
    icon: DollarSign,
    description: "Track revenue, expenses, and financial health",
    href: "/finance",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
    features: ["Ledger", "Budget", "Reports", "Categories"],
  },
  {
    id: "payroll",
    name: "Payroll",
    icon: Wallet,
    description: "Automate payroll processing and tax calculations",
    href: "/payroll",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    features: ["Runs", "History", "Taxes", "By Employee"],
  },
  {
    id: "communication",
    name: "Communication",
    icon: MessageSquare,
    description: "Secure messaging and company-wide announcements",
    href: "/communication",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    features: ["Inbox", "Broadcasts", "Threads", "Files"],
  },
];

export default function Home() {
  const { user, logout } = useAuthStore();
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient.getDashboard(),
    retry: false,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: () => apiClient.getUnreadMessageCount(),
    retry: false,
  });

  const kpis = dashboard?.kpis ?? dashboard;

  const stats = [
    {
      label: "Active Employees",
      value: dashboardLoading ? "..." : String(kpis?.employee_stats?.active ?? 0),
      icon: Users,
    },
    {
      label: "Monthly Revenue",
      value: dashboardLoading ? "..." : formatCurrency(Number(kpis?.financial_stats?.total_income ?? 0)),
      icon: TrendingUp,
    },
    {
      label: "Pending PTO",
      value: dashboardLoading ? "..." : String(kpis?.pto_stats?.pending_requests ?? 0),
      icon: Calendar,
    },
    {
      label: "Unread Messages",
      value: String(unreadData?.unread_count ?? 0),
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">StyrCan</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-5 w-5" />
                </Button>
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
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Welcome to Your Business Hub
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage employees, finances, payroll, and communications all in one place.
            Choose a service below to get started.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} href={service.href}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${service.bgColor}`}>
                        <Icon className={`h-8 w-8 ${service.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{service.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {service.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((feature) => (
                        <div
                          key={feature}
                          className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                        >
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Need Help Getting Started?</h3>
            <p className="mb-4 opacity-90">
              Check out our guides and documentation to make the most of StyrCan.
            </p>
            <Button variant="secondary" size="lg">
              View Documentation
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
