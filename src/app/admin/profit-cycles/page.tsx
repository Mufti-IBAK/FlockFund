'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface ProfitCycle {
  id: string;
  flock_id: string;
  flocks?: {
    flock_name: string;
    total_birds: number;
  };
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  investor_pool: number;
  flockfund_share: number;
  calculated_at: string;
}

export default function AdminProfitCycles() {
  const [cycles, setCycles] = useState<ProfitCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCycles();

    // Set up Realtime listener
    const setupRealtime = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const channel = supabase
        .channel('admin_profit_cycles_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profit_cycles' }, () => loadCycles())
        .subscribe();
        
      return channel;
    };

    const channelPromise = setupRealtime();
    return () => {
      channelPromise.then(ch => {
        const { createClient } = require('@/lib/supabase/client');
        createClient().removeChannel(ch);
      });
    };
  }, []);

  async function loadCycles() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profit_cycles')
        .select(`
          *,
          flocks (
            flock_name,
            total_birds
          )
        `)
        .order('calculated_at', { ascending: false });
      
      if (error) throw error;
      setCycles(data || []);
    } catch (err) {
      console.error('Failed to load profit cycles:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll('.cycle-card'),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
        );
      });
      return () => ctx.revert();
    }
  }, [loading, cycles]);

  // Summary stats
  const totalRevenue = cycles.reduce((s, c) => s + (Number(c.total_revenue) || 0), 0);
  const totalProfit = cycles.reduce((s, c) => s + (Number(c.total_profit) || 0), 0);
  const totalInvestorPool = cycles.reduce((s, c) => s + (Number(c.investor_pool) || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div ref={contentRef} className="pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Profit Cycles</h1>
          <p className="text-slate-400 text-sm mt-1">Settled financial history for completed batches</p>
        </div>
        
        <button className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <span className="material-symbols-outlined text-lg">download</span>
          Export Audit Trail
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Settled Revenue', value: `₦${(totalRevenue / 1_000_000).toFixed(2)}M`, icon: 'payments', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Net Profit Realized', value: `₦${(totalProfit / 1_000_000).toFixed(2)}M`, icon: 'trending_up', color: 'bg-accent/5 text-accent border-accent/10' },
          { label: 'Investor Distributions', value: `₦${(totalInvestorPool / 1_000_000).toFixed(2)}M`, icon: 'account_balance', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          { label: 'Average Profit Margin', value: `${avgMargin.toFixed(1)}%`, icon: 'percent', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        ].map((kpi) => (
          <div key={kpi.label} className={`cycle-card group p-5 rounded-2xl border ${kpi.color} shadow-sm hover:shadow-md transition-all`}>
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4`}>
              <span className="material-symbols-outlined text-xl">{kpi.icon}</span>
            </div>
            <p className="font-heading font-extrabold text-2xl tracking-tight leading-none mb-1">{kpi.value}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Cycles Listing */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">Settlement Ledger</h2>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            {cycles.length} Cycles Logged
          </span>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculating distributions...</p>
          </div>
        ) : cycles.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-200">history_edu</span>
            </div>
            <p className="text-sm text-slate-400 italic">No profit cycles have been settled yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-8">Calculation Date</th>
                  <th className="p-4">Associated Flock</th>
                  <th className="p-4">Revenue & Cost</th>
                  <th className="p-4">Gross Profit</th>
                  <th className="p-4">Distribution Split (Inv / Plat)</th>
                  <th className="p-4 pr-8 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cycles.map((c) => {
                  const invShare = Number(c.investor_pool) || 0;
                  const platShare = Number(c.flockfund_share) || 0;
                  const total = invShare + platShare;
                  const invPercent = total > 0 ? (invShare / total) * 100 : 0;
                  const platPercent = total > 0 ? (platShare / total) * 100 : 0;

                  return (
                    <tr key={c.id} className="cycle-card group hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-8">
                        <p className="text-xs font-bold text-primary">{new Date(c.calculated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(c.calculated_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-accent text-lg">egg_alt</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary">{c.flocks?.flock_name || 'N/A'}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{c.flocks?.total_birds.toLocaleString()} Birds Batch</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between max-w-[120px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Rev:</span>
                            <span className="text-xs font-bold text-emerald-600">₦{(Number(c.total_revenue) || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between max-w-[120px]">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Cost:</span>
                            <span className="text-xs font-medium text-slate-500">₦{(Number(c.total_cost) || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="inline-block px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-sm font-heading font-extrabold text-primary">₦{(Number(c.total_profit) || 0).toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center mt-0.5">NET REALIZED</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-full max-w-[180px]">
                          <div className="flex items-center justify-between mb-1.5 px-0.5">
                            <span className="text-[10px] font-bold text-accent">₦{invShare.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-primary/60">₦{platShare.toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/50">
                            <div className="bg-accent h-full transition-all duration-1000" style={{ width: `${invPercent}%` }} />
                            <div className="bg-primary/40 h-full transition-all duration-1000" style={{ width: `${platPercent}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1 px-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Investor {invPercent.toFixed(0)}%</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Mudarib {platPercent.toFixed(0)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-accent hover:bg-slate-50 transition-all">
                          <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
