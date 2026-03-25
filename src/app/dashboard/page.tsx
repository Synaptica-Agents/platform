import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCustomerForUser } from "@/lib/supabase/get-customer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Plug, ClipboardCheck, Activity, Download, FileText, Settings } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ChartContainer } from "@/components/dashboard/chart-container";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { JobsChart } from "@/components/dashboard/jobs-chart";
import { SessionsChart } from "@/components/dashboard/sessions-chart";
import { SettingsForm, type AgentModelField } from "./settings/settings-form";

// Agent fields for the non-admin overview (matches actual deployed agents)
const OVERVIEW_AGENT_FIELDS: AgentModelField[] = [
    { field: "coordinator_model", label: "Coordinator" },
    { field: "research_model", label: "Research" },
    { field: "founder_eval_model", label: "Founder Evaluation" },
    { field: "startup_analyst_model", label: "Startup Analyst" },
];

// Default models for agents whose columns don't exist in Supabase yet
const MODEL_DEFAULTS: Record<string, string> = {
    coordinator_model: "x-ai/grok-4.1-fast",
    research_model: "anthropic/claude-sonnet-4.6",
    founder_eval_model: "anthropic/claude-opus-4.6",
    startup_analyst_model: "anthropic/claude-opus-4.6",
};

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.user_metadata?.is_admin === true;

    // Get customer info
    let customers;
    if (isAdmin) {
        const { data } = await supabase.from("customers").select("*").order("created_at");
        customers = data ?? [];
    } else {
        const customer = await getCustomerForUser(supabase, user!.id);
        customers = customer ? [customer] : [];
    }

    const displayName = customers[0]?.display_name ?? user?.email?.split("@")[0] ?? "User";

    // Get integration count
    const { data: integrations } = await supabase
        .from("integrations")
        .select("provider, status");

    const connectedCount = integrations?.filter((i) => i.status === "connected").length ?? 0;

    // ── Client view ──────────────────────────────────────────────────
    if (!isAdmin) {
        // Fetch agent config for inline settings
        const { data: config } = await supabase
            .from("agent_config")
            .select("*")
            .limit(1)
            .single();

        return (
            <div className="space-y-6">
                <PageHeader
                    title={`Welcome back, ${displayName}`}
                    description="Your AI agent overview"
                />

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-foreground">Agent Status</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Your bot is running and ready to work
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="border-green-600 text-green-400">
                                Active
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {connectedCount} integration{connectedCount !== 1 ? "s" : ""} connected
                        </p>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">Configuration</h2>
                    <SettingsForm
                        config={{
                            has_openrouter_key: !!config?.openrouter_api_key_encrypted,
                            coordinator_model: config?.coordinator_model ?? MODEL_DEFAULTS.coordinator_model,
                            research_model: config?.research_model ?? MODEL_DEFAULTS.research_model,
                            sales_model: config?.sales_model ?? null,
                            content_model: config?.content_model ?? null,
                            founder_eval_model: config?.founder_eval_model ?? MODEL_DEFAULTS.founder_eval_model,
                            startup_analyst_model: config?.startup_analyst_model ?? MODEL_DEFAULTS.startup_analyst_model,
                            max_agent_iterations: config?.max_agent_iterations ?? null,
                            max_task_cost_usd: config?.max_task_cost_usd ?? null,
                            personality: config?.personality ?? null,
                            answer_length: config?.answer_length ?? null,
                            timezone: config?.timezone ?? null,
                            language: config?.language ?? null,
                        }}
                        isAdmin={false}
                        readOnly
                        agentFields={OVERVIEW_AGENT_FIELDS}
                    />
                </div>
            </div>
        );
    }

    // ── Admin view ───────────────────────────────────────────────────

    // Get brain entry count
    const { count: brainCount } = await supabase
        .from("company_brain")
        .select("*", { count: "exact", head: true });

    // Get pending approvals
    const { count: pendingApprovals } = await supabase
        .from("approval_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Welcome back, ${displayName}`}
                description={`Managing ${customers.length} customer instance${customers.length !== 1 ? "s" : ""}`}
                actions={[
                    { label: "Export data", icon: Download, variant: "outline" },
                    { label: "Create report", icon: FileText, variant: "default" },
                ]}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Brain}
                    label="Brain Entries"
                    value={brainCount ?? 0}
                    subtitle="entries configured"
                />
                <StatCard
                    icon={Plug}
                    label="Integrations"
                    value={connectedCount}
                    subtitle="connected"
                />
                <StatCard
                    icon={ClipboardCheck}
                    label="Pending Approvals"
                    value={pendingApprovals ?? 0}
                    subtitle="actions awaiting review"
                />
                <StatCard
                    icon={Activity}
                    label="Agent Status"
                    value="Active"
                    change="Online"
                    changeDirection="up"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <ChartContainer
                    title="Agent Activity"
                    value="127"
                    change="24.6%"
                    subtitle="Total tasks this period"
                    className="lg:col-span-2"
                >
                    <ActivityChart />
                </ChartContainer>

                <div className="space-y-4">
                    <ChartContainer
                        title="Jobs Executed"
                        value="64"
                        change="28.5%"
                    >
                        <JobsChart />
                    </ChartContainer>

                    <ChartContainer
                        title="Total Sessions"
                        value="400"
                        change="16.8%"
                    >
                        <SessionsChart />
                    </ChartContainer>
                </div>
            </div>

            {customers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-foreground">Customer Instances</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            All deployed Synaptica instances
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {customers.map((c: { customer_id: string; display_name: string; server: string; status: string }) => (
                                <div
                                    key={c.customer_id}
                                    className="flex items-center justify-between rounded-md border border-border p-3"
                                >
                                    <div>
                                        <p className="font-medium text-foreground">{c.display_name}</p>
                                        <p className="text-sm text-muted-foreground">{c.customer_id}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {c.server}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={
                                                c.status === "active"
                                                    ? "border-green-600 text-green-400"
                                                    : "text-muted-foreground"
                                            }
                                        >
                                            {c.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
