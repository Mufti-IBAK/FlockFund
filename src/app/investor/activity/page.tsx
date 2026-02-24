'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

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
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('farm_reports')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(20);
        setReports(data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.feed-item'),
          { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, [loading, reports]);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Farm Activity</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time approved reports from the farm</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">monitoring</span>
          <p className="text-sm text-slate-400">No approved farm activity yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="feed-item bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.mortality_count > 0 ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                  <span className={`material-symbols-outlined text-lg ${r.mortality_count > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {r.mortality_count > 0 ? 'warning' : 'check_circle'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary">
                    Daily Health Report — {r.mortality_count === 0 ? 'All Clear' : `${r.mortality_count} mortality`}
                  </p>
                  <div className="flex gap-4 mt-1 text-[10px] text-slate-400">
                    {r.temperature_celsius && <span>🌡 {r.temperature_celsius}°C</span>}
                    {r.feed_consumed_kg && <span>🌾 {r.feed_consumed_kg}kg feed</span>}
                    {r.clinical_signs && <span>📋 {r.clinical_signs.slice(0, 50)}</span>}
                  </div>
                </div>
                <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">{new Date(r.report_date || r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
