"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FileCheck,
    DollarSign,
    TrendingUp,
    Calendar,
    Loader2,
    Download,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { apiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type { PayrollRun, PayrollItem, Employee } from "@/types";

function formatCurrency(val: string | number) {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num || 0);
}

export default function TaxDocumentsPage() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch payroll runs for the year
    const { data: runsData, isLoading } = useQuery<{ payroll_runs: PayrollRun[]; total: number }>({
        queryKey: ["payroll-runs", selectedYear],
        queryFn: () => apiClient.getPayrollRuns({ year: parseInt(selectedYear), limit: 100 }),
    });

    const payrollRuns = runsData?.payroll_runs ?? [];
    const completedRuns = payrollRuns.filter((r) => r.status === "completed");

    // Fetch employees
    const { data: empData } = useQuery({
        queryKey: ["employees", "all"],
        queryFn: () => apiClient.getEmployees({ limit: 200 }),
    });
    const employees: Employee[] = empData?.employees ?? [];
    const empMap = new Map(employees.map((e) => [e.id, `${e.first_name} ${e.last_name}`]));

    // Calculate total tax from completed runs
    const totalTax = completedRuns.reduce((sum, r) => {
        const amount = parseFloat(r.total_amount || "0");
        return sum + amount * 0.2; // Backend uses 20% flat tax rate
    }, 0);

    const totalGross = completedRuns.reduce((sum, r) => sum + parseFloat(r.total_amount || "0"), 0);

    // Export tax summary
    const handleExport = () => {
        const headers = ["Period", "Status", "Total Amount", "Est. Tax (20%)", "Processed"];
        const rows = completedRuns.map((r) => [
            `${formatDate(r.period_start)} - ${formatDate(r.period_end)}`,
            r.status,
            formatCurrency(r.total_amount),
            formatCurrency(parseFloat(r.total_amount || "0") * 0.2),
            r.processed_at ? formatDate(r.processed_at) : "N/A",
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tax-summary-${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter runs
    const filteredRuns = searchQuery
        ? payrollRuns.filter((r) =>
            `${r.period_start} ${r.period_end} ${r.status}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : payrollRuns;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tax Documents</h1>
                    <p className="text-muted-foreground">
                        Tax summaries and withholding information from payroll
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport} disabled={completedRuns.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Gross</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalGross)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Est. Tax Withheld</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalTax)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Payroll Runs</p>
                                <p className="text-2xl font-bold">{completedRuns.length}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tax Rate</p>
                                <p className="text-2xl font-bold">20%</p>
                            </div>
                            <FileCheck className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search payroll periods..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Payroll Tax Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Payroll Tax History</CardTitle>
                    <CardDescription>
                        Tax withholding details per payroll period ({selectedYear})
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredRuns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <FileCheck className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No payroll runs for {selectedYear}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="py-3 px-4 text-left text-sm font-medium">Period</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Gross Amount</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Est. Tax (20%)</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Net After Tax</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Processed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRuns.map((run) => {
                                        const gross = parseFloat(run.total_amount || "0");
                                        const tax = gross * 0.2;
                                        const net = gross - tax;
                                        return (
                                            <tr key={run.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-3 px-4 text-sm">
                                                    {formatDate(run.period_start)} &ndash; {formatDate(run.period_end)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            run.status === "completed"
                                                                ? "bg-green-100 text-green-800"
                                                                : run.status === "processing"
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : run.status === "draft"
                                                                        ? "bg-gray-100 text-gray-800"
                                                                        : "bg-red-100 text-red-800"
                                                        }
                                                    >
                                                        {run.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-right font-medium">
                                                    {formatCurrency(gross)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-right text-red-600 font-medium">
                                                    {formatCurrency(tax)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-right font-medium">
                                                    {formatCurrency(net)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {run.processed_at ? formatDate(run.processed_at) : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/50 font-semibold">
                                        <td className="py-3 px-4 text-sm" colSpan={2}>
                                            Total ({selectedYear})
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right">
                                            {formatCurrency(totalGross)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-red-600">
                                            {formatCurrency(totalTax)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right">
                                            {formatCurrency(totalGross - totalTax)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
