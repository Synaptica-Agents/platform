"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentInfo {
    role: string;
    displayName: string;
    emoji: string;
    description: string;
    modelField: string;
}

const AGENT_DEFINITIONS: AgentInfo[] = [
    {
        role: "coordinator",
        displayName: "Coordinator",
        emoji: "🎯",
        description: "Main agent — routes tasks, manages conversations, and orchestrates sub-agents",
        modelField: "coordinator_model",
    },
    {
        role: "researcher",
        displayName: "Research Agent",
        emoji: "🔍",
        description: "Web research via Perplexity — market intelligence, competitor analysis, trend reports",
        modelField: "research_model",
    },
    {
        role: "sales",
        displayName: "Sales Agent",
        emoji: "💼",
        description: "Lead prospecting via Apollo — ICP scoring, CRM sync, contact enrichment",
        modelField: "sales_model",
    },
    {
        role: "content",
        displayName: "Content Agent",
        emoji: "✍️",
        description: "Content creation — LinkedIn posts, email drafts, style-matched writing",
        modelField: "content_model",
    },
    {
        role: "founder_eval",
        displayName: "Founder Evaluation Agent",
        emoji: "🚀",
        description: "Evaluates startup founders — scores applications, researches backgrounds, generates recommendations",
        modelField: "founder_eval_model",
    },
    {
        role: "startup_analyst",
        displayName: "Startup Analyst",
        emoji: "🧠",
        description: "Analyzes startup ideas — market sizing, competitive analysis, scoring frameworks, Notion integration",
        modelField: "startup_analyst_model",
    },
];

interface AgentConfig {
    coordinator_model?: string | null;
    research_model?: string | null;
    sales_model?: string | null;
    content_model?: string | null;
    founder_eval_model?: string | null;
    startup_analyst_model?: string | null;
}

export function AgentsOverview({
    config,
    activeRoles,
}: {
    config: AgentConfig | null;
    activeRoles?: string[];
}) {
    const cfg = config ?? {};

    // If activeRoles is provided, use it to filter; otherwise use DB-based detection
    const activeAgents = activeRoles
        ? AGENT_DEFINITIONS.filter((agent) => activeRoles.includes(agent.role))
        : AGENT_DEFINITIONS.filter((agent) => {
            const model = cfg[agent.modelField as keyof AgentConfig];
            return agent.role === "coordinator" || (model !== null && model !== undefined && model !== "");
        });

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {activeAgents.map((agent) => {
                const model = cfg[agent.modelField as keyof AgentConfig] ?? "Not configured";
                const modelShort = typeof model === "string" ? model.split("/").pop() ?? model : "Not configured";

                return (
                    <Card key={agent.role} className="border-border bg-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{agent.emoji}</span>
                                    <div>
                                        <CardTitle className="text-foreground">{agent.displayName}</CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            {agent.description}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-green-600 text-green-400"
                                >
                                    Active
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Model</span>
                                <span className="font-mono text-sm text-foreground">{modelShort}</span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
