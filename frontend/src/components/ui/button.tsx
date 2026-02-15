import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn, variants } from "@/lib/utils";

const buttonVariants = variants(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-xs font-bold uppercase tracking-wide ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]",
    {
        variants: {
            variant: {
                default: "bg-black text-white hover:bg-zinc-800 border border-black shadow-sm",
                destructive: "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50",
                outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm",
                ghost: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                link: "text-primary underline-offset-4 hover:underline",
                success: "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600",
            },
            size: {
                default: "h-10 px-5 py-2.5",
                sm: "h-8 rounded-sm px-3 py-1.5",
                lg: "h-12 rounded-sm px-8 py-3",
                xs: "h-7 px-2 py-1 text-[10px]",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success";
    size?: "default" | "sm" | "lg" | "xs" | "icon";
    asChild?: boolean;
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={buttonVariants({ variant, size, className })}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading...
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
