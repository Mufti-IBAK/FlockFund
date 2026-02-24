'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface FCR {
  id: string;
  flock_id: string;
  week_number: number;
  avg_weight_kg: number;
  total_feed_kg: number;
  fcr: number;
  calculated_at: string;
}

export default function AdminData() {
  const [fcrData, setFcrData] = useState<FCR[]>([]);
  const [feedLogs, setFeedLogs] = useState<number>(0);
  const [weightRecords, setWeightRecords] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const [fcr, feeds, weights] = await Promise.all([
          supabase.from('fcr_calculations').select('*').order('calculated_at', { ascending: false }).limit(20),
          supabase.from('feed_logs').select('id', { count: 'exact', head: true }),
          supabase.from('weight_records').select('id', { count: 'exact', head: true }),
        ]);
        setFcrData(fcr.data || []);
        setFeedLogs(feeds.count || 0);
        setWeightRecords(weights.count || 0);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.data-card'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, []);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Data Monetisation</h1>
        <p className="text-slate-400 text-sm mt-1">Feed conversion ratio analytics and data collection metrics</p>
      </div>

      {/* Data Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Feed Logs', value: feedLogs, icon: 'set_meal', color: 'from-emerald-500/20 to-teal-500/20' },
          { label: 'Weight Records', value: weightRecords, icon: 'monitor_weight', color: 'from-sky-500/20 to-indigo-500/20' },
          { label: 'FCR Calculations', value: fcrData.length, icon: 'calculate', color: 'from-accent/20 to-amber-500/20' },
        ].map((kpi) => (
          <div key={kpi.label} className={`data-card bg-gradient-to-br ${kpi.color} rounded-2xl p-5 border border-white/40`}>
            <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-primary text-xl">{kpi.icon}</span>
            </div>
            <p className="font-mono text-2xl font-bold text-primary tracking-tighter">{kpi.value.toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* FCR Trend Chart */}
      {fcrData.length > 0 && (
        <div className="data-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-700 text-lg">monitoring</span>
            </div>
            <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">FCR Trend</h3>
          </div>
          <div className="flex items-end gap-1 h-32">
            {fcrData.map((d, i) => {
              const maxFcr = Math.max(1, ...fcrData.map((f) => f.fcr));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-accent/30 rounded-t relative group" style={{ height: `${(d.fcr / maxFcr) * 100}%`, minHeight: '4px' }}>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Wk {d.week_number}: FCR {d.fcr.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FCR Table */}
      <div className="data-card bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">FCR Calculations</h2>
          <span className="text-xs text-slate-400 font-bold">{fcrData.length} records</span>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : fcrData.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">calculate</span>
            <p className="text-sm text-slate-400">No FCR calculations yet. Data will appear once keeper reports accumulate feed and weight records.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Week</span>
              <span>Avg Weight (kg)</span>
              <span>Total Feed (kg)</span>
              <span>FCR</span>
              <span>Calculated</span>
            </div>
            {fcrData.map((f) => (
              <div key={f.id} className="grid grid-cols-5 gap-4 px-5 py-4 items-center hover:bg-slate-50/50 transition-colors">
                <span className="font-mono text-sm font-bold text-primary">Week {f.week_number}</span>
                <span className="font-mono text-sm text-primary">{f.avg_weight_kg?.toFixed(2)} kg</span>
                <span className="font-mono text-sm text-primary">{f.total_feed_kg?.toFixed(1)} kg</span>
                <span className={`font-mono text-sm font-bold ${f.fcr < 2 ? 'text-emerald-600' : f.fcr < 2.5 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {f.fcr?.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">{new Date(f.calculated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
