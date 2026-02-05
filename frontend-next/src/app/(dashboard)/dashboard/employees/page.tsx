"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Phone,
    Calendar,
    Download,
    UserPlus,
    ChevronLeft,
    ChevronRight,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn, getInitials } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@/types";

const departments = ["All", "Engineering", "Product", "Design", "Sales", "HR", "Finance", "Marketing", "Operations"];
const statuses = ["All", "active", "on_leave", "inactive", "terminated"];

interface EmployeeFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    hire_date: string;
    employment_type: string;
    salary_amount: string;
}

const initialFormData: EmployeeFormData = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    hire_date: "",
    employment_type: "full-time",
    salary_amount: "",
};

export default function EmployeesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
    const itemsPerPage = 10;

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch employees from API
    const { data: employeesData, isLoading, error } = useQuery<{ employees: Employee[]; total: number }>({
        queryKey: ["employees", selectedDepartment, selectedStatus, currentPage],
        queryFn: () => apiClient.getEmployees({
            skip: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage,
            status: selectedStatus !== "All" ? selectedStatus : undefined,
        }),
    });

    // Create employee mutation
    const createEmployeeMutation = useMutation({
        mutationFn: (data: typeof formData) => apiClient.createEmployee({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || undefined,
            department: data.department || undefined,
            position: data.position || undefined,
            hire_date: data.hire_date,
            employment_type: data.employment_type as "full-time" | "part-time" | "contract",
            salary_amount: data.salary_amount ? parseFloat(data.salary_amount) : undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            setIsAddDialogOpen(false);
            setFormData(initialFormData);
            toast({
                title: "Employee created",
                description: "The employee has been successfully added.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create employee",
                variant: "destructive",
            });
        },
    });

    // Delete employee mutation
    const deleteEmployeeMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast({
                title: "Employee deleted",
                description: "The employee has been removed.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete employee",
                variant: "destructive",
            });
        },
    });

    // Extract employees and total from response
    const employees: Employee[] = employeesData?.employees || [];
    const totalEmployees = employeesData?.total || 0;

    // Client-side search filter (for immediate feedback)
    const filteredEmployees = searchQuery
        ? employees.filter((employee) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchLower) ||
                employee.email.toLowerCase().includes(searchLower) ||
                (employee.position && employee.position.toLowerCase().includes(searchLower))
            );
        })
        : employees;

    // Pagination (server-side, but we'll use total from API)
    const totalPages = Math.ceil(totalEmployees / itemsPerPage);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>;
            case "on_leave":
                return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">On Leave</Badge>;
            case "inactive":
                return <Badge className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">Inactive</Badge>;
            case "terminated":
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Terminated</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleFormChange = (field: keyof EmployeeFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createEmployeeMutation.mutate(formData);
    };

    const handleExport = () => {
        if (employees.length === 0) {
            toast({
                title: "No data to export",
                description: "There are no employees to export.",
                variant: "destructive",
            });
            return;
        }

        const headers = ["Name", "Email", "Department", "Position", "Status", "Hire Date"];
        const rows = employees.map(emp => [
            `${emp.first_name} ${emp.last_name}`,
            emp.email,
            emp.department || "",
            emp.position || "",
            emp.status,
            emp.hire_date,
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "employees.csv";
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Export complete",
            description: "Employee data has been exported to CSV.",
        });
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-destructive">Error loading employees</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                {error instanceof Error ? error.message : "An unexpected error occurred"}
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => queryClient.invalidateQueries({ queryKey: ["employees"] })}
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">
                        Manage your team members and their information
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Employee
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Add New Employee</DialogTitle>
                                    <DialogDescription>
                                        Enter the employee's information below.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                value={formData.first_name}
                                                onChange={(e) => handleFormChange("first_name", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                value={formData.last_name}
                                                onChange={(e) => handleFormChange("last_name", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john.doe@example.com"
                                            value={formData.email}
                                            onChange={(e) => handleFormChange("email", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                            <Select
                                                value={formData.department}
                                                onValueChange={(value) => handleFormChange("department", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.filter(d => d !== "All").map((dept) => (
                                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="position">Position</Label>
                                            <Input
                                                id="position"
                                                placeholder="Software Engineer"
                                                value={formData.position}
                                                onChange={(e) => handleFormChange("position", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+1 (555) 000-0000"
                                                value={formData.phone}
                                                onChange={(e) => handleFormChange("phone", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hireDate">Hire Date *</Label>
                                            <Input
                                                id="hireDate"
                                                type="date"
                                                value={formData.hire_date}
                                                onChange={(e) => handleFormChange("hire_date", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="employmentType">Employment Type</Label>
                                            <Select
                                                value={formData.employment_type}
                                                onValueChange={(value) => handleFormChange("employment_type", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="full-time">Full Time</SelectItem>
                                                    <SelectItem value="part-time">Part Time</SelectItem>
                                                    <SelectItem value="contract">Contract</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="salary">Salary</Label>
                                            <Input
                                                id="salary"
                                                type="number"
                                                placeholder="50000"
                                                value={formData.salary_amount}
                                                onChange={(e) => handleFormChange("salary_amount", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createEmployeeMutation.isPending}
                                    >
                                        {createEmployeeMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Add Employee
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Department: {selectedDepartment}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {departments.map((dept) => (
                                        <DropdownMenuItem
                                            key={dept}
                                            onClick={() => {
                                                setSelectedDepartment(dept);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            {dept}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Status: {selectedStatus === "All" ? "All" : selectedStatus.replace("_", " ")}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {statuses.map((status) => (
                                        <DropdownMenuItem
                                            key={status}
                                            onClick={() => {
                                                setSelectedStatus(status);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            {status === "All" ? "All" : status.replace("_", " ")}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Employee List */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <p className="text-muted-foreground">No employees found</p>
                            <Button
                                variant="link"
                                className="mt-2"
                                onClick={() => setIsAddDialogOpen(true)}
                            >
                                Add your first employee
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="py-3 px-4 text-left text-sm font-medium">Employee</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Department</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Position</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium">Hire Date</th>
                                            <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map((employee) => (
                                            <tr key={employee.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>
                                                                {getInitials(`${employee.first_name} ${employee.last_name}`)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">
                                                                {employee.first_name} {employee.last_name}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm">{employee.department || "—"}</td>
                                                <td className="py-3 px-4 text-sm">{employee.position || "—"}</td>
                                                <td className="py-3 px-4">{getStatusBadge(employee.status)}</td>
                                                <td className="py-3 px-4 text-sm">
                                                    {new Date(employee.hire_date).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </td>
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
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/employees/${employee.id}`}>
                                                                    View Profile
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/employees/${employee.id}/edit`}>
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Mail className="mr-2 h-4 w-4" />
                                                                Send Email
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to delete this employee?")) {
                                                                        deleteEmployeeMutation.mutate(employee.id);
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t px-4 py-3">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                        {Math.min(currentPage * itemsPerPage, totalEmployees)} of{" "}
                                        {totalEmployees} employees
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
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
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
