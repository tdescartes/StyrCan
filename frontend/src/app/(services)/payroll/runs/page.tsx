"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Play,
    Loader2,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Trash2,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { StatsCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import type { PayrollRun } from "@/types";

const statusConfig: Record<string, { icon: any; color: string }> = {
    draft: { icon: Clock, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    processing: { icon: Loader2, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    completed: { icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    failed: { icon: AlertCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    cancelled: { icon: XCircle, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

function getFirstDayOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function getLastDayOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}

export default function PayrollRunsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [detailRunId, setDetailRunId] = useState<string | null>(null);
    const limit = 15;

    const [form, setForm] = useState({
        period_start: getFirstDayOfMonth(new Date()),
        period_end: getLastDayOfMonth(new Date()),
    });

    // Runs list
    const { data, isLoading } = useQuery({
        queryKey: ["payroll-runs-page", statusFilter, currentPage],
        queryFn: () =>
            apiClient.getPayrollRuns({
                skip: (currentPage - 1) * limit,
                limit,
                status: statusFilter !== "all" ? statusFilter : undefined,
            }),
    });

    const runs: PayrollRun[] = data?.payroll_runs ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Run detail
    const { data: detail, isLoading: detailLoading } = useQuery({
        queryKey: ["payroll-run-detail", detailRunId],
        queryFn: () => apiClient.getPayrollRun(detailRunId!),
        enabled: !!detailRunId,
    });

    // Items for detail
    const { data: items } = useQuery({
        queryKey: ["payroll-run-items", detailRunId],
        queryFn: () => apiClient.getPayrollRunItems(detailRunId!),
        enabled: !!detailRunId,
    });

    const createMutation = useMutation({
        mutationFn: () => apiClient.createPayrollRun(form),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payroll-runs-page"] });
            setIsCreateOpen(false);
            toast.success("Payroll run created");
        },
        onError: (err: any) => toast.error(err.message || "Failed to create run"),
    });

    const processMutation = useMutation({
        mutationFn: (id: string) => apiClient.processPayrollRun(id, { notify_employees: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payroll-runs-page"] });
            queryClient.invalidateQueries({ queryKey: ["payroll-run-detail"] });
            queryClient.invalidateQueries({ queryKey: ["payroll-run-items"] });
            toast.success("Payroll processed successfully");
        },
        onError: (err: any) => toast.error(err.message || "Processing failed"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deletePayrollRun(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payroll-runs-page"] });
            setDetailRunId(null);
            toast.success("Payroll run deleted");
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete"),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
                    <p className="text-muted-foreground">Create and process payroll periods</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Payroll Run
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Runs Table */}
            {isLoading ? (
                <TableSkeleton rows={8} columns={5} />
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead>Processed</TableHead>
                                    <TableHead className="w-[140px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No payroll runs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    runs.map((run) => {
                                        const cfg = statusConfig[run.status] || statusConfig.draft;
                                        const StatusIcon = cfg.icon;
                                        return (
                                            <TableRow key={run.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDate(run.period_start)} – {formatDate(run.period_end)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cfg.color} variant="secondary">
                                                        <StatusIcon className="mr-1 h-3 w-3" />
                                                        {run.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {run.total_amount ? formatCurrency(Number(run.total_amount)) : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {run.processed_at ? formatDate(run.processed_at) : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => setDetailRunId(run.id)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {run.status === "draft" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-600"
                                                                onClick={() => processMutation.mutate(run.id)}
                                                                disabled={processMutation.isPending}
                                                            >
                                                                <Play className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {(run.status === "draft" || run.status === "cancelled") && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500"
                                                                onClick={() => deleteMutation.mutate(run.id)}
                                                                disabled={deleteMutation.isPending}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                        Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!detailRunId} onOpenChange={(o) => !o && setDetailRunId(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Payroll Run Detail</DialogTitle>
                        <DialogDescription>
                            {detail && `${formatDate((detail as any).period_start)} – ${formatDate((detail as any).period_end)}`}
                        </DialogDescription>
                    </DialogHeader>
                    {detailLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-auto">
                            {(detail as any)?.total_net_pay != null && (
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Total Gross</p>
                                        <p className="font-semibold">{formatCurrency(Number((detail as any).total_base_salary))}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total Tax</p>
                                        <p className="font-semibold">{formatCurrency(Number((detail as any).total_tax))}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total Net</p>
                                        <p className="font-semibold">{formatCurrency(Number((detail as any).total_net_pay))}</p>
                                    </div>
                                </div>
                            )}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">Base</TableHead>
                                        <TableHead className="text-right">Tax</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {((detail as any)?.items ?? items ?? []).map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.employee_name || item.employee_id?.slice(0, 8)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(item.base_salary))}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(item.tax_amount))}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(Number(item.net_pay))}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={item.payment_status === "paid" ? "bg-green-100 text-green-800" : ""}>
                                                    {item.payment_status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Payroll Run</DialogTitle>
                        <DialogDescription>Define the payroll period to create a draft run.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Period Start</Label>
                            <Input
                                type="date"
                                value={form.period_start}
                                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Period End</Label>
                            <Input
                                type="date"
                                value={form.period_end}
                                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
