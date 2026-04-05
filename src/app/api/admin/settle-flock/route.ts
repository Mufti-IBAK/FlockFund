import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { flock_id } = await req.json();

    if (!flock_id) {
      return NextResponse.json({ error: "Flock ID is required" }, { status: 400 });
    }

    // 1. Fetch Flock Data
    const { data: flock, error: flockErr } = await supabase
      .from("flocks")
      .select("*")
      .eq("id", flock_id)
      .single();

    if (flockErr || !flock) throw new Error("Flock not found");

    // 2. Fetch Aggregated Revenue (Verified)
    const { data: sales, error: salesErr } = await supabase
      .from("sales_reports")
      .select("total_revenue")
      .eq("flock_id", flock_id)
      .eq("accountant_status", "approved");

    const totalRevenue = sales?.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0) || 0;

    // 3. Fetch Aggregated Costs (Verified)
    const { data: costs, error: costsErr } = await supabase
      .from("flock_costs")
      .select("amount")
      .eq("flock_id", flock_id)
      .eq("verified", true);

    const totalCosts = costs?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

    // 4. Fetch Settings (PSR and Estimated Profit Index)
    const { data: settings, error: settingsErr } = await supabase
      .from("settings")
      .select("*")
      .single();

    const investorSharePercent = (settings?.investor_share_percentage || 30) / 100;
    const costPerBird = settings?.cost_per_bird || 4250;

    // 5. Calculate Flock Level Net Profit
    const netProfit = totalRevenue - totalCosts;

    // 6. Mortality Tracking
    const { data: farmReports, error: farmErr } = await supabase
      .from("farm_reports")
      .select("mortality_count")
      .eq("flock_id", flock_id);

    const totalDead = farmReports?.reduce((sum, r) => sum + (Number(r.mortality_count) || 0), 0) || 0;
    const initialBirds = flock.batch_size || 1000;
    const survivalRate = (initialBirds - totalDead) / initialBirds;

    // 7. Fetch All Active Investments for this flock
    const { data: investments, error: invErr } = await supabase
      .from("investments")
      .select("*, profiles!inner(id, full_name)")
      .eq("flock_id", flock_id)
      .eq("status", "active");

    if (invErr) throw invErr;

    const payouts = [];

    for (const inv of (investments || [])) {
      const birdsOwned = Number(inv.birds_owned);
      const ownershipRatio = birdsOwned / initialBirds;
      
      // Mudarabah Calculation
      // a. Capital Return (Adjusted for Mortality)
      const initialCapital = Number(inv.amount_invested);
      const capitalReturned = initialCapital * survivalRate;
      const mortalityLoss = initialCapital - capitalReturned;

      // b. Profit Share (only if netProfit > 0)
      let profitShared = 0;
      if (netProfit > 0) {
        // Profit attributed to this investor's share of the flock profit pool
        profitShared = ownershipRatio * netProfit * investorSharePercent;
      }

      payouts.push({
        investor_id: inv.profiles.id,
        flock_id: flock_id,
        investment_id: inv.id,
        amount_disbursed: capitalReturned + profitShared, // Total due
        capital_returned: capitalReturned,
        profit_shared: profitShared,
        mortality_loss: mortalityLoss,
        status: 'draft',
        payout_date: new Date().toISOString()
      });
    }

    // 8. Atomic Insert into investor_payouts
    const { error: payoutErr } = await supabase
      .from("investor_payouts")
      .insert(payouts);

    if (payoutErr) throw payoutErr;

    // 9. Record the Profit Cycle
    await supabase.from("profit_cycles").insert({
      flock_id: flock_id,
      total_revenue: totalRevenue,
      total_cost: totalCosts,
      total_profit: netProfit,
      investor_pool: netProfit > 0 ? netProfit * investorSharePercent : 0,
      flockfund_share: netProfit > 0 ? netProfit * (1 - investorSharePercent) : 0,
      calculated_at: new Date().toISOString()
    });

    // 10. Finalize the Flock status
    await supabase.from("flocks").update({ status: 'completed' }).eq("id", flock_id);
    await supabase.from("investments").update({ status: 'completed' }).eq("flock_id", flock_id);

    return NextResponse.json({ 
      success: true, 
      payouts_generated: payouts.length,
      net_profit: netProfit,
      total_mortality: totalDead
    });

  } catch (err: any) {
    console.error("Settlement Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
