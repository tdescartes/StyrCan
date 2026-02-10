"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

const resetPasswordSchema = z
    .object({
        new_password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[a-z]/, "Must contain a lowercase letter")
            .regex(/[0-9]/, "Must contain a number"),
        confirm_password: z.string(),
    })
    .refine((data) => data.new_password === data.confirm_password, {
        message: "Passwords don't match",
        path: ["confirm_password"],
    });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, hasHydrated } = useAuthStore();
    const token = searchParams.get("token");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (hasHydrated && isAuthenticated) {
            router.push("/");
        }
    }, [hasHydrated, isAuthenticated, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-foreground">S</span>
                        </div>
                        <span className="text-2xl font-bold">Pulse</span>
                    </Link>
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
                            <CardDescription>
                                This password reset link is invalid or has expired. Please request a new one.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Link href="/forgot-password">
                                <Button>Request New Link</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-foreground">S</span>
                        </div>
                        <span className="text-2xl font-bold">Pulse</span>
                    </Link>
                    <Card>
                        <CardHeader className="space-y-1 text-center">
                            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-2xl">Password Reset</CardTitle>
                            <CardDescription>
                                Your password has been successfully reset. You can now log in with your new password.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Link href="/login">
                                <Button>Go to Login</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        try {
            await apiClient.post("/api/auth/reset-password", {
                token,
                new_password: data.new_password,
                confirm_password: data.confirm_password,
            });
            setIsSuccess(true);
            toast.success("Password reset successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password. The link may have expired.");
        } finally {
            setIsLoading(false);
        }
    };

    // Prevent any form submission that could expose password in URL
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4">
            <div className="w-full max-w-md">
                <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-xl font-bold text-primary-foreground">S</span>
                    </div>
                    <span className="text-2xl font-bold">Pulse</span>
                </Link>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Set New Password</CardTitle>
                        <CardDescription>
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFormSubmit} method="post" action="#" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new_password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new_password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...register("new_password")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.new_password && (
                                    <p className="text-sm text-red-500">{errors.new_password.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Must be 8+ characters with uppercase, lowercase, and a number
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm_password">Confirm Password</Label>
                                <Input
                                    id="confirm_password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("confirm_password")}
                                />
                                {errors.confirm_password && (
                                    <p className="text-sm text-red-500">{errors.confirm_password.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reset Password
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                            Back to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
