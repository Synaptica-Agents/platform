"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, AlertTriangle } from "lucide-react";

interface BrainEntry {
    id: string;
    category: string;
    key: string;
    value: string;
    customer_id: string;
    updated_at: string;
}

interface ParsedCriterion {
    description: string;
    weight: number;
    is_ko: boolean;
}

function parseValue(value: string): ParsedCriterion {
    try {
        const p = JSON.parse(value) as Partial<ParsedCriterion>;
        return {
            description: p.description ?? "",
            weight: typeof p.weight === "number" ? p.weight : 10,
            is_ko: !!p.is_ko,
        };
    } catch {
        return { description: value, weight: 10, is_ko: false };
    }
}

interface FormState {
    key: string;
    description: string;
    weight: number;
    is_ko: boolean;
}

const EMPTY_FORM: FormState = { key: "", description: "", weight: 10, is_ko: false };

export function CriteriaEditor({
    entries,
    customerId,
}: {
    entries: BrainEntry[];
    customerId: string;
}) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    function startEdit(entry: BrainEntry) {
        const parsed = parseValue(entry.value);
        setEditingId(entry.id);
        setAdding(false);
        setForm({
            key: entry.key,
            description: parsed.description,
            weight: parsed.weight,
            is_ko: parsed.is_ko,
        });
    }

    function startAdd() {
        setAdding(true);
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    function cancel() {
        setAdding(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    async function save() {
        if (!form.key.trim() || !form.description.trim()) return;
        setSaving(true);
        await fetch("/api/brain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: customerId,
                category: "evaluation",
                key: form.key.trim(),
                value: JSON.stringify({
                    description: form.description.trim(),
                    weight: form.weight,
                    is_ko: form.is_ko,
                }),
            }),
        });
        cancel();
        setSaving(false);
        router.refresh();
    }

    async function remove(id: string) {
        setSaving(true);
        await fetch(`/api/brain?id=${id}`, { method: "DELETE" });
        setSaving(false);
        router.refresh();
    }

    function renderForm() {
        return (
            <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2">
                <Input
                    placeholder="Criterion name (e.g. sales_experience)"
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    disabled={!!editingId}
                    className="border-border bg-muted text-foreground"
                />
                <Textarea
                    placeholder="Description — what should the AI look for?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="border-border bg-muted text-foreground"
                />
                <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground">Weight (0-100)</label>
                    <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form.weight}
                        onChange={(e) =>
                            setForm({ ...form, weight: Number(e.target.value) || 0 })
                        }
                        className="w-24 border-border bg-muted text-foreground"
                    />
                    <label className="flex items-center gap-1 text-xs text-muted-foreground ml-3">
                        <input
                            type="checkbox"
                            checked={form.is_ko}
                            onChange={(e) => setForm({ ...form, is_ko: e.target.checked })}
                        />
                        K.O. criterion
                    </label>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={save}
                        disabled={saving || !form.key.trim() || !form.description.trim()}
                    >
                        {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <ClipboardCheck className="h-4 w-4" /> Evaluation Criteria
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Criteria the AI uses to score new founder applications. K.O.
                            criteria force a &ldquo;Pass (KO)&rdquo; recommendation when failed.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground/80"
                        onClick={adding ? cancel : startAdd}
                    >
                        {adding ? "Cancel" : "+ Add Criterion"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {adding && renderForm()}

                {entries.length === 0 && !adding && (
                    <p className="text-sm text-muted-foreground">
                        No criteria yet. Click &ldquo;+ Add Criterion&rdquo; to define how the AI
                        should score applicants.
                    </p>
                )}

                {entries.map((entry) => {
                    const parsed = parseValue(entry.value);
                    const isEditing = editingId === entry.id;
                    return (
                        <div key={entry.id} className="rounded-md border border-border p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-foreground/90">
                                            {entry.key}
                                        </p>
                                        <Badge variant="secondary" className="bg-accent text-xs">
                                            weight {parsed.weight}
                                        </Badge>
                                        {parsed.is_ko && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-red-900/40 text-red-300 text-xs"
                                            >
                                                <AlertTriangle className="h-3 w-3 mr-1" /> K.O.
                                            </Badge>
                                        )}
                                    </div>
                                    {!isEditing && (
                                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                                            {parsed.description}
                                        </p>
                                    )}
                                </div>
                                {!isEditing && (
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-muted-foreground"
                                            onClick={() => startEdit(entry)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-red-400 hover:text-red-300"
                                            onClick={() => remove(entry.id)}
                                            disabled={saving}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {isEditing && <div className="mt-3">{renderForm()}</div>}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
