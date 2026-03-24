"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Target, PenLine } from "lucide-react";

interface Job {
    id: string;
    job_type: string;
    cron_expression: string | null;
    config: Record<string, unknown>;
    enabled: boolean;
    last_run: string | null;
    next_run: string | null;
}

const JOB_TEMPLATES = [
    {
        type: "market_intel",
        name: "Market Intelligence Briefing",
        icon: BarChart3,
        description: "Weekly competitor & industry research delivered via Telegram",
        defaultCron: "0 8 * * 1",
        cronLabel: "Every Monday at 8:00 AM",
    },
    {
        type: "prospecting",
        name: "Lead Prospecting",
        icon: Target,
        description: "Auto-find new leads matching your ICP via Apollo",
        defaultCron: "0 9 * * 1",
        cronLabel: "Every Monday at 9:00 AM",
    },
    {
        type: "content_calendar",
        name: "Content Calendar",
        icon: PenLine,
        description: "Weekly topic suggestions + draft LinkedIn posts",
        defaultCron: "0 10 * * 1",
        cronLabel: "Every Monday at 10:00 AM",
    },
];

export function JobsManager({ jobs }: { jobs: Job[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [addingType, setAddingType] = useState<string | null>(null);
    const [cronInput, setCronInput] = useState("");

    const jobMap = new Map(jobs.map((j) => [j.job_type, j]));

    async function handleCreate(type: string, defaultCron: string) {
        setLoading(true);
        await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                job_type: type,
                cron_expression: cronInput || defaultCron,
                enabled: true,
            }),
        });
        setAddingType(null);
        setCronInput("");
        setLoading(false);
        router.refresh();
    }

    async function handleToggle(id: string, enabled: boolean) {
        setLoading(true);
        await fetch("/api/jobs", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, enabled: !enabled }),
        });
        setLoading(false);
        router.refresh();
    }

    async function handleDelete(id: string) {
        setLoading(true);
        await fetch(`/api/jobs?id=${id}`, { method: "DELETE" });
        setLoading(false);
        router.refresh();
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {JOB_TEMPLATES.map((template) => {
                const existingJob = jobMap.get(template.type);
                const isAdding = addingType === template.type;

                return (
                    <Card key={template.type} className="border-border bg-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <template.icon className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-foreground text-sm">{template.name}</CardTitle>
                                </div>
                                {existingJob && (
                                    <Badge
                                        variant="outline"
                                        className={
                                            existingJob.enabled
                                                ? "border-green-600 text-green-400"
                                                : "border-border text-muted-foreground"
                                        }
                                    >
                                        {existingJob.enabled ? "Active" : "Paused"}
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="text-muted-foreground text-xs">
                                {template.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {existingJob ? (
                                <div className="space-y-3">
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <p>Schedule: <span className="text-muted-foreground font-mono">{existingJob.cron_expression ?? "manual"}</span></p>
                                        {existingJob.last_run && (
                                            <p>Last run: {new Date(existingJob.last_run).toLocaleString()}</p>
                                        )}
                                        {existingJob.next_run && (
                                            <p>Next run: {new Date(existingJob.next_run).toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 border-border text-foreground/80"
                                            onClick={() => handleToggle(existingJob.id, existingJob.enabled)}
                                            disabled={loading}
                                        >
                                            {existingJob.enabled ? "Pause" : "Resume"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-400 hover:text-red-300"
                                            onClick={() => handleDelete(existingJob.id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ) : isAdding ? (
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Cron Schedule</Label>
                                        <Input
                                            placeholder={template.defaultCron}
                                            value={cronInput}
                                            onChange={(e) => setCronInput(e.target.value)}
                                            className="border-border bg-muted text-foreground font-mono text-xs"
                                        />
                                        <p className="text-xs text-muted-foreground">Default: {template.cronLabel}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleCreate(template.type, template.defaultCron)}
                                            disabled={loading}
                                        >
                                            {loading ? "Creating..." : "Enable"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-muted-foreground"
                                            onClick={() => setAddingType(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setAddingType(template.type);
                                        setCronInput("");
                                    }}
                                >
                                    Set Up
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
