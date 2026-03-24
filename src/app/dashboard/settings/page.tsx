import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

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
                    coordinator_model: config?.coordinator_model ?? null,
                    research_model: config?.research_model ?? null,
                    sales_model: config?.sales_model ?? null,
                    content_model: config?.content_model ?? null,
                    max_agent_iterations: config?.max_agent_iterations ?? null,
                    max_task_cost_usd: config?.max_task_cost_usd ?? null,
                    personality: config?.personality ?? null,
                    answer_length: config?.answer_length ?? null,
                    timezone: config?.timezone ?? null,
                    language: config?.language ?? null,
                }}
                isAdmin={isAdmin}
            />
        </div>
    );
}
