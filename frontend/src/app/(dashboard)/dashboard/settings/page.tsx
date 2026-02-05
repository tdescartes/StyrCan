"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    User,
    Building2,
    Bell,
    Shield,
    Palette,
    CreditCard,
    Loader2,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const profileSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
});

const companySchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type ProfileFormData = z.infer<typeof profileSchema>;
type CompanyFormData = z.infer<typeof companySchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "billing", label: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("profile");
    const [isLoading, setIsLoading] = useState(false);

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: user?.full_name || "",
            email: user?.email || "",
        },
    });

    const {
        register: registerCompany,
        handleSubmit: handleCompanySubmit,
        formState: { errors: companyErrors },
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: user?.company?.name || "",
        },
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors },
        reset: resetPassword,
    } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    const onProfileSubmit = async (data: ProfileFormData) => {
        setIsLoading(true);
        try {
            // API call would go here
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const onCompanySubmit = async (data: CompanyFormData) => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Company settings updated successfully");
        } catch (error) {
            toast.error("Failed to update company settings");
        } finally {
            setIsLoading(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Password changed successfully");
            resetPassword();
        } catch (error) {
            toast.error("Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Sidebar */}
                <nav className="flex lg:flex-col gap-2 lg:w-48 overflow-x-auto pb-2 lg:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Settings</CardTitle>
                                <CardDescription>
                                    Update your personal information
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                                    {/* Avatar */}
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={user?.avatar} />
                                            <AvatarFallback className="text-lg">
                                                {user?.full_name ? getInitials(user.full_name) : "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <Button type="button" variant="outline" size="sm">
                                                Change Avatar
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                JPG, PNG or GIF. Max size 2MB.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Full Name</Label>
                                            <Input id="full_name" {...registerProfile("full_name")} />
                                            {profileErrors.full_name && (
                                                <p className="text-sm text-destructive">
                                                    {profileErrors.full_name.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" {...registerProfile("email")} />
                                            {profileErrors.email && (
                                                <p className="text-sm text-destructive">
                                                    {profileErrors.email.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" {...registerProfile("phone")} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Company Tab */}
                    {activeTab === "company" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Company Settings</CardTitle>
                                <CardDescription>
                                    Manage your company information
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name">Company Name</Label>
                                            <Input id="company_name" {...registerCompany("name")} />
                                            {companyErrors.name && (
                                                <p className="text-sm text-destructive">
                                                    {companyErrors.name.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company_phone">Phone</Label>
                                            <Input id="company_phone" {...registerCompany("phone")} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="company_address">Address</Label>
                                            <Input id="company_address" {...registerCompany("address")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company_website">Website</Label>
                                            <Input
                                                id="company_website"
                                                placeholder="https://example.com"
                                                {...registerCompany("website")}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Configure how you receive notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    {[
                                        { id: "email_payroll", label: "Payroll notifications", description: "Receive email when payroll is processed" },
                                        { id: "email_employee", label: "Employee updates", description: "New hires, terminations, and status changes" },
                                        { id: "email_financial", label: "Financial alerts", description: "Large transactions and budget updates" },
                                        { id: "email_system", label: "System notifications", description: "Updates, maintenance, and security alerts" },
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                defaultChecked
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end">
                                    <Button>Save Preferences</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security Tab */}
                    {activeTab === "security" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>
                                        Update your password to keep your account secure
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <Input
                                                id="currentPassword"
                                                type="password"
                                                {...registerPassword("currentPassword")}
                                            />
                                            {passwordErrors.currentPassword && (
                                                <p className="text-sm text-destructive">
                                                    {passwordErrors.currentPassword.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                {...registerPassword("newPassword")}
                                            />
                                            {passwordErrors.newPassword && (
                                                <p className="text-sm text-destructive">
                                                    {passwordErrors.newPassword.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                {...registerPassword("confirmPassword")}
                                            />
                                            {passwordErrors.confirmPassword && (
                                                <p className="text-sm text-destructive">
                                                    {passwordErrors.confirmPassword.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={isLoading}>
                                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Change Password
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Two-Factor Authentication</CardTitle>
                                    <CardDescription>
                                        Add an extra layer of security to your account
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Status</p>
                                            <p className="text-sm text-muted-foreground">
                                                Two-factor authentication is not enabled
                                            </p>
                                        </div>
                                        <Button variant="outline">Enable 2FA</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === "appearance" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>
                                    Customize the look and feel of your dashboard
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-base">Theme</Label>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Select your preferred theme
                                        </p>
                                        <div className="grid grid-cols-3 gap-4">
                                            {["light", "dark", "system"].map((theme) => (
                                                <button
                                                    key={theme}
                                                    className="rounded-lg border-2 p-4 text-center hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <Palette className="h-6 w-6 mx-auto mb-2" />
                                                    <span className="text-sm font-medium capitalize">{theme}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Billing Tab */}
                    {activeTab === "billing" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Plan</CardTitle>
                                    <CardDescription>
                                        Manage your subscription and billing
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-lg">Professional Plan</p>
                                                <Badge>Active</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                $49/month • Renews on April 1, 2024
                                            </p>
                                        </div>
                                        <Button variant="outline">Manage Plan</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Method</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">•••• •••• •••• 4242</p>
                                                <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">Update</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
