import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { AgentsOverview } from "./agents-overview";

// Active agents per customer (hardcoded until agent registry is in DB)
const ACTIVE_ROLES = ["coordinator", "researcher", "founder_eval", "startup_analyst"];

// Default models for agents whose columns don't exist in Supabase yet
const MODEL_DEFAULTS: Record<string, string> = {
    coordinator_model: "x-ai/grok-4.1-fast",
    research_model: "anthropic/claude-sonnet-4.6",
    founder_eval_model: "anthropic/claude-opus-4.6",
    startup_analyst_model: "anthropic/claude-opus-4.6",
};

export default async function AgentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <p className="text-muted-foreground">Unauthorized</p>;

    const customerId = await getCustomerIdForUser(supabase, user.id);

    const { data: agentConfig } = await supabase
        .from("agent_config")
        .select("coordinator_model, research_model")
        .eq("customer_id", customerId ?? "")
        .single();

    // Merge DB values with defaults for columns that don't exist yet
    const mergedConfig = {
        ...MODEL_DEFAULTS,
        ...(agentConfig ?? {}),
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Agents</h1>
                <p className="text-muted-foreground">
                    Your active AI agents and their model configurations
                </p>
            </div>
            <AgentsOverview config={mergedConfig} activeRoles={ACTIVE_ROLES} />
        </div>
    );
}
