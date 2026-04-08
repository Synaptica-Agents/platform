"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw } from "lucide-react";

interface NotionDatabase {
    id: string;
    title: string;
    url?: string;
    last_edited_time?: string;
}

export function ConnectedDatabases({ notionConnected }: { notionConnected: boolean }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [databases, setDatabases] = useState<NotionDatabase[]>([]);
    const [hasFetched, setHasFetched] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/notion/databases");
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? "Failed to load databases");
            } else {
                setDatabases(json.databases ?? []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
            setHasFetched(true);
        }
    }

    useEffect(() => {
        if (notionConnected) load();
    }, [notionConnected]);

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <Database className="h-4 w-4" /> Connected Databases
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Notion databases your integration token has access to.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground/80"
                        onClick={load}
                        disabled={loading || !notionConnected}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {!notionConnected ? (
                    <p className="text-sm text-muted-foreground">
                        Notion is not connected. Add your Notion API key in the{" "}
                        <a href="/dashboard/integrations" className="underline">
                            Integrations
                        </a>{" "}
                        tab first.
                    </p>
                ) : error ? (
                    <p className="text-sm text-red-400">{error}</p>
                ) : loading && !hasFetched ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : databases.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No databases visible. Make sure you&apos;ve shared the relevant
                        databases with your Notion integration.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {databases.map((db) => (
                            <div
                                key={db.id}
                                className="flex items-center justify-between rounded-md border border-border p-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground/90 truncate">
                                        {db.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono truncate">
                                        {db.id}
                                    </p>
                                </div>
                                {db.last_edited_time && (
                                    <Badge variant="secondary" className="bg-accent text-xs ml-3 shrink-0">
                                        {new Date(db.last_edited_time).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
