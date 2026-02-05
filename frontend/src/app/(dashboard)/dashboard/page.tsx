"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    DollarSign,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api/client";
import type { Employee, Transaction, PayrollRun } from "@/types";

export default function DashboardPage() {
    const { user } = useAuthStore();

    // Fetch dashboard data
    const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => apiClient.getDashboard(),
    });

    // Fetch recent employees
    const { data: employeesData, isLoading: employeesLoading } = useQuery({
        queryKey: ["employees", "recent"],
        queryFn: () => apiClient.getEmployees({ limit: 3 }),
    });

    // Fetch recent transactions
    const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
        queryKey: ["transactions", "recent"],
        queryFn: () => apiClient.getTransactions({ limit: 4 }),
    });

    // Fetch pending payroll runs
    const { data: payrollData, isLoading: payrollLoading } = useQuery({
        queryKey: ["payroll-runs", "pending"],
        queryFn: () => apiClient.getPayrollRuns({ limit: 3, status: "pending" }),
    });

    // Extract data from API responses
    const kpis = dashboardData?.kpis;
    const recentEmployees = employeesData?.employees || [];
    const recentTransactions = transactionsData?.transactions || [];
    const upcomingPayroll = payrollData?.runs || [];

    // Build stats array from API data
    const stats = [
        {
            name: "Total Employees",
            value: kpis?.total_employees?.toString() || "0",
            change: kpis?.employee_change || "+0",
            trend: "up" as const,
            icon: Users,
            href: "/dashboard/employees",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            name: "Monthly Revenue",
            value: formatCurrency(kpis?.monthly_revenue || 0),
            change: kpis?.revenue_change || "+0%",
            trend: "up" as const,
            icon: DollarSign,
            href: "/dashboard/finances",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            name: "Payroll This Month",
            value: formatCurrency(kpis?.monthly_payroll || 0),
            change: kpis?.payroll_change || "+0%",
            trend: "up" as const,
            icon: CreditCard,
            href: "/dashboard/payroll",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
        {
            name: "Pending Expenses",
            value: formatCurrency(kpis?.pending_expenses || 0),
            change: kpis?.expenses_change || "-0%",
            trend: (kpis?.pending_expenses || 0) < (kpis?.previous_expenses || 0) ? "down" : "up" as const,
            icon: TrendingDown,
            href: "/dashboard/finances",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
        },
    ];

    const isLoading = dashboardLoading || employeesLoading || transactionsLoading || payrollLoading;

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, {user?.first_name || "User"}!
                    </h1>
                    <p className="text-muted-foreground">
                        Here's what's happening with your business today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link key={stat.name} href={stat.href}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.name}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {dashboardLoading ? (
                                    <div className="h-8 flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            {stat.trend === "up" ? (
                                                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                                            )}
                                            <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                                                {stat.change}
                                            </span>
                                            <span className="ml-1">from last month</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Employees */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Employees</CardTitle>
                            <CardDescription>Newly joined team members</CardDescription>
                        </div>
                        <Link href="/dashboard/employees">
                            <Button variant="ghost" size="sm">View all</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {employeesLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : recentEmployees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <Users className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No employees yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentEmployees.map((employee: Employee) => (
                                    <div key={employee.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src="" />
                                                <AvatarFallback>
                                                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {employee.first_name} {employee.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{employee.position}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {employee.hire_date && (
                                                <>Joined {new Date(employee.hire_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Your latest financial activity</CardDescription>
                        </div>
                        <Link href="/dashboard/finances">
                            <Button variant="ghost" size="sm">View all</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {transactionsLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : recentTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <DollarSign className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentTransactions.map((transaction: Transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${transaction.type === "income" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                                                {transaction.type === "income" ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{transaction.description || transaction.category || "Transaction"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(new Date(transaction.transaction_date))}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-medium ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
                                            {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Payroll */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Payroll</CardTitle>
                            <CardDescription>Scheduled payroll runs</CardDescription>
                        </div>
                        <Link href="/dashboard/payroll">
                            <Button variant="ghost" size="sm">Manage payroll</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {payrollLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : upcomingPayroll.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <CreditCard className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No pending payroll runs</p>
                                <Link href="/dashboard/payroll">
                                    <Button variant="link" size="sm">Create a payroll run</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="rounded-lg border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="py-3 px-4 text-left text-sm font-medium">Period</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Employees</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Total Amount</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Due Date</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                                            <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcomingPayroll.map((payroll: PayrollRun) => (
                                            <tr key={payroll.id} className="border-b last:border-0">
                                                <td className="py-3 px-4 text-sm font-medium">
                                                    {new Date(payroll.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                                </td>
                                                <td className="py-3 px-4 text-sm">{payroll.employee_count || 0} employees</td>
                                                <td className="py-3 px-4 text-sm font-medium">{formatCurrency(payroll.total_net || 0)}</td>
                                                <td className="py-3 px-4 text-sm">
                                                    {new Date(payroll.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={payroll.status === "pending" ? "secondary" : "default"}>
                                                        {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem>Run Payroll</DropdownMenuItem>
                                                            <DropdownMenuItem>Export</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
