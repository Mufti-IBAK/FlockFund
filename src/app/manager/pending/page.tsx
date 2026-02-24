"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Report {
  id: string;
  flock_id: string;
  keeper_id: string;
  mortality_count: number;
  clinical_signs: string;
  temperature_celsius: number;
  feed_available: boolean;
  water_available: boolean;
  feed_consumed_kg: number;
  status: string;
  vet_notes: string | null;
  report_date: string;
  created_at: string;
}

export default function ManagerPending() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [vetNotes, setVetNotes] = useState<Record<string, string>>({});
  const [diagCategories, setDiagCategories] = useState<Record<string, string>>(
    {},
  );
  const [processing, setProcessing] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  async function loadPending() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("farm_reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".report-card"),
          { y: 30, opacity: 0, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "back.out(1.3)",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading, reports]);

  async function handleAction(
    reportId: string,
    action: "approved" | "rejected",
  ) {
    setProcessing(reportId);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: report } = await supabase
        .from("farm_reports")
        .select("flock_id, mortality_count")
        .eq("id", reportId)
        .single();

      const { error } = await supabase
        .from("farm_reports")
        .update({
          status: action,
          vet_notes: vetNotes[reportId] || null,
          diagnosis_category: diagCategories[reportId] || null,
          approved_by: user?.id || null,
        })
        .eq("id", reportId);
      if (error) throw error;

      // Handle mortality and FCR on approval
      if (action === "approved" && report?.flock_id) {
        // 1. Sync bird counts if mortality recorded
        if (report.mortality_count > 0) {
          const { data: flock } = await supabase
            .from("flocks")
            .select("current_count, mortality_count")
            .eq("id", report.flock_id)
            .single();

          if (flock) {
            await supabase
              .from("flocks")
              .update({
                current_count: Math.max(
                  0,
                  flock.current_count - report.mortality_count,
                ),
                mortality_count:
                  (flock.mortality_count || 0) + report.mortality_count,
              })
              .eq("id", report.flock_id);
          }
        }

        // 2. Trigger FCR recalculation
        fetch("/api/fcr/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flock_id: report.flock_id }),
        }).catch((err) => console.error("FCR calc error:", err));
      }

      // Animate removal
      const card = contentRef.current?.querySelector(`[data-id="${reportId}"]`);
      if (card) {
        gsap.to(card, {
          x: action === "approved" ? 80 : -80,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            void loadPending();
          },
        });
      } else {
        await loadPending();
      }
    } catch (err) {
      console.error(`Failed to ${action} report:`, err);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Pending Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review and approve keeper daily reports
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-3">
            Loading pending reports…
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <span className="material-symbols-outlined text-5xl text-emerald-300 mb-4">
            check_circle
          </span>
          <p className="text-sm text-slate-400">
            All caught up! No pending reports to review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((r) => (
            <div
              key={r.id}
              data-id={r.id}
              className="report-card bg-white rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600">
                      pending_actions
                    </span>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-primary">
                      Daily Report
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(
                        r.report_date || r.created_at,
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {r.mortality_count > 0 && (
                  <span className="text-xs font-bold text-rose-600 px-3 py-1.5 rounded-full bg-rose-50 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      warning
                    </span>
                    {r.mortality_count} mortality
                  </span>
                )}
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-5 gap-4 p-4 bg-slate-50 rounded-xl mb-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Mortality
                  </p>
                  <p
                    className={`font-mono text-lg font-bold ${r.mortality_count > 0 ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {r.mortality_count}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Temperature
                  </p>
                  <p className="font-mono text-lg font-bold text-primary">
                    {r.temperature_celsius ? `${r.temperature_celsius}°C` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Feed (kg)
                  </p>
                  <p className="font-mono text-lg font-bold text-primary">
                    {r.feed_consumed_kg || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Feed Supply
                  </p>
                  <p
                    className={`text-sm font-bold ${r.feed_available ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {r.feed_available ? "✓ Available" : "✗ Low"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Water
                  </p>
                  <p
                    className={`text-sm font-bold ${r.water_available ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {r.water_available ? "✓ Available" : "✗ Low"}
                  </p>
                </div>
              </div>

              {/* Clinical Signs */}
              {r.clinical_signs && (
                <div className="mb-4 p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-1">
                    Clinical Signs
                  </p>
                  <p className="text-sm text-rose-800">{r.clinical_signs}</p>
                </div>
              )}

              {/* Diagnostics & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Diagnosis Category
                  </label>
                  <select
                    value={diagCategories[r.id] || ""}
                    onChange={(e) =>
                      setDiagCategories({
                        ...diagCategories,
                        [r.id]: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  >
                    <option value="">No Diagnosis</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Nutritional">Nutritional</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Viral">Viral Infectious</option>
                    <option value="Bacterial">Bacterial</option>
                    <option value="Injury">Physical Injury</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Vet Notes (optional)
                  </label>
                  <textarea
                    rows={1}
                    placeholder="Recommendations..."
                    value={vetNotes[r.id] || ""}
                    onChange={(e) =>
                      setVetNotes({ ...vetNotes, [r.id]: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleAction(r.id, "rejected")}
                  disabled={processing === r.id}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                  Reject
                </button>
                <button
                  onClick={() => handleAction(r.id, "approved")}
                  disabled={processing === r.id}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    check
                  </span>
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
