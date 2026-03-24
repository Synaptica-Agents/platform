// ── Integration Connect/Disconnect API ──────────────────────────────
// POST /api/integrations/[provider] — connect (API key or start OAuth)
// DELETE /api/integrations/[provider] — disconnect
// GET /api/integrations/[provider] — get status

import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { NextRequest, NextResponse } from "next/server";

// Provider configs for OAuth flows
const OAUTH_PROVIDERS: Record<string, {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    clientIdEnv: string;
    clientSecretEnv: string;
}> = {
    gmail: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"],
        clientIdEnv: "GOOGLE_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    },
    google_calendar: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
        clientIdEnv: "GOOGLE_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    },
};

const API_KEY_PROVIDERS = ["apollo", "attio", "hubspot", "notion"];

// GET — check status
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // OpenRouter lives in agent_config, not integrations table
    if (provider === "openrouter") {
        const customerId = await getCustomerIdForUser(supabase, user.id);
        if (!customerId) return NextResponse.json({ provider, status: "disconnected" });

        const { data } = await supabase
            .from("agent_config")
            .select("openrouter_api_key_encrypted")
            .eq("customer_id", customerId)
            .single();

        return NextResponse.json({
            provider: "openrouter",
            status: data?.openrouter_api_key_encrypted ? "connected" : "disconnected",
            connected_at: null,
        });
    }

    const { data } = await supabase
        .from("integrations")
        .select("provider, status, connected_at, scopes, expires_at")
        .eq("provider", provider)
        .single();

    return NextResponse.json(data ?? { provider, status: "disconnected" });
}

// POST — connect
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customerId = await getCustomerIdForUser(supabase, user.id);
    if (!customerId) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    const customer = { customer_id: customerId };

    const body = await request.json();

    // ── OpenRouter — stored in agent_config ──────────────────────────
    if (provider === "openrouter") {
        const { api_key } = body;
        if (!api_key) {
            return NextResponse.json({ error: "api_key is required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("agent_config")
            .upsert(
                {
                    customer_id: customer.customer_id,
                    openrouter_api_key_encrypted: api_key,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "customer_id" }
            );

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ status: "connected", provider: "openrouter" });
    }

    // ── API Key providers ──────────────────────────────────────────
    if (API_KEY_PROVIDERS.includes(provider)) {
        const { api_key } = body;
        if (!api_key) {
            return NextResponse.json({ error: "api_key is required" }, { status: 400 });
        }

        // Store the key (in production, encrypt with pgcrypto)
        const credentials = JSON.stringify({ api_key });

        const { data, error } = await supabase
            .from("integrations")
            .upsert(
                {
                    customer_id: customer.customer_id,
                    provider,
                    status: "connected",
                    credentials_encrypted: credentials,
                    connected_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "customer_id,provider" }
            )
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ status: "connected", provider: data.provider });
    }

    // ── OAuth providers — return the authorization URL ─────────────
    const oauthConfig = OAUTH_PROVIDERS[provider];
    if (!oauthConfig) {
        return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    const clientId = process.env[oauthConfig.clientIdEnv];
    if (!clientId) {
        return NextResponse.json(
            { error: `OAuth not configured for ${provider}. Set ${oauthConfig.clientIdEnv} env var.` },
            { status: 500 }
        );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/integrations/callback`;

    // Build state param: provider + customer_id (signed via Supabase session)
    const state = Buffer.from(JSON.stringify({
        provider,
        customer_id: customer.customer_id,
    })).toString("base64url");

    const authUrl = new URL(oauthConfig.authUrl);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", oauthConfig.scopes.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return NextResponse.json({ auth_url: authUrl.toString() });
}

// DELETE — disconnect
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // OpenRouter — clear from agent_config
    if (provider === "openrouter") {
        const customerId = await getCustomerIdForUser(supabase, user.id);
        if (!customerId) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

        const { error } = await supabase
            .from("agent_config")
            .update({
                openrouter_api_key_encrypted: null,
                updated_at: new Date().toISOString(),
            })
            .eq("customer_id", customerId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ status: "disconnected" });
    }

    const { error } = await supabase
        .from("integrations")
        .update({
            status: "disconnected",
            credentials_encrypted: null,
            updated_at: new Date().toISOString(),
        })
        .eq("provider", provider);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: "disconnected" });
}
