"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Report {
  id: string;
  mortality_count: number;
  clinical_signs: string;
  temperature_celsius: number;
  feed_consumed_kg: number;
  report_date: string;
  created_at: string;
}

export default function InvestorActivity() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let supabase: any;
    async function init() {
      const { createClient } = await import("@/lib/supabase/client");
      supabase = createClient();
      load();

      // Real-time subscriptions
      const reportsSub = supabase
        .channel("activity_reports")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "farm_reports" },
          () => load(),
        )
        .subscribe();

      const incidentsSub = supabase
        .channel("activity_incidents")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "incident_reports" },
          () => load(),
        );

      incidentsSub.subscribe();

      return () => {
        supabase.removeChannel(reportsSub);
        supabase.removeChannel(incidentsSub);
      };
    }

    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabaseClient = createClient();

        const [reportsRes, incidentsRes] = await Promise.all([
          supabaseClient
            .from("farm_reports")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(20),
          supabaseClient
            .from("incident_reports")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(20),
        ]);

        const combined: any[] = [
          ...(reportsRes.data || []).map((r) => ({
            ...r,
            type: "report",
            sortDate: new Date(r.created_at).getTime(),
          })),
        ];

        (incidentsRes.data || []).forEach((inc) => {
          const causeTitle = inc.cause ? inc.cause.replace(/_/g, ' ').toUpperCase() : 'FARM INCIDENT';

          combined.push({
            id: `${inc.id}-alert`,
            type: "incident_custom",
            title: `Keeper Alerted: ${causeTitle}`,
            icon: "notification_important",
            color: "bg-amber-100 text-amber-600",
            detail: inc.description?.slice(0, 80) + "...",
            sortDate: new Date(inc.created_at).getTime(),
            dateDisplay: inc.created_at
          });

          if (inc.investigation_started_at) {
            combined.push({
              id: `${inc.id}-investigating`,
              type: "incident_custom",
              title: `Investigation Started: ${causeTitle}`,
              icon: "sync",
              color: "bg-amber-50 text-amber-500",
              detail: "VET is on-site examining the situation.",
              sortDate: new Date(inc.investigation_started_at).getTime(),
              dateDisplay: inc.investigation_started_at
            });
          }

          if (inc.status === "reported" || inc.status === "resolved") {
            const rDate = inc.updated_at || inc.created_at;
            combined.push({
              id: `${inc.id}-reported`,
              type: "incident_custom",
              title: `VET Report Submitted: ${causeTitle}`,
              icon: "medical_services",
              color: "bg-indigo-100 text-indigo-600",
              detail: "VET report submitted and pending Admin review.",
              sortDate: new Date(rDate).getTime(),
              dateDisplay: rDate
            });
          }

          if (inc.status === "resolved" && inc.admin_determination) {
            const isRisk = inc.admin_determination === "risk_neg_found";
            combined.push({
              id: `${inc.id}-resolved`,
              type: "incident_custom",
              title: isRisk ? `Risk Found: ${causeTitle}` : `Incident Resolved: ${causeTitle}`,
              icon: isRisk ? "gavel" : "verified",
              color: isRisk ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600",
              detail: inc.admin_resolution_notes || inc.resolution || "Admin concluded this issue.",
              sortDate: new Date(inc.resolved_at || inc.updated_at).getTime(),
              dateDisplay: inc.resolved_at || inc.updated_at
            });
          }
        });

        combined.sort((a, b) => b.sortDate - a.sortDate);
        setReports(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".feed-item"),
          { x: -30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading, reports]);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Farm Activity
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time approved reports from the farm
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
            monitoring
          </span>
          <p className="text-sm text-slate-400">
            No approved farm activity yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r: any) => {
            const isReport = r.type === "report";

            let title = r.title;
            let icon = r.icon;
            let color = r.color;
            let detail = r.detail;

            if (isReport) {
              title = `Daily Health Report — ${r.mortality_count === 0 ? "All Clear" : `${r.mortality_count} mortality`}`;
              icon = r.mortality_count > 0 ? "warning" : "check_circle";
              color =
                r.mortality_count > 0
                  ? "bg-rose-100 text-rose-500"
                  : "bg-emerald-100 text-emerald-600";
              detail = "";
            }

            return (
              <div
                key={r.id}
                className="feed-item bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.split(" ")[0]}`}
                  >
                    <span
                      className={`material-symbols-outlined text-lg ${color.split(" ")[1]}`}
                    >
                      {icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">
                      {title}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-slate-400">
                      {isReport && (
                        <>
                          {r.temperature_celsius && (
                            <span>🌡 {r.temperature_celsius}°C</span>
                          )}
                          {r.feed_consumed_kg && (
                            <span>🌾 {r.feed_consumed_kg}kg feed</span>
                          )}
                          {r.clinical_signs && (
                            <span>📋 {r.clinical_signs.slice(0, 50)}</span>
                          )}
                        </>
                      )}
                      {!isReport && detail && (
                        <span className="text-slate-600 font-medium italic">
                          {detail}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">
                    {new Date(
                      r.dateDisplay || r.report_date || r.created_at,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
