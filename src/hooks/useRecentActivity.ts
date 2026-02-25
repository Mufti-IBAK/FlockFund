"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ActivityItem {
  icon: string;
  text: string;
  detail: string;
  time: string;
  color: string;
  sortDate: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function useRecentActivity(limit = 10) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActivity = async () => {
    try {
      const [recentInvestors, recentInvestments, recentReports] = await Promise.all([
        supabase.from("profiles").select("full_name, created_at").eq("role", "investor").order("created_at", { ascending: false }).limit(limit),
        supabase.from("investments").select("amount_invested, birds_owned, created_at").in("status", ["active", "completed"]).order("created_at", { ascending: false }).limit(limit),
        supabase.from("farm_reports").select("mortality_count, created_at, status").order("created_at", { ascending: false }).limit(limit),
      ]);

      const items: ActivityItem[] = [];

      (recentInvestors.data || []).forEach((p) => {
        items.push({
          icon: "person_add",
          text: "New investor registered",
          detail: p.full_name || "Anonymous",
          time: timeAgo(p.created_at),
          color: "text-emerald-500",
          sortDate: new Date(p.created_at).getTime(),
        });
      });

      (recentInvestments.data || []).forEach((inv) => {
        items.push({
          icon: "payments",
          text: "Investment payment received",
          detail: `₦${(inv.amount_invested || 0).toLocaleString()} · ${inv.birds_owned || 0} birds`,
          time: timeAgo(inv.created_at),
          color: "text-accent",
          sortDate: new Date(inv.created_at).getTime(),
        });
      });

      (recentReports.data || []).forEach((r) => {
        if (r.mortality_count > 0) {
          items.push({
            icon: "warning",
            text: "Mortality alert",
            detail: `${r.mortality_count} bird${r.mortality_count > 1 ? "s" : ""} reported`,
            time: timeAgo(r.created_at),
            color: "text-rose-500",
            sortDate: new Date(r.created_at).getTime(),
          });
        } else {
          items.push({
            icon: "assignment",
            text: "Farm report submitted",
            detail: `${r.status === "approved" ? "Approved" : "Pending review"} · 0 mortality`,
            time: timeAgo(r.created_at),
            color: "text-sky-500",
            sortDate: new Date(r.created_at).getTime(),
          });
        }
      });

      items.sort((a, b) => b.sortDate - a.sortDate);
      setActivity(items.slice(0, limit));
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();

    const profilesSub = supabase
      .channel("profiles_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles", filter: "role=eq.investor" }, () => fetchActivity())
      .subscribe();

    const investmentsSub = supabase
      .channel("investments_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "investments" }, () => fetchActivity())
      .subscribe();

    const reportsSub = supabase
      .channel("reports_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "farm_reports" }, () => fetchActivity())
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(investmentsSub);
      supabase.removeChannel(reportsSub);
    };
  }, []);

  return { activity, loading, refresh: fetchActivity };
}
