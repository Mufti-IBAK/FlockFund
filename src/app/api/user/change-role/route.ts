/**
 * POST /api/user/change-role
 *
 * Admin-only endpoint to change ANOTHER user's role.
 * Requires: { userId: string, newRole: string }
 *
 * This is distinct from /api/user/switch-role which lets
 * an admin switch their OWN role for dashboard previewing.
 */
import { createClient } from '@supabase/supabase-js';

const VALID_ROLES = ['admin', 'farm_manager', 'accountant', 'keeper', 'investor', 'sales_manager'];

export async function POST(req: Request) {
  try {
    const { userId, newRole } = await req.json();

    // ── Validate input ──
    if (!userId || typeof userId !== 'string') {
      return Response.json({ error: "Missing or invalid userId" }, { status: 400 });
    }
    if (!VALID_ROLES.includes(newRole)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    // ── Verify caller is authenticated ──
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Verify caller is an admin ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: "Server missing Supabase environment variables." }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerProfile, error: callerError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (callerError || callerProfile?.role !== 'admin') {
      return Response.json({ error: "Forbidden — admin access required" }, { status: 403 });
    }

    // ── Prevent admin from changing their own role via this endpoint ──
    if (userId === user.id) {
      return Response.json(
        { error: "Cannot change your own role here. Use the role-switch feature instead." },
        { status: 400 }
      );
    }

    // ── Update the target user's role ──
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (updateError) throw updateError;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("Change role error:", err);
    return Response.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
