import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    change?: string;
    changeDirection?: "up" | "down";
    subtitle?: string;
}

export function StatCard({ icon: Icon, label, value, change, changeDirection, subtitle }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {change && (
                        <span
                            className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                                changeDirection === "up"
                                    ? "bg-success/10 text-success"
                                    : changeDirection === "down"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {changeDirection === "up" ? "↗" : changeDirection === "down" ? "↘" : ""} {change}
                        </span>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
