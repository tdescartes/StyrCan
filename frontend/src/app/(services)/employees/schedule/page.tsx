"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    Clock,
    Pencil,
    Trash2,
    MoreHorizontal,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { Employee, Shift } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleAccess } from "@/hooks/use-role-access";
import { MyScheduleView } from "@/components/employee/my-schedule";

const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    missed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

function getWeekDates(weekOffset: number) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Monday
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function formatDate(d: Date) {
    return d.toISOString().split("T")[0];
}

export default function SchedulePage() {
    const { isEmployee } = useRoleAccess();

    // Employee role sees personal schedule view
    if (isEmployee) {
        return <MyScheduleView />;
    }

    const queryClient = useQueryClient();
    const [weekOffset, setWeekOffset] = useState(0);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [shiftDate, setShiftDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [notes, setNotes] = useState("");

    const weekDates = getWeekDates(weekOffset);
    const weekStart = formatDate(weekDates[0]);
    const weekEnd = formatDate(weekDates[6]);

    const { data: employeesData } = useQuery({
        queryKey: ["employees", "all"],
        queryFn: () => apiClient.getEmployees({ limit: 100 }),
    });

    const { data: shiftsData, isLoading } = useQuery({
        queryKey: ["shifts", weekStart, weekEnd],
        queryFn: () => apiClient.getShifts({ start_date: weekStart, end_date: weekEnd }),
    });

    const employees: Employee[] = employeesData?.employees ?? [];
    const shifts: Shift[] = (shiftsData as any)?.shifts ?? [];

    const createShiftMutation = useMutation({
        mutationFn: (data: any) => apiClient.createShift(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shifts"] });
            setAddOpen(false);
            setSelectedEmployeeId("");
            setShiftDate("");
            setNotes("");
            toast.success("Shift created");
        },
        onError: (err: any) => toast.error(err.message || "Failed to create shift"),
    });

    const updateShiftMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateShift(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shifts"] });
            setEditOpen(false);
            setEditingShift(null);
            toast.success("Shift updated");
        },
        onError: (err: any) => toast.error(err.message || "Failed to update shift"),
    });

    const deleteShiftMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteShift(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shifts"] });
            toast.success("Shift deleted");
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete shift"),
    });

    const handleCreateShift = () => {
        if (!selectedEmployeeId || !shiftDate) return;
        createShiftMutation.mutate({
            employee_id: selectedEmployeeId,
            shift_date: shiftDate,
            start_time: `${shiftDate}T${startTime}:00`,
            end_time: `${shiftDate}T${endTime}:00`,
            notes: notes || undefined,
        });
    };

    const handleEditShift = (shift: Shift) => {
        setEditingShift(shift);
        setSelectedEmployeeId(shift.employee_id);
        setShiftDate(shift.shift_date);
        setStartTime(new Date(shift.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
        setEndTime(new Date(shift.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
        setNotes(shift.notes || "");
        setEditOpen(true);
    };

    const handleUpdateShift = () => {
        if (!editingShift || !shiftDate) return;
        updateShiftMutation.mutate({
            id: editingShift.id,
            data: {
                employee_id: selectedEmployeeId,
                shift_date: shiftDate,
                start_time: `${shiftDate}T${startTime}:00`,
                end_time: `${shiftDate}T${endTime}:00`,
                notes: notes || undefined,
            },
        });
    };

    // Group shifts by date
    const shiftsByDate = new Map<string, Shift[]>();
    for (const shift of shifts) {
        const d = shift.shift_date;
        if (!shiftsByDate.has(d)) shiftsByDate.set(d, []);
        shiftsByDate.get(d)!.push(shift);
    }

    // Map employee IDs to names
    const empMap = new Map(employees.map((e) => [e.id, `${e.first_name} ${e.last_name}`]));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                    <p className="text-muted-foreground">Manage employee shifts and schedules</p>
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Shift
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Shift</DialogTitle>
                            <DialogDescription>Schedule a new shift for an employee</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Employee</Label>
                                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
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
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes (optional)</Label>
                                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shift notes..." />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleCreateShift} disabled={!selectedEmployeeId || !shiftDate || createShiftMutation.isPending}>
                                    {createShiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Shift
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Week Navigator */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                    {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                    {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Weekly Calendar Grid */}
            {isLoading ? (
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Card key={i} className="min-h-[160px]">
                            <CardHeader className="p-3 pb-1 space-y-2">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-8 w-8" />
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-1">
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((date) => {
                        const key = formatDate(date);
                        const dayShifts = shiftsByDate.get(key) || [];
                        const isToday = key === formatDate(new Date());
                        return (
                            <Card key={key} className={cn("min-h-[160px]", isToday && "border-primary")}>
                                <CardHeader className="p-3 pb-1">
                                    <p className={cn("text-sm font-medium", isToday && "text-primary")}>
                                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                                    </p>
                                    <p className={cn("text-xl font-bold", isToday && "text-primary")}>
                                        {date.getDate()}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-3 pt-0 space-y-1">
                                    {dayShifts.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No shifts</p>
                                    ) : (
                                        dayShifts.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className="rounded bg-accent p-1.5 text-xs space-y-0.5 group relative"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <p className="font-medium truncate flex-1">
                                                        {empMap.get(shift.employee_id) || shift.employee_id.slice(0, 8)}
                                                    </p>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/50">
                                                                <MoreHorizontal className="h-3 w-3" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditShift(shift)}>
                                                                <Pencil className="mr-2 h-3 w-3" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    if (confirm("Delete this shift?")) {
                                                                        deleteShiftMutation.mutate(shift.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-3 w-3" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {new Date(shift.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {" – "}
                                                        {new Date(shift.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                                <Badge className={cn("text-[10px] px-1 py-0", statusColors[shift.status] || "")} variant="secondary">
                                                    {shift.status}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Edit Shift Dialog */}
            <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingShift(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Shift</DialogTitle>
                        <DialogDescription>Update shift details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
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
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shift notes..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateShift} disabled={!selectedEmployeeId || !shiftDate || updateShiftMutation.isPending}>
                            {updateShiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
