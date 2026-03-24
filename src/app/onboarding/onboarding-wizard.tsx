"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StepConfig {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    fields: {
        key: string;
        label: string;
        placeholder: string;
        type: "input" | "textarea";
        required?: boolean;
    }[];
}

const STEPS: StepConfig[] = [
    {
        id: "identity",
        title: "Tell us about your company",
        subtitle: "This helps your agent represent you accurately",
        category: "identity",
        fields: [
            { key: "company_name", label: "Company Name", placeholder: "Acme Corp", type: "input", required: true },
            { key: "product", label: "What do you sell?", placeholder: "B2B SaaS for supply chain optimization", type: "textarea", required: true },
            { key: "stage", label: "Company Stage", placeholder: "Pre-seed / Seed / Series A / Bootstrapped", type: "input" },
            { key: "founding_year", label: "Founded", placeholder: "2024", type: "input" },
            { key: "website", label: "Website", placeholder: "https://acme.com", type: "input" },
            { key: "elevator_pitch", label: "Elevator Pitch (2-3 sentences)", placeholder: "We help mid-market manufacturers reduce procurement costs by 30% through AI-powered supplier matching...", type: "textarea" },
        ],
    },
    {
        id: "icp",
        title: "Who is your Ideal Customer?",
        subtitle: "Your agent uses this to find and qualify leads",
        category: "icp",
        fields: [
            { key: "target_industry", label: "Target Industries", placeholder: "Manufacturing, Logistics, Retail", type: "input", required: true },
            { key: "target_company_size", label: "Company Size", placeholder: "50-500 employees / $10M-$100M revenue", type: "input", required: true },
            { key: "target_role", label: "Decision Maker Title", placeholder: "VP of Operations, Head of Procurement, COO", type: "input", required: true },
            { key: "target_geography", label: "Geography", placeholder: "DACH region, Western Europe", type: "input" },
            { key: "pain_points", label: "Key Pain Points You Solve", placeholder: "- Supplier fragmentation\n- Manual procurement processes\n- Lack of spend visibility", type: "textarea" },
            { key: "disqualifiers", label: "Disqualifiers (who NOT to target)", placeholder: "Companies under 20 employees, government agencies, companies already using SAP Ariba", type: "textarea" },
        ],
    },
    {
        id: "market",
        title: "Market & Competition",
        subtitle: "Your agent monitors these for intelligence",
        category: "market",
        fields: [
            { key: "competitors", label: "Main Competitors", placeholder: "Competitor A, Competitor B, Competitor C", type: "textarea", required: true },
            { key: "positioning", label: "Your Differentiation", placeholder: "We're the only solution that combines AI supplier matching with real-time quality scoring", type: "textarea" },
            { key: "market_trends", label: "Key Market Trends to Track", placeholder: "Supply chain AI adoption, nearshoring, ESG compliance requirements", type: "textarea" },
        ],
    },
    {
        id: "voice",
        title: "Your Voice & Style",
        subtitle: "Paste examples so your agent writes like you",
        category: "voice",
        fields: [
            { key: "tone", label: "How should your agent sound?", placeholder: "Professional but approachable. Data-driven. No corporate jargon. Occasionally witty.", type: "textarea" },
            { key: "example_post_1", label: "Example LinkedIn Post or Email (paste one)", placeholder: "Paste a real post or email you've written that represents your style...", type: "textarea" },
            { key: "example_post_2", label: "Another Example (optional)", placeholder: "A second example helps improve style matching...", type: "textarea" },
            { key: "words_to_avoid", label: "Words/Phrases to Never Use", placeholder: "synergy, leverage, disruptive, game-changer", type: "input" },
        ],
    },
];

export function OnboardingWizard({
    customerId,
    hasExistingEntries,
}: {
    customerId: string;
    hasExistingEntries: boolean;
}) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [values, setValues] = useState<Record<string, Record<string, string>>>({});

    const currentStep = STEPS[step];
    const isLastStep = step === STEPS.length - 1;

    function updateField(category: string, key: string, value: string) {
        setValues((prev) => ({
            ...prev,
            [category]: { ...prev[category], [key]: value },
        }));
    }

    async function saveCurrentStep() {
        setSaving(true);
        const stepValues = values[currentStep.category] ?? {};

        // Save each non-empty field
        const promises = Object.entries(stepValues)
            .filter(([, v]) => v.trim())
            .map(([key, value]) =>
                fetch("/api/brain", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer_id: customerId,
                        category: currentStep.category,
                        key,
                        value: value.trim(),
                    }),
                })
            );

        await Promise.all(promises);
        setSaving(false);
    }

    async function handleNext() {
        await saveCurrentStep();
        if (isLastStep) {
            router.push("/dashboard");
        } else {
            setStep(step + 1);
        }
    }

    function handleBack() {
        if (step > 0) setStep(step - 1);
    }

    const stepValues = values[currentStep.category] ?? {};
    const hasRequiredFields = currentStep.fields
        .filter((f) => f.required)
        .every((f) => (stepValues[f.key] ?? "").trim().length > 0);

    return (
        <Card className="w-full max-w-2xl border-border bg-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl text-foreground">
                            {currentStep.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {currentStep.subtitle}
                        </CardDescription>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        Step {step + 1} of {STEPS.length}
                    </span>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-1 w-full rounded-full bg-muted">
                    <div
                        className="h-1 rounded-full bg-white transition-all"
                        style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {currentStep.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                        <Label className="text-sm text-foreground/80">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                        </Label>
                        {field.type === "textarea" ? (
                            <Textarea
                                placeholder={field.placeholder}
                                value={stepValues[field.key] ?? ""}
                                onChange={(e) => updateField(currentStep.category, field.key, e.target.value)}
                                rows={3}
                                className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                            />
                        ) : (
                            <Input
                                placeholder={field.placeholder}
                                value={stepValues[field.key] ?? ""}
                                onChange={(e) => updateField(currentStep.category, field.key, e.target.value)}
                                className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                            />
                        )}
                    </div>
                ))}

                <div className="flex items-center justify-between pt-4">
                    <div className="flex gap-2">
                        {step > 0 && (
                            <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
                                Back
                            </Button>
                        )}
                        {hasExistingEntries && step === 0 && (
                            <Button
                                variant="ghost"
                                onClick={() => router.push("/dashboard")}
                                className="text-muted-foreground"
                            >
                                Skip (already onboarded)
                            </Button>
                        )}
                    </div>
                    <Button
                        onClick={handleNext}
                        disabled={saving || !hasRequiredFields}
                    >
                        {saving
                            ? "Saving..."
                            : isLastStep
                              ? "Complete Setup"
                              : "Next"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
