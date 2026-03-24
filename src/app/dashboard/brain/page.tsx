import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { BrainEditor } from "./brain-editor";

export default async function BrainPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const customerId = await getCustomerIdForUser(supabase, user!.id);
    const customer = customerId ? { customer_id: customerId } : null;

    const { data: entries } = await supabase
        .from("company_brain")
        .select("*")
        .order("category")
        .order("key");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Company Brain</h1>
                <p className="text-muted-foreground">
                    Your company context that powers every agent response
                </p>
            </div>
            <BrainEditor
                entries={entries ?? []}
                customerId={customer?.customer_id ?? ""}
            />
        </div>
    );
}
