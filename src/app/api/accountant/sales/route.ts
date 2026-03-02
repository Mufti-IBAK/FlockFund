import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: requestorProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!requestorProfile || !["accountant", "admin"].includes(requestorProfile.role)) {
      return NextResponse.json({ error: "Forbidden. Accountant access required." }, { status: 403 });
    }

    const { data: cycles, error } = await supabaseAdmin
      .from("profit_cycles")
      .select(`
        *,
        flocks (
          flock_name,
          batch_size
        )
      `)
      .order("calculated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ cycles: cycles || [] });
  } catch (error: any) {
    console.error("Sales Report Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sales report" }, { status: 500 });
  }
}
