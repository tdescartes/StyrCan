"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Trash2,
    Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { Transaction } from "@/types";

const categoryOptions = [
    "Sales",
    "Consulting",
    "Office Supplies",
    "Software",
    "Utilities",
    "Payroll",
    "Marketing",
    "Travel",
    "Other",
];

export default function LedgerPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        type: "expense" as "income" | "expense",
        category: "",
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split("T")[0],
    });

    const limit = 25;

    const { data, isLoading } = useQuery({
        queryKey: ["ledger-transactions", typeFilter, categoryFilter, startDate, endDate, currentPage],
        queryFn: () =>
            apiClient.getTransactions({
                skip: (currentPage - 1) * limit,
                limit,
                type: typeFilter !== "all" ? typeFilter : undefined,
                category: categoryFilter !== "all" ? categoryFilter : undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            }),
    });

    const transactions: Transaction[] = data?.transactions ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const filtered = searchQuery
        ? transactions.filter(
            (t) =>
                t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : transactions;

    const createMutation = useMutation({
        mutationFn: () =>
            editingId
                ? apiClient.updateTransaction(editingId, {
                    type: form.type,
                    category: form.category || undefined,
                    amount: parseFloat(form.amount),
                    description: form.description || undefined,
                    transaction_date: form.transaction_date,
                })
                : apiClient.createTransaction({
                    type: form.type,
                    category: form.category || undefined,
                    amount: parseFloat(form.amount),
                    description: form.description || undefined,
                    transaction_date: form.transaction_date,
                }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ledger-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
            setIsDialogOpen(false);
            resetForm();
            toast.success(editingId ? "Transaction updated" : "Transaction created");
        },
        onError: (err: any) => toast.error(err.message || "Failed to save transaction"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ledger-transactions"] });
            toast.success("Transaction deleted");
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete"),
    });

    function resetForm() {
        setForm({
            type: "expense",
            category: "",
            amount: "",
            description: "",
            transaction_date: new Date().toISOString().split("T")[0],
        });
        setEditingId(null);
    }

    function openEdit(t: Transaction) {
        setForm({
            type: t.type,
            category: t.category || "",
            amount: String(t.amount),
            description: t.description || "",
            transaction_date: t.transaction_date.split("T")[0],
        });
        setEditingId(t.id);
        setIsDialogOpen(true);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
                    <p className="text-muted-foreground">
                        All transactions &middot; {total} total
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categoryOptions.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Start date"
                        />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="End date"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(t.transaction_date)}
                                        </TableCell>
                                        <TableCell>{t.description || "—"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{t.category || "Uncategorized"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {t.type === "income" ? (
                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    <ArrowUpRight className="mr-1 h-3 w-3" /> Income
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    <ArrowDownRight className="mr-1 h-3 w-3" /> Expense
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <span className={t.type === "income" ? "text-green-600" : "text-red-600"}>
                                                {t.type === "income" ? "+" : "-"}
                                                {formatCurrency(t.amount)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openEdit(t)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                                    onClick={() => deleteMutation.mutate(t.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Transaction" : "New Transaction"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Update the transaction details." : "Record a new income or expense."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense" })}
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
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={form.category}
                                onValueChange={(v) => setForm({ ...form, category: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={form.transaction_date}
                                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Transaction description..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createMutation.mutate()}
                            disabled={!form.amount || createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
