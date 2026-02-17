"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    DollarSign,
    Download,
    Loader2,
    AlertCircle,
    Receipt,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { apiClient } from "@/lib/api/client";
import type { MyPayrollResponse } from "@/types";

export function MyPayStubsView() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    const { data, isLoading, error } = useQuery<MyPayrollResponse>({
        queryKey: ["my-payroll", selectedYear],
        queryFn: () => apiClient.getMyPayroll(selectedYear),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-zinc-300" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-zinc-700">Payroll Not Available</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Your employee record hasn&apos;t been linked yet. Contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    const items = data?.payroll_items ?? [];
    const summary = data?.summary;

    const formatCurrency = (val: string | number) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Pay Stubs</h1>
                    <p className="text-sm text-zinc-500">Your payroll history and earnings summary</p>
                </div>
                <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => setSelectedYear(Number(v))}
                >
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                            <SelectItem key={y} value={String(y)}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Gross Earnings</CardTitle>
                            <DollarSign className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_gross)}</div>
                            <p className="text-xs text-zinc-500">Year to date</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
                            <Receipt className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_tax)}</div>
                            <p className="text-xs text-zinc-500">Withheld</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.total_net)}</div>
                            <p className="text-xs text-zinc-500">Take-home</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pay Periods</CardTitle>
                            <Receipt className="h-4 w-4 text-zinc-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.pay_periods}</div>
                            <p className="text-xs text-zinc-500">In {selectedYear}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Pay Stubs List */}
            <Card>
                <CardHeader>
                    <CardTitle>Pay Stubs</CardTitle>
                    <CardDescription>{items.length} pay periods in {selectedYear}</CardDescription>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8">
                            No payroll records found for {selectedYear}.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-zinc-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {item.period_start && item.period_end
                                                    ? `${new Date(item.period_start).toLocaleDateString()} — ${new Date(item.period_end).toLocaleDateString()}`
                                                    : "Pay Period"}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Gross: {formatCurrency(item.base_salary)} · Tax: {formatCurrency(item.tax_amount)} · Deductions: {formatCurrency(item.deductions)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-green-700">
                                                {formatCurrency(item.net_amount)}
                                            </p>
                                            <p className="text-xs text-zinc-500">net pay</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={
                                                item.payment_status === "paid"
                                                    ? "bg-green-100 text-green-800 border-green-300"
                                                    : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                            }
                                        >
                                            {item.payment_status || "processed"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
