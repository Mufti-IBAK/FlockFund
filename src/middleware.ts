import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// ── Dashboard routes — all require authentication ──
// Keep in sync with DASHBOARD_ROUTES in lib/constants.ts
// (We can't dynamically import from constants here because
//  Next.js middleware runs in the Edge runtime.)
const DASHBOARD_ROUTES = [
  "/admin",
  "/manager",
  "/keeper",
  "/investor",
  "/accountant",
  "/sales-manager",
  "/community",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Static assets & API — skip middleware entirely ──
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── 2. Check if route requires auth ──
  const isDashboard = DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // If we don't have supabase envs, allow public, but block dashboard
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (isDashboard) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If it's a public route, just return the response (session refreshed)
  if (!isDashboard) {
    return response;
  }

  // ── 3. Dashboard Route: user must be logged in ──
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 4. Dashboard route — check role access ──
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[Middleware] Profile fetch error:", profileError.message);
  }

  const userRole = profile?.role || "investor";

  // ★ Admin can access ALL dashboard routes (for role-switching/review)
  if (userRole === "admin") {
    return response;
  }

  // Non-admin users: check if they're on the right dashboard
  const correctDashboard = getRoleDashboard(userRole);
  const isOnCorrectRoute =
    pathname === correctDashboard ||
    pathname.startsWith(correctDashboard + "/");

  if (!isOnCorrectRoute) {
    return NextResponse.redirect(new URL(correctDashboard, request.url));
  }

  return response;
}

/**
 * Maps a user role to its dashboard base path.
 * Keep in sync with ROLE_DASHBOARD_MAP in lib/constants.ts.
 */
function getRoleDashboard(role?: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "farm_manager":
      return "/manager";
    case "keeper":
      return "/keeper";
    case "accountant":
      return "/accountant";
    case "sales_manager":
      return "/sales-manager";
    case "investor":
    default:
      return "/investor";
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
