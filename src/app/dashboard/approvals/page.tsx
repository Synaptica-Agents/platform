import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ApprovalsPage() {
    const supabase = await createClient();

    const { data: approvals } = await supabase
        .from("approval_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    const pending = approvals?.filter((a) => a.status === "pending") ?? [];
    const resolved = approvals?.filter((a) => a.status !== "pending") ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Approval Queue</h1>
                <p className="text-muted-foreground">
                    Review and approve actions proposed by your agent
                </p>
            </div>

            {pending.length > 0 ? (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground">
                        Pending ({pending.length})
                    </h2>
                    {pending.map((item) => (
                        <Card key={item.id} className="border-amber-800/30 bg-card">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm text-foreground">{item.title || item.action_type}</CardTitle>
                                    <Badge className="bg-amber-500/20 text-amber-400">
                                        Pending
                                    </Badge>
                                </div>
                                <CardDescription className="text-muted-foreground">
                                    {item.action_type} — {new Date(item.created_at).toLocaleString()}
                                </CardDescription>
                            </CardHeader>
                            {item.context && (
                                <CardContent>
                                    <p className="text-xs text-muted-foreground">{item.context}</p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-border bg-card">
                    <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            No pending approvals. Your agent will submit actions here for your review.
                        </p>
                    </CardContent>
                </Card>
            )}

            {resolved.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-muted-foreground">
                        Recent ({resolved.length})
                    </h2>
                    {resolved.map((item) => (
                        <Card key={item.id} className="border-border bg-card/50">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm text-muted-foreground">{item.title || item.action_type}</CardTitle>
                                    <Badge
                                        variant="outline"
                                        className={
                                            item.status === "approved"
                                                ? "border-green-600 text-green-400"
                                                : "border-red-600 text-red-400"
                                        }
                                    >
                                        {item.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
