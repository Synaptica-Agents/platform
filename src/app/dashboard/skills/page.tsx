import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SkillsPage() {
    const supabase = await createClient();

    const { data: skills } = await supabase
        .from("skills")
        .select("*")
        .order("category")
        .order("name");

    const coreSkills = skills?.filter((s) => s.is_core) ?? [];
    const librarySkills = skills?.filter((s) => !s.is_core && !s.customer_id) ?? [];
    const customSkills = skills?.filter((s) => s.customer_id) ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Skills</h1>
                <p className="text-muted-foreground">
                    Capabilities your agent uses to get work done
                </p>
            </div>

            <Tabs defaultValue="core">
                <TabsList className="bg-card">
                    <TabsTrigger value="core" className="data-[state=active]:bg-muted">
                        Core ({coreSkills.length})
                    </TabsTrigger>
                    <TabsTrigger value="library" className="data-[state=active]:bg-muted">
                        Library ({librarySkills.length})
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="data-[state=active]:bg-muted">
                        Custom ({customSkills.length})
                    </TabsTrigger>
                </TabsList>

                {[
                    { key: "core", items: coreSkills, empty: "Core skills will be populated when your agent boots up." },
                    { key: "library", items: librarySkills, empty: "The shared skill library is being built. Check back soon." },
                    { key: "custom", items: customSkills, empty: "No custom skills yet. These are created as your agent learns." },
                ].map(({ key, items, empty }) => (
                    <TabsContent key={key} value={key}>
                        {items.length > 0 ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {items.map((skill) => (
                                    <Card key={skill.id} className="border-border bg-card">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm text-foreground">{skill.name}</CardTitle>
                                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                                    {skill.category}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-muted-foreground">{skill.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-border bg-card">
                                <CardContent className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">{empty}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
