import { createClient } from "@/lib/supabase/server";
import { SettingsForm, type AgentModelField } from "./settings-form";

// Agent fields matching actual deployed agents
const SETTINGS_AGENT_FIELDS: AgentModelField[] = [
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

export default async function SettingsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.user_metadata?.is_admin === true;

    const { data: config } = await supabase
        .from("agent_config")
        .select("*")
        .limit(1)
        .single();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">
                    {isAdmin
                        ? "Configure your agent, API keys, and model preferences"
                        : "Configure your agent's personality and preferences"}
                </p>
            </div>
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
                isAdmin={isAdmin}
                agentFields={SETTINGS_AGENT_FIELDS}
            />
        </div>
    );
}
