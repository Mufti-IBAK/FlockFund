import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// POST /api/payments/webhook
// Handles webhooks from Flutterwave
// Idempotent: checks if investment is already active before processing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // ─── Verify webhook hash ───
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    const receivedHash = req.headers.get("verif-hash");
    if (secretHash && receivedHash !== secretHash) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
    }

    const reference = body.data?.tx_ref || "";
    const investmentId = body.data?.meta?.investment_id || "";
    const flwTransactionId = body.data?.id;

    if (!reference && !investmentId) {
      return NextResponse.json(
        { error: "No reference found" },
        { status: 400 },
      );
    }

    // ─── Verify transaction with Flutterwave ───
    let verified = false;
    let paymentFailed = false;
    let verifyData: Record<string, unknown> = {};

    if (flwTransactionId) {
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${flwTransactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        },
      );
      verifyData = await verifyRes.json();
      const txStatus = (verifyData as { data?: { status?: string } })?.data?.status;
      verified = txStatus === "successful";
      paymentFailed = txStatus === "failed" || txStatus === "cancelled";
    }

    // ─── Find the investment ───
    const query = investmentId
      ? supabase.from("investments").select("*").eq("id", investmentId).single()
      : supabase
          .from("investments")
          .select("*")
          .or(`payment_reference.eq.${reference},payment_transaction_id.eq.${reference}`)
          .single();

    const { data: investment } = await query;

    if (!investment) {
      return NextResponse.json(
        { error: "Investment not found" },
        { status: 404 },
      );
    }

    // Already processed — idempotent
    if (investment.status === "active") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (verified) {
      // ─── SUCCESS: Activate the investment ───
      await supabase
        .from("investments")
        .update({ status: "active" })
        .eq("id", investment.id);

      // Update transactions table
      try {
        await supabase
          .from("transactions")
          .update({ status: "completed", gateway_response: verifyData })
          .eq("reference", reference);
      } catch { /* table may not exist */ }

      // Generate blockchain hash if enabled
      const { data: settings } = await supabase
        .from("settings")
        .select("blockchain_enabled")
        .single();
      if (settings?.blockchain_enabled) {
        const txHash = crypto
          .createHash("sha256")
          .update(
            `${investment.id}:${investment.investor_id}:${investment.amount_invested || investment.cost_paid}:${Date.now()}`,
          )
          .digest("hex");
        await supabase
          .from("investments")
          .update({ blockchain_tx_hash: `0x${txHash}` })
          .eq("id", investment.id);
      }

      // Award "Early Bird" / "First Investment" badge if applicable
      const { data: badge } = await supabase
        .from("badges")
        .select("id")
        .or("name.eq.Early Bird,name.eq.First Investment")
        .limit(1)
        .single();

      if (badge) {
        const { data: alreadyAwarded } = await supabase
          .from("investor_badges")
          .select("badge_id")
          .eq("investor_id", investment.investor_id)
          .eq("badge_id", badge.id)
          .single();

        if (!alreadyAwarded) {
          await supabase.from("investor_badges").insert({
            investor_id: investment.investor_id,
            badge_id: badge.id,
          });
        }
      }
    } else if (paymentFailed) {
      // ─── FAILED: Mark investment as failed ───
      await supabase
        .from("investments")
        .update({ status: "failed" })
        .eq("id", investment.id);

      // Update transactions table
      try {
        await supabase
          .from("transactions")
          .update({ status: "failed", gateway_response: verifyData })
          .eq("reference", reference);
      } catch { /* table may not exist */ }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
