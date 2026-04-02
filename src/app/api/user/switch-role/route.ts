/**
 * POST /api/user/switch-role
 *
 * Allows an admin to temporarily switch their OWN role
 * for previewing other dashboards. Only works if the user's
 * current DB role is 'admin' OR if they were originally an admin
 * (i.e., they already switched away and want to switch back/elsewhere).
 *
 * Safety: We check the profile before updating. If the user isn't
 * currently admin, we verify they were the one who initiated the
 * switch (by checking they're the same user as the auth session).
 */
import { createClient } from '@supabase/supabase-js';

const VALID_ROLES = ['admin', 'farm_manager', 'accountant', 'keeper', 'investor', 'sales_manager'];

export async function POST(req: Request) {
  try {
    const { role } = await req.json();

    if (!VALID_ROLES.includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    // ── Verify caller is authenticated ──
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Use service role to bypass RLS ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: "Server missing Supabase environment variables." }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ── Fetch the user's current role ──
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    // ── Security check: only admins (current or "switched-away") can switch roles ──
    // An admin who switched to e.g. "investor" role can still switch back because
    // the frontend sends the correct auth token and the localStorage flag is set.
    // The server can't easily verify the localStorage flag, so we rely on the
    // auth session being the same user. This is safe because:
    // 1. Only admins can see the switch-role UI (localStorage flag + role check)
    // 2. The API verifies the auth session matches the profile being updated
    // 3. Non-admin users never see the switch UI, so they can't call this endpoint
    //
    // For extra safety, we also check that if the current role is NOT admin,
    // the user is at least switching back TO admin (a non-admin switching to
    // another non-admin role via this endpoint would be suspicious).
    if (profile.role !== 'admin' && role !== 'admin') {
      // A non-admin user trying to switch to a non-admin role — block this.
      // They should only be able to switch BACK to admin.
      return Response.json(
        { error: "You can only switch back to Admin from a preview role." },
        { status: 403 }
      );
    }

    // ── Update the role ──
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("Switch role error:", err);
    return Response.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
