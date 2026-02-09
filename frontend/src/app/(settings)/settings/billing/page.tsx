"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

const planTiers = [
    {
        name: "standard",
        label: "Standard",
        price: "$0",
        features: ["Up to 5 employees", "Basic payroll", "Email support"],
    },
    {
        name: "professional",
        label: "Professional",
        price: "$29",
        features: ["Up to 50 employees", "Full payroll & finance", "Priority support", "Custom reports"],
    },
    {
        name: "enterprise",
        label: "Enterprise",
        price: "Custom",
        features: ["Unlimited employees", "SSO & advanced security", "Dedicated account manager", "API access"],
    },
];

export default function BillingPage() {
    const { data: billing, isLoading } = useQuery({
        queryKey: ["settings", "billing"],
        queryFn: () => apiClient.getBillingInfo(),
    });

    const changePlan = useMutation({
        mutationFn: (plan: string) => apiClient.changePlan(plan),
        onSuccess: (data) => {
            toast.success(data.message || "Plan change initiated");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to change plan");
        },
    });

    const currentPlan = billing?.subscription?.plan || "standard";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
                <p className="text-muted-foreground">Manage your subscription and payments</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading billing info...
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-lg">Current Plan</p>
                                <p className="text-sm text-muted-foreground">
                                    Your company is on the{" "}
                                    <Badge variant="secondary" className="capitalize">
                                        {currentPlan}
                                    </Badge>{" "}
                                    plan
                                    {billing?.subscription?.status && (
                                        <span> &mdash; {billing.subscription.status}</span>
                                    )}
                                </p>
                                {billing?.payment_method && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Payment: {billing.payment_method}
                                    </p>
                                )}
                            </div>
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planTiers.map((plan) => {
                    const isCurrent = currentPlan === plan.name;
                    return (
                        <Card key={plan.name} className={isCurrent ? "border-primary" : ""}>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <p className="text-lg font-semibold">{plan.label}</p>
                                    <p className="text-2xl font-bold">
                                        {plan.price}
                                        {plan.price !== "Custom" && (
                                            <span className="text-sm text-muted-foreground font-normal"> /mo</span>
                                        )}
                                    </p>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {plan.features.map((f) => (
                                        <li key={f} className="text-muted-foreground">
                                            ✓ {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    variant={isCurrent ? "outline" : "default"}
                                    className="w-full"
                                    disabled={isCurrent || changePlan.isPending}
                                    onClick={() => changePlan.mutate(plan.name)}
                                >
                                    {changePlan.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {isCurrent ? "Current Plan" : "Upgrade"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
