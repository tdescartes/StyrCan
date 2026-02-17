"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
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
import { apiClient } from "@/lib/api/client";
import type { MyScheduleResponse } from "@/types";

function getWeekRange(offset: number) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    };
}

export function MyScheduleView() {
    const [weekOffset, setWeekOffset] = useState(0);
    const week = getWeekRange(weekOffset);

    const { data, isLoading, error } = useQuery<MyScheduleResponse>({
        queryKey: ["my-schedule", week.start_date, week.end_date],
        queryFn: () => apiClient.getMySchedule({ start_date: week.start_date, end_date: week.end_date }),
    });

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-zinc-300" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-zinc-700">Schedule Not Available</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                        Your employee record hasn&apos;t been linked yet. Contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    const shifts = data?.shifts ?? [];

    // Group shifts by day
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekStart = new Date(week.start_date + "T00:00:00");
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        return {
            date: dateStr,
            label: dayNames[d.getDay()],
            dayNum: d.getDate(),
            isToday: dateStr === new Date().toISOString().split("T")[0],
            shifts: shifts.filter((s) => s.shift_date === dateStr),
        };
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
                <p className="text-sm text-zinc-500">Your weekly shift schedule</p>
            </div>

            {/* Week navigation */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                <span className="text-sm font-semibold">{week.label}</span>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {days.map((day) => (
                        <Card
                            key={day.date}
                            className={`min-h-[140px] ${day.isToday ? "ring-2 ring-black" : ""}`}
                        >
                            <CardHeader className="p-3 pb-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-500 uppercase">
                                        {day.label}
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${day.isToday ? "bg-black text-white rounded-full w-6 h-6 flex items-center justify-center" : "text-zinc-700"}`}
                                    >
                                        {day.dayNum}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                {day.shifts.length === 0 ? (
                                    <p className="text-xs text-zinc-400 text-center pt-4">Off</p>
                                ) : (
                                    <div className="space-y-2">
                                        {day.shifts.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className="p-2 rounded bg-zinc-50 border border-zinc-100"
                                            >
                                                <p className="text-xs font-semibold">
                                                    {shift.start_time} — {shift.end_time}
                                                </p>
                                                {shift.notes && (
                                                    <Badge variant="outline" className="text-[10px] mt-1">
                                                        {shift.notes}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Week Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-2xl font-bold">{shifts.length}</p>
                            <p className="text-xs text-zinc-500">Total shifts</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {7 - days.filter((d) => d.shifts.length > 0).length}
                            </p>
                            <p className="text-xs text-zinc-500">Days off</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
