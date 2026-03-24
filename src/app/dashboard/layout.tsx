import { createClient } from "@/lib/supabase/server";
import { getCustomerForUser } from "@/lib/supabase/get-customer";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const customer = await getCustomerForUser(supabase, user.id);

    const isAdmin = user.user_metadata?.is_admin === true;

    // Fetch customer-specific UI config from agent_config + customers table
    let logoUrl: string | null = null;
    let visiblePages: string[] | null = null;

    if (customer?.customer_id) {
        // Get logo from customers table
        const { data: custRow } = await supabase
            .from("customers")
            .select("logo_url")
            .eq("customer_id", customer.customer_id)
            .single();
        logoUrl = custRow?.logo_url ?? null;

        // Get visible_pages from agent_config
        if (!isAdmin) {
            const { data: agentConfig } = await supabase
                .from("agent_config")
                .select("visible_pages")
                .eq("customer_id", customer.customer_id)
                .single();
            visiblePages = agentConfig?.visible_pages ?? null;
        }
    }

    return (
        <DashboardShell
            user={{
                email: user.email ?? "",
                isAdmin,
                customerId: customer?.customer_id ?? null,
                displayName: customer?.display_name ?? user.email ?? "",
                logoUrl,
                visiblePages,
            }}
        >
            {children}
        </DashboardShell>
    );
}
