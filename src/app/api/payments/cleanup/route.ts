import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/payments/cleanup
// Expires pending investments older than 24 hours
// Can be called by a cron job or admin manually
export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Expire stale pending investments
    const { data: expired, error } = await supabase
      .from("investments")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .select("id, payment_reference, payment_transaction_id");

    if (error) {
      console.error("Cleanup error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also update transactions table
    if (expired && expired.length > 0) {
      const refs = expired
        .map((inv) => inv.payment_reference || inv.payment_transaction_id)
        .filter(Boolean);

      if (refs.length > 0) {
        try {
          for (const ref of refs) {
            await supabase
              .from("transactions")
              .update({ status: "failed" })
              .eq("reference", ref)
              .eq("status", "pending");
          }
        } catch {
          /* transactions table may not exist */
        }
      }
    }

    return NextResponse.json({
      success: true,
      expired_count: expired?.length || 0,
      message: `${expired?.length || 0} stale pending investments expired`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
