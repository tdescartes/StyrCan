"use client";

import { CreditCard, Loader2, Download, ExternalLink } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

// Plan configurations from backend/app/schemas/subscription.py
const planTiers = [
    {
        tier: "standard",
        name: "Standard",
        price: 0,
        interval: "month",
        features: [
            "Up to 5 employees",
            "Basic payroll",
            "Email support",
            "Core features only",
        ],
    },
    {
        tier: "professional",
        name: "Professional",
        price: 29,
        interval: "month",
        priceAnnual: 290,
        features: [
            "Up to 50 employees",
            "Full payroll & finance",
            "Priority support",
            "Custom reports",
            "API access",
        ],
    },
    {
        tier: "enterprise",
        name: "Enterprise",
        price: 99,
        interval: "month",
        priceAnnual: 990,
        features: [
            "Unlimited employees",
            "SSO & advanced security",
            "Dedicated account manager",
            "White-label options",
            "Priority API access",
        ],
    },
];

export default function BillingPage() {
    const { data: subscription, isLoading: subLoading } = useQuery({
        queryKey: ["billing", "subscription"],
        queryFn: () => apiClient.getSubscription(),
    });

    const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
        queryKey: ["billing", "invoices"],
        queryFn: () => apiClient.getInvoices({ limit: 5 }),
    });

    const createCheckout = useMutation({
        mutationFn: (planTier: string) =>
            apiClient.createCheckoutSession(planTier),
        onSuccess: (data) => {
            // Redirect to Stripe Checkout
            window.location.href = data.url;
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to create checkout session");
        },
    });

    const openPortal = useMutation({
        mutationFn: () => apiClient.createPortalSession(),
        onSuccess: (data) => {
            // Open Stripe Customer Portal in new tab
            window.open(data.url, "_blank");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to open billing portal");
        },
    });

    const currentPlan = subscription?.plan_tier || "standard";
    const isSubscriptionActive = subscription?.status === "active" || subscription?.status === "trialing";

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground">
                    Manage your subscription, payment method, and billing history
                </p>
            </div>

            {/* Current Subscription Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Current Subscription
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {subLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription...
                        </div>
                    ) : subscription ? (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="default" className="capitalize text-base px-3 py-1">
                                            {subscription.plan_tier}
                                        </Badge>
                                        <Badge
                                            variant={isSubscriptionActive ? "default" : "secondary"}
                                            className="capitalize"
                                        >
                                            {subscription.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Current period: {formatDate(subscription.current_period_start)} -{" "}
                                        {formatDate(subscription.current_period_end)}
                                    </p>
                                    {subscription.cancel_at_period_end && (
                                        <p className="text-sm text-destructive mt-1">
                                            ⚠️ Subscription will cancel at period end
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => openPortal.mutate()}
                                    disabled={openPortal.isPending}
                                >
                                    {openPortal.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                    )}
                                    Manage Billing
                                </Button>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2">Plan Features:</h4>
                                <ul className="grid grid-cols-2 gap-2">
                                    {subscription.features.map((feature) => (
                                        <li key={feature} className="text-sm text-muted-foreground flex items-start gap-1">
                                            <span className="text-green-600">✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-muted-foreground mb-4">
                                You're currently on the free Standard plan
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Upgrade to unlock more features and support
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Available Plans */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {planTiers.map((plan) => {
                        const isCurrent = currentPlan === plan.tier;
                        const isDowngrade = planTiers.findIndex((p) => p.tier === currentPlan) > planTiers.findIndex((p) => p.tier === plan.tier);

                        return (
                            <Card key={plan.tier} className={isCurrent ? "border-primary shadow-lg" : ""}>
                                <CardHeader>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <CardDescription>
                                        <span className="text-3xl font-bold">
                                            {plan.price === 0 ? "Free" : `$${plan.price}`}
                                        </span>
                                        {plan.price > 0 && (
                                            <span className="text-sm text-muted-foreground"> /month</span>
                                        )}
                                    </CardDescription>
                                    {plan.priceAnnual && (
                                        <p className="text-xs text-muted-foreground">
                                            or ${plan.priceAnnual}/year (save ${plan.price * 12 - plan.priceAnnual})
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="text-sm flex items-start gap-1">
                                                <span className="text-green-600">✓</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        variant={isCurrent ? "outline" : "default"}
                                        className="w-full"
                                        disabled={
                                            isCurrent ||
                                            createCheckout.isPending ||
                                            (plan.tier === "standard" && isSubscriptionActive)
                                        }
                                        onClick={() => {
                                            if (isSubscriptionActive && !isCurrent) {
                                                // User has active subscription, open portal to change plan
                                                openPortal.mutate();
                                            } else {
                                                // New subscription, create checkout
                                                createCheckout.mutate(plan.tier);
                                            }
                                        }}
                                    >
                                        {createCheckout.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        {isCurrent
                                            ? "Current Plan"
                                            : plan.tier === "standard"
                                                ? "Downgrade"
                                                : isSubscriptionActive
                                                    ? isDowngrade ? "Manage Plan" : "Upgrade"
                                                    : "Get Started"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Invoices</CardTitle>
                    <CardDescription>View and download your billing history</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoicesLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices...
                        </div>
                    ) : invoicesData?.invoices && invoicesData.invoices.length > 0 ? (
                        <div className="space-y-2">
                            {invoicesData.invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {formatAmount(invoice.amount_due, invoice.currency)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(invoice.created)}
                                            {invoice.due_date && ` • Due ${formatDate(invoice.due_date)}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                invoice.status === "paid"
                                                    ? "default"
                                                    : invoice.status === "open"
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                            className="capitalize"
                                        >
                                            {invoice.status}
                                        </Badge>
                                        {invoice.invoice_pdf && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={invoice.invoice_pdf}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No invoices yet
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
