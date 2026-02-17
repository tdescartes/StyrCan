"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Loader2,
    Plus,
    UserPlus,
    Mail,
    Shield,
    MoreHorizontal,
    Trash2,
    Pencil,
    Users,
    Search,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const roleLabels: Record<string, string> = {
    employee: "Employee",
    manager: "Manager",
    company_admin: "Admin",
    super_admin: "Super Admin",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    employee: "secondary",
    manager: "outline",
    company_admin: "default",
    super_admin: "destructive",
};

export default function TeamPage() {
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteFirstName, setInviteFirstName] = useState("");
    const [inviteLastName, setInviteLastName] = useState("");
    const [inviteRole, setInviteRole] = useState("employee");

    // Edit form state
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("");
    const [editIsActive, setEditIsActive] = useState(true);

    const { data: usersData, isLoading } = useQuery({
        queryKey: ["company-users"],
        queryFn: () => apiClient.getCompanyUsers(),
    });

    const inviteMutation = useMutation({
        mutationFn: (data: { email: string; first_name: string; last_name: string; role: string }) =>
            apiClient.inviteUser(data),
        onSuccess: () => {
            toast.success("User invited successfully");
            queryClient.invalidateQueries({ queryKey: ["company-users"] });
            setShowInviteDialog(false);
            resetInviteForm();
        },
        onError: (err: any) => toast.error(err.message || "Failed to invite user"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateUser(id, data),
        onSuccess: () => {
            toast.success("User updated successfully");
            queryClient.invalidateQueries({ queryKey: ["company-users"] });
            setShowEditDialog(false);
            setSelectedUser(null);
        },
        onError: (err: any) => toast.error(err.message || "Failed to update user"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteUser(id),
        onSuccess: () => {
            toast.success("User removed successfully");
            queryClient.invalidateQueries({ queryKey: ["company-users"] });
            setShowDeleteDialog(false);
            setSelectedUser(null);
        },
        onError: (err: any) => toast.error(err.message || "Failed to remove user"),
    });

    const resetInviteForm = () => {
        setInviteEmail("");
        setInviteFirstName("");
        setInviteLastName("");
        setInviteRole("employee");
    };

    const handleInvite = () => {
        if (!inviteEmail || !inviteFirstName || !inviteLastName) {
            toast.error("Please fill in all required fields");
            return;
        }
        inviteMutation.mutate({
            email: inviteEmail,
            first_name: inviteFirstName,
            last_name: inviteLastName,
            role: inviteRole,
        });
    };

    const handleEditOpen = (user: any) => {
        setSelectedUser(user);
        setEditFirstName(user.first_name || "");
        setEditLastName(user.last_name || "");
        setEditEmail(user.email || "");
        setEditRole(user.role || "employee");
        setEditIsActive(user.is_active !== false);
        setShowEditDialog(true);
    };

    const handleEditSave = () => {
        if (!selectedUser) return;
        updateMutation.mutate({
            id: selectedUser.id,
            data: {
                first_name: editFirstName,
                last_name: editLastName,
                email: editEmail,
                role: editRole,
                is_active: editIsActive,
            },
        });
    };

    const users = usersData?.users || [];
    const filteredUsers = users.filter(
        (u: any) =>
            u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground">
                        Invite, manage roles, and remove users from your organization
                    </p>
                </div>
                <Button onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{users.length}</p>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter((u: any) => u.is_active !== false).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Active Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter((u: any) => u.role === "company_admin" || u.role === "super_admin").length}
                                </p>
                                <p className="text-sm text-muted-foreground">Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* User List */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} in your organization
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map((u: any) => (
                                <div key={u.id} className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-bold">
                                            {u.first_name?.[0]}
                                            {u.last_name?.[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {u.first_name} {u.last_name}
                                                </p>
                                                {u.id === currentUser?.id && (
                                                    <Badge variant="outline" className="text-xs">
                                                        You
                                                    </Badge>
                                                )}
                                                {u.is_active === false && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {u.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={roleBadgeVariant[u.role] || "secondary"}>
                                            {roleLabels[u.role] || u.role}
                                        </Badge>
                                        {u.id !== currentUser?.id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditOpen(u)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Invite Dialog */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                            Send an invitation to add a new user to your organization
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invite-first">First Name *</Label>
                                <Input
                                    id="invite-first"
                                    value={inviteFirstName}
                                    onChange={(e) => setInviteFirstName(e.target.value)}
                                    placeholder="Jane"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-last">Last Name *</Label>
                                <Input
                                    id="invite-last"
                                    value={inviteLastName}
                                    onChange={(e) => setInviteLastName(e.target.value)}
                                    placeholder="Smith"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">Email *</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="jane@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invite-role">Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">Employee</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="company_admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                            {inviteMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user details and permissions
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={editFirstName}
                                    onChange={(e) => setEditFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={editLastName}
                                    onChange={(e) => setEditLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">Employee</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="company_admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-3">
                            <Label>Status</Label>
                            <Select
                                value={editIsActive ? "active" : "inactive"}
                                onValueChange={(v) => setEditIsActive(v === "active")}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditSave} disabled={updateMutation.isPending}>
                            {updateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            <strong>
                                {selectedUser?.first_name} {selectedUser?.last_name}
                            </strong>{" "}
                            from the organization? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
