import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { AgentsOverview } from "./agents-overview";

export default async function AgentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <p className="text-muted-foreground">Unauthorized</p>;

    const customerId = await getCustomerIdForUser(supabase, user.id);

    const { data: agentConfig } = await supabase
        .from("agent_config")
        .select("coordinator_model, research_model, sales_model, content_model, founder_eval_model")
        .eq("customer_id", customerId ?? "")
        .single();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Agents</h1>
                <p className="text-muted-foreground">
                    Your active AI agents and their model configurations
                </p>
            </div>
            <AgentsOverview config={agentConfig} />
        </div>
    );
}
