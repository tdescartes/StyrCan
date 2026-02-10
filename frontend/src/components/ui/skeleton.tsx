import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-sm bg-zinc-100", className)}
            {...props}
        />
    );
}

// Table Skeleton for data tables
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
            {/* Header */}
            <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-3 flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            <div className="divide-y divide-zinc-100">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="px-6 py-4 flex gap-4 items-center">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="h-4 flex-1"
                                style={{ width: colIndex === 0 ? '30%' : 'auto' }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Card Skeleton for dashboard cards
export function CardSkeleton() {
    return (
        <div className="bg-white border border-zinc-200 rounded-sm shadow-sm p-6 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    );
}

// Stats Card Skeleton for KPI cards
export function StatsCardSkeleton() {
    return (
        <div className="bg-white border border-zinc-200 rounded-sm p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-sm" />
            </div>
        </div>
    );
}

// Activity List Skeleton
export function ActivityListSkeleton({ items = 4 }: { items?: number }) {
    return (
        <div className="divide-y divide-zinc-100">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Service Card Skeleton for homepage service cards
export function ServiceCardSkeleton() {
    return (
        <div className="bg-white p-6 border border-zinc-200 rounded-sm shadow-sm space-y-4">
            <Skeleton className="w-10 h-10 rounded-sm" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-sm" />
                <Skeleton className="h-7 w-20 rounded-sm" />
            </div>
        </div>
    );
}
