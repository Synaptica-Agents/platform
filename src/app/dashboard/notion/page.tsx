import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { ConnectedDatabases } from "./connected-databases";
import { CriteriaEditor } from "./criteria-editor";

export default async function NotionPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const customerId = await getCustomerIdForUser(supabase, user!.id);

    const { data: integration } = await supabase
        .from("integrations")
        .select("status")
        .eq("customer_id", customerId ?? "")
        .eq("provider", "notion")
        .single();

    const { data: criteria } = await supabase
        .from("company_brain")
        .select("*")
        .eq("customer_id", customerId ?? "")
        .eq("category", "evaluation")
        .order("key");

    const notionConnected = integration?.status === "connected";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Notion</h1>
                <p className="text-muted-foreground">
                    Manage your connected Notion databases and the AI evaluation
                    criteria used to score new founder applications.
                </p>
            </div>

            <ConnectedDatabases notionConnected={notionConnected} />

            <CriteriaEditor
                entries={criteria ?? []}
                customerId={customerId ?? ""}
            />
        </div>
    );
}
