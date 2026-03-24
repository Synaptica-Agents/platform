"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentConfig {
    has_openrouter_key: boolean;
    coordinator_model: string | null;
    research_model: string | null;
    sales_model: string | null;
    content_model: string | null;
    max_agent_iterations: number | null;
    max_task_cost_usd: number | null;
    personality: string | null;
    answer_length: string | null;
    timezone: string | null;
    language: string | null;
}

const MODEL_OPTIONS = [
    "google/gemini-2.5-flash-preview",
    "google/gemini-2.5-pro-preview",
    "anthropic/claude-sonnet-4",
    "anthropic/claude-haiku-4",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "deepseek/deepseek-chat-v3",
];

export function SettingsForm({
    config,
    isAdmin = true,
    readOnly = false,
}: {
    config: AgentConfig;
    isAdmin?: boolean;
    readOnly?: boolean;
}) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [showKeyInput, setShowKeyInput] = useState(false);

    const [models, setModels] = useState({
        coordinator_model: config.coordinator_model ?? "google/gemini-2.5-flash-preview",
        research_model: config.research_model ?? "google/gemini-2.5-flash-preview",
        sales_model: config.sales_model ?? "google/gemini-2.5-flash-preview",
        content_model: config.content_model ?? "google/gemini-2.5-flash-preview",
    });

    const [prefs, setPrefs] = useState({
        personality: config.personality ?? "default",
        language: config.language ?? "en",
        timezone: config.timezone ?? "UTC",
        answer_length: config.answer_length ?? "normal",
    });

    const [limits, setLimits] = useState({
        max_task_cost_usd: config.max_task_cost_usd ?? 2,
        max_agent_iterations: config.max_agent_iterations ?? 15,
    });

    async function saveApiKey() {
        if (!apiKey.trim()) return;
        setSaving(true);
        await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ openrouter_api_key_encrypted: apiKey.trim() }),
        });
        setApiKey("");
        setShowKeyInput(false);
        setSaving(false);
        router.refresh();
    }

    async function saveModels() {
        setSaving(true);
        await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(models),
        });
        setSaving(false);
        router.refresh();
    }

    async function savePrefs() {
        setSaving(true);
        await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prefs),
        });
        setSaving(false);
        router.refresh();
    }

    async function saveLimits() {
        setSaving(true);
        await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(limits),
        });
        setSaving(false);
        router.refresh();
    }

    const selectClass = readOnly
        ? "w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground cursor-default"
        : "w-full rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground";

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Model Configuration */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-foreground">Model Configuration</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {readOnly ? "AI models powering each agent" : "Choose which AI models power each agent"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(["coordinator_model", "research_model", "sales_model", "content_model"] as const).map((field) => (
                        <div key={field} className="space-y-1">
                            <Label className="text-xs text-muted-foreground capitalize">
                                {field.replace("_model", "")}
                            </Label>
                            <select
                                value={models[field]}
                                onChange={(e) => !readOnly && setModels({ ...models, [field]: e.target.value })}
                                disabled={readOnly}
                                className={selectClass}
                            >
                                {MODEL_OPTIONS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                    {!readOnly && (
                        <Button size="sm" onClick={saveModels} disabled={saving}>
                            {saving ? "Saving..." : "Save Models"}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Agent Preferences */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-foreground">Agent Preferences</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {readOnly ? "Current personality and behavior settings" : "Personality, language, and behavior settings"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Personality</Label>
                        <select
                            value={prefs.personality}
                            onChange={(e) => !readOnly && setPrefs({ ...prefs, personality: e.target.value })}
                            disabled={readOnly}
                            className={selectClass}
                        >
                            <option value="default">Default</option>
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="concise">Concise</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Language</Label>
                        <select
                            value={prefs.language}
                            onChange={(e) => !readOnly && setPrefs({ ...prefs, language: e.target.value })}
                            disabled={readOnly}
                            className={selectClass}
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="de">German</option>
                            <option value="pt">Portuguese</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Timezone</Label>
                        <Input
                            value={prefs.timezone}
                            onChange={(e) => !readOnly && setPrefs({ ...prefs, timezone: e.target.value })}
                            disabled={readOnly}
                            placeholder="America/New_York"
                            className={readOnly
                                ? "border-border bg-muted/50 text-muted-foreground text-sm cursor-default"
                                : "border-border bg-muted text-foreground text-sm"
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Answer Length</Label>
                        <select
                            value={prefs.answer_length}
                            onChange={(e) => !readOnly && setPrefs({ ...prefs, answer_length: e.target.value })}
                            disabled={readOnly}
                            className={selectClass}
                        >
                            <option value="short">Short</option>
                            <option value="normal">Normal</option>
                            <option value="detailed">Detailed</option>
                        </select>
                    </div>
                    {!readOnly && (
                        <Button size="sm" onClick={savePrefs} disabled={saving}>
                            {saving ? "Saving..." : "Save Preferences"}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* OpenRouter API Key — only in editable mode */}
            {!readOnly && (
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-foreground">OpenRouter API Key</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Your LLM provider key — you control your own costs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {config.has_openrouter_key
                                ? "API key configured"
                                : "No API key set — enter one to activate your agent"}
                        </p>
                        {showKeyInput ? (
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="sk-or-..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="border-border bg-muted text-foreground font-mono text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={saveApiKey} disabled={saving || !apiKey.trim()}>
                                        {saving ? "Saving..." : "Save Key"}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowKeyInput(false)} className="text-muted-foreground">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border text-foreground/80"
                                onClick={() => setShowKeyInput(true)}
                            >
                                {config.has_openrouter_key ? "Update Key" : "Enter Key"}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Safety Limits — admin only */}
            {isAdmin && !readOnly && <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-foreground">Safety Limits</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Cost and iteration budgets per task
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Max cost per task (USD)</Label>
                        <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="50"
                            value={limits.max_task_cost_usd}
                            onChange={(e) => setLimits({ ...limits, max_task_cost_usd: parseFloat(e.target.value) })}
                            className="border-border bg-muted text-foreground text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Max agent iterations</Label>
                        <Input
                            type="number"
                            min="1"
                            max="50"
                            value={limits.max_agent_iterations}
                            onChange={(e) => setLimits({ ...limits, max_agent_iterations: parseInt(e.target.value) })}
                            className="border-border bg-muted text-foreground text-sm"
                        />
                    </div>
                    <Button size="sm" onClick={saveLimits} disabled={saving}>
                        {saving ? "Saving..." : "Save Limits"}
                    </Button>
                </CardContent>
            </Card>}
        </div>
    );
}
