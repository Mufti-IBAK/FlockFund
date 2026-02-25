"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";

/* ── helpers ── */
function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
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

/* ── types ── */
interface KPI {
  label: string;
  value: string;
  change: string;
  icon: string;
  trend: "up" | "down" | "neutral";
  color: string;
}

interface ActivityItem {
  icon: string;
  text: string;
  detail: string;
  time: string;
  color: string;
  sortDate: number;
}

export default function AdminOverview() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── data loader ── */
  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).toISOString();
        const startOfPrevMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        ).toISOString();
        const endOfPrevMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
        ).toISOString();
        const oneWeekAgo = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();

        /* ── parallel queries ── */
        const [
          flocksRes,
          flocksThisMonthRes,
          investorsRes,
          investorsThisWeekRes,
          revThisMonthRes,
          revPrevMonthRes,
          reportsActiveRes,
          reportsActiveLastMonthRes,
          activeFlocksForMortRes,
          // activity feed queries
          recentInvestorsRes,
          recentInvestmentsRes,
          recentReportsRes,
        ] = await Promise.all([
          // KPI: Active Flocks count
          supabase
            .from("flocks")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          // KPI: Flocks created this month
          supabase
            .from("flocks")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startOfMonth),
          // KPI: Total Investors
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "investor"),
          // KPI: Investors joined this week
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "investor")
            .gte("created_at", oneWeekAgo),
          // KPI: Revenue this month
          supabase
            .from("investments")
            .select("amount_invested")
            .in("status", ["active", "completed"])
            .gte("created_at", startOfMonth),
          // KPI: Revenue previous month
          supabase
            .from("investments")
            .select("amount_invested")
            .in("status", ["active", "completed"])
            .gte("created_at", startOfPrevMonth)
            .lte("created_at", endOfPrevMonth),
          // KPI: Mortality — reports this month for active flocks
          supabase
            .from("farm_reports")
            .select("mortality_count")
            .gte("created_at", startOfMonth),
          // KPI: Mortality — reports last month
          supabase
            .from("farm_reports")
            .select("mortality_count")
            .gte("created_at", startOfPrevMonth)
            .lte("created_at", endOfPrevMonth),
          // KPI: Active flocks for batch_size total
          supabase
            .from("flocks")
            .select("batch_size, total_birds")
            .eq("status", "active"),
          // Activity: recent investors
          supabase
            .from("profiles")
            .select("full_name, created_at")
            .eq("role", "investor")
            .order("created_at", { ascending: false })
            .limit(5),
          // Activity: recent investments
          supabase
            .from("investments")
            .select("amount_invested, birds_owned, created_at")
            .in("status", ["active", "completed"])
            .order("created_at", { ascending: false })
            .limit(5),
          // Activity: recent farm reports
          supabase
            .from("farm_reports")
            .select("mortality_count, created_at, status")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        /* ── KPI 1: Active Flocks ── */
        const activeFlocks = flocksRes.count ?? 0;
        const flocksNewThisMonth = flocksThisMonthRes.count ?? 0;

        /* ── KPI 2: Total Investors ── */
        const totalInvestors = investorsRes.count ?? 0;
        const investorsNewThisWeek = investorsThisWeekRes.count ?? 0;

        /* ── KPI 3: Revenue MTD ── */
        const revThisMonth = (revThisMonthRes.data || []).reduce(
          (s, r) => s + (r.amount_invested || 0),
          0,
        );
        const revPrevMonth = (revPrevMonthRes.data || []).reduce(
          (s, r) => s + (r.amount_invested || 0),
          0,
        );
        const revChangePct =
          revPrevMonth > 0
            ? ((revThisMonth - revPrevMonth) / revPrevMonth) * 100
            : 0;

        /* ── KPI 4: Mortality Rate ── */
        const totalBirds = (activeFlocksForMortRes.data || []).reduce(
          (s, f) => s + (f.batch_size || f.total_birds || 0),
          0,
        );
        const mortalityThisMonth = (reportsActiveRes.data || []).reduce(
          (s, r) => s + (r.mortality_count || 0),
          0,
        );
        const mortalityLastMonth = (
          reportsActiveLastMonthRes.data || []
        ).reduce((s, r) => s + (r.mortality_count || 0), 0);
        const mortalityRate =
          totalBirds > 0 ? (mortalityThisMonth / totalBirds) * 100 : 0;
        const mortalityRateLastMonth =
          totalBirds > 0 ? (mortalityLastMonth / totalBirds) * 100 : 0;
        const mortalityDelta = mortalityRate - mortalityRateLastMonth;

        /* ── build KPIs ── */
        setKpis([
          {
            label: "Active Flocks",
            value: String(activeFlocks),
            change:
              flocksNewThisMonth > 0
                ? `+${flocksNewThisMonth} this month`
                : "No change",
            icon: "egg_alt",
            trend: flocksNewThisMonth > 0 ? "up" : "neutral",
            color: "from-emerald-500/20 to-teal-500/20",
          },
          {
            label: "Total Investors",
            value: String(totalInvestors),
            change:
              investorsNewThisWeek > 0
                ? `+${investorsNewThisWeek} this week`
                : "No change",
            icon: "group",
            trend: investorsNewThisWeek > 0 ? "up" : "neutral",
            color: "from-accent/20 to-amber-500/20",
          },
          {
            label: "Revenue (MTD)",
            value: formatNaira(revThisMonth),
            change:
              revPrevMonth > 0
                ? `${revChangePct >= 0 ? "+" : ""}${revChangePct.toFixed(1)}%`
                : revThisMonth > 0
                  ? "New"
                  : "₦0",
            icon: "trending_up",
            trend: revChangePct >= 0 ? "up" : "down",
            color: "from-sky-500/20 to-indigo-500/20",
          },
          {
            label: "Mortality Rate",
            value: `${mortalityRate.toFixed(1)}%`,
            change: `${mortalityDelta >= 0 ? "+" : ""}${mortalityDelta.toFixed(1)}%`,
            icon: "health_and_safety",
            trend: mortalityDelta <= 0 ? "down" : "up",
            color: "from-rose-500/20 to-pink-500/20",
          },
        ]);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── GSAP entrance ── */
  useEffect(() => {
    if (loading || !contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current!.querySelectorAll(".kpi-card"),
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          duration: 0.7,
          ease: "back.out(1.3)",
          delay: 0.1,
        },
      );
      gsap.fromTo(
        contentRef.current!.querySelectorAll(".activity-row"),
        { x: 30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: "power2.out",
          delay: 0.5,
        },
      );
    });
    return () => ctx.revert();
  }, [loading, kpis]);

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          System overview and management
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`kpi-card bg-gradient-to-br ${kpi.color} rounded-2xl p-5 border border-white/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-default`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-xl">
                  {kpi.icon}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  kpi.trend === "up"
                    ? "bg-emerald-100 text-emerald-700"
                    : kpi.trend === "down"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {kpi.change}
              </span>
            </div>
            <p className="font-mono text-2xl font-bold text-primary tracking-tighter">
              {kpi.value}
            </p>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <RecentActivityFeed limit={10} />
    </div>
  );
}
