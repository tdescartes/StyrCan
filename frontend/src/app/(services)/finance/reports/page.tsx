"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Loader2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";

export default function ReportsPage() {
    const [months, setMonths] = useState("6");

    // Fetch trends
    const { data: trendsData, isLoading: trendsLoading } = useQuery({
        queryKey: ["financial-trends", months],
        queryFn: () => apiClient.getFinancialTrends(parseInt(months)),
    });

    // Fetch summary for totals
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ["financial-summary", "reports"],
        queryFn: () => apiClient.getFinancialSummary(),
    });

    const isLoading = trendsLoading || summaryLoading;
    const trends = trendsData?.trends ?? [];

    // Calculate totals from trends
    const totalIncome = trends.reduce((s, t) => s + Number(t.income), 0);
    const totalExpenses = trends.reduce((s, t) => s + Number(t.expenses), 0);
    const totalNet = totalIncome - totalExpenses;

    // Find best and worst months
    const bestMonth = trends.length
        ? trends.reduce((best, t) => (Number(t.net) > Number(best.net) ? t : best), trends[0])
        : null;
    const worstMonth = trends.length
        ? trends.reduce((worst, t) => (Number(t.net) < Number(worst.net) ? t : worst), trends[0])
        : null;

    // Max income for bar scaling
    const maxVal = Math.max(
        ...trends.map((t) => Math.max(Number(t.income), Number(t.expenses))),
        1
    );

    function formatMonth(monthStr: string) {
        const [year, month] = monthStr.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">Income & expense trends</p>
                </div>
                <Select value={months} onValueChange={setMonths}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3">Last 3 months</SelectItem>
                        <SelectItem value="6">Last 6 months</SelectItem>
                        <SelectItem value="12">Last 12 months</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Period Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Income</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(totalIncome)}
                                </p>
                            </div>
                            <ArrowUpRight className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(totalExpenses)}
                                </p>
                            </div>
                            <ArrowDownRight className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Net Profit</p>
                                <p className={`text-2xl font-bold ${totalNet >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                    {formatCurrency(totalNet)}
                                </p>
                            </div>
                            <DollarSign className={`h-8 w-8 ${totalNet >= 0 ? "text-blue-500" : "text-red-500"}`} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Highlights */}
            {bestMonth && worstMonth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" /> Best Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">{formatMonth(bestMonth.month)}</p>
                            <p className="text-sm text-green-600">
                                Net: {formatCurrency(Number(bestMonth.net))}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-500" /> Worst Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">{formatMonth(worstMonth.month)}</p>
                            <p className={`text-sm ${Number(worstMonth.net) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                Net: {formatCurrency(Number(worstMonth.net))}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Monthly Breakdown - visual bar chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" /> Monthly Breakdown
                    </CardTitle>
                    <CardDescription>Income vs expenses by month</CardDescription>
                </CardHeader>
                <CardContent>
                    {trends.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No data for the selected period
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {trends.map((t) => {
                                const incomeW = (Number(t.income) / maxVal) * 100;
                                const expenseW = (Number(t.expenses) / maxVal) * 100;
                                const net = Number(t.net);
                                return (
                                    <div key={t.month} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium w-28">{formatMonth(t.month)}</span>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-green-600">
                                                    +{formatCurrency(Number(t.income))}
                                                </span>
                                                <span className="text-red-600">
                                                    -{formatCurrency(Number(t.expenses))}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        net >= 0
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                    }
                                                >
                                                    {net >= 0 ? "+" : ""}
                                                    {formatCurrency(net)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div
                                                className="h-3 rounded bg-green-500/80"
                                                style={{ width: `${Math.max(incomeW, 1)}%` }}
                                            />
                                            <div
                                                className="h-3 rounded bg-red-500/80"
                                                style={{ width: `${Math.max(expenseW, 1)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="flex gap-6 text-xs text-muted-foreground pt-2 border-t">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded bg-green-500/80" /> Income
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded bg-red-500/80" /> Expenses
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Breakdown from summary */}
            {summary?.expenses_by_category && summary.expenses_by_category.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Expense Breakdown by Category</CardTitle>
                        <CardDescription>Current period spending by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {summary.expenses_by_category.map(
                                (cat: { category: string; total: number; count: number }) => {
                                    const totalExpCategory = Number(summary.total_expenses) || 1;
                                    const pct = (Number(cat.total) / totalExpCategory) * 100;
                                    return (
                                        <div key={cat.category} className="flex items-center gap-4">
                                            <span className="w-28 text-sm font-medium truncate">
                                                {cat.category}
                                            </span>
                                            <div className="flex-1 h-2 rounded bg-muted">
                                                <div
                                                    className="h-full rounded bg-primary"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-24 text-right">
                                                {formatCurrency(Number(cat.total))}
                                            </span>
                                            <span className="text-xs text-muted-foreground w-12 text-right">
                                                {pct.toFixed(0)}%
                                            </span>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
