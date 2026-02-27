"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    CalendarDays,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { StatsCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useRoleAccess } from "@/hooks/use-role-access";
import { MyPTOView } from "@/components/employee/my-pto";
import type { Employee } from "@/types";

interface PTORequest {
    id: string;
    employee_id: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason?: string;
    status: string;
    reviewed_by?: string;
    reviewed_at?: string;
    created_at: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Pending" },
    approved: { icon: CheckCircle2, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Approved" },
    rejected: { icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Rejected" },
};

export default function PTOPage() {
    const { isEmployee } = useRoleAccess();

    // Employee role sees personal PTO view
    if (isEmployee) {
        return <MyPTOView />;
    }

    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPTO, setNewPTO] = useState({
        employee_id: "",
        start_date: "",
        end_date: "",
        reason: "",
    });

    // Fetch employees
    const { data: employeesData } = useQuery({
        queryKey: ["employees", "all"],
        queryFn: () => apiClient.getEmployees({ limit: 100 }),
    });
    const employees: Employee[] = employeesData?.employees ?? [];
    const empMap = new Map(employees.map((e) => [e.id, `${e.first_name} ${e.last_name}`]));

    // Fetch PTO requests from all employees
    // We use the pending endpoint for managers, plus gather from employees
    const { data: pendingData, isLoading } = useQuery<{ requests: PTORequest[]; total: number }>({
        queryKey: ["pto-requests", "pending"],
        queryFn: () => apiClient.getPTORequests({ status: "pending" }) as any,
    });

    const allRequests: PTORequest[] = (pendingData as any)?.requests ?? [];

    const filtered = statusFilter === "all"
        ? allRequests
        : allRequests.filter((r) => r.status === statusFilter);

    // Approve / Deny mutations
    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            apiClient.updatePTORequest(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pto-requests"] });
            toast.success("PTO request updated");
        },
        onError: (err: any) => toast.error(err.message || "Failed to update request"),
    });

    // Create PTO request mutation
    const createMutation = useMutation({
        mutationFn: (data: typeof newPTO) => apiClient.createPTORequest(data.employee_id, {
            start_date: data.start_date,
            end_date: data.end_date,
            reason: data.reason || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pto-requests"] });
            setIsCreateOpen(false);
            setNewPTO({ employee_id: "", start_date: "", end_date: "", reason: "" });
            toast.success("PTO request created");
        },
        onError: (err: any) => toast.error(err.message || "Failed to create request"),
    });

    // Summary counts
    const pendingCount = allRequests.filter((r) => r.status === "pending").length;
    const approvedCount = allRequests.filter((r) => r.status === "approved").length;
    const rejectedCount = allRequests.filter((r) => r.status === "rejected").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Time Off Requests</h1>
                    <p className="text-muted-foreground">Review and manage PTO requests</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Request PTO
                </Button>
            </div>

            {/* Summary Cards */}
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
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold">{pendingCount}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Approved</p>
                                    <p className="text-2xl font-bold">{approvedCount}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Denied</p>
                                    <p className="text-2xl font-bold">{rejectedCount}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Requests</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Request List */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white border border-zinc-200 rounded-sm p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-5 w-5 bg-zinc-100 rounded-full animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-zinc-100 rounded w-1/4 animate-pulse" />
                                    <div className="h-3 bg-zinc-100 rounded w-1/2 animate-pulse" />
                                </div>
                                <div className="h-6 w-20 bg-zinc-100 rounded-sm animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No PTO requests found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filtered.map((req) => {
                            const cfg = statusConfig[req.status] || statusConfig.pending;
                            const StatusIcon = cfg.icon;
                            return (
                                <Card key={req.id}>
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <StatusIcon className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-semibold">
                                                        {empMap.get(req.employee_id) || req.employee_id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(req.start_date)} – {formatDate(req.end_date)} · {req.days_requested} day{req.days_requested !== 1 ? "s" : ""}
                                                    </p>
                                                    {req.reason && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Reason: {req.reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={cfg.color} variant="secondary">
                                                    {cfg.label}
                                                </Badge>
                                                {req.status === "pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 border-green-300 hover:bg-green-50"
                                                            onClick={() => updateMutation.mutate({ id: req.id, status: "approved" })}
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                                            onClick={() => updateMutation.mutate({ id: req.id, status: "rejected" })}
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Create PTO Request Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Time Off</DialogTitle>
                        <DialogDescription>
                            Submit a PTO request for an employee
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select value={newPTO.employee_id} onValueChange={(v) => setNewPTO((p) => ({ ...p, employee_id: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={newPTO.start_date}
                                    onChange={(e) => setNewPTO((p) => ({ ...p, start_date: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={newPTO.end_date}
                                    onChange={(e) => setNewPTO((p) => ({ ...p, end_date: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={newPTO.reason}
                                onChange={(e) => setNewPTO((p) => ({ ...p, reason: e.target.value }))}
                                placeholder="Reason for time off..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createMutation.mutate(newPTO)}
                            disabled={!newPTO.employee_id || !newPTO.start_date || !newPTO.end_date || createMutation.isPending}
                        >
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
