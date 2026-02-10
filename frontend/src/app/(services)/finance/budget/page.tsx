"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Loader2,
    PiggyBank,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { StatsCardSkeleton } from "@/components/ui/skeleton";
import type { ExpenseCategory } from "@/types";

export default function BudgetPage() {
    // Fetch categories (which have budget_limit)
    const { data: catData, isLoading: catLoading } = useQuery({
        queryKey: ["expense-categories"],
        queryFn: () => apiClient.getExpenseCategories(),
    });

    // Fetch current period financial summary to get actual spending
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ["financial-summary", "budget"],
        queryFn: () => apiClient.getFinancialSummary(),
    });

    const isLoading = catLoading || summaryLoading;

    const categories: ExpenseCategory[] = catData?.categories ?? [];

    // Build spending by category from summary
    const spendingByCategory = new Map<string, number>();
    if (summary?.expenses_by_category) {
        for (const item of summary.expenses_by_category) {
            spendingByCategory.set(item.category.toLowerCase(), Number(item.total));
        }
    }

    // Categories with budgets
    const budgeted = categories.filter((c) => c.budget_limit && c.budget_limit > 0);
    const totalBudget = budgeted.reduce((s, c) => s + (c.budget_limit || 0), 0);
    const totalSpent = budgeted.reduce(
        (s, c) => s + (spendingByCategory.get(c.name.toLowerCase()) || 0),
        0
    );
    const overBudgetCount = budgeted.filter((c) => {
        const spent = spendingByCategory.get(c.name.toLowerCase()) || 0;
        return spent > (c.budget_limit || 0);
    }).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Budget Planning</h1>
                <p className="text-muted-foreground">
                    Track spending against budget limits for the current period
                </p>
            </div>

            {/* Overview Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Budget</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                                </div>
                                <PiggyBank className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Spent</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                                </div>
                                {totalSpent <= totalBudget ? (
                                    <TrendingDown className="h-8 w-8 text-green-500" />
                                ) : (
                                    <TrendingUp className="h-8 w-8 text-red-500" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Over Budget</p>
                                    <p className="text-2xl font-bold">{overBudgetCount}</p>
                                    <p className="text-xs text-muted-foreground">
                                        of {budgeted.length} categories
                                    </p>
                                </div>
                                <AlertTriangle
                                    className={`h-8 w-8 ${overBudgetCount > 0 ? "text-red-500" : "text-green-500"}`}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Budget Breakdown */}
            {budgeted.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-semibold mb-1">No budgets configured</p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Set budget limits on your expense categories in the Categories page
                            to start tracking spending against budgets.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {budgeted.map((cat) => {
                        const spent = spendingByCategory.get(cat.name.toLowerCase()) || 0;
                        const limit = cat.budget_limit || 1;
                        const pct = Math.min((spent / limit) * 100, 100);
                        const over = spent > limit;
                        return (
                            <Card key={cat.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-semibold">{cat.name}</p>
                                            {cat.description && (
                                                <p className="text-xs text-muted-foreground">{cat.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm">
                                                <span className={over ? "text-red-600 font-semibold" : ""}>
                                                    {formatCurrency(spent)}
                                                </span>
                                                {" / "}
                                                {formatCurrency(limit)}
                                            </p>
                                            {over && (
                                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                                                    Over by {formatCurrency(spent - limit)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Progress
                                        value={pct}
                                        className={`h-2 ${over ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {pct.toFixed(0)}% of budget used &middot;{" "}
                                        {formatCurrency(Math.max(limit - spent, 0))} remaining
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
