"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Loader2,
    History,
    CheckCircle,
    DollarSign,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import type { PayrollRun } from "@/types";
import { StatsCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function PayrollHistoryPage() {
    const [yearFilter, setYearFilter] = useState("all");
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const { data, isLoading } = useQuery({
        queryKey: ["payroll-history", yearFilter],
        queryFn: () =>
            apiClient.getPayrollRuns({
                limit: 100,
                status: "completed",
                year: yearFilter !== "all" ? parseInt(yearFilter) : undefined,
            }),
    });

    const runs: PayrollRun[] = data?.payroll_runs ?? [];

    // Compute totals
    const totalPaid = runs.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);
    const totalRuns = runs.length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
                <p className="text-muted-foreground">Completed payroll runs</p>
            </div>

            {/* Summary */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatsCardSkeleton />
                    <StatsCardSkeleton />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Paid Out</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed Runs</p>
                                    <p className="text-2xl font-bold">{totalRuns}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-4">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {isLoading ? (
                <TableSkeleton rows={8} />
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead>Processed By</TableHead>
                                    <TableHead>Processed At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">No completed payroll runs</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    runs.map((run) => (
                                        <TableRow key={run.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(run.period_start)} – {formatDate(run.period_end)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(Number(run.total_amount ?? 0))}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {run.processed_by?.slice(0, 8) || "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {run.processed_at ? formatDate(run.processed_at) : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
