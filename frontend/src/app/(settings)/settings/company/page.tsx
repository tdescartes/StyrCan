"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Building2, Mail, Phone, MapPin, Calendar } from "lucide-react";
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
import { apiClient } from "@/lib/api/client";

const companySchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    email: z.string().email().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanySettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    // Fetch company settings
    const { data: company, isLoading: isFetching } = useQuery({
        queryKey: ["company-settings"],
        queryFn: () => apiClient.getCompanySettings(),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
    });

    // Update form when company data is loaded
    useEffect(() => {
        if (company) {
            reset({
                name: company.name || "",
                email: company.email || "",
                address: company.address || "",
                phone: company.phone || "",
                tax_id: company.tax_id || "",
            });
        }
    }, [company, reset]);

    const onSubmit = async (data: CompanyFormData) => {
        setIsLoading(true);
        try {
            await apiClient.updateCompanySettings({
                name: data.name,
                ...(data.email ? { email: data.email } : {}),
                ...(data.phone ? { phone: data.phone } : {}),
                ...(data.address ? { address: data.address } : {}),
                ...(data.tax_id ? { tax_id: data.tax_id } : {}),
            });
            toast.success("Company settings updated successfully");
            // Invalidate the query to refetch updated data
            queryClient.invalidateQueries({ queryKey: ["company-settings"] });
        } catch (error: any) {
            toast.error(error.message || "Failed to update company settings");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Company</h1>
                <p className="text-muted-foreground">Manage your company information and settings</p>
            </div>

            {/* Current Company Information */}
            {company && (
                <Card>
                    <CardHeader>
                        <CardTitle>Current Company Information</CardTitle>
                        <CardDescription>View your company&apos;s current details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-start space-x-3">
                                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                                    <p className="text-base">{company.name || <span className="text-muted-foreground italic">Not set</span>}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p className="text-base">{company.email || <span className="text-muted-foreground italic">Not set</span>}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                    <p className="text-base">{company.phone || <span className="text-muted-foreground italic">Not set</span>}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                                    <p className="text-base">{company.address || <span className="text-muted-foreground italic">Not set</span>}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                                    <p className="text-base">{company.tax_id || <span className="text-muted-foreground italic">Not set</span>}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                    <p className="text-base">
                                        {company.created_at ? new Date(company.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        }) : <span className="text-muted-foreground italic">Not available</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit Company Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Edit Company Details</CardTitle>
                    <CardDescription>Update your company&apos;s information</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name *</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...register("email")} />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" {...register("phone")} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" {...register("address")} placeholder="123 Main St, City, State ZIP" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax_id">Tax ID</Label>
                            <Input id="tax_id" {...register("tax_id")} placeholder="00-0000000" />
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
