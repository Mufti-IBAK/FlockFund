"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    activeFlocks: 0,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const [reports, flocks] = await Promise.all([
          supabase.from("farm_reports").select("status"),
          supabase.from("flocks").select("id").eq("status", "active"),
        ]);
        const list = reports.data || [];
        setStats({
          pending: list.filter((r) => r.status === "pending").length,
          approved: list.filter((r) => r.status === "approved").length,
          rejected: list.filter((r) => r.status === "rejected").length,
          activeFlocks: flocks.data?.length || 0,
        });
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
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
      });
      return () => ctx.revert();
    }
  }, []);

  const kpis = [
    {
      label: "Pending Reviews",
      value: stats.pending,
      icon: "pending_actions",
      color: "from-amber-500/20 to-orange-500/20",
      textColor: "text-amber-700",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: "check_circle",
      color: "from-emerald-500/20 to-teal-500/20",
      textColor: "text-emerald-700",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: "cancel",
      color: "from-rose-500/20 to-pink-500/20",
      textColor: "text-rose-700",
    },
    {
      label: "Active Flocks",
      value: stats.activeFlocks,
      icon: "egg_alt",
      color: "from-sky-500/20 to-indigo-500/20",
      textColor: "text-sky-700",
    },
  ];

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Farm Manager Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor flock health and review keeper reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`kpi-card bg-gradient-to-br ${kpi.color} rounded-2xl p-5 border border-white/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-default`}
          >
            <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm mb-4">
              <span
                className={`material-symbols-outlined text-xl ${kpi.textColor}`}
              >
                {kpi.icon}
              </span>
            </div>
            <p
              className={`font-mono text-2xl font-bold ${kpi.textColor} tracking-tighter`}
            >
              {kpi.value}
            </p>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/manager/pending"
            className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 hover:shadow-md transition-all duration-300"
          >
            <span className="material-symbols-outlined text-amber-600 text-2xl">
              pending_actions
            </span>
            <div>
              <p className="text-sm font-bold text-primary">
                Review Pending Reports
              </p>
              <p className="text-[10px] text-slate-400">
                {stats.pending} reports awaiting review
              </p>
            </div>
          </a>
          <a
            href="/manager/health-trends"
            className="flex items-center gap-4 p-4 rounded-xl bg-sky-50 border border-sky-100 hover:shadow-md transition-all duration-300"
          >
            <span className="material-symbols-outlined text-sky-600 text-2xl">
              monitoring
            </span>
            <div>
              <p className="text-sm font-bold text-primary">Health Trends</p>
              <p className="text-[10px] text-slate-400">
                View flock health analytics
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
