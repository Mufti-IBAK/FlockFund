'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface ProfitCycle {
  id: string;
  flock_id: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  investor_pool: number;
  platform_pool: number;
  calculated_at: string;
}

export default function AdminProfitCycles() {
  const [cycles, setCycles] = useState<ProfitCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profit_cycles')
          .select('*')
          .order('calculated_at', { ascending: false });
        if (error) throw error;
        setCycles(data || []);
      } catch (err) {
        console.error('Failed to load profit cycles:', err);
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
          contentRef.current!.querySelectorAll('.cycle-card'),
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.6, ease: 'back.out(1.3)', delay: 0.1 }
        );
      });
      return () => ctx.revert();
    }
  }, [loading, cycles]);

  // Summary stats
  const totalRevenue = cycles.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const totalProfit = cycles.reduce((s, c) => s + (c.gross_profit || 0), 0);
  const totalInvestorPool = cycles.reduce((s, c) => s + (c.investor_pool || 0), 0);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Profit Cycles</h1>
        <p className="text-slate-400 text-sm mt-1">Revenue and profit breakdowns per completed flock</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Revenue', value: `₦${(totalRevenue / 1_000_000).toFixed(1)}M`, icon: 'payments', color: 'from-emerald-500/20 to-teal-500/20' },
          { label: 'Gross Profit', value: `₦${(totalProfit / 1_000_000).toFixed(1)}M`, icon: 'trending_up', color: 'from-accent/20 to-amber-500/20' },
          { label: 'Investor Pool', value: `₦${(totalInvestorPool / 1_000_000).toFixed(1)}M`, icon: 'group', color: 'from-sky-500/20 to-indigo-500/20' },
        ].map((kpi) => (
          <div key={kpi.label} className={`cycle-card bg-gradient-to-br ${kpi.color} rounded-2xl p-5 border border-white/40`}>
            <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-primary text-xl">{kpi.icon}</span>
            </div>
            <p className="font-mono text-2xl font-bold text-primary tracking-tighter">{kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Cycles Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">Completed Cycles</h2>
          <span className="text-xs text-slate-400 font-bold">{cycles.length} cycles</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">Loading cycles…</p>
          </div>
        ) : cycles.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">account_balance</span>
            <p className="text-sm text-slate-400">No profit cycles yet. Complete a flock to generate the first cycle.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Date</span>
              <span>Revenue</span>
              <span>Cost</span>
              <span>Profit</span>
              <span>Investor Pool</span>
              <span>Platform Pool</span>
            </div>
            {cycles.map((c) => (
              <div key={c.id} className="cycle-card grid grid-cols-6 gap-4 px-5 py-4 items-center hover:bg-slate-50/50 transition-colors duration-300">
                <span className="text-xs text-slate-500">{new Date(c.calculated_at).toLocaleDateString()}</span>
                <span className="font-mono text-sm font-bold text-primary">₦{(c.total_revenue || 0).toLocaleString()}</span>
                <span className="font-mono text-sm text-slate-500">₦{(c.total_cost || 0).toLocaleString()}</span>
                <span className={`font-mono text-sm font-bold ${(c.gross_profit || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₦{(c.gross_profit || 0).toLocaleString()}
                </span>
                <span className="font-mono text-sm text-accent font-bold">₦{(c.investor_pool || 0).toLocaleString()}</span>
                <span className="font-mono text-sm text-primary/60">₦{(c.platform_pool || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
