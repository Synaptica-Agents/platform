// ── Shared helper: resolve auth user → customer_id ──────────────────
// Uses customer_users junction table first, falls back to legacy
// customers.auth_user_id column for backward compatibility.

import { SupabaseClient } from "@supabase/supabase-js";

export async function getCustomerIdForUser(
    supabase: SupabaseClient,
    userId: string
): Promise<string | null> {
    // Primary: junction table
    const { data: membership } = await supabase
        .from("customer_users")
        .select("customer_id")
        .eq("auth_user_id", userId)
        .limit(1)
        .single();

    if (membership) return membership.customer_id;

    // Fallback: legacy column on customers table
    const { data: customer } = await supabase
        .from("customers")
        .select("customer_id")
        .eq("auth_user_id", userId)
        .single();

    return customer?.customer_id ?? null;
}

export async function getCustomerForUser(
    supabase: SupabaseClient,
    userId: string
): Promise<{ customer_id: string; display_name: string; email: string; status: string } | null> {
    const customerId = await getCustomerIdForUser(supabase, userId);
    if (!customerId) return null;

    const { data } = await supabase
        .from("customers")
        .select("customer_id, display_name, email, status")
        .eq("customer_id", customerId)
        .single();

    return data;
}
