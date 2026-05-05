import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_platform_stats");

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API Stats Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
