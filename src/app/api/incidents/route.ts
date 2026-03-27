import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/incidents?flock_id=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const flockId = searchParams.get("flock_id");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from("incident_reports")
      .select("*, profiles:reported_by(full_name, role), flocks:flock_id(name)")
      .order("created_at", { ascending: false });

    if (flockId) {
      query = query.eq("flock_id", flockId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Fetch incidents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 },
    );
  }
}

// POST /api/incidents
// Body: { flock_id, description, cause, reported_by }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flock_id, description, cause, reported_by } = body;

    if (!flock_id || !description || !cause || !reported_by) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: flock_id, description, cause, reported_by",
        },
        { status: 400 },
      );
    }

    const validCauses = [
      "disease",
      "natural_disaster",
      "negligence",
      "mismanagement",
      "other",
    ];
    if (!validCauses.includes(cause)) {
      return NextResponse.json(
        { error: `Invalid cause. Must be one of: ${validCauses.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("incident_reports")
      .insert({
        flock_id,
        description,
        cause,
        reported_by,
        incident_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Create incident error:", error);
    return NextResponse.json(
      { error: "Failed to create incident report" },
      { status: 500 },
    );
  }
}

// PATCH /api/incidents
// Body: { id, investigation_notes?, findings?, negligence_found?, compensation_required?, resolved? }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing incident report id" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const payload: Record<string, unknown> = {};
    if (updates.investigation_notes !== undefined)
      payload.investigation_notes = updates.investigation_notes;
    if (updates.findings !== undefined) payload.findings = updates.findings;
    if (updates.negligence_found !== undefined)
      payload.negligence_found = updates.negligence_found;
    if (updates.negligence_determined !== undefined)
      payload.negligence_determined = updates.negligence_determined;
    if (updates.compensation_required !== undefined)
      payload.compensation_required = updates.compensation_required;
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.status === "resolved") {
        payload.resolved_at = new Date().toISOString();
      } else if (updates.status === "investigating") {
        payload.investigation_started_at = new Date().toISOString();
      }
    }
    if (updates.admin_determination !== undefined)
      payload.admin_determination = updates.admin_determination;
    if (updates.admin_resolution_notes !== undefined)
      payload.admin_resolution_notes = updates.admin_resolution_notes;
    if (updates.investigation_started_at !== undefined)
      payload.investigation_started_at = updates.investigation_started_at;
    if (updates.resolved) payload.resolved_at = new Date().toISOString();

    // VET Report Fields
    if (updates.birds_dead !== undefined) payload.birds_dead = updates.birds_dead;
    if (updates.birds_culled !== undefined) payload.birds_culled = updates.birds_culled;
    if (updates.birds_isolated !== undefined) payload.birds_isolated = updates.birds_isolated;
    if (updates.birds_recovered !== undefined) payload.birds_recovered = updates.birds_recovered;
    if (updates.birds_sold !== undefined) payload.birds_sold = updates.birds_sold;
    if (updates.clinical_exam !== undefined) payload.clinical_exam = updates.clinical_exam;
    if (updates.physical_exam !== undefined) payload.physical_exam = updates.physical_exam;
    if (updates.action_plan !== undefined) payload.action_plan = updates.action_plan;
    if (updates.recommendations !== undefined) payload.recommendations = updates.recommendations;
    if (updates.history !== undefined) payload.history = updates.history;
    if (updates.affected_flock_ids !== undefined) payload.affected_flock_ids = updates.affected_flock_ids;

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("incident_reports")
      .update(payload)
      .eq("id", id)
      .select("*, flocks(name)")
      .single();

    if (error) throw error;

    if (updates.status === "resolved") {
      const { data: investors } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "investor");

      if (investors && investors.length > 0) {
        const titleStr = payload.admin_determination === "risk_neg_found"
          ? "Incident Risk Found"
          : "Incident Resolved";
        const msgStr = `The reported incident on flock ${data.flocks?.name || 'Unknown'} has been reviewed by the Admin.`;
        
        const notifs = investors.map((inv: any) => ({
          user_id: inv.id,
          title: titleStr,
          message: msgStr,
          type: "system",
          redirect_url: "/investor/activity"
        }));

        await supabase.from("notifications").insert(notifs);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Update incident error:", error);
    return NextResponse.json(
      { error: "Failed to update incident report" },
      { status: 500 },
    );
  }
}
