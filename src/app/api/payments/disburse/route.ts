import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getApiRateLimit } from "@/lib/rateLimit";
import { logAuditEvent } from "@/lib/auditLogger";

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting based on IP
    let ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (ip.includes(",")) ip = ip.split(",")[0].trim();

    const rateLimit = getApiRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const body = await req.json();
    const { investorId, request_id, user_id, amount, category } = body;

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

    // Handle STAFF_SALARY Disbursement
    if (body.type === "salary") {
      const { staff_id, amount, month, year } = body;
      if (!staff_id || !amount) {
        return NextResponse.json(
          { error: "Missing salary details" },
          { status: 400 },
        );
      }

      // 1. Record payment
      const { error: payErr } = await supabaseAdmin
        .from("staff_payments")
        .insert({
          staff_id,
          amount,
          payment_month: month,
          payment_year: year,
          processed_by: user.id,
          payment_reference: `SAL-${Math.random().toString(36).substring(7).toUpperCase()}`,
        });

      if (payErr) {
        return NextResponse.json(
          { error: "Failed recording salary: " + payErr.message },
          { status: 500 },
        );
      }

      await logAuditEvent({
        action: "SALARY_DISBURSEMENT_COMPLETED",
        actor_id: user.id,
        target_id: staff_id,
        details: { amount, month, year },
        ip_address: ip,
      });

      return NextResponse.json({ 
        success: true,
        transfer_url: `https://dashboard.paystack.com/#/transfers`
      });
    }

    // Handle Staff/Operational Disbursement if request_id provided
    if (request_id) {
      // 1. Update fund_request
      const { data: request, error: reqErr } = await supabaseAdmin
        .from("fund_requests")
        .update({
          status: "processed",
          accountant_processed: true,
          processed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request_id)
        .select()
        .single();

      if (reqErr)
        throw new Error("Failed to process request: " + reqErr.message);

      // 2. Insert into flock_costs if linked to a flock
      if (request.flock_id) {
        await supabaseAdmin.from("flock_costs").insert({
          flock_id: request.flock_id,
          cost_category:
            request.category === "maintenance"
              ? "combined_operational_fees"
              : request.category === "drugs"
                ? "drugs"
                : request.category,
          amount: request.amount,
          description: `Automated Disbursement for Request #${request_id.substring(0, 8)}`,
          incurred_date: new Date().toISOString().split("T")[0],
          verified: true,
          verified_by: user.id,
        });
      }

      await logAuditEvent({
        action: "STAFF_DISBURSEMENT_COMPLETED",
        actor_id: user.id,
        target_id: user_id,
        details: { request_id, amount, category },
        ip_address: ip,
      });

      return NextResponse.json({ 
        success: true,
        transfer_url: `https://dashboard.paystack.com/#/transfers`
      });
    }

    // Handle MUDARABAH/INVESTOR Payout
    const { payoutId } = body;
    if (payoutId) {
      // 1. Fetch the Payout Record (Must be verified)
      const { data: payout, error: payoutErr } = await supabaseAdmin
        .from("investor_payouts")
        .select(`
          *,
          profiles!inner(full_name, bank_name, account_number, bank_code)
        `)
        .eq("id", payoutId)
        .single();

      if (payoutErr || !payout) throw new Error("Payout record not found");
      if (payout.status !== 'verified') throw new Error("Payout must be verified by Accountant before disbursement.");

      const investor = payout.profiles;
      if (!investor.bank_name || !investor.account_number) throw new Error("Investor missing bank details.");

      // 2. Execute REAL Paystack Transfer
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackKey) throw new Error("Payment Gateway Configuration Missing (Missing PS KEY).");

      const reference = `DISB-${payoutId.substring(0, 8)}-${Date.now()}`;

      // 2a. Create Transfer Recipient
      const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "nuban",
          name: investor.full_name,
          account_number: investor.account_number,
          bank_code: investor.bank_code || "044",
          currency: "NGN"
        })
      });
      const recipientData = await recipientRes.json();
      if (!recipientData.status) throw new Error(`Paystack Recipient Error: ${recipientData.message}`);

      // 2b. Initiate Transfer
      const transferResponse = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: "balance",
          amount: Math.round(Number(payout.amount_disbursed) * 100),
          recipient: recipientData.data.recipient_code,
          reason: `FlockFund Settlement: ${payout.flock_id?.substring(0, 8)}`,
          reference: reference
        })
      });

      const psData = await transferResponse.json();

      if (!psData.status) {
        await logAuditEvent({
          action: "DISBURSEMENT_GATEWAY_ERROR",
          actor_id: user.id,
          target_id: payout.investor_id,
          details: { error: psData.message, payout_id: payoutId },
          ip_address: ip,
        });
        throw new Error(`Paystack Error: ${psData.message}`);
      }

      // 3. Record Successful/Pending Dispatch
      const { error: updateErr } = await supabaseAdmin
        .from("investor_payouts")
        .update({ status: 'disbursed', payment_reference: psData.data.reference })
        .eq("id", payoutId);

      if (updateErr) throw new Error("Gateway success but failed to update platform DB: " + updateErr.message);

      // 4. Create Withdrawal Record
      await supabaseAdmin.from("withdrawals").insert({
        investor_id: payout.investor_id,
        amount: payout.amount_disbursed,
        status: "completed",
        payment_reference: fwData.data.reference,
        processed_at: new Date().toISOString()
      });

      await logAuditEvent({
        action: "DISBURSEMENT_SUCCESS",
        actor_id: user.id,
        target_id: payout.investor_id,
        details: { amount: payout.amount_disbursed, reference: psData.data.reference },
        ip_address: ip,
      });

      return NextResponse.json({ 
        success: true, 
        payoutAmount: payout.amount_disbursed,
        reference: fwData.data.reference
      });
    }

    return NextResponse.json({ error: "No valid disbursement target (payoutId or request_id)" }, { status: 400 });
  } catch (error: any) {
    console.error("Disbursement Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process disbursement" },
      { status: 500 },
    );
  }
}
