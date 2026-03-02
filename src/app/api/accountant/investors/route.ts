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

    // 2. Fetch all investors using service role (bypasses RLS)
    // In production, we would want to join `auth.users` to get actual email if not stored in profiles.
    // For this demonstration, we query profiles and investments.
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, bank_name, account_number, account_name")
      .eq("role", "investor");

    if (profilesError) throw profilesError;

    // 3. Fetch investments for aggregation
    const { data: investments, error: investmentsError } = await supabaseAdmin
      .from("investments")
      .select("investor_id, birds_owned, cost_paid, status");

    if (investmentsError) throw investmentsError;

    // 4. Map and aggregate data
    const enrichedInvestors = profiles.map((p) => {
      const userInvestments = (investments || []).filter(
        (i) => i.investor_id === p.id && i.status === "active"
      );

      const totalBirds = userInvestments.reduce(
        (acc, curr) => acc + (curr.birds_owned || 0),
        0
      );
      const totalInvested = userInvestments.reduce(
        (acc, curr) => acc + (curr.cost_paid || 0),
        0
      );

      return {
        ...p,
        email: "investor@flockfund.local", // placeholder since auth.users isn't joinable via rest directly without admin api
        total_birds: totalBirds,
        total_invested: totalInvested,
        active_investments: userInvestments,
      };
    });

    return NextResponse.json({ investors: enrichedInvestors });
  } catch (error: any) {
    console.error("Fetch Investors Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch investors" },
      { status: 500 }
    );
  }
}
