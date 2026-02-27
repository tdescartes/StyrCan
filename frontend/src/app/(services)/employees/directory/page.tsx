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
    Plus,
    Filter,
    MoreHorizontal,
    Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { TableSkeleton } from "@/components/ui/skeleton";
import type { Employee } from "@/types";

const statusVariants: Record<string, "success" | "warning" | "default" | "error"> = {
    active: "success",
    on_leave: "warning",
    inactive: "default",
    terminated: "error",
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Directory</h1>
                    <p className="text-zinc-500 text-sm mt-1">Browse and manage all team members</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => apiClient.exportEmployees("csv").then(() => {}).catch(() => {})}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="secondary" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors" />
                    <Input
                        placeholder="Search by name, email, or position..."
                        className="pl-9 bg-zinc-50 border-zinc-200 focus:bg-white"
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

            {/* Employee Table */}
            {isLoading ? (
                <TableSkeleton rows={8} columns={6} />
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    <p>No employees found matching your criteria.</p>
                </div>
            ) : (
                <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider font-bold text-zinc-500">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Position</th>
                                <th className="px-6 py-3">Department</th>
                                <th className="px-6 py-3">Contact</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filtered.map((emp) => (
                                <tr key={emp.id} className="hover:bg-zinc-50 group transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                                                {getInitials(`${emp.first_name} ${emp.last_name}`)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-zinc-900">
                                                    {emp.first_name} {emp.last_name}
                                                </div>
                                                <div className="text-xs text-zinc-500">{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-zinc-600">
                                        {emp.position || "—"}
                                    </td>
                                    <td className="px-6 py-3 text-zinc-600">
                                        {emp.department || "—"}
                                    </td>
                                    <td className="px-6 py-3 text-zinc-500 text-xs">
                                        {emp.phone || "—"}
                                    </td>
                                    <td className="px-6 py-3">
                                        <Badge variant={statusVariants[emp.status] || "default"}>
                                            {emp.status.replace("_", " ")}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button className="text-zinc-400 hover:text-black transition-colors" title="More options">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
