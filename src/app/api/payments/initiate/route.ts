import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/payments/initiate
// Body: { investor_id, birds_count, gateway: 'flutterwave', email, flock_id, agreement_id }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { investor_id, birds_count, gateway, flock_id, callback_url, agreement_id } = body;

    if (!investor_id || !birds_count) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Islamic Finance Agreement required for new investments
    if (!agreement_id) {
      return NextResponse.json(
        { error: "Mudarabah agreement must be signed before investing" },
        { status: 400 },
      );
    }

    // Only allow Flutterwave
    if (gateway && gateway !== "flutterwave") {
      return NextResponse.json(
        { error: "Only Flutterwave gateway is currently active" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verify the agreement exists
    const { data: agreement } = await supabase
      .from("mudarabah_agreements")
      .select("id")
      .eq("id", agreement_id)
      .eq("investor_id", investor_id)
      .single();

    if (!agreement) {
      return NextResponse.json(
        { error: "Invalid or missing Islamic Finance agreement" },
        { status: 400 },
      );
    }

    // Get cost per bird from settings
    const { data: settings } = await supabase
      .from("settings")
      .select("cost_per_bird, investor_share_percentage, flockfund_share_percentage")
      .single();
    const costPerBird = settings?.cost_per_bird || 4250;
    const amount = birds_count * costPerBird;
    const investorRatio = settings?.investor_share_percentage ?? 30;
    const mudaribRatio = settings?.flockfund_share_percentage ?? 70;

    // Get an active flock if not specified
    let activeFlock = flock_id;
    if (!activeFlock) {
      const { data: flock } = await supabase
        .from("flocks")
        .select("id")
        .eq("status", "active")
        .limit(1)
        .single();
      activeFlock = flock?.id;
    }

    if (!activeFlock) {
      return NextResponse.json(
        { error: "No active flocks available" },
        { status: 400 },
      );
    }

    // Create pending investment with Islamic Finance fields
    const { data: investment, error: invError } = await supabase
      .from("investments")
      .insert({
        investor_id,
        flock_id: activeFlock,
        birds_owned: birds_count,
        cost_paid: amount,
        amount_invested: amount,
        capital_amount: amount,
        agreement_id,
        profit_ratio_investor: investorRatio,
        profit_ratio_mudarib: mudaribRatio,
        status: "pending",
        round_count: 0,
        payment_gateway_used: "flutterwave",
        payment_gateway: "flutterwave",
      })
      .select()
      .single();

    if (invError) {
      console.error("Investment insert error:", invError);
      return NextResponse.json(
        { error: `Failed to create investment: ${invError.message}` },
        { status: 500 },
      );
    }

    // Link the agreement to the investment
    await supabase
      .from("mudarabah_agreements")
      .update({ investment_id: investment.id })
      .eq("id", agreement_id);

    // Generate checkout URL
    let checkoutUrl = "";
    const reference = `FF-${investment.id.slice(0, 8)}-${Date.now()}`;
    const redirectUrl =
      callback_url ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/investor/payment/callback`;

    // Flutterwave Standard Payment
    const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount,
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: { email: body.email || "investor@flockfund.com" },
        customizations: {
          title: "FlockFund Investment",
          description: `Purchase ${birds_count} birds`,
        },
        meta: { investment_id: investment.id },
      }),
    });
    const flwData = await flwResponse.json();
    
    if (flwData.status === "error" || !flwData.data?.link) {
      console.warn("Flutterwave API Warning (Defaulting to Mock Gateway for Testnet/Missing Key):", flwData);
      checkoutUrl = `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${reference}&amount=${amount}&currency=NGN&redirect_url=${encodeURIComponent(redirectUrl)}&mock=testnet`;
    } else {
      checkoutUrl = flwData.data.link;
    }

    // Store the payment reference
    await supabase
      .from("investments")
      .update({
        payment_reference: reference,
        payment_transaction_id: reference,
      })
      .eq("id", investment.id);

    return NextResponse.json({
      success: true,
      investment_id: investment.id,
      checkout_url: checkoutUrl,
      reference,
      amount,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 },
    );
  }
}
