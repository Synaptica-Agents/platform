// ── Settings API (OpenRouter key, model config, preferences) ────────
import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { NextRequest, NextResponse } from "next/server";

// GET /api/settings — get agent config for current customer
export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from("agent_config")
        .select("*")
        .limit(1)
        .single();

    if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mask the encrypted key for display
    const config = data ?? {};
    return NextResponse.json({
        ...config,
        has_openrouter_key: !!config.openrouter_api_key_encrypted,
        openrouter_api_key_encrypted: undefined, // never send to client
    });
}

// PATCH /api/settings — update agent config fields
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the customer's customer_id (supports multi-user via junction table)
    const customerId = await getCustomerIdForUser(supabase, user.id);
    if (!customerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    const customer = { customer_id: customerId };

    const body = await request.json();
    const isAdmin = user.user_metadata?.is_admin === true;

    // All customer users can update API key, models, and preferences.
    // Only admin can change safety limits.
    const baseFields = [
        "openrouter_api_key_encrypted",
        "coordinator_model",
        "research_model",
        "sales_model",
        "content_model",
        "founder_eval_model",
        "personality",
        "answer_length",
        "timezone",
        "language",
    ];
    const adminOnlyFields = ["max_agent_iterations", "max_task_cost_usd", "visible_integrations"];
    const allowedFields = isAdmin ? [...baseFields, ...adminOnlyFields] : baseFields;

    // Filter to only allowed fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }

    // Upsert — create if doesn't exist
    const { data, error } = await supabase
        .from("agent_config")
        .upsert(
            { customer_id: customer.customer_id, ...updates },
            { onConflict: "customer_id" }
        )
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        ...data,
        has_openrouter_key: !!data.openrouter_api_key_encrypted,
        openrouter_api_key_encrypted: undefined,
    });
}
