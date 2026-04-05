"use client";

import { useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";

export default function AccountantOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    netCashFlow: 0,
    pendingFunds: 0,
    activeFlocks: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCashFlow() {
      try {
        const res = await fetch("/api/accountant/cash-flow");
        if (!res.ok) throw new Error("Failed to load cash flow");
        const data = await res.json();

        setStats({
          totalInflow: data.aggregates.totalInflow || 0,
          totalOutflow: data.aggregates.totalOutflow || 0,
          netCashFlow: data.aggregates.netCashFlow || 0,
          pendingFunds: data.aggregates.pendingFunds || 0,
          activeFlocks: data.aggregates.activeFlocks || 0,
        });
        setTransactions((data.transactions || []).slice(0, 10));

        // Fetch verification queue (pending sales reports or fund requests)
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: q } = await supabase
          .from('sales_reports')
          .select('*, flocks(flock_name)')
          .eq('accountant_status', 'pending');
          
        setVerificationQueue(q || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCashFlow();

    const setupRealtime = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const channel = supabase
        .channel('accountant_dashboard_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchCashFlow())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchCashFlow())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_reports' }, () => fetchCashFlow())
        .subscribe();
      return channel;
    };
    const channelPromise = setupRealtime();
    return () => {
      channelPromise.then(ch => {
        const { createClient } = require("@/lib/supabase/client");
        createClient().removeChannel(ch);
      });
    };
  }, []);

  if (loading)
    return (
      <div className="p-8 animate-pulse text-slate-400">Loading comprehensive ledger...</div>
    );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-primary tracking-tight">
            Financial Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time reconciliation and net liquidity management.
          </p>
        </div>
        
        <div className="bg-primary/5 border border-primary/10 px-6 py-3 rounded-2xl">
           <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Estimated Net Liquidity</p>
           <h2 className="text-2xl font-heading font-extrabold text-primary">₦{stats.netCashFlow.toLocaleString()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Inflow", value: stats.totalInflow, icon: "payments", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { label: "Total Outflow", value: stats.totalOutflow, icon: "receipt_long", color: "bg-rose-50 text-rose-600 border-rose-100" },
          { label: "Verification Req.", value: verificationQueue.length, icon: "rule", color: "bg-amber-50 text-amber-600 border-amber-100", noCurrency: true },
          { label: "Pending Payouts", value: stats.pendingFunds, icon: "history", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
        ].map((kpi) => (
          <div key={kpi.label} className={`p-6 rounded-2xl border ${kpi.color} shadow-sm`}>
             <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
                <span className="material-symbols-outlined text-lg">{kpi.icon}</span>
             </div>
             <h3 className="text-xl font-heading font-extrabold leading-none tracking-tight">
                {!kpi.noCurrency && "₦"}{kpi.value.toLocaleString()}
             </h3>
             <p className="text-[10px] uppercase font-bold tracking-widest opacity-70 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Queue */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center justify-between">
                 Verification Queue
                 <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px]">{verificationQueue.length}</span>
              </h2>
              {verificationQueue.length === 0 ? (
                <div className="py-10 text-center">
                   <span className="material-symbols-outlined text-3xl text-emerald-200">check_circle</span>
                   <p className="text-xs text-slate-400 mt-2 font-medium">All accounts reconciled.</p>
                </div>
              ) : (
                <div className="space-y-3">
                   {verificationQueue.map(item => (
                     <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl group transition-all hover:bg-white hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.flocks?.flock_name}</p>
                           <p className="text-xs font-bold text-primary">₦{Number(item.total_revenue).toLocaleString()}</p>
                        </div>
                        <p className="text-xs font-bold text-primary opacity-80">{item.customer_name || 'Market Sale'}</p>
                        <button className="w-full mt-3 py-1.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:border-accent hover:text-accent transition-all">Verify Receipt</button>
                     </div>
                   ))}
                </div>
              )}
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-primary p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-lg font-heading font-extrabold mb-1">Finalized P&L</h3>
                 <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mb-4">Current Cycle Accuracy</p>
                 <p className="text-3xl font-heading font-extrabold">100%</p>
                 <p className="text-[10px] mt-4 opacity-80 leading-relaxed italic">All system-wide transactions are interlinked for end-to-end accountability.</p>
              </div>
              <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-9xl opacity-10 rotate-12">verified</span>
           </div>
        </div>

        {/* Ledger */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Global Transaction Ledger</h2>
              <a href="/admin/audit" className="text-[10px] font-bold text-accent hover:underline">VIEW FULL TRAIL</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-6">Source / Activity</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 pr-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                           <div className={`w-1.5 h-6 rounded-full ${tx.type === "INFLOW" ? "bg-emerald-500" : "bg-rose-500"}`} />
                           <div>
                              <p className="text-xs font-bold text-primary">{tx.source}</p>
                              <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{tx.status}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className={`p-4 pr-6 text-right text-sm font-mono font-bold ${tx.type === "INFLOW" ? "text-emerald-600" : "text-rose-600"}`}>
                        {tx.type === "INFLOW" ? "+" : "-"}₦{(tx.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
