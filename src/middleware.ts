// ── Auth Middleware — Protects all routes except /login and /auth ────
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Public routes that don't require auth
    const publicPaths = ["/login", "/auth/callback", "/auth/confirm"];
    const isPublicPath = publicPaths.some((p) =>
        request.nextUrl.pathname.startsWith(p)
    );

    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // If logged in and visiting /login, redirect to dashboard
    if (user && request.nextUrl.pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    // Block non-admin users from admin-only dashboard pages
    const adminOnlyPaths = [
        "/dashboard/brain",
        "/dashboard/jobs",
        "/dashboard/skills",
        "/dashboard/approvals",
        "/dashboard/admin",
    ];
    const isAdmin = user?.user_metadata?.is_admin === true;
    if (
        user &&
        !isAdmin &&
        adminOnlyPaths.some((p) => request.nextUrl.pathname.startsWith(p))
    ) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
