"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const themes = [
    { id: "light", label: "Light", icon: Sun, description: "A clean light theme" },
    { id: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
    { id: "system", label: "System", icon: Monitor, description: "Follow system preference" },
];

export default function AppearancePage() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
                <p className="text-muted-foreground">Customize how Pulse looks</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>Select your preferred color scheme</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {themes.map((t) => {
                            const Icon = t.icon;
                            const isActive = theme === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors hover:border-primary/50",
                                        isActive
                                            ? "border-primary bg-primary/5"
                                            : "border-muted"
                                    )}
                                >
                                    <Icon className={cn("h-8 w-8", isActive ? "text-primary" : "text-muted-foreground")} />
                                    <div className="text-center">
                                        <p className="font-medium">{t.label}</p>
                                        <p className="text-xs text-muted-foreground">{t.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
