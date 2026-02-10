"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuthStore } from "@/stores/auth-store";

const registerSchema = z
    .object({
        fullName: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        companyName: z.string().min(2, "Company name must be at least 2 characters"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRequirements = [
    { regex: /.{8,}/, label: "At least 8 characters" },
    { regex: /[A-Z]/, label: "One uppercase letter" },
    { regex: /[a-z]/, label: "One lowercase letter" },
    { regex: /[0-9]/, label: "One number" },
];

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register: registerUser, isAuthenticated, hasHydrated } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch("password", "");

    // Redirect after successful authentication
    useEffect(() => {
        if (hasHydrated && isAuthenticated && !isLoading) {
            const redirect = searchParams.get("redirect") || "/";
            router.push(redirect);
        }
    }, [isAuthenticated, hasHydrated, isLoading, router, searchParams]);

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            const [firstName, ...lastNameParts] = data.fullName.split(" ");
            const lastName = lastNameParts.join(" ") || firstName;

            await registerUser({
                name: data.companyName,              // company name
                email: data.email,                   // company email (same as admin for now)
                admin_first_name: firstName,
                admin_last_name: lastName,
                admin_email: data.email,             // admin email
                admin_password: data.password,
            });
            toast.success("Account created successfully!");
            // Don't redirect here - let useEffect handle it after state updates
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Registration failed");
            setIsLoading(false);
        }
    };

    // Prevent any form submission that could expose credentials in URL
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-xl font-bold text-primary-foreground">S</span>
                    </div>
                    <span className="text-2xl font-bold">Pulse</span>
                </Link>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Create an account</CardTitle>
                        <CardDescription className="text-center">
                            Start your 14-day free trial. No credit card required.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleFormSubmit} method="post" action="#">
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    autoComplete="name"
                                    {...register("fullName")}
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input
                                    id="companyName"
                                    type="text"
                                    placeholder="Acme Inc."
                                    autoComplete="organization"
                                    {...register("companyName")}
                                />
                                {errors.companyName && (
                                    <p className="text-sm text-destructive">{errors.companyName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        autoComplete="new-password"
                                        {...register("password")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}

                                {/* Password requirements */}
                                {password && (
                                    <div className="space-y-1 mt-2">
                                        {passwordRequirements.map((req) => (
                                            <div
                                                key={req.label}
                                                className={`flex items-center gap-2 text-xs ${req.regex.test(password)
                                                    ? "text-success"
                                                    : "text-muted-foreground"
                                                    }`}
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                                {req.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        autoComplete="new-password"
                                        {...register("confirmPassword")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-destructive">
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                            <p className="text-xs text-center text-muted-foreground">
                                By creating an account, you agree to our{" "}
                                <Link href="/terms" className="underline">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="underline">
                                    Privacy Policy
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
