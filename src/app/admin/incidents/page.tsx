"use client";

import { useEffect, useState } from "react";

interface Incident {
  id: string;
  flock_id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "received" | "investigating" | "resolved" | "reported" | "dismissed";
  reported_by: string;
  investigation_notes: string | null;
  resolution: string | null;
  admin_resolution_notes: string | null;
  negligence_determined: boolean;
  created_at: string;
  updated_at: string;
  investigation_started_at?: string;
  admin_determination?:
    | "resolved_no_neg"
    | "risk_alert_no_neg"
    | "risk_neg_found";
  // VET Report details
  birds_dead?: number;
  birds_culled?: number;
  birds_isolated?: number;
  birds_recovered?: number;
  clinical_exam?: string;
  physical_exam?: string;
  recommendations?: string;
  action_plan?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-rose-100 text-rose-700",
};

const STATUS_STYLES: Record<string, string> = {
  received: "bg-sky-100 text-sky-700",
  reported: "bg-indigo-100 text-indigo-700",
  investigating: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-slate-100 text-slate-500",
};

const DETERMINATION_LABELS = {
  resolved_no_neg: "Resolved (No Negligence Found)",
  risk_alert_no_neg: "Risk Alert (No Negligence Found)",
  risk_neg_found: "Risk (Negligence Found)",
};

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDetermination, setSelectedDetermination] = useState<
    Incident["admin_determination"] | null
  >(null);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [adminSummary, setAdminSummary] = useState("");

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    try {
      const res = await fetch("/api/incidents");
      const data = await res.json();
      if (data.data) setIncidents(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function updateIncident(id: string, updates: Partial<Incident>) {
    setUpdating(id);
    try {
      const res = await fetch("/api/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.data) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...data.data } : i)),
        );
      }
    } catch (err) {
      console.error(err);
    }
    setUpdating(null);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-6" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
          Incident Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Mudarabah compliance — track, investigate, and resolve farm incidents.
          Negligence must be determined for Mudarib liability.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total",
            value: incidents.length,
            icon: "report",
            color: "text-slate-600",
          },
          {
            label: "Investigating",
            value: incidents.filter((i) => i.status === "investigating" || i.status === "reported").length,
            icon: "search",
            color: "text-amber-600",
          },
          {
            label: "Resolved",
            value: incidents.filter((i) => i.status === "resolved").length,
            icon: "check_circle",
            color: "text-emerald-600",
          },
          {
            label: "Negligence Found",
            value: incidents.filter((i) => i.negligence_determined).length,
            icon: "gavel",
            color: "text-rose-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-lg ${s.color}`}>
                {s.icon}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {s.label}
              </span>
            </div>
            <p className="font-mono text-2xl font-extrabold text-primary">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">
            check_circle
          </span>
          <h3 className="text-lg font-bold text-primary mb-2">No Incidents</h3>
          <p className="text-sm text-slate-400">
            All flocks are operating normally. No incidents have been reported.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary">
                    {incident.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Flock: {incident.flock_id.slice(0, 8)} •{" "}
                    {new Date(incident.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${SEVERITY_STYLES[incident.severity]}`}
                  >
                    {incident.severity}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[incident.status]}`}
                  >
                    {incident.status}
                  </span>
                  {incident.negligence_determined && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                      ⚠ Negligence
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {incident.description}
              </p>

              {incident.investigation_notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                    Investigation Notes
                  </p>
                  <p className="text-xs text-amber-800">
                    {incident.investigation_notes}
                  </p>
                </div>
              )}

              {incident.resolution && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-4">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Resolution
                  </p>
                  <p className="text-xs text-emerald-800">
                    {incident.resolution}
                  </p>
                </div>
              )}

              {/* Admin Actions */}
              {incident.status !== "resolved" &&
                incident.status !== "dismissed" && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    {/* VET Report Visibility - only if reported or investigating */}
                    {(incident.status === "reported" ||
                      incident.status === "investigating") && (
                      <div className="w-full mb-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            VET Investigation Report
                          </h4>
                          {incident.status === "reported" && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                              REPORT READY
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {[
                            {
                              label: "Dead",
                              val: incident.birds_dead,
                              color: "text-rose-600",
                            },
                            {
                              label: "Culled",
                              val: incident.birds_culled,
                              color: "text-amber-600",
                            },
                            {
                              label: "Isolated",
                              val: incident.birds_isolated,
                              color: "text-sky-600",
                            },
                            {
                              label: "Recovered",
                              val: incident.birds_recovered,
                              color: "text-emerald-600",
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="p-2 bg-white rounded border border-slate-100"
                            >
                              <p className="text-[8px] text-slate-400 uppercase font-bold">
                                {stat.label}
                              </p>
                              <p
                                className={`text-sm font-mono font-bold ${stat.color}`}
                              >
                                {stat.val || 0}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500">
                              Clinical Exam Findings
                            </p>
                            <p className="text-xs text-slate-600 italic bg-white p-2 rounded mt-1 border border-slate-100">
                              {incident.clinical_exam || "Pending..."}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-500">
                              Recommendations
                            </p>
                            <p className="text-xs text-slate-600 italic bg-white p-2 rounded mt-1 border border-slate-100">
                              {incident.recommendations || "Pending..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contextual Information/Buttons */}
                  <div className="flex flex-wrap gap-2 w-full">
                    {incident.status === 'received' && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-xs animate-pulse">hourglass_empty</span>
                        Awaiting VET investigation...
                      </div>
                    )}

                    {incident.status === 'investigating' && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                        Investigation in Progress
                      </div>
                    )}

                    {incident.status === 'reported' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setActiveIncident(incident);
                            setSelectedDetermination('resolved_no_neg');
                            setShowSummaryModal(true);
                            setAdminSummary("");
                          }}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600"
                        >
                          Resolved (No Negligence)
                        </button>
                        <button
                          onClick={() => {
                            setActiveIncident(incident);
                            setSelectedDetermination('risk_alert_no_neg');
                            setShowSummaryModal(true);
                            setAdminSummary("");
                          }}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600"
                        >
                          Risk Alert (No Negligence)
                        </button>
                        <button
                          onClick={() => {
                            setActiveIncident(incident);
                            setSelectedDetermination('risk_neg_found');
                            setShowSummaryModal(true);
                            setAdminSummary("");
                          }}
                          className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600"
                        >
                          Risk (Negligence Found)
                        </button>
                      </div>
                    )}
                  </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Summary Modal */}
      {showSummaryModal && activeIncident && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-primary text-white">
              <h3 className="text-xl font-heading font-bold">
                Final Incident Determination
              </h3>
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mt-1">
                {DETERMINATION_LABELS[selectedDetermination!]}
              </p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Formal Summary & Outcome
                </label>
                <textarea
                  value={adminSummary}
                  onChange={(e) => setAdminSummary(e.target.value)}
                  placeholder="Summarize the entire incident and the final decision. This will be visible to investors."
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    if (!adminSummary.trim())
                      return alert("Please provide a summary.");
                    await updateIncident(activeIncident.id, {
                      status: "resolved",
                      admin_determination: selectedDetermination!,
                      admin_resolution_notes: adminSummary,
                      negligence_determined:
                        selectedDetermination === "risk_neg_found",
                    });
                    setShowSummaryModal(false);
                  }}
                  disabled={updating === activeIncident.id}
                  className="flex-[2] py-3 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-lg shadow-stone-200 hover:stone-800 transition-all"
                >
                  Finalise & Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
