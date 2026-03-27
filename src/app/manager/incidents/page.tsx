"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface Incident {
  id: string;
  flock_id: string;
  incident_date: string;
  description: string;
  status: 'received' | 'investigating' | 'resolved' | 'reported';
  urgency_grade: 'low' | 'medium' | 'high' | 'critical';
  reported_by: string;
  profiles: { full_name: string };
  flocks: { name: string };
  birds_dead?: number;
  birds_culled?: number;
  birds_isolated?: number;
  birds_recovered?: number;
  birds_sold?: number;
}

export default function ManagerIncidents() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeFlocks, setActiveFlocks] = useState<{id: string, name: string}[]>([]);
  const [inspecting, setInspecting] = useState<Incident | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Form State
  const [birdsDead, setBirdsDead] = useState(0);
  const [birdsCulled, setBirdsCulled] = useState(0);
  const [birdsIsolated, setBirdsIsolated] = useState(0);
  const [birdsRecovered, setBirdsRecovered] = useState(0);
  const [birdsSold, setBirdsSold] = useState(0);
  const [clinicalExam, setClinicalExam] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [history, setHistory] = useState("");
  const [selectedFlockIds, setSelectedFlockIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && pageRef.current) {
      gsap.fromTo(".incident-card", 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [loading, incidents]);

  async function loadData() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: incs } = await supabase
        .from("incident_reports")
        .select("*, profiles(full_name), flocks(name)")
        .order("created_at", { ascending: false });
      
      const { data: flks } = await supabase.from("flocks").select("id, name").eq("status", "active");

      setIncidents(incs || []);
      setActiveFlocks(flks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: Incident['status']) {
    try {
      await fetch('/api/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmitReport() {
    if (!inspecting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inspecting.id,
          status: 'reported',
          birds_dead: birdsDead,
          birds_culled: birdsCulled,
          birds_isolated: birdsIsolated,
          birds_recovered: birdsRecovered,
          birds_sold: birdsSold,
          clinical_exam: clinicalExam,
          physical_exam: physicalExam,
          action_plan: actionPlan,
          recommendations: recommendations,
          history: history,
          affected_flock_ids: selectedFlockIds
        })
      });

      if (!res.ok) throw new Error("API failed");
      
      alert("Professional VET Report Submitted to Admin.");
      setShowReportModal(false);
      setInspecting(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  const renderIncident = (inc: Incident) => (
    <div key={inc.id} className="incident-card bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${
        inc.urgency_grade === 'critical' ? 'bg-rose-500' : 
        inc.urgency_grade === 'high' ? 'bg-amber-500' : 'bg-sky-500'
      }`} />
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inc.flocks?.name}</span>
            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
              inc.status === 'received' ? 'bg-slate-100 text-slate-500' :
              inc.status === 'investigating' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {inc.status}
            </span>
          </div>
          <h3 className="text-sm font-bold text-primary max-w-[200px] truncate">{inc.description}</h3>
          <p className="text-[10px] text-slate-400 font-medium">Reported by {inc.profiles?.full_name} • {new Date(inc.incident_date).toLocaleDateString()}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
          inc.urgency_grade === 'critical' ? 'bg-rose-50 text-rose-600' : 
          inc.urgency_grade === 'high' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
        }`}>
          {inc.urgency_grade}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {inc.status === 'received' && (
          <button 
            onClick={() => updateStatus(inc.id, 'investigating')}
            className="flex-1 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            Investigate
          </button>
        )}
        {inc.status === 'investigating' && (
          <button 
            onClick={() => { setInspecting(inc); setShowReportModal(true); setHistory(""); setClinicalExam(""); setPhysicalExam(""); setActionPlan(""); setRecommendations(""); setSelectedFlockIds([inc.flock_id]); }}
            className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            Finalize Report
          </button>
        )}
        {inc.status === 'reported' && (
          <div className="w-full py-3 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-2xl text-center">
            Reported to Admin
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={pageRef} className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">VET Incident Management</h1>
          <p className="text-slate-400 text-sm mt-1">Review and process health/operational alerts from Keepers.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.map(renderIncident)}
        </div>
      )}

      {/* VET Final Report Modal */}
      {showReportModal && inspecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-heading font-bold">Comprehensive VET Report</h3>
                <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Final Stages of Investigation</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-white/60 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Bird Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Dead", val: birdsDead, set: setBirdsDead, color: "rose" },
                  { label: "Culled", val: birdsCulled, set: setBirdsCulled, color: "slate" },
                  { label: "Isolated", val: birdsIsolated, set: setBirdsIsolated, color: "amber" },
                  { label: "Recovered", val: birdsRecovered, set: setBirdsRecovered, color: "emerald" },
                  { label: "Sold", val: birdsSold, set: setBirdsSold, color: "sky" }
                ].map(stat => (
                  <div key={stat.label} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">{stat.label}</label>
                    <input 
                      type="number" 
                      value={stat.val} 
                      onChange={(e) => stat.set(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-primary" 
                    />
                  </div>
                ))}
              </div>

              {/* Multi Flock Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Flocks Affected</label>
                <div className="flex flex-wrap gap-2">
                  {activeFlocks.map(f => (
                    <button 
                      key={f.id}
                      onClick={() => setSelectedFlockIds(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        selectedFlockIds.includes(f.id) ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">History</label>
                    <textarea value={history} onChange={e => setHistory(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Physical Exam</label>
                    <textarea value={physicalExam} onChange={e => setPhysicalExam(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinical Exam</label>
                    <textarea value={clinicalExam} onChange={e => setClinicalExam(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action Plan</label>
                    <textarea value={actionPlan} onChange={e => setActionPlan(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Final Recommendations</label>
                  <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs shadow-sm" />
                </div>
              </div>

              <button 
                onClick={handleSubmitReport}
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 text-white font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? "Processing..." : "Submit Professional Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
