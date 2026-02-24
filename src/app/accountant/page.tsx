'use client';

import { useState, useEffect } from 'react';
import gsap from 'gsap';

export default function AccountantOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    pendingFunds: 0,
    activeFlocks: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const [invResult, reqResult, flockResult] = await Promise.all([
          supabase.from('investments').select('amount_invested'),
          supabase.from('fund_requests').select('amount, status'),
          supabase.from('flocks').select('id', { count: 'exact' }).eq('status', 'active')
        ]);

        const inflow = (invResult.data || []).reduce((acc: number, curr: any) => acc + (curr.amount_invested || 0), 0);
        const outflow = (reqResult.data || [])
          .filter((r: any) => r.status === 'processed')
          .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        const pending = (reqResult.data || [])
          .filter((r: any) => r.status === 'approved')
          .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

        setStats({
          totalInflow: inflow,
          totalOutflow: outflow,
          pendingFunds: pending,
          activeFlocks: flockResult.count || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="p-8 animate-pulse text-slate-400">Loading metrics...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Financial Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time cash flow and operational data insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Inflow', value: stats.totalInflow, icon: 'account_balance_wallet', color: 'from-emerald-500/10 to-teal-500/10', text: 'text-emerald-600' },
          { label: 'Total Outflow', value: stats.totalOutflow, icon: 'payments', color: 'from-rose-500/10 to-orange-500/10', text: 'text-rose-600' },
          { label: 'Pending Payouts', value: stats.pendingFunds, icon: 'pending_actions', color: 'from-amber-500/10 to-yellow-500/10', text: 'text-amber-600' },
          { label: 'Active Flocks', value: stats.activeFlocks, icon: 'egg_alt', color: 'from-accent/10 to-amber-500/10', text: 'text-accent', noCurrency: true },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-6 border border-white`}>
            <span className="material-symbols-outlined text-slate-400 text-xl mb-3">{kpi.icon}</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className={`text-2xl font-mono font-bold ${kpi.text}`}>
              {!kpi.noCurrency && '₦'}{kpi.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-6">Cash Flow Analytics</h2>
          <div className="h-64 flex items-end gap-2 px-2">
            <div className="flex-1 bg-emerald-100/50 rounded-t-lg relative group h-full">
              <div className="absolute bottom-0 inset-x-0 bg-emerald-500 rounded-t-lg transition-all duration-700 h-[60%] flex items-center justify-center">
                 <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">72%</span>
              </div>
              <p className="absolute -bottom-6 inset-x-0 text-center text-[9px] font-bold text-slate-400">INFLOW</p>
            </div>
            <div className="flex-1 bg-rose-100/50 rounded-t-lg relative group h-full">
              <div className="absolute bottom-0 inset-x-0 bg-rose-500 rounded-t-lg transition-all duration-700 h-[28%] flex items-center justify-center">
                 <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">28%</span>
              </div>
              <p className="absolute -bottom-6 inset-x-0 text-center text-[9px] font-bold text-slate-400">OUTFLOW</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-300 mt-10 text-center italic">Calculated based on current operational cycle</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-6">Recent Alerts</h2>
          <div className="space-y-3">
             <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
               <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
               <div>
                 <p className="text-xs font-bold text-amber-900">Feed Variance Alert</p>
                 <p className="text-[10px] text-amber-700">Flock #22 Feed consumption is 12% above projections.</p>
               </div>
             </div>
             <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex gap-3">
               <span className="material-symbols-outlined text-sky-500 text-base">info</span>
               <div>
                 <p className="text-xs font-bold text-sky-900">Payout Approaching</p>
                 <p className="text-[10px] text-sky-700">Flock #20 cycle ends in 8 days. Est. payout: ₦2.4M</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
