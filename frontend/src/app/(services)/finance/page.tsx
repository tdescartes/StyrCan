"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    Wallet,
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
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@/types";

const categories = ["All", "Sales", "Consulting", "Office Supplies", "Software", "Utilities", "Payroll", "Marketing", "Travel", "Other"];
const types = ["All", "income", "expense"];

interface TransactionFormData {
    type: "income" | "expense";
    category: string;
    amount: string;
    description: string;
    transaction_date: string;
}

const initialFormData: TransactionFormData = {
    type: "expense",
    category: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split('T')[0],
};

export default function FinancesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch transactions
    const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
        queryKey: ["transactions", selectedType, selectedCategory, currentPage],
        queryFn: () => apiClient.getTransactions({
            skip: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage,
            type: selectedType !== "All" ? selectedType : undefined,
            category: selectedCategory !== "All" ? selectedCategory : undefined,
        }),
    });

    // Fetch financial summary
    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ["financial-summary"],
        queryFn: () => apiClient.getFinancialSummary(),
    });

    // Create transaction mutation
    const createTransactionMutation = useMutation({
        mutationFn: (data: TransactionFormData) => apiClient.createTransaction({
            type: data.type,
            category: data.category || undefined,
            amount: parseFloat(data.amount),
            description: data.description || undefined,
            transaction_date: data.transaction_date,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            setIsAddDialogOpen(false);
            setFormData(initialFormData);
            toast({
                title: "Transaction created",
                description: "The transaction has been recorded.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create transaction",
                variant: "destructive",
            });
        },
    });

    // Delete transaction mutation
    const deleteTransactionMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            toast({
                title: "Transaction deleted",
                description: "The transaction has been removed.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete transaction",
                variant: "destructive",
            });
        },
    });

    const transactions = transactionsData?.transactions || [];
    const totalTransactions = transactionsData?.total || 0;

    // Client-side search filter
    const filteredTransactions = searchQuery
        ? transactions.filter((t: Transaction) =>
            t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : transactions;

    const totalPages = Math.ceil(totalTransactions / itemsPerPage);

    // Calculate stats from summary
    const totalIncome = summaryData?.total_income || 0;
    const totalExpenses = summaryData?.total_expenses || 0;
    const netBalance = summaryData?.net_balance || 0;

    const financialStats = [
        {
            name: "Total Revenue",
            value: totalIncome,
            change: "+12.3%",
            trend: "up" as const,
            icon: DollarSign,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            name: "Total Expenses",
            value: totalExpenses,
            change: "+5.2%",
            trend: "up" as const,
            icon: CreditCard,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
        },
        {
            name: "Net Balance",
            value: netBalance,
            change: netBalance >= 0 ? "+15.1%" : "-8.3%",
            trend: netBalance >= 0 ? "up" as const : "down" as const,
            icon: Wallet,
            color: netBalance >= 0 ? "text-blue-500" : "text-red-500",
            bgColor: netBalance >= 0 ? "bg-blue-500/10" : "bg-red-500/10",
        },
    ];

    const handleFormChange = (field: keyof TransactionFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid amount greater than 0",
                variant: "destructive",
            });
            return;
        }
        createTransactionMutation.mutate(formData);
    };

    const handleExport = () => {
        if (transactions.length === 0) {
            toast({
                title: "No data to export",
                description: "There are no transactions to export.",
                variant: "destructive",
            });
            return;
        }

        const headers = ["Date", "Type", "Category", "Description", "Amount"];
        const rows = transactions.map((t: Transaction) => [
            t.transaction_date,
            t.type,
            t.category || "",
            t.description || "",
            t.type === "income" ? t.amount : -t.amount,
        ]);

        const csv = [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transactions.csv";
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Export complete",
            description: "Transactions have been exported to CSV.",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
                    <p className="text-muted-foreground">
                        Track your income, expenses, and cash flow
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
                                <Plus className="mr-2 h-4 w-4" />
                                Add Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Add New Transaction</DialogTitle>
                                    <DialogDescription>
                                        Record a new income or expense transaction.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type">Type *</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(value) => handleFormChange("type", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="income">Income</SelectItem>
                                                    <SelectItem value="expense">Expense</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => handleFormChange("category", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.filter(c => c !== "All").map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => handleFormChange("amount", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            placeholder="Enter description"
                                            value={formData.description}
                                            onChange={(e) => handleFormChange("description", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.transaction_date}
                                            onChange={(e) => handleFormChange("transaction_date", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createTransactionMutation.isPending}>
                                        {createTransactionMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Add Transaction
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {financialStats.map((stat) => (
                    <Card key={stat.name}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.name}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {summaryLoading ? (
                                <div className="h-8 flex items-center">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{formatCurrency(stat.value)}</div>
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        {stat.trend === "up" ? (
                                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                                        ) : (
                                            <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                                        )}
                                        <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                                            {stat.change}
                                        </span>
                                        <span className="ml-1">from last month</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Type: {selectedType === "All" ? "All" : selectedType}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {types.map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => {
                                                setSelectedType(type);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            {type === "All" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Category: {selectedCategory}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {categories.map((cat) => (
                                        <DropdownMenuItem
                                            key={cat}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            {cat}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest financial activity</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {transactionsLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <p className="text-muted-foreground">No transactions found</p>
                            <Button
                                variant="link"
                                className="mt-2"
                                onClick={() => setIsAddDialogOpen(true)}
                            >
                                Record your first transaction
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="py-3 px-4 text-left text-sm font-medium">Description</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Category</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium">Date</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Amount</th>
                                        <th className="py-3 px-4 text-right text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((transaction: Transaction) => (
                                        <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`p-2 rounded-lg ${transaction.type === "income"
                                                            ? "bg-green-500/10"
                                                            : "bg-red-500/10"
                                                            }`}
                                                    >
                                                        {transaction.type === "income" ? (
                                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{transaction.description || "No description"}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">
                                                            {transaction.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm">{transaction.category || "—"}</td>
                                            <td className="py-3 px-4 text-sm">
                                                {new Date(transaction.transaction_date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td
                                                className={`py-3 px-4 text-right font-medium ${transaction.type === "income" ? "text-green-500" : "text-red-500"
                                                    }`}
                                            >
                                                {transaction.type === "income" ? "+" : "-"}
                                                {formatCurrency(transaction.amount)}
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
                                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                if (confirm("Are you sure you want to delete this transaction?")) {
                                                                    deleteTransactionMutation.mutate(transaction.id);
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
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                {Math.min(currentPage * itemsPerPage, totalTransactions)} of{" "}
                                {totalTransactions} transactions
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
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
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
