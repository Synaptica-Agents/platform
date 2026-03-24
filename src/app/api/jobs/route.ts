// ── Scheduled Jobs API ──────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { NextRequest, NextResponse } from "next/server";

// GET /api/jobs — list all jobs for current customer
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
        .from("scheduled_jobs")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/jobs — create or update a job
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customerId = await getCustomerIdForUser(supabase, user.id);
    if (!customerId) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    const customer = { customer_id: customerId };

    const body = await request.json();
    const { job_type, cron_expression, config: jobConfig, enabled } = body;

    if (!job_type) {
        return NextResponse.json({ error: "job_type is required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("scheduled_jobs")
        .upsert(
            {
                customer_id: customer.customer_id,
                job_type,
                cron_expression: cron_expression ?? null,
                config: jobConfig ?? {},
                enabled: enabled ?? true,
                created_at: new Date().toISOString(),
            },
            { onConflict: "customer_id,job_type" }
        )
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// PATCH /api/jobs — toggle enabled/disabled
export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, enabled } = body;

    if (!id || enabled === undefined) {
        return NextResponse.json({ error: "id and enabled are required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("scheduled_jobs")
        .update({ enabled })
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// DELETE /api/jobs — delete a job
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabase.from("scheduled_jobs").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
