import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const bankCodes: Record<string, string> = {
  "Access Bank": "044",
  Citibank: "023",
  Ecobank: "050",
  "Fidelity Bank": "070",
  "First Bank": "011",
  "First City Monument Bank (FCMB)": "214",
  "Globus Bank": "103",
  "Guaranty Trust Bank (GTBank)": "058",
  "Heritage Bank": "030",
  "Jaiz Bank": "301",
  "Keystone Bank": "082",
  "Kuda Bank": "090267",
  Opay: "100004",
  Palmpay: "100033",
  "Polaris Bank": "076",
  "Providus Bank": "101",
  "Stanbic IBTC Bank": "221",
  "Standard Chartered Bank": "068",
  "Sterling Bank": "232",
  "SunTrust Bank": "100",
  "Titan Trust Bank": "102",
  "Union Bank": "032",
  "United Bank for Africa (UBA)": "033",
  "Unity Bank": "215",
  "Wema Bank": "035",
  "Zenith Bank": "057",
};

export async function POST(req: NextRequest) {
  try {
    const { request_id, amount, user_id, category } = await req.json();

    if (!request_id || !amount || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1. Get user bank details
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("full_name, bank_name, account_number, account_name")
      .eq("id", user_id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "Recipient profile not found" },
        { status: 404 },
      );
    }

    if (
      !profile.bank_name ||
      !profile.account_number ||
      !profile.account_name
    ) {
      return NextResponse.json(
        {
          error:
            "Recipient bank details not set. They must save them in Settings.",
        },
        { status: 400 },
      );
    }

    const bankCode = bankCodes[profile.bank_name];
    if (!bankCode) {
      return NextResponse.json(
        { error: "Unsupported bank for automated disbursement." },
        { status: 400 },
      );
    }

    const reference = `FF-STAFF-${request_id.slice(0, 8)}-${Date.now()}`;

    // 2. Initiate Flutterwave Transfer
    const transferRes = await fetch(
      "https://api.flutterwave.com/v3/transfers",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: profile.account_number,
          amount,
          currency: "NGN",
          narration: `FlockFund Staff Disbursement: ${category} - ${reference}`,
          reference,
          beneficiary_name: profile.account_name,
          meta: {
            request_id,
            recipient_id: user_id,
            category,
          },
        }),
      },
    );

    const transferData = await transferRes.json();

    if (transferData.status === "success") {
      // 3. Update fund_requests record
      await supabase
        .from("fund_requests")
        .update({
          status: "processed",
          accountant_processed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request_id);

      // 4. Notify user
      await supabase.from("notifications").insert({
        user_id: user_id,
        title: "💸 Funds Disbursed",
        message: `Your request for ₦${Number(amount).toLocaleString()} (${category}) has been paid to your ${profile.bank_name} account.`,
        type: "payment",
      });

      return NextResponse.json({
        success: true,
        message: "Disbursement successful.",
        reference,
      });
    } else {
      return NextResponse.json(
        {
          error: transferData.message || "Transfer failed",
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Disbursement error:", error);
    return NextResponse.json(
      { error: "Internal disbursement failure" },
      { status: 500 },
    );
  }
}
