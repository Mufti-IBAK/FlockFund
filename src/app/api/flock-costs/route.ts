import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/flock-costs?flock_id=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const flockId = searchParams.get("flock_id");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from("flock_costs")
      .select("*, profiles:verified_by(full_name), flocks:flock_id(name)")
      .order("incurred_date", { ascending: false });

    if (flockId) {
      query = query.eq("flock_id", flockId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Fetch flock costs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flock costs" },
      { status: 500 },
    );
  }
}

// POST /api/flock-costs
// Body: { flock_id, cost_category, amount, description?, incurred_date?, receipt_url? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      flock_id,
      cost_category,
      amount,
      description,
      incurred_date,
      receipt_url,
    } = body;

    if (!flock_id || !cost_category || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: flock_id, cost_category, amount" },
        { status: 400 },
      );
    }

    const validCategories = [
      "feed",
      "drugs",
      "maintenance",
      "tax",
      "stamp_duty",
      "labor",
      "overhead",
      "other",
    ];
    if (!validCategories.includes(cost_category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("flock_costs")
      .insert({
        flock_id,
        cost_category,
        amount,
        description: description || null,
        incurred_date: incurred_date || new Date().toISOString().split("T")[0],
        receipt_url: receipt_url || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Create flock cost error:", error);
    return NextResponse.json(
      { error: "Failed to create flock cost" },
      { status: 500 },
    );
  }
}

// PATCH /api/flock-costs
// Body: { id, verified_by }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, verified_by } = body;

    if (!id || !verified_by) {
      return NextResponse.json(
        { error: "Missing required fields: id, verified_by" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("flock_costs")
      .update({
        verified: true,
        verified_by,
        verified_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Verify flock cost error:", error);
    return NextResponse.json(
      { error: "Failed to verify flock cost" },
      { status: 500 },
    );
  }
}
