import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MUDARABAH_AGREEMENT_TEMPLATE = `
MUDARABAH AL-MUQAYYADA (RESTRICTED MUDARABAH) AGREEMENT

This agreement is entered into between:

1. The RABB-UL-MAAL (Capital Provider / Investor)
2. The MUDARIB (Fund Manager / FlockFund International)

TERMS AND CONDITIONS:

1. BUSINESS SCOPE (Al-Muqayyada Restriction)
   The Flockfund shall use the invested capital exclusively for broiler chicken farming operations.
   No funds shall be diverted to any other business activity.

2. PROFIT DISTRIBUTION
   Net profit (revenue minus capital and verified costs) shall be distributed as follows:
   - 70% to the Flockfund (FlockFund)
   - 30% to the Investor (Investor)
   Profit is defined as what exceeds the original capital after deducting verified operational costs.

3. LOSS LIABILITY
   - Financial loss arising from normal business operations (disease, market fluctuations,
     natural disasters) shall be borne entirely by the Investor (Investor).
   - The Flockfund loses time, effort, and resources — receiving no compensation if no profit is generated.
   - If loss is caused by the Flockfund's negligence or breach of agreed protocols,
     the Flockfund shall compensate the Investor for the full capital amount.

4. DEFINITION OF NEGLIGENCE
   Negligence includes but is not limited to:
   - Failure to follow agreed-upon biosecurity protocols
   - Ignoring veterinary advice
   - Misappropriation of invested funds
   - Investing in prohibited activities
   - Gross mismanagement of farm operations

5. CAPITAL PRIORITY
   Capital must be returned to the Investor before any profit calculation.
   Profit is only what exceeds the original capital invested.

6. COST TRANSPARENCY
   All operational costs (feed, drugs, maintenance, tax, stamp duty) shall be:
   - Itemized and recorded transparently
   - Verified by the Farm Manager
   - Deducted from revenue before profit calculation
   - Made visible to the Investor via the platform dashboard

7. NO GUARANTEED RETURNS
   This investment does not guarantee any fixed return or profit.
   Returns depend entirely on the actual performance of the broiler farming operations.

8. DURATION
   This agreement is effective for the duration of one flock cycle,
   commencing upon payment confirmation and concluding upon completion of bird sales
   and final profit/loss distribution.

9. DISPUTE RESOLUTION
   Any disputes shall be resolved through arbitration in accordance with
   Islamic commercial jurisprudence (Fiqh al-Muamalat).

By signing this agreement, both parties acknowledge and accept the above terms
in accordance with Shariah principles governing Mudarabah partnerships.
`;

// POST /api/mudarabah/agreement
// Body: { investor_id, investment_id? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { investor_id, investment_id } = body;

    if (!investor_id) {
      return NextResponse.json(
        { error: "Missing investor_id" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to sign the agreement." },
        { status: 401 },
      );
    }

    // Verify investor_id matches the authenticated user
    if (user.id !== investor_id) {
      return NextResponse.json(
        { error: "Security mismatch. You can only sign for your own account." },
        { status: 403 },
      );
    }

    // Capture metadata
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Insert agreement
    const { data: agreement, error } = await supabase
      .from("mudarabah_agreements")
      .insert({
        investor_id,
        investment_id: investment_id || null,
        agreement_text: MUDARABAH_AGREEMENT_TEMPLATE.trim(),
        ip_address: ipAddress,
        user_agent: userAgent,
        restricted_business: "Broiler chicken farming only",
        profit_share_agreed: "70/30",
        loss_liability:
          "Investor bears financial loss unless negligence proven",
        negligence_definition:
          "Failure to follow biosecurity protocols, ignoring veterinary advice, misappropriation of funds, investing in prohibited activities, gross mismanagement",
      })
      .select()
      .single();

    if (error) {
      console.error("Agreement insert error:", error);
      return NextResponse.json(
        { error: `Failed to create agreement: ${error.message}` },
        { status: 500 },
      );
    }

    // If investment_id provided, link the agreement to the investment
    if (investment_id) {
      await supabase
        .from("investments")
        .update({ mudarabah_agreement_id: agreement.id })
        .eq("id", investment_id);
    }

    return NextResponse.json({
      success: true,
      agreement_id: agreement.id,
      signed_at: agreement.signed_at,
    });
  } catch (error) {
    console.error("Islamic Finance Agreement error:", error);
    return NextResponse.json(
      { error: "Failed to capture agreement" },
      { status: 500 },
    );
  }
}
