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

interface BreakdownData {
  sales: { id: string; amount_birds: number; total_revenue: number; customer_name: string; sale_timestamp: string }[];
  costs: { id: string; category: string; amount: number; description: string; incurred_date: string }[];
}

export default function AdminProfitCycles() {
  const [cycles, setCycles] = useState<ProfitCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<ProfitCycle | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCycles();

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
        .select(`*, flocks (flock_name, total_birds)`)
        .order('calculated_at', { ascending: false });
      if (error) throw error;
      setCycles(data || []);
    } catch (err) {
      console.error('Failed to load profit cycles:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewBreakdown(cycle: ProfitCycle) {
    setSelectedCycle(cycle);
    setShowModal(true);
    setBreakdown(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const [salesRes, costsRes] = await Promise.all([
        supabase.from('sales_reports').select('*').eq('flock_id', cycle.flock_id),
        supabase.from('flock_costs').select('*').eq('flock_id', cycle.flock_id)
      ]);

      setBreakdown({
        sales: salesRes.data || [],
        costs: costsRes.data || []
      });
    } catch (err) {
      console.error("Breakdown Load Error:", err);
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

  const totalRevenue = cycles.reduce((s, c) => s + (Number(c.total_revenue) || 0), 0);
  const totalProfit = cycles.reduce((s, c) => s + (Number(c.total_profit) || 0), 0);
  const totalInvestorPool = cycles.reduce((s, c) => s + (Number(c.investor_pool) || 0), 0);

  return (
    <div ref={contentRef} className="pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Settled Profit Cycles</h1>
          <p className="text-slate-400 text-sm mt-1">Full accountability for every completed batch.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Settled Revenue', value: `₦${(totalRevenue / 1_000_000).toFixed(2)}M`, icon: 'payments', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Net Profit Realized', value: `₦${(totalProfit / 1_000_000).toFixed(2)}M`, icon: 'trending_up', color: 'bg-accent/5 text-accent border-accent/10' },
          { label: 'Investor Share', value: `₦${(totalInvestorPool / 1_000_000).toFixed(2)}M`, icon: 'account_balance', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        ].map((kpi) => (
          <div key={kpi.label} className={`cycle-card p-5 rounded-2xl border ${kpi.color} shadow-sm group`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-xl">{kpi.icon}</span>
            </div>
            <p className="font-heading font-extrabold text-2xl tracking-tight mb-1">{kpi.value}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 font-bold uppercase tracking-widest text-[10px] text-slate-400">
          <span>Settlement Records</span>
          <span>{cycles.length} Cycles</span>
        </div>

        {loading ? (
           <div className="p-20 text-center">
              <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hydrating P&L metrics...</p>
           </div>
        ) : cycles.length === 0 ? (
           <div className="p-20 text-center text-slate-400 italic">No cycles settled yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-8">Calculation Date</th>
                  <th className="p-4">Flock Batch</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4">Gross Profit</th>
                  <th className="p-4">Payout Split</th>
                  <th className="p-4 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cycles.map((c) => {
                  const invShare = Number(c.investor_pool) || 0;
                  const platShare = Number(c.flockfund_share) || 0;
                  const total = invShare + platShare;
                  const invPercent = total > 0 ? (invShare / total) * 100 : 0;

                  return (
                    <tr key={c.id} className="cycle-card group hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-8">
                        <p className="text-xs font-bold text-primary">{new Date(c.calculated_at).toLocaleDateString()}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Calculated</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                             <span className="material-symbols-outlined text-accent text-lg">egg_alt</span>
                          </div>
                          <p className="text-xs font-bold text-primary">{c.flocks?.flock_name || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-emerald-600">₦{(Number(c.total_revenue) || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">Total Sales</p>
                      </td>
                      <td className="p-4">
                         <p className="text-xs font-bold text-primary">₦{(Number(c.total_profit) || 0).toLocaleString()}</p>
                         <p className="text-[10px] text-primary/40 uppercase font-bold tracking-[1px]">Net Profit</p>
                      </td>
                      <td className="p-4">
                        <div className="w-full max-w-[150px]">
                           <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 mb-1">
                              <span>INV: {invPercent.toFixed(0)}%</span>
                              <span>PLAT: {(100 - invPercent).toFixed(0)}%</span>
                           </div>
                           <div className="h-1.5 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/40">
                              <div className="bg-accent h-full" style={{ width: `${invPercent}%` }} />
                              <div className="bg-primary h-full" style={{ width: `${100 - invPercent}%` }} />
                           </div>
                        </div>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <button 
                          onClick={() => handleViewBreakdown(c)} 
                          className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          View Audit
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

      {/* Breakdown Modal */}
      {showModal && selectedCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl scale-in-center">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <div>
                  <h3 className="text-lg font-heading font-extrabold text-primary">Settlement Audit: {selectedCycle.flocks?.flock_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Drill-down of all recorded sales and expenses.</p>
               </div>
               <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-slate-400">close</span>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {/* Summary Mini Cards */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                     <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Verified Revenue</p>
                     <p className="text-xl font-heading font-extrabold text-emerald-700">₦{Number(selectedCycle.total_revenue).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                     <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-1">Total Verified Costs</p>
                     <p className="text-xl font-heading font-extrabold text-rose-700">₦{Number(selectedCycle.total_cost).toLocaleString()}</p>
                  </div>
               </div>

               {/* Sales Records */}
               <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">Sales Inflow</h4>
                  {breakdown?.sales.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No sales reports found for this flock.</p>
                  ) : (
                    <div className="space-y-3">
                       {breakdown?.sales.map(s => (
                         <div key={s.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/20">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-bold">SALE</div>
                               <div>
                                  <p className="text-xs font-bold text-primary">{s.customer_name || 'Anonymous Market'}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{s.amount_birds} Birds</p>
                               </div>
                            </div>
                            <p className="text-xs font-bold text-emerald-600">+ ₦{Number(s.total_revenue).toLocaleString()}</p>
                         </div>
                       ))}
                    </div>
                  )}
               </div>

               {/* Cost Records */}
               <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">Expense Outflow</h4>
                  {breakdown?.costs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No cost records found for this flock.</p>
                  ) : (
                    <div className="space-y-3">
                       {breakdown?.costs.map(c => (
                         <div key={c.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/20">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 text-[10px] font-bold uppercase">{c.category.slice(0, 3)}</div>
                               <div>
                                  <p className="text-xs font-bold text-primary">{c.category}</p>
                                  <p className="text-[10px] text-slate-400">{c.description || 'Verified operational cost'}</p>
                               </div>
                            </div>
                            <p className="text-xs font-bold text-rose-600">- ₦{Number(c.amount).toLocaleString()}</p>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all">
                  Close Audit
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
