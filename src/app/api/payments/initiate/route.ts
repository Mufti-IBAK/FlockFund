import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/payments/initiate
// Body: { investor_id, birds_count, gateway: 'flutterwave', email, flock_id }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { investor_id, birds_count, gateway, flock_id } = body;

    if (!investor_id || !birds_count) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Get cost per bird from settings
    const { data: settings } = await supabase
      .from("settings")
      .select("cost_per_bird")
      .single();
    const costPerBird = settings?.cost_per_bird || 4250;
    const amount = birds_count * costPerBird;

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

    // Create pending investment — write both old and new columns
    const { data: investment, error: invError } = await supabase
      .from("investments")
      .insert({
        investor_id,
        flock_id: activeFlock,
        birds_owned: birds_count,
        cost_paid: amount,
        amount_invested: amount,
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

    // Generate checkout URL
    let checkoutUrl = "";
    const reference = `FF-${investment.id.slice(0, 8)}-${Date.now()}`;

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
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/investor/payment/callback`,
        customer: { email: body.email || "investor@flockfund.com" },
        customizations: {
          title: "FlockFund Investment",
          description: `Purchase ${birds_count} birds`,
        },
        meta: { investment_id: investment.id },
      }),
    });
    const flwData = await flwResponse.json();
    checkoutUrl = flwData?.data?.link || "";

    // Store the payment reference
    await supabase
      .from("investments")
      .update({
        payment_reference: reference,
        payment_transaction_id: reference,
      })
      .eq("id", investment.id);

    // Also log to transactions table
    try {
      await supabase.from("transactions").insert({
        investor_id,
        investment_id: investment.id,
        type: "investment",
        amount,
        status: "pending",
        gateway: "flutterwave",
        reference,
      });
    } catch {
      /* transactions table may not exist yet */
    }

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
