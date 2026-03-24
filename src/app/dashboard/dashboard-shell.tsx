"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Brain,
    Plug,
    CalendarClock,
    Zap,
    ClipboardCheck,
    Settings,
    Search,
    LogOut,
    ChevronRight,
    Bot,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export interface DashboardUser {
    email: string;
    isAdmin: boolean;
    customerId: string | null;
    displayName: string;
    logoUrl?: string | null;
    /** If set, only show these page slugs in sidebar. null = show all non-admin pages. */
    visiblePages?: string[] | null;
}

// slug matches the path segment after /dashboard (empty string = overview)
const mainNavItems = [
    { title: "Overview", href: "/dashboard", slug: "overview", icon: LayoutDashboard, adminOnly: false },
    { title: "Agents", href: "/dashboard/agents", slug: "agents", icon: Bot, adminOnly: false },
    { title: "Company Brain", href: "/dashboard/brain", slug: "brain", icon: Brain, adminOnly: true },
    { title: "Integrations", href: "/dashboard/integrations", slug: "integrations", icon: Plug, adminOnly: false },
    { title: "Jobs", href: "/dashboard/jobs", slug: "jobs", icon: CalendarClock, adminOnly: true },
    { title: "Skills", href: "/dashboard/skills", slug: "skills", icon: Zap, adminOnly: true },
    { title: "Approvals", href: "/dashboard/approvals", slug: "approvals", icon: ClipboardCheck, adminOnly: true },
];

const pageTitles: Record<string, string> = {
    "/dashboard": "Overview",
    "/dashboard/agents": "Agents",
    "/dashboard/brain": "Company Brain",
    "/dashboard/integrations": "Integrations",
    "/dashboard/jobs": "Jobs",
    "/dashboard/skills": "Skills",
    "/dashboard/approvals": "Approvals",
    "/dashboard/settings": "Settings",
};

export function DashboardShell({
    user,
    children,
}: {
    user: DashboardUser;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const supabase = createClient();

    async function handleSignOut() {
        await supabase.auth.signOut();
        window.location.href = "/login";
    }

    const initials = user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const currentPageTitle = pageTitles[pathname] ?? "Dashboard";

    // Build visible pages set from customer config
    const visibleSet = user.visiblePages ? new Set(user.visiblePages) : null;

    // Filter nav items: admin sees admin-only items; visiblePages further restricts non-admin items
    const filteredNavItems = mainNavItems.filter((item) => {
        // Admin-only items: only admin sees them
        if (item.adminOnly && !user.isAdmin) return false;
        // Admin always sees everything
        if (user.isAdmin) return true;
        // If no visiblePages set, show all non-admin items
        if (!visibleSet) return true;
        // Otherwise, only show if in the visible set
        return visibleSet.has(item.slug);
    });

    // Show settings link only if admin or visiblePages includes "settings"
    const showSettings = user.isAdmin || !visibleSet || visibleSet.has("settings");

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" className="border-border">
                <SidebarHeader className="border-b border-border px-4 py-3">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        {user.logoUrl ? (
                            <img
                                src={user.logoUrl}
                                alt={user.displayName}
                                className="h-7 group-data-[collapsible=icon]:h-6"
                            />
                        ) : (
                            <img
                                src="/logo-synaptica.png"
                                alt="Synaptica Agents"
                                className="h-7 dark:invert-0 invert group-data-[collapsible=icon]:h-6"
                            />
                        )}
                        {user.isAdmin && (
                            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary group-data-[collapsible=icon]:hidden">
                                Admin
                            </span>
                        )}
                    </Link>
                    <div className="relative mt-3 group-data-[collapsible=icon]:hidden">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search for..."
                            className="pl-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filteredNavItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                render={<Link href={item.href} />}
                                                isActive={isActive}
                                                className={isActive ? "border-l-2 border-primary" : ""}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {showSettings && (
                        <>
                            <SidebarSeparator />

                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                render={<Link href="/dashboard/settings" />}
                                                isActive={pathname === "/dashboard/settings"}
                                                className={pathname === "/dashboard/settings" ? "border-l-2 border-primary" : ""}
                                            >
                                                <Settings className="h-4 w-4" />
                                                <span>Settings</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </>
                    )}
                </SidebarContent>

                <SidebarFooter className="border-t border-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={<button className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-accent" />}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                                <p className="text-sm font-medium text-foreground">
                                    {user.displayName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Account settings
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-12 items-center gap-2 border-b border-border px-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm font-medium text-foreground">
                        {currentPageTitle}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                        {user.isAdmin
                            ? (user.customerId ?? "No instance linked")
                            : `Welcome, ${user.displayName}`}
                    </span>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
