"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProviderConfig {
    id: string;
    name: string;
    description: string;
    authType: "api_key" | "oauth";
    keyPlaceholder?: string;
}

const PROVIDERS: ProviderConfig[] = [
    { id: "apollo", name: "Apollo.io", description: "Lead prospecting & enrichment", authType: "api_key", keyPlaceholder: "apollo-api-key..." },
    { id: "gmail", name: "Gmail", description: "Email reading & drafting", authType: "oauth" },
    { id: "google_calendar", name: "Google Calendar", description: "Meeting scheduling", authType: "oauth" },
    { id: "notion", name: "Notion", description: "Databases & pages — read & create", authType: "api_key", keyPlaceholder: "ntn_..." },
    { id: "openrouter", name: "OpenRouter", description: "LLM routing — your API key for all models", authType: "api_key", keyPlaceholder: "sk-or-..." },
    { id: "attio", name: "Attio", description: "CRM — contacts & deals", authType: "api_key", keyPlaceholder: "attio-api-key..." },
    { id: "hubspot", name: "HubSpot", description: "CRM — contacts & pipeline", authType: "api_key", keyPlaceholder: "pat-..." },
];

interface IntegrationStatus {
    provider: string;
    status: string;
    connected_at: string | null;
}

export function IntegrationsHub({
    integrations,
    visibleIntegrations,
}: {
    integrations: IntegrationStatus[];
    /** If set, only show these provider IDs. null/undefined = show all (admin). */
    visibleIntegrations?: string[] | null;
}) {
    const router = useRouter();
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const statusMap = new Map(integrations.map((i) => [i.provider, i]));

    // Filter providers based on customer's visible_integrations config
    const visibleSet = visibleIntegrations ? new Set(visibleIntegrations) : null;
    const filteredProviders = visibleSet
        ? PROVIDERS.filter((p) => visibleSet.has(p.id))
        : PROVIDERS;

    async function handleApiKeyConnect(providerId: string) {
        if (!apiKeyInput.trim()) return;
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/integrations/${providerId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: apiKeyInput.trim() }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Failed to connect");
            setLoading(false);
            return;
        }

        setApiKeyInput("");
        setConnectingId(null);
        setLoading(false);
        router.refresh();
    }

    async function handleOAuthConnect(providerId: string) {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/integrations/${providerId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error || "Failed to start OAuth");
            return;
        }

        if (data.auth_url) {
            window.location.href = data.auth_url;
        }
    }

    async function handleDisconnect(providerId: string) {
        setLoading(true);
        await fetch(`/api/integrations/${providerId}`, { method: "DELETE" });
        setLoading(false);
        router.refresh();
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-md border border-red-800 bg-red-900/20 p-3">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {filteredProviders.map((provider) => {
                    const integration = statusMap.get(provider.id);
                    const isConnected = integration?.status === "connected";
                    const isExpanding = connectingId === provider.id;

                    return (
                        <Card key={provider.id} className="border-border bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-foreground">{provider.name}</CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            {provider.description}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            isConnected
                                                ? "border-green-600 text-green-400"
                                                : "border-border text-muted-foreground"
                                        }
                                    >
                                        {isConnected ? "Connected" : "Not connected"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isConnected ? (
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">
                                            Connected{" "}
                                            {integration?.connected_at
                                                ? new Date(integration.connected_at).toLocaleDateString()
                                                : ""}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-border text-foreground/80"
                                            onClick={() => handleDisconnect(provider.id)}
                                            disabled={loading}
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                ) : provider.authType === "api_key" ? (
                                    isExpanding ? (
                                        <div className="space-y-2">
                                            <Input
                                                type="password"
                                                placeholder={provider.keyPlaceholder || "Enter API key..."}
                                                value={apiKeyInput}
                                                onChange={(e) => setApiKeyInput(e.target.value)}
                                                className="border-border bg-muted text-foreground font-mono text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApiKeyConnect(provider.id)}
                                                    disabled={loading || !apiKeyInput.trim()}
                                                >
                                                    {loading ? "Connecting..." : "Connect"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-muted-foreground"
                                                    onClick={() => {
                                                        setConnectingId(null);
                                                        setApiKeyInput("");
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                setConnectingId(provider.id);
                                                setApiKeyInput("");
                                                setError(null);
                                            }}
                                        >
                                            Enter API Key
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => handleOAuthConnect(provider.id)}
                                        disabled={loading}
                                    >
                                        {loading ? "Redirecting..." : "Connect with Google"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
