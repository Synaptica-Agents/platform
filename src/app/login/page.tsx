"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

type LoginMode = "magic-link" | "password";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [mode, setMode] = useState<LoginMode>("magic-link");

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setMagicLinkSent(true);
        setLoading(false);
    }

    async function handlePasswordLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        window.location.href = "/dashboard";
    }

    // ── Magic link sent confirmation ────────────────────────────────
    if (magicLinkSent) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-foreground">Check your email</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            We sent a login link to <span className="font-medium text-foreground">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-sm text-muted-foreground">
                            Click the link in the email to sign in. It expires in 1 hour.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setMagicLinkSent(false);
                                setEmail("");
                            }}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Login form ──────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <img
                        src="/logo-synaptica.png"
                        alt="Synaptica"
                        className="mx-auto mb-2 h-8 dark:invert-0 invert"
                    />
                    <CardDescription className="text-muted-foreground font-bold">
                        Log in to our AI Founders Associate Portal
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {mode === "magic-link" ? (
                        <form onSubmit={handleMagicLink} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-bold">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="founder@company.com"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <Button
                                type="submit"
                                className="w-full font-bold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send login link
                                    </>
                                )}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setMode("password"); setError(""); }}
                                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Sign in with password instead
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-pw" className="font-bold">
                                    Email
                                </Label>
                                <Input
                                    id="email-pw"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="founder@company.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="font-bold">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <Button
                                type="submit"
                                className="w-full font-bold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    "Log in"
                                )}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setMode("magic-link"); setError(""); }}
                                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Sign in with email link instead
                            </button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
