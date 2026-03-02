"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Report {
  id: string;
  mortality_count: number;
  clinical_signs: string;
  temperature_celsius: number;
  feed_consumed_kg: number;
  status: string;
  vet_notes: string | null;
  report_date: string;
  created_at: string;
}

export default function ManagerApproved() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("farm_reports")
          .select("*")
          .in("status", ["approved", "rejected"])
          .order("created_at", { ascending: false });
        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".report-row"),
          { x: 30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.05,
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
          Reviewed Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          History of approved and rejected farm reports
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
              assignment
            </span>
            <p className="text-sm text-slate-400">No reviewed reports yet.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <div className="divide-y divide-slate-50 min-w-[800px] xl:min-w-0">
                <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Date</span>
                  <span>Status</span>
                  <span>Mortality</span>
                  <span>Feed (kg)</span>
                  <span>Clinical Signs</span>
                  <span>Vet Notes</span>
                </div>
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="report-row grid grid-cols-6 gap-4 px-5 py-4 items-center hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-xs text-slate-500">
                      {new Date(
                        r.report_date || r.created_at,
                      ).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit ${
                        r.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${r.mortality_count > 0 ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {r.mortality_count}
                    </span>
                    <span className="font-mono text-sm text-primary">
                      {r.feed_consumed_kg || "—"}
                    </span>
                    <p className="text-xs text-slate-400 truncate">
                      {r.clinical_signs || "—"}
                    </p>
                    <p className="text-xs text-sky-600 truncate">
                      {r.vet_notes || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:hidden gap-4 p-4">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3 report-row relative"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(
                        r.report_date || r.created_at,
                      ).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        r.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Mortality
                      </p>
                      <span
                        className={`font-mono text-sm font-bold ${r.mortality_count > 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {r.mortality_count}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Feed (kg)
                      </p>
                      <span className="font-mono text-sm font-bold text-primary">
                        {r.feed_consumed_kg || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                        Clinical Signs
                      </p>
                      <p className="text-xs text-slate-700">
                        {r.clinical_signs || "—"}
                      </p>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                        Vet Notes
                      </p>
                      <p className="text-xs text-sky-700 italic">
                        {r.vet_notes || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
