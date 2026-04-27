import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// POST /api/payments/webhook
// Handles webhooks from Flutterwave
// Idempotent: checks if investment is already active before processing
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // ─── Determine Gateway ───
    const flwSignature = req.headers.get("verif-hash");
    const paystackSignature = req.headers.get("x-paystack-signature");
    let gateway: "flutterwave" | "paystack" = "flutterwave";

    if (paystackSignature) {
      gateway = "paystack";
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
        .update(rawBody)
        .digest("hex");
      if (hash !== paystackSignature) {
        return NextResponse.json({ error: "Invalid Paystack signature" }, { status: 401 });
      }
    } else {
      const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
      if (secretHash && flwSignature !== secretHash) {
        return NextResponse.json({ error: "Invalid Flutterwave hash" }, { status: 401 });
      }
    }

    let reference = "";
    let investmentId = "";
    let gatewayTransactionId = "";
    let verified = false;
    let paymentFailed = false;
    let gatewayResponse: Record<string, unknown> = {};

    if (gateway === "flutterwave") {
      reference = body.data?.tx_ref || "";
      investmentId = body.data?.meta?.investment_id || "";
      gatewayTransactionId = body.data?.id;

      if (gatewayTransactionId) {
        const verifyRes = await fetch(
          `https://api.flutterwave.com/v3/transactions/${gatewayTransactionId}/verify`,
          {
            headers: {
              Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            },
          },
        );
        gatewayResponse = await verifyRes.json();
        const txStatus = (gatewayResponse as { data?: { status?: string } })?.data?.status;
        verified = txStatus === "successful";
        paymentFailed = txStatus === "failed" || txStatus === "cancelled";
      }
    } else if (gateway === "paystack") {
      if (body.event === "charge.success") {
        reference = body.data?.reference || "";
        investmentId = body.data?.metadata?.investment_id || "";
        gatewayTransactionId = body.data?.id?.toString() || reference;
        verified = true;
        gatewayResponse = body.data;
      } else if (body.event?.includes("failed")) {
        paymentFailed = true;
        reference = body.data?.reference || "";
        investmentId = body.data?.metadata?.investment_id || "";
      }
    }

    // ─── Find the investment ───
    const query = investmentId
      ? supabase.from("investments").select("*").eq("id", investmentId).single()
      : supabase
          .from("investments")
          .select("*")
          .or(
            `payment_reference.eq.${reference},payment_transaction_id.eq.${reference}`,
          )
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

      // Insert into transactions table
      try {
        await supabase.from("transactions").insert({
          investor_id: investment.investor_id,
          investment_id: investment.id,
          type: "investment",
          amount: investment.amount_invested || investment.cost_paid,
          status: "completed",
          gateway: gateway,
          reference: reference,
          gateway_response: gatewayResponse,
        });
      } catch {
        /* table may not exist */
      }

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
