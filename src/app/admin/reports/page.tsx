'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

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
  approved_by: string | null;
  report_date: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('farm_reports')
          .select('*')
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
        gsap.fromTo(
          contentRef.current!.querySelectorAll('.report-row'),
          { x: 30, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: 'power2.out', delay: 0.1 }
        );
      });
      return () => ctx.revert();
    }
  }, [loading, reports, filterStatus]);

  const filtered = filterStatus === 'all' ? reports : reports.filter((r) => r.status === filterStatus);
  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    approved: reports.filter((r) => r.status === 'approved').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Farm reports from keepers across all flocks</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All', icon: 'description' },
          { key: 'pending', label: 'Pending', icon: 'pending' },
          { key: 'approved', label: 'Approved', icon: 'check_circle' },
          { key: 'rejected', label: 'Rejected', icon: 'cancel' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              filterStatus === tab.key
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${filterStatus === tab.key ? 'bg-white/20' : 'bg-slate-100'}`}>
              {counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">Loading reports…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">assignment</span>
            <p className="text-sm text-slate-400">No reports found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="grid grid-cols-7 gap-4 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Date</span>
              <span>Mortality</span>
              <span>Temp</span>
              <span>Feed (kg)</span>
              <span>Feed/Water</span>
              <span>Status</span>
              <span>Clinical Signs</span>
            </div>
            {filtered.map((r) => (
              <div key={r.id} className="report-row grid grid-cols-7 gap-4 px-5 py-4 items-center hover:bg-slate-50/50 transition-colors duration-300">
                <span className="text-xs text-slate-500">{new Date(r.report_date || r.created_at).toLocaleDateString()}</span>
                <span className={`font-mono text-sm font-bold ${r.mortality_count > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {r.mortality_count}
                </span>
                <span className="font-mono text-sm text-primary">{r.temperature_celsius ? `${r.temperature_celsius}°C` : '—'}</span>
                <span className="font-mono text-sm text-primary">{r.feed_consumed_kg || '—'}</span>
                <div className="flex gap-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${r.feed_available ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {r.feed_available ? '✓ Feed' : '✗ Feed'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${r.water_available ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {r.water_available ? '✓ Water' : '✗ Water'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                  {r.status}
                </span>
                <p className="text-xs text-slate-400 truncate">{r.clinical_signs || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
