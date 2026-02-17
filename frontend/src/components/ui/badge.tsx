import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "bg-zinc-100 text-zinc-600 border-transparent",
                secondary: "bg-zinc-100 text-zinc-600 border-zinc-200",
                success: "bg-emerald-50 text-emerald-700 border-emerald-100",
                warning: "bg-amber-50 text-amber-700 border-amber-100",
                error: "bg-rose-50 text-rose-700 border-rose-100",
                destructive: "bg-rose-50 text-rose-700 border-rose-100",
                black: "bg-black text-white border-black",
                outline: "bg-white text-zinc-500 border-zinc-200",
                blue: "bg-blue-50 text-blue-700 border-blue-100",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "success" | "warning" | "error" | "destructive" | "black" | "outline" | "blue";
}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
