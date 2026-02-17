"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Calendar,
    Clock,
    DollarSign,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Building2,
    CalendarDays,
    Loader2,
    AlertCircle,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import { getInitials } from "@/lib/utils";
import type { MyProfileResponse } from "@/types";

export function MyEmployeeProfile() {
    const { data, isLoading, error } = useQuery<MyProfileResponse>({
        queryKey: ["my-profile"],
        queryFn: () => apiClient.getMyProfile(),
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
                    <h3 className="text-lg font-semibold text-zinc-700">Profile Not Available</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Your employee record hasn&apos;t been linked yet. Contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    const employee = data?.employee;
    const ptoBalance = data?.pto_balance;
    const upcomingShifts = data?.upcoming_shifts ?? [];
    const pendingPTO = data?.pending_pto_requests ?? [];

    if (!employee) return null;

    const fullName = `${employee.first_name} ${employee.last_name}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="text-sm text-zinc-500">Your employee information and quick overview</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-black text-white text-xl font-bold">
                                {getInitials(fullName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h2 className="text-xl font-bold">{fullName}</h2>
                                <p className="text-zinc-500">{employee.position}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    {employee.email}
                                </span>
                                {employee.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-4 w-4" />
                                        {employee.phone}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4" />
                                    {employee.department}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4" />
                                    Hired {new Date(employee.hire_date).toLocaleDateString()}
                                </span>
                            </div>
                            <Badge
                                variant={employee.status === "active" ? "default" : "secondary"}
                                className={employee.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                            >
                                {employee.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">PTO Available</CardTitle>
                        <Clock className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ptoBalance ? `${ptoBalance.available_days}` : "—"}
                        </div>
                        <p className="text-xs text-zinc-500">
                            {ptoBalance ? `${ptoBalance.used_days} used of ${ptoBalance.total_days} total` : "No balance set"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
                        <Calendar className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingShifts.length}</div>
                        <p className="text-xs text-zinc-500">In the next 14 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Briefcase className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPTO.length}</div>
                        <p className="text-xs text-zinc-500">PTO requests awaiting approval</p>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Shifts */}
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Shifts</CardTitle>
                    <CardDescription>Your next scheduled shifts</CardDescription>
                </CardHeader>
                <CardContent>
                    {upcomingShifts.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8">No upcoming shifts scheduled.</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingShifts.map((shift) => (
                                <div
                                    key={shift.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-zinc-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-zinc-500" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {new Date(shift.shift_date).toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {shift.start_time} — {shift.end_time}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{shift.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pending PTO Requests */}
            {pendingPTO.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending PTO Requests</CardTitle>
                        <CardDescription>Awaiting manager approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingPTO.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-yellow-100 bg-yellow-50"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {new Date(req.start_date).toLocaleDateString()} — {new Date(req.end_date).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-zinc-500">{req.reason}</p>
                                    </div>
                                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                        Pending
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
