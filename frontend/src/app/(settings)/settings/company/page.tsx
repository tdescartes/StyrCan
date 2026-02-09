"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api/client";

const companySchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    address: z.string().optional(),
    phone: z.string().optional(),
    industry: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanySettingsPage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: user?.company?.name || "",
            address: user?.company?.address || "",
            phone: user?.company?.phone || "",
            industry: user?.company?.industry || "",
        },
    });

    const onSubmit = async (data: CompanyFormData) => {
        setIsLoading(true);
        try {
            await apiClient.updateCompanySettings({
                name: data.name,
                ...(data.phone ? { phone: data.phone } : {}),
                ...(data.address ? { address: data.address } : {}),
            });
            toast.success("Company settings updated");
        } catch (error: any) {
            toast.error(error.message || "Failed to update");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Company</h1>
                <p className="text-muted-foreground">Manage company information</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Update your company&apos;s public information</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Input id="industry" {...register("industry")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" {...register("address")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" {...register("phone")} />
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
