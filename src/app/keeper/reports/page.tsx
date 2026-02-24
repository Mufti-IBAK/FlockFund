'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface Report {
  id: string;
  flock_id: string;
  mortality_count: number;
  clinical_signs: string;
  temperature_celsius: number;
  feed_consumed_kg: number;
  feed_available: boolean;
  water_available: boolean;
  status: string;
  vet_notes: string | null;
  report_date: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export default function KeeperReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('farm_reports')
          .select('*')
          .eq('keeper_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.report-card'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, [loading, reports]);

  const counts = {
    pending: reports.filter((r) => r.status === 'pending').length,
    approved: reports.filter((r) => r.status === 'approved').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div ref={contentRef}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">My Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Your submitted daily flock reports</p>
        </div>
        <a href="/keeper/new-report"
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300">
          <span className="material-symbols-outlined text-lg">add</span>
          New Report
        </a>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending', count: counts.pending, icon: 'pending', color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-700' },
          { label: 'Approved', count: counts.approved, icon: 'check_circle', color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-700' },
          { label: 'Rejected', count: counts.rejected, icon: 'cancel', color: 'from-rose-500/20 to-pink-500/20', textColor: 'text-rose-700' },
        ].map((s) => (
          <div key={s.label} className={`report-card bg-gradient-to-br ${s.color} rounded-2xl p-5 border border-white/40`}>
            <span className={`material-symbols-outlined text-2xl ${s.textColor} mb-2`}>{s.icon}</span>
            <p className={`font-mono text-2xl font-bold ${s.textColor}`}>{s.count}</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">Loading reports…</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">assignment</span>
            <p className="text-sm text-slate-400">No reports submitted yet.</p>
          </div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="report-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">{new Date(r.report_date || r.created_at).toLocaleDateString()}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                {r.mortality_count > 0 && (
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {r.mortality_count} mortality
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Temp</p>
                  <p className="font-mono font-bold text-primary">{r.temperature_celsius ? `${r.temperature_celsius}°C` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feed</p>
                  <p className="font-mono font-bold text-primary">{r.feed_consumed_kg ? `${r.feed_consumed_kg} kg` : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feed/Water</p>
                  <p className="text-sm">
                    <span className={r.feed_available ? 'text-emerald-600' : 'text-rose-600'}>{r.feed_available ? '✓' : '✗'}</span>
                    {' / '}
                    <span className={r.water_available ? 'text-emerald-600' : 'text-rose-600'}>{r.water_available ? '✓' : '✗'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notes</p>
                  <p className="text-xs text-slate-500 truncate">{r.clinical_signs || '—'}</p>
                </div>
              </div>
              {r.vet_notes && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wider mb-1">Vet Notes</p>
                  <p className="text-xs text-slate-500">{r.vet_notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
