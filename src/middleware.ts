import { type NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// Public routes (no auth required)
const PUBLIC_ROUTES = ['/', '/how-it-works', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback'];

// Dashboard routes — all require login, but admins can access any of them
const DASHBOARD_ROUTES = ['/admin', '/manager', '/keeper', '/investor', '/community'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Static assets & API — skip middleware entirely ──
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── 2. Public routes — allow through, just refresh session ──
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.next();
    }

    const { supabase, response } = createMiddlewareClient(request);
    // Refresh the session cookies (important for auth to work)
    await supabase.auth.getUser();

    return response;
  }

  // ── 3. Everything else requires authentication ──
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { supabase, response } = createMiddlewareClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 4. Dashboard route — check role access ──
  const isDashboard = DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isDashboard) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[Middleware] User:', user.email, '| Profile:', profile, '| Error:', profileError);

    const userRole = profile?.role || 'investor';

    // ★ Admin can access ALL dashboard routes (for role-switching/review)
    if (userRole === 'admin') {
      return response;
    }

    // Non-admin users: check if they're on the right dashboard
    const correctDashboard = getRoleDashboard(userRole);
    const isOnCorrectRoute = pathname === correctDashboard || pathname.startsWith(correctDashboard + '/');

    if (!isOnCorrectRoute) {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }

  return response;
}

function getRoleDashboard(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'farm_manager':
      return '/manager';
    case 'keeper':
      return '/keeper';
    case 'accountant':
      return '/accountant';
    case 'investor':
    default:
      return '/investor';
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
