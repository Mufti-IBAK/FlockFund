"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

export interface ActivityItem {
  icon: string;
  text: string;
  detail: string;
  time: string;
  color: string;
  sortDate: number;
}

export function useRecentActivity(limit = 9) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Use ref to avoid re-creating the client on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchActivity = async () => {
    try {
      const [
        recentInvestors,
        recentInvestments,
        recentReports,
        recentIncidents,
        recentSales,
        recentTasks,
        recentWithdrawals,
        recentVaccines,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, created_at")
          .eq("role", "investor")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("investments")
          .select("amount_invested, birds_owned, created_at")
          .in("status", ["active", "completed"])
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("farm_reports")
          .select("mortality_count, created_at, status")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("incident_reports")
          .select("cause, description, status, admin_determination, created_at, updated_at, investigation_started_at, resolved_at")
          .order("updated_at", { ascending: false })
          .limit(limit),
        supabase
          .from("sales_reports")
          .select("amount_birds, is_manure, total_revenue, sale_timestamp")
          .order("sale_timestamp", { ascending: false })
          .limit(limit),
        supabase
          .from("farm_activity_logs")
          .select("status, created_at, farm_activities(task_name)")
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("withdrawals")
          .select("amount, status, processed_at")
          .order("processed_at", { ascending: false })
          .limit(limit),
        supabase
          .from("vaccinations")
          .select("vaccine_name, status, administered_date, created_at")
          .order("created_at", { ascending: false })
          .limit(limit),
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

      (recentSales.data || []).forEach((sale) => {
        items.push({
          icon: sale.is_manure ? "compost" : "inventory_2",
          text: sale.is_manure ? "Manure Batch Sold" : "Birds Sold & Dispatched",
          detail: `Revenue: ₦${(sale.total_revenue || 0).toLocaleString()}${sale.is_manure ? "" : ` · ${sale.amount_birds} birds`}`,
          time: timeAgo(sale.sale_timestamp),
          color: "text-emerald-500",
          sortDate: new Date(sale.sale_timestamp).getTime(),
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

      (recentIncidents.data || []).forEach((inc) => {
        const causeTitle = inc.cause ? inc.cause.replace(/_/g, " ").toUpperCase() : "FARM INCIDENT";

        items.push({
          icon: "notification_important",
          text: "Incident Alert Raised",
          detail: `Keeper reported: ${causeTitle}`,
          time: timeAgo(inc.created_at),
          color: "text-amber-500",
          sortDate: new Date(inc.created_at).getTime(),
        });

        if (inc.investigation_started_at) {
          items.push({
            icon: "sync",
            text: "Investigation Started",
            detail: `VET on-site examination for: ${causeTitle}`,
            time: timeAgo(inc.investigation_started_at),
            color: "text-amber-600",
            sortDate: new Date(inc.investigation_started_at).getTime(),
          });
        }

        if (inc.status === "reported" || inc.status === "resolved") {
          const reportTime = inc.updated_at || inc.created_at;
          items.push({
            icon: "medical_services",
            text: "VET Report Submitted",
            detail: `Professional checkup filed for: ${causeTitle}`,
            time: timeAgo(reportTime),
            color: "text-indigo-500",
            sortDate: new Date(reportTime).getTime(),
          });
        }

        if (inc.status === "resolved" && inc.admin_determination) {
          const isRisk = inc.admin_determination === "risk_neg_found";
          items.push({
            icon: isRisk ? "gavel" : "check_circle",
            text: isRisk ? "Risk (Negligence Found)" : "Incident Resolved",
            detail: `Admin ruling for: ${causeTitle}`,
            time: timeAgo(inc.resolved_at || inc.updated_at),
            color: isRisk ? "text-rose-600" : "text-emerald-600",
            sortDate: new Date(inc.resolved_at || inc.updated_at).getTime(),
          });
        }
      });

      (recentTasks.data || []).forEach((task) => {
        const title = (task.farm_activities as any)?.task_name || "Daily Task";
        items.push({
          icon: task.status === "completed" ? "check_circle" : "pending_actions",
          text: `Task ${task.status}`,
          detail: title,
          time: timeAgo(task.created_at),
          color: task.status === "completed" ? "text-emerald-500" : "text-amber-500",
          sortDate: new Date(task.created_at).getTime(),
        });
      });

      (recentWithdrawals.data || []).forEach((w) => {
        const isCompleted = w.status === "completed";
        items.push({
          icon: "account_balance",
          text: isCompleted ? "Disbursement Successful" : "Payout Pending",
          detail: `₦${(w.amount || 0).toLocaleString()}`,
          time: timeAgo(w.processed_at),
          color: isCompleted ? "text-blue-500" : "text-slate-400",
          sortDate: new Date(w.processed_at).getTime(),
        });
      });

      (recentVaccines.data || []).forEach((v) => {
        const isDone = v.status === "administered";
        const dateStr = isDone ? v.administered_date || v.created_at : v.created_at;
        items.push({
          icon: "vaccines",
          text: isDone ? "Vaccine Administered" : "Vaccination Scheduled",
          detail: v.vaccine_name || "Unknown Vaccine",
          time: timeAgo(dateStr),
          color: isDone ? "text-emerald-600" : "text-purple-500",
          sortDate: new Date(dateStr).getTime(),
        });
      });

      items.sort((a, b) => b.sortDate - a.sortDate);
      setActivity(items.slice(0, 9));
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();

    const channels = [
      supabase.channel("profiles_changes").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchActivity()),
      supabase.channel("investments_changes").on("postgres_changes", { event: "*", schema: "public", table: "investments" }, () => fetchActivity()),
      supabase.channel("reports_changes").on("postgres_changes", { event: "*", schema: "public", table: "farm_reports" }, () => fetchActivity()),
      supabase.channel("incidents_changes").on("postgres_changes", { event: "*", schema: "public", table: "incident_reports" }, () => fetchActivity()),
      supabase.channel("sales_changes").on("postgres_changes", { event: "*", schema: "public", table: "sales_reports" }, () => fetchActivity()),
      supabase.channel("tasks_changes").on("postgres_changes", { event: "*", schema: "public", table: "farm_activity_logs" }, () => fetchActivity()),
      supabase.channel("withdrawals_changes").on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => fetchActivity()),
      supabase.channel("vaccines_changes").on("postgres_changes", { event: "*", schema: "public", table: "vaccinations" }, () => fetchActivity()),
    ];
    channels.forEach(ch => ch.subscribe());

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  return { activity, loading, refresh: fetchActivity };
}
