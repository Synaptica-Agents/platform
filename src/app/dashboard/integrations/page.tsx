import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { IntegrationsHub } from "./integrations-hub";

export default async function IntegrationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.user_metadata?.is_admin === true;

    const { data: integrations } = await supabase
        .from("integrations")
        .select("provider, status, connected_at");

    // Build the integration status list
    const integrationList = (integrations ?? []).map((i) => ({
        provider: i.provider,
        status: i.status,
        connected_at: i.connected_at,
    }));

    // Fetch visible_integrations filter + OpenRouter status
    let visibleIntegrations: string[] | null = null;
    if (user) {
        const customerId = await getCustomerIdForUser(supabase, user.id);
        if (customerId) {
            const { data: agentConfig } = await supabase
                .from("agent_config")
                .select("visible_integrations, openrouter_api_key_encrypted")
                .eq("customer_id", customerId)
                .single();

            if (!isAdmin) {
                visibleIntegrations = agentConfig?.visible_integrations ?? null;
            }

            // Inject OpenRouter as a synthetic integration status
            const hasKey = !!agentConfig?.openrouter_api_key_encrypted;
            integrationList.push({
                provider: "openrouter",
                status: hasKey ? "connected" : "disconnected",
                connected_at: null,
            });
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
                <p className="text-muted-foreground">
                    Connect your tools so the agent can use them
                </p>
            </div>
            <IntegrationsHub
                integrations={integrationList}
                visibleIntegrations={visibleIntegrations}
            />
        </div>
    );
}
