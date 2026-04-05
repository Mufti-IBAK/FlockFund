import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // 1. Authenticate user to verify they are an accountant or admin
    // Importing standard Next.js Supabase auth logic (assuming it exists in standard setup)
    const { createClient: createServerClient } = await import(
      "@/lib/supabase/server"
    );
    const supabaseUser = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: requestorProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !requestorProfile ||
      !["accountant", "admin"].includes(requestorProfile.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden. Accountant access required." },
        { status: 403 }
      );
    }

    // 1. Fetch Payouts with status 'draft' or 'verified'
    // This allows Accountants to see exactly what the Admin has settled.
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from("investor_payouts")
      .select(`
        *,
        profiles!inner(id, full_name, email, bank_name, account_number, account_name),
        flocks!inner(flock_name)
      `)
      .in("status", ["draft", "verified"])
      .order("payout_date", { ascending: false });

    if (payoutsError) throw payoutsError;

    // 4. Map to standardized format for frontend
    const enrichedPayouts = (payouts || []).map((p: any) => ({
      id: p.id,
      investor_id: p.investor_id,
      full_name: p.profiles?.full_name,
      email: p.profiles?.email,
      bank_name: p.profiles?.bank_name,
      account_number: p.profiles?.account_number,
      account_name: p.profiles?.account_name,
      flock_name: p.flocks?.flock_name,
      amount_to_disburse: Number(p.withdrawable_amount),
      capital_returned: Number(p.capital_returned),
      profit_shared: Number(p.profit_shared),
      mortality_loss: Number(p.mortality_loss),
      status: p.status,
      payout_date: p.created_at
    }));

    return NextResponse.json({ payouts: enrichedPayouts });
  } catch (error: any) {
    console.error("Fetch Investors Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch investors" },
      { status: 500 }
    );
  }
}
