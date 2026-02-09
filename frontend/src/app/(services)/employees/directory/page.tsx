"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Search,
    Mail,
    Phone,
    Loader2,
    Building2,
    Briefcase,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import type { Employee } from "@/types";

const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    on_leave: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    terminated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function DirectoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");

    const { data, isLoading } = useQuery({
        queryKey: ["employees", "directory"],
        queryFn: () => apiClient.getEmployees({ limit: 100 }),
    });

    const employees: Employee[] = data?.employees ?? [];

    const filtered = employees.filter((emp) => {
        const matchesSearch =
            !searchQuery ||
            `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.position?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept =
            departmentFilter === "all" || emp.department === departmentFilter;

        return matchesSearch && matchesDept;
    });

    const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
                <p className="text-muted-foreground">Browse and search all team members</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or position..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept} value={dept!}>
                                {dept}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((emp) => (
                    <Card key={emp.id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                        {getInitials(`${emp.first_name} ${emp.last_name}`)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold truncate">
                                            {emp.first_name} {emp.last_name}
                                        </h3>
                                        <Badge className={statusColors[emp.status] || ""} variant="secondary">
                                            {emp.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                    {emp.position && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                            <Briefcase className="h-3 w-3" />
                                            <span className="truncate">{emp.position}</span>
                                        </div>
                                    )}
                                    {emp.department && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Building2 className="h-3 w-3" />
                                            <span>{emp.department}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                                        <a href={`mailto:${emp.email}`} className="flex items-center gap-1 hover:text-primary">
                                            <Mail className="h-3 w-3" />
                                            <span className="truncate">{emp.email}</span>
                                        </a>
                                    </div>
                                    {emp.phone && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                            <Phone className="h-3 w-3" />
                                            <span>{emp.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No employees found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
