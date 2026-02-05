"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    MoreHorizontal,
    Play,
    Download,
    Calendar,
    Users,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Loader2,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import type { PayrollRun, PayrollItem } from "@/types";

interface PayrollRunFormData {
    period_start: string;
    period_end: string;
}

const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

const initialFormData: PayrollRunFormData = {
    period_start: getFirstDayOfMonth(new Date()).toISOString().split('T')[0],
    period_end: getLastDayOfMonth(new Date()).toISOString().split('T')[0],
};

export default function PayrollPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [isRunPayrollDialogOpen, setIsRunPayrollDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [formData, setFormData] = useState<PayrollRunFormData>(initialFormData);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch payroll runs
    const { data: payrollRunsData, isLoading: runsLoading } = useQuery({
        queryKey: ["payroll-runs", selectedStatus, currentPage],
        queryFn: () => apiClient.getPayrollRuns({
            skip: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage,
            status: selectedStatus !== "All" ? selectedStatus : undefined,
        }),
    });

    // Fetch current/pending payroll run details
    const pendingRun = payrollRunsData?.runs?.find((r: PayrollRun) => r.status === "pending");

    // Fetch items for selected run
    const { data: selectedRunDetails, isLoading: detailsLoading } = useQuery({
        queryKey: ["payroll-run-details", selectedRunId || pendingRun?.id],
        queryFn: () => apiClient.getPayrollRunItems(selectedRunId || pendingRun?.id || ""),
        enabled: !!(selectedRunId || pendingRun?.id),
    });

    // Create payroll run mutation
    const createRunMutation = useMutation({
        mutationFn: (data: PayrollRunFormData) => apiClient.createPayrollRun({
            period_start: data.period_start,
            period_end: data.period_end,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
            setIsCreateDialogOpen(false);
            setFormData(initialFormData);
            toast({
                title: "Payroll run created",
                description: "A new payroll run has been created for the period.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create payroll run",
                variant: "destructive",
            });
        },
    });

    // Process payroll mutation
    const processPayrollMutation = useMutation({
        mutationFn: (runId: string) => apiClient.processPayrollRun(runId, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
            queryClient.invalidateQueries({ queryKey: ["payroll-run-details"] });
            setIsRunPayrollDialogOpen(false);
            toast({
                title: "Payroll processed",
                description: "Payroll has been successfully processed.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Processing failed",
                description: error.message || "Failed to process payroll",
                variant: "destructive",
            });
        },
    });

    // Delete payroll run mutation
    const deleteRunMutation = useMutation({
        mutationFn: (runId: string) => apiClient.deletePayrollRun(runId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
            toast({
                title: "Payroll run deleted",
                description: "The payroll run has been removed.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete payroll run",
                variant: "destructive",
            });
        },
    });

    const payrollRuns = payrollRunsData?.runs || [];
    const totalRuns = payrollRunsData?.total || 0;
    const totalPages = Math.ceil(totalRuns / itemsPerPage);

    // Filter by search
    const filteredRuns = searchQuery
        ? payrollRuns.filter((run: PayrollRun) => {
            const periodStr = `${run.period_start} ${run.period_end}`.toLowerCase();
            return periodStr.includes(searchQuery.toLowerCase());
        })
        : payrollRuns;

    // Get payroll items for the current/pending run
    const payrollItems = selectedRunDetails?.items || [];

    // Calculate stats from API data
    const currentRun = pendingRun || payrollRuns[0];
    const totalGross = currentRun?.total_gross || 0;
    const totalDeductions = currentRun?.total_deductions || 0;
    const totalNet = currentRun?.total_net || 0;
    const employeeCount = currentRun?.employee_count || 0;

    const payrollStats = [
        {
            name: "Current Period",
            value: currentRun
                ? new Date(currentRun.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                : "No active period",
            subtitle: currentRun
                ? `${new Date(currentRun.period_start).toLocaleDateString()} - ${new Date(currentRun.period_end).toLocaleDateString()}`
                : "Create a new payroll run",
            icon: Calendar,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            name: "Employees",
            value: employeeCount.toString(),
            subtitle: "Active employees",
            icon: Users,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            name: "Total Payroll",
            value: formatCurrency(totalGross),
            subtitle: "Gross wages",
            icon: DollarSign,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
        {
            name: "Net Payroll",
            value: formatCurrency(totalNet),
            subtitle: "After deductions",
            icon: Clock,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
            case "processing":
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Processing
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleExportReport = (runId: string) => {
        const run = payrollRuns.find((r: PayrollRun) => r.id === runId);
        if (!run) return;

        const headers = ["Period Start", "Period End", "Employees", "Gross", "Deductions", "Net", "Status"];
        const row = [
            run.period_start,
            run.period_end,
            run.employee_count,
            run.total_gross,
            run.total_deductions,
            run.total_net,
            run.status,
        ];

        const csv = [headers.join(","), row.join(",")].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payroll-${run.period_start}-${run.period_end}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Report exported",
            description: "Payroll report has been downloaded.",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
                    <p className="text-muted-foreground">
                        Process payroll, manage deductions, and generate reports
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Reports
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                New Run
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <form onSubmit={(e) => { e.preventDefault(); createRunMutation.mutate(formData); }}>
                                <DialogHeader>
                                    <DialogTitle>Create Payroll Run</DialogTitle>
                                    <DialogDescription>
                                        Set up a new payroll period for processing.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="period_start">Period Start</Label>
                                        <Input
                                            id="period_start"
                                            type="date"
                                            value={formData.period_start}
                                            onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="period_end">Period End</Label>
                                        <Input
                                            id="period_end"
                                            type="date"
                                            value={formData.period_end}
                                            onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createRunMutation.isPending}>
                                        {createRunMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Create
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isRunPayrollDialogOpen} onOpenChange={setIsRunPayrollDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" disabled={!pendingRun}>
                                <Play className="mr-2 h-4 w-4" />
                                Run Payroll
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Run Payroll</DialogTitle>
                                <DialogDescription>
                                    Process payroll for the current period. This will calculate wages,
                                    deductions, and generate pay stubs.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="rounded-lg border p-4 bg-muted/50">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Period</p>
                                            <p className="font-medium">
                                                {pendingRun && (
                                                    `${new Date(pendingRun.period_start).toLocaleDateString()} - ${new Date(pendingRun.period_end).toLocaleDateString()}`
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Employees</p>
                                            <p className="font-medium">{employeeCount} active employees</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Gross Total</p>
                                            <p className="font-medium">{formatCurrency(totalGross)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Net Total</p>
                                            <p className="font-medium">{formatCurrency(totalNet)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Review employee details before processing payroll.</span>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRunPayrollDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => pendingRun && processPayrollMutation.mutate(pendingRun.id)}
                                    disabled={processPayrollMutation.isPending}
                                >
                                    {processPayrollMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    <Play className="mr-2 h-4 w-4" />
                                    Process Payroll
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {payrollStats.map((stat) => (
                    <Card key={stat.name}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.name}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {runsLoading ? (
                                <div className="h-8 flex items-center">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Current Period Employee Payroll */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Period - Employee Breakdown</CardTitle>
                    <CardDescription>
                        {currentRun
                            ? `${new Date(currentRun.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })} payroll details by employee`
                            : "No active payroll period"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {detailsLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : payrollItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <p className="text-muted-foreground">No payroll items found</p>
                            <p className="text-sm text-muted-foreground mt-1">Create a payroll run to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="py-3 px-4 text-left text-sm font-medium">Employee</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Gross Pay</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Deductions</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Net Pay</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrollItems.map((item: PayrollItem & { employee_name?: string; position?: string }) => (
                                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{item.employee_name || `Employee ${item.employee_id}`}</p>
                                                    <p className="text-xs text-muted-foreground">{item.position || "Staff"}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium">
                                                {formatCurrency(item.gross_pay)}
                                            </td>
                                            <td className="py-3 px-4 text-right text-red-500">
                                                -{formatCurrency(item.total_deductions)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-green-500">
                                                {formatCurrency(item.net_pay)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.is_paid ? (
                                                    <Badge className="bg-green-500/10 text-green-500">Paid</Badge>
                                                ) : (
                                                    <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button variant="ghost" size="sm">
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t bg-muted/50">
                                        <td className="py-3 px-4 font-medium">Total ({employeeCount} employees)</td>
                                        <td className="py-3 px-4 text-right font-bold">{formatCurrency(totalGross)}</td>
                                        <td className="py-3 px-4 text-right font-bold text-red-500">
                                            -{formatCurrency(totalDeductions)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-green-500">
                                            {formatCurrency(totalNet)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payroll History */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Payroll History</CardTitle>
                        <CardDescription>Previous payroll runs and their status</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search payroll..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {runsLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredRuns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <p className="text-muted-foreground">No payroll runs found</p>
                            <Button
                                variant="link"
                                className="mt-2"
                                onClick={() => setIsCreateDialogOpen(true)}
                            >
                                Create your first payroll run
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="py-3 px-4 text-left text-sm font-medium">Period</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Employees</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Gross</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Deductions</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Net</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRuns.map((run: PayrollRun) => (
                                        <tr key={run.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">
                                                        {new Date(run.period_start).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(run.period_start).toLocaleDateString()} -{" "}
                                                        {new Date(run.period_end).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm">{run.employee_count} employees</td>
                                            <td className="py-3 px-4 text-right font-medium">
                                                {formatCurrency(run.total_gross)}
                                            </td>
                                            <td className="py-3 px-4 text-right text-muted-foreground">
                                                {formatCurrency(run.total_deductions)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-green-500">
                                                {formatCurrency(run.total_net)}
                                            </td>
                                            <td className="py-3 px-4">{getStatusBadge(run.status)}</td>
                                            <td className="py-3 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setSelectedRunId(run.id)}>
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleExportReport(run.id)}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download Report
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>View Pay Stubs</DropdownMenuItem>
                                                        {run.status === "pending" && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => {
                                                                        if (confirm("Are you sure you want to delete this payroll run?")) {
                                                                            deleteRunMutation.mutate(run.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                {Math.min(currentPage * itemsPerPage, totalRuns)} of{" "}
                                {totalRuns} payroll runs
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
