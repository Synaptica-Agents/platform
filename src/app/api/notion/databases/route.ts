// ── Notion Databases API ────────────────────────────────────────────
// GET /api/notion/databases — list Notion databases the customer's
// integration token has access to. Reads the API key from the
// `integrations` table (provider='notion'), then calls Notion's
// /v1/search endpoint with a database filter. No caching.

import { createClient } from "@/lib/supabase/server";
import { getCustomerIdForUser } from "@/lib/supabase/get-customer";
import { NextResponse } from "next/server";

const NOTION_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

interface NotionDatabase {
    id: string;
    title: string;
    url?: string;
    last_edited_time?: string;
}

interface NotionSearchResult {
    object: "database" | "page";
    id: string;
    url?: string;
    last_edited_time?: string;
    title?: Array<{ plain_text?: string }>;
}

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customerId = await getCustomerIdForUser(supabase, user.id);
    if (!customerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { data: integration } = await supabase
        .from("integrations")
        .select("credentials_encrypted, status")
        .eq("customer_id", customerId)
        .eq("provider", "notion")
        .single();

    if (!integration?.credentials_encrypted || integration.status !== "connected") {
        return NextResponse.json(
            { connected: false, databases: [] as NotionDatabase[] },
        );
    }

    let apiKey: string;
    try {
        const parsed = JSON.parse(integration.credentials_encrypted);
        apiKey = parsed.api_key;
    } catch {
        return NextResponse.json(
            { error: "Invalid Notion credentials" },
            { status: 500 },
        );
    }
    if (!apiKey) {
        return NextResponse.json(
            { connected: false, databases: [] as NotionDatabase[] },
        );
    }

    try {
        const response = await fetch(`${NOTION_BASE}/search`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                filter: { property: "object", value: "database" },
                page_size: 100,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: `Notion API error: ${response.status} ${text}` },
                { status: 502 },
            );
        }

        const data = (await response.json()) as { results?: NotionSearchResult[] };
        const databases: NotionDatabase[] = (data.results ?? [])
            .filter((r) => r.object === "database")
            .map((r) => ({
                id: r.id,
                title:
                    (r.title ?? [])
                        .map((t) => t.plain_text ?? "")
                        .join("")
                        .trim() || "(untitled)",
                url: r.url,
                last_edited_time: r.last_edited_time,
            }));

        return NextResponse.json({ connected: true, databases });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
