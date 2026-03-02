import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getApiRateLimit } from "@/lib/rateLimit";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting based on IP
    let ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    
    const rateLimit = getApiRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const { investorId } = body;

    if (!investorId) {
      return NextResponse.json(
        { error: "Investor ID required" },
        { status: 400 },
      );
    }

    // 1. Authenticate user to verify they are an accountant or admin
    const { createClient: createServerClient } =
      await import("@/lib/supabase/server");
    const supabaseUser = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

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

    if (
      !requestorProfile ||
      !["accountant", "admin"].includes(requestorProfile.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden. Accountant access required." },
        { status: 403 },
      );
    }

    // 2. Fetch investor details
    const { data: investor, error: invError } = await supabaseAdmin
      .from("profiles")
      .select("bank_name, account_number")
      .eq("id", investorId)
      .single();

    if (invError || !investor) {
      return NextResponse.json(
        { error: "Failed to locate investor profile" },
        { status: 404 },
      );
    }

    if (!investor.bank_name || !investor.account_number) {
      return NextResponse.json(
        { error: "Investor is missing required bank details" },
        { status: 400 },
      );
    }

    // 3. Calculate payout amount (simulate active investments + 15% ROI for demo purposes based on requirements)
    const { data: investments } = await supabaseAdmin
      .from("investments")
      .select("cost_paid")
      .eq("investor_id", investorId)
      .eq("status", "active");

    const totalInvested =
      (investments || []).reduce(
        (acc, curr) => acc + (curr.cost_paid || 0),
        0,
      ) || 0;

    // In a real scenario, this involves complex `profit_cycles` math,
    // but the task specifies showing investment + expected profit.
    const expectedProfit = totalInvested * 0.15;
    const payoutAmount = totalInvested + expectedProfit;

    if (payoutAmount <= 0) {
      return NextResponse.json(
        { error: "No active funds to disburse" },
        { status: 400 },
      );
    }

    // 4. Record to `withdrawals` table to create a transaction log for cash outflow
    const { error: insertError } = await supabaseAdmin
      .from("withdrawals")
      .insert({
        investor_id: investorId,
        amount: payoutAmount,
        status: "completed",
        payment_reference: `DISB-${Math.random().toString(36).substring(7).toUpperCase()}`,
        processed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed recording withdrawal:", insertError);
      
      await logAuditEvent({
        action: "DISBURSEMENT_FAILED",
        actor_id: user.id,
        target_id: investorId,
        details: { error: insertError.message, amount: payoutAmount },
        ip_address: ip
      });

      return NextResponse.json(
        { error: "Failed to record transaction in database" },
        { status: 500 },
      );
    }

    // 5. In a real system, you'd trigger Flutterwave/Paystack API for the transfer here.
    // Assuming success...
    await logAuditEvent({
      action: "DISBURSEMENT_COMPLETED",
      actor_id: user.id,
      target_id: investorId,
      details: { amount: payoutAmount, reference: `DISB-...` },
      ip_address: ip
    });

    return NextResponse.json({ success: true, payoutAmount });
  } catch (error: any) {
    console.error("Disbursement Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process disbursement" },
      { status: 500 },
    );
  }
}
