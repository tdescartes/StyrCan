"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Loader2,
    User,
    Search,
    DollarSign,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import type { Employee } from "@/types";

export default function PayrollByEmployeePage() {
    const [search, setSearch] = useState("");
    const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

    const { data: empData, isLoading: empLoading } = useQuery({
        queryKey: ["employees-payroll"],
        queryFn: () => apiClient.getEmployees({ limit: 200 }),
    });

    const employees: Employee[] = empData?.employees ?? [];

    const filtered = search
        ? employees.filter(
            (e) =>
                `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
                e.email.toLowerCase().includes(search.toLowerCase()) ||
                e.department?.toLowerCase().includes(search.toLowerCase())
        )
        : employees;

    // Employee history
    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: ["employee-payroll-history", selectedEmpId],
        queryFn: () => apiClient.getEmployeePayrollHistory(selectedEmpId!, { limit: 24 }),
        enabled: !!selectedEmpId,
    });

    const selectedEmp = employees.find((e) => e.id === selectedEmpId);

    if (empLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Payroll by Employee</h1>
                <p className="text-muted-foreground">View individual employee payroll history</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search employees..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Employee list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="py-12 text-center">
                            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No employees found</p>
                        </CardContent>
                    </Card>
                ) : (
                    filtered.map((emp) => (
                        <Card
                            key={emp.id}
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => setSelectedEmpId(emp.id)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    {emp.first_name} {emp.last_name}
                                </CardTitle>
                                <CardDescription>{emp.email}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm">
                                    {emp.department && (
                                        <Badge variant="outline">{emp.department}</Badge>
                                    )}
                                    {emp.position && (
                                        <span className="text-muted-foreground">{emp.position}</span>
                                    )}
                                </div>
                                {emp.salary_amount && (
                                    <p className="text-sm mt-2 flex items-center gap-1 text-muted-foreground">
                                        <DollarSign className="h-3 w-3" />
                                        {formatCurrency(emp.salary_amount)} / month
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Employee History Dialog */}
            <Dialog open={!!selectedEmpId} onOpenChange={(o) => !o && setSelectedEmpId(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : "Employee"} — Payroll History
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEmp?.position} {selectedEmp?.department ? `· ${selectedEmp.department}` : ""}
                        </DialogDescription>
                    </DialogHeader>

                    {historyLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-auto">
                            {/* Summary */}
                            {history?.summary && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="rounded-lg border p-3">
                                        <p className="text-muted-foreground">Total Earned</p>
                                        <p className="font-semibold">{formatCurrency(Number(history.summary.total_earned))}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-muted-foreground">Total Tax</p>
                                        <p className="font-semibold">{formatCurrency(Number(history.summary.total_tax))}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-muted-foreground">Net Received</p>
                                        <p className="font-semibold">{formatCurrency(Number(history.summary.net_received))}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-muted-foreground">Pay Periods</p>
                                        <p className="font-semibold">{history.summary.payroll_count}</p>
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Base</TableHead>
                                        <TableHead className="text-right">Tax</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(history?.items ?? []).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                                                No payroll records
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history.items.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDate(item.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(Number(item.base_salary))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(Number(item.tax_amount))}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(Number(item.net_pay))}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            item.payment_status === "paid"
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                : ""
                                                        }
                                                    >
                                                        {item.payment_status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
