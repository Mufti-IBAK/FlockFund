import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { role } = await req.json();

    if (!['admin', 'farm_manager', 'accountant', 'keeper', 'investor'].includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get the standard server client to verify auth
    // Assuming the user has @/lib/supabase/server exported as standard Next.js Supabase setup
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role to bypass RLS and update the profile role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: "Server missing supabase environment variables." }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
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
