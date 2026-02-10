"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Loader2,
    Tags,
    Pencil,
    Trash2,
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { ExpenseCategory } from "@/types";

interface CategoryForm {
    name: string;
    description: string;
    budget_limit: string;
}

const emptyForm: CategoryForm = { name: "", description: "", budget_limit: "" };

export default function CategoriesPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CategoryForm>(emptyForm);

    const { data, isLoading } = useQuery({
        queryKey: ["expense-categories"],
        queryFn: () => apiClient.getExpenseCategories(),
    });

    const categories: ExpenseCategory[] = data?.categories ?? [];

    const saveMutation = useMutation({
        mutationFn: () => {
            const payload = {
                name: form.name,
                description: form.description || undefined,
                budget_limit: form.budget_limit ? parseFloat(form.budget_limit) : undefined,
            };
            return editingId
                ? apiClient.updateExpenseCategory(editingId, payload)
                : apiClient.createExpenseCategory(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
            setIsDialogOpen(false);
            resetForm();
            toast.success(editingId ? "Category updated" : "Category created");
        },
        onError: (err: any) => toast.error(err.message || "Failed to save category"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteExpenseCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
            toast.success("Category deleted");
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete category"),
    });

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
    }

    function openEdit(cat: ExpenseCategory) {
        setForm({
            name: cat.name,
            description: cat.description || "",
            budget_limit: cat.budget_limit ? String(cat.budget_limit) : "",
        });
        setEditingId(cat.id);
        setIsDialogOpen(true);
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
                    <p className="text-muted-foreground">
                        Manage categories and budget limits
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </div>

            {categories.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-semibold mb-1">No categories yet</p>
                        <p className="text-sm text-muted-foreground">
                            Create expense categories to organize your transactions and set
                            budget limits.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <Card key={cat.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{cat.name}</CardTitle>
                                        {cat.description && (
                                            <CardDescription className="mt-1">
                                                {cat.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEdit(cat)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                            onClick={() => deleteMutation.mutate(cat.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {cat.budget_limit && cat.budget_limit > 0 ? (
                                    <Badge variant="secondary">
                                        Budget: {formatCurrency(cat.budget_limit)}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">No budget set</Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Edit Category" : "New Category"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Update the category details."
                                : "Create a new expense category with an optional budget limit."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Office Supplies"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Optional description..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Budget Limit (optional)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.budget_limit}
                                onChange={(e) => setForm({ ...form, budget_limit: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => saveMutation.mutate()}
                            disabled={!form.name.trim() || saveMutation.isPending}
                        >
                            {saveMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
