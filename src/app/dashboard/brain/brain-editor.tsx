"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Target, BarChart3, PenLine, Settings, Users } from "lucide-react";

const CATEGORIES = [
    { id: "identity", label: "Identity", icon: Building2, desc: "Company mission, product, pricing, stage, funding" },
    { id: "icp", label: "ICP", icon: Target, desc: "Ideal Customer Profile — who you sell to" },
    { id: "market", label: "Market", icon: BarChart3, desc: "Competitors, positioning, market dynamics" },
    { id: "voice", label: "Voice", icon: PenLine, desc: "Writing style, tone, vocabulary patterns" },
    { id: "process", label: "Process", icon: Settings, desc: "Sales flow, outreach cadence, follow-up rules" },
    { id: "team", label: "Team", icon: Users, desc: "Team members, roles, responsibilities" },
] as const;

interface BrainEntry {
    id: string;
    category: string;
    key: string;
    value: string;
    customer_id: string;
    updated_at: string;
}

export function BrainEditor({
    entries,
    customerId,
}: {
    entries: BrainEntry[];
    customerId: string;
}) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [addingCategory, setAddingCategory] = useState<string | null>(null);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");

    const grouped: Record<string, BrainEntry[]> = {};
    for (const entry of entries) {
        if (!grouped[entry.category]) grouped[entry.category] = [];
        grouped[entry.category].push(entry);
    }

    async function handleSave(entry: BrainEntry) {
        setSaving(true);
        await fetch("/api/brain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: entry.customer_id,
                category: entry.category,
                key: entry.key,
                value: editValue,
            }),
        });
        setEditingId(null);
        setSaving(false);
        router.refresh();
    }

    async function handleAdd(category: string) {
        if (!newKey.trim() || !newValue.trim()) return;
        setSaving(true);
        await fetch("/api/brain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: customerId,
                category,
                key: newKey.trim(),
                value: newValue.trim(),
            }),
        });
        setAddingCategory(null);
        setNewKey("");
        setNewValue("");
        setSaving(false);
        router.refresh();
    }

    async function handleDelete(id: string) {
        setSaving(true);
        await fetch(`/api/brain?id=${id}`, { method: "DELETE" });
        setSaving(false);
        router.refresh();
    }

    return (
        <Tabs defaultValue="identity">
            <TabsList className="bg-card">
                {CATEGORIES.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-muted">
                        <cat.icon className="h-3.5 w-3.5 mr-1" /> {cat.label}
                        {grouped[cat.id]?.length ? (
                            <Badge variant="secondary" className="ml-1.5 bg-accent text-xs">
                                {grouped[cat.id].length}
                            </Badge>
                        ) : null}
                    </TabsTrigger>
                ))}
            </TabsList>

            {CATEGORIES.map((cat) => (
                <TabsContent key={cat.id} value={cat.id}>
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-foreground">
                                        <cat.icon className="h-4 w-4" /> {cat.label}
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        {cat.desc}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground/80"
                                    onClick={() => {
                                        setAddingCategory(addingCategory === cat.id ? null : cat.id);
                                        setNewKey("");
                                        setNewValue("");
                                    }}
                                >
                                    {addingCategory === cat.id ? "Cancel" : "+ Add Entry"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {addingCategory === cat.id && (
                                <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2">
                                    <Input
                                        placeholder="Key (e.g. company_name, target_role)"
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                        className="border-border bg-muted text-foreground"
                                    />
                                    <Textarea
                                        placeholder="Value"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        rows={3}
                                        className="border-border bg-muted text-foreground"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleAdd(cat.id)}
                                        disabled={saving || !newKey.trim() || !newValue.trim()}
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            )}

                            {grouped[cat.id]?.length ? (
                                grouped[cat.id].map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-md border border-border p-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <p className="text-sm font-medium text-foreground/80">
                                                {entry.key}
                                            </p>
                                            <div className="flex gap-1">
                                                {editingId === entry.id ? (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-muted-foreground"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={() => handleSave(entry)}
                                                            disabled={saving}
                                                        >
                                                            {saving ? "..." : "Save"}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-muted-foreground"
                                                            onClick={() => {
                                                                setEditingId(entry.id);
                                                                setEditValue(entry.value);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-red-400 hover:text-red-300"
                                                            onClick={() => handleDelete(entry.id)}
                                                            disabled={saving}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {editingId === entry.id ? (
                                            <Textarea
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                rows={4}
                                                className="mt-2 border-border bg-muted text-foreground"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                                                {entry.value}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                !addingCategory && (
                                    <p className="text-sm text-muted-foreground">
                                        No entries yet. Click &ldquo;+ Add Entry&rdquo; or complete the onboarding to populate this section.
                                    </p>
                                )
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            ))}
        </Tabs>
    );
}
