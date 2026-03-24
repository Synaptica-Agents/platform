import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface PageHeaderAction {
    label: string;
    icon?: LucideIcon;
    variant?: "default" | "outline" | "secondary" | "ghost";
    onClick?: () => void;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: PageHeaderAction[];
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && actions.length > 0 && (
                <div className="flex items-center gap-2">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={action.label}
                                variant={action.variant ?? "outline"}
                                size="sm"
                                onClick={action.onClick}
                            >
                                {Icon && <Icon className="mr-1.5 h-4 w-4" />}
                                {action.label}
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
