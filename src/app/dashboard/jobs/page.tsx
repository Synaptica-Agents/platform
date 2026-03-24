import { createClient } from "@/lib/supabase/server";
import { JobsManager } from "./jobs-manager";

export default async function JobsPage() {
    const supabase = await createClient();

    const { data: jobs } = await supabase
        .from("scheduled_jobs")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Scheduled Jobs</h1>
                <p className="text-muted-foreground">
                    Configure proactive automation — market briefings, prospecting, content
                </p>
            </div>
            <JobsManager jobs={jobs ?? []} />
        </div>
    );
}
