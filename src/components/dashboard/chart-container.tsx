import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartContainerProps {
    title: string;
    value?: string;
    change?: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

export function ChartContainer({ title, value, change, subtitle, children, className }: ChartContainerProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        {value && (
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-2xl font-bold text-foreground">{value}</span>
                                {change && (
                                    <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                        ↗ {change}
                                    </span>
                                )}
                            </div>
                        )}
                        {subtitle && (
                            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                {children}
            </CardContent>
        </Card>
    );
}
