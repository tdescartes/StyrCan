"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    Clock,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import type { MyPTOResponse } from "@/types";

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    denied: "bg-red-100 text-red-800 border-red-300",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-300",
};

const statusIcons: Record<string, typeof Clock> = {
    pending: Clock,
    approved: CheckCircle2,
    denied: XCircle,
    cancelled: XCircle,
};

export function MyPTOView() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<MyPTOResponse>({
        queryKey: ["my-pto"],
        queryFn: () => apiClient.getMyPTO(),
    });

    const createRequest = useMutation({
        mutationFn: (data: { start_date: string; end_date: string; reason: string }) =>
            apiClient.createMyPTORequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-pto"] });
            queryClient.invalidateQueries({ queryKey: ["my-profile"] });
            setIsDialogOpen(false);
            setStartDate("");
            setEndDate("");
            setReason("");
            toast({
                title: "PTO Request Submitted",
                description: "Your request has been sent for approval.",
            });
        },
        onError: (err: any) => {
            toast({
                title: "Error",
                description: err.message || "Failed to submit request.",
                variant: "destructive",
            });
        },
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
                    <h3 className="text-lg font-semibold text-zinc-700">PTO Not Available</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Your employee record hasn&apos;t been linked yet. Contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    const balance = data?.balance;
    const requests = data?.requests ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Time Off</h1>
                    <p className="text-sm text-zinc-500">Your PTO balance and request history</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Request Time Off
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Time Off</DialogTitle>
                            <DialogDescription>
                                Submit a PTO request for your manager to review.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start">Start Date</Label>
                                    <Input
                                        id="start"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end">End Date</Label>
                                    <Input
                                        id="end"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason</Label>
                                <Input
                                    id="reason"
                                    placeholder="e.g., Family vacation, Medical appointment"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() =>
                                    createRequest.mutate({
                                        start_date: startDate,
                                        end_date: endDate,
                                        reason,
                                    })
                                }
                                disabled={!startDate || !endDate || !reason || createRequest.isPending}
                            >
                                {createRequest.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : null}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <Calendar className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">
                            {balance?.available_days ?? "—"}
                        </div>
                        <p className="text-xs text-zinc-500">days remaining</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Used</CardTitle>
                        <Clock className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{balance?.used_days ?? "—"}</div>
                        <p className="text-xs text-zinc-500">days used this year</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Allowance</CardTitle>
                        <Calendar className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{balance?.total_days ?? "—"}</div>
                        <p className="text-xs text-zinc-500">days per year</p>
                    </CardContent>
                </Card>
            </div>

            {/* Request History */}
            <Card>
                <CardHeader>
                    <CardTitle>Request History</CardTitle>
                    <CardDescription>{data?.total_requests ?? 0} total requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8">
                            No PTO requests yet. Click &quot;Request Time Off&quot; to get started.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => {
                                const StatusIcon = statusIcons[req.status] ?? Clock;
                                return (
                                    <div
                                        key={req.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-zinc-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <StatusIcon className="h-5 w-5 text-zinc-400" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {new Date(req.start_date).toLocaleDateString()} — {new Date(req.end_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-zinc-500">{req.reason}</p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={statusColors[req.status] ?? ""}
                                        >
                                            {req.status}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
