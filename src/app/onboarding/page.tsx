import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const customerId = await getCustomerIdForUser(supabase, user.id);
    const customer = customerId ? { customer_id: customerId } : null;

    // Check if brain already has entries (user may have already onboarded)
    const { count } = await supabase
        .from("company_brain")
        .select("*", { count: "exact", head: true });

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <OnboardingWizard
                customerId={customer?.customer_id ?? ""}
                hasExistingEntries={(count ?? 0) > 0}
            />
        </div>
    );
}
