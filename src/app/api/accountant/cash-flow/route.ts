import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // 1. Authenticate user as accountant/admin
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

    // 2. Fetch Inflows
    // a) Investments (amount invested)
    const { data: investments } = await supabaseAdmin
      .from("investments")
      .select("id, cost_paid, created_at, status")
      // assuming successful investments only
      .in("status", ["active", "completed"]);

    // b) Sales / Revenue (profit cycles)
    const { data: cycles } = await supabaseAdmin
      .from("profit_cycles")
      .select("id, total_revenue, calculated_at");

    // c) Confirmed Direct Sales (from sales_reports)
    const { data: salesRevenues } = await supabaseAdmin
      .from("sales_reports")
      .select("id, total_revenue, is_manure, sale_timestamp")
      .eq("accountant_status", "confirmed");

    // 3. Fetch Outflows
    // a) Fund Requests (farm ops)
    const { data: fundRequests } = await supabaseAdmin
      .from("fund_requests")
      .select("id, amount, status, category, updated_at")
      .eq("status", "processed");

    // b) Withdrawals (disbursements)
    const { data: withdrawals } = await supabaseAdmin
      .from("withdrawals")
      .select("id, amount, status, processed_at")
      .eq("status", "completed");

    // c) Pending Payouts (for Overview metrics)
    const { data: pendingRequests } = await supabaseAdmin
      .from("fund_requests")
      .select("amount")
      .eq("status", "approved");

    // d) Staff Payments (salaries)
    const { data: staffPayments } = await supabaseAdmin
      .from("staff_payments")
      .select("id, amount, status, created_at")
      .eq("status", "completed");

    const pendingFunds = (pendingRequests || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    // d) Active Flocks
    const { count: activeFlocks } = await supabaseAdmin
      .from("flocks")
      .select("*", { count: "exact", head: true });

    // 4. Transform into unified ledger
    interface LedgerEntry {
      id: string;
      type: "INFLOW" | "OUTFLOW";
      source: string;
      amount: number;
      date: string;
      status: string;
    }

    const ledger: LedgerEntry[] = [];

    (investments || []).forEach((inv) => {
      ledger.push({
        id: inv.id,
        type: "INFLOW",
        source: "Investment",
        amount: inv.cost_paid,
        date: inv.created_at,
        status: inv.status,
      });
    });

    (cycles || []).forEach((cyc) => {
      ledger.push({
        id: cyc.id,
        type: "INFLOW",
        source: "Flock Sale Revenue (Profit Cycle)",
        amount: cyc.total_revenue,
        date: cyc.calculated_at,
        status: "completed",
      });
    });

    (salesRevenues || []).forEach((sale) => {
      ledger.push({
        id: sale.id,
        type: "INFLOW",
        source: sale.is_manure ? "Manure Batch Sale" : "Bird Stock Sale",
        amount: sale.total_revenue || 0,
        date: sale.sale_timestamp,
        status: "completed",
      });
    });

    (fundRequests || []).forEach((req) => {
      ledger.push({
        id: req.id,
        type: "OUTFLOW",
        source: `Farm Expense (${req.category})`,
        amount: req.amount,
        date: req.updated_at,
        status: "completed",
      });
    });

    (withdrawals || []).forEach((wth) => {
      ledger.push({
        id: wth.id,
        type: "OUTFLOW",
        source: "Investor Payout (Disbursement)",
        amount: wth.amount,
        date: wth.processed_at || new Date().toISOString(), // fallback if processed_at missing
        status: wth.status,
      });
    });

    (staffPayments || []).forEach((pay) => {
      ledger.push({
        id: pay.id,
        type: "OUTFLOW",
        source: "Staff Salary / Payment",
        amount: Number(pay.amount),
        date: pay.created_at,
        status: "completed",
      });
    });

    // Sort descending by date
    ledger.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Calculate aggregates
    const totalInflow = ledger
      .filter((l) => l.type === "INFLOW")
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    const totalOutflow = ledger
      .filter((l) => l.type === "OUTFLOW")
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    return NextResponse.json({
      aggregates: {
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow,
        pendingFunds,
        activeFlocks: activeFlocks || 0,
      },
      transactions: ledger,
    });
  } catch (error: any) {
    console.error("CashFlow Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate cashflow report" },
      { status: 500 },
    );
  }
}
