// ── OAuth Callback Handler ──────────────────────────────────────────
// Handles the redirect from Google OAuth (Gmail, Calendar)
// Exchanges the authorization code for access/refresh tokens and stores them.

import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const TOKEN_URLS: Record<string, string> = {
    gmail: "https://oauth2.googleapis.com/token",
    google_calendar: "https://oauth2.googleapis.com/token",
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(
            new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(
            new URL("/dashboard/integrations?error=missing_params", request.url)
        );
    }

    // Decode state
    let state: { provider: string; customer_id: string };
    try {
        state = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
    } catch {
        return NextResponse.redirect(
            new URL("/dashboard/integrations?error=invalid_state", request.url)
        );
    }

    const { provider, customer_id } = state;
    const tokenUrl = TOKEN_URLS[provider];
    if (!tokenUrl) {
        return NextResponse.redirect(
            new URL(`/dashboard/integrations?error=unknown_provider`, request.url)
        );
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/integrations/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(
            new URL("/dashboard/integrations?error=oauth_not_configured", request.url)
        );
    }

    try {
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.text();
            console.error("Token exchange failed:", errorBody);
            return NextResponse.redirect(
                new URL("/dashboard/integrations?error=token_exchange_failed", request.url)
            );
        }

        const tokens = await tokenResponse.json();

        // Store credentials in Supabase (using admin client to bypass RLS)
        const supabase = createAdminClient();
        const credentials = JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_type: tokens.token_type,
            expires_in: tokens.expires_in,
        });

        const expiresAt = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null;

        await supabase
            .from("integrations")
            .upsert(
                {
                    customer_id,
                    provider,
                    status: "connected",
                    credentials_encrypted: credentials,
                    scopes: tokens.scope ? tokens.scope.split(" ") : [],
                    connected_at: new Date().toISOString(),
                    expires_at: expiresAt,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "customer_id,provider" }
            );

        return NextResponse.redirect(
            new URL(`/dashboard/integrations?connected=${provider}`, request.url)
        );
    } catch (err) {
        console.error("OAuth callback error:", err);
        return NextResponse.redirect(
            new URL("/dashboard/integrations?error=callback_failed", request.url)
        );
    }
}
