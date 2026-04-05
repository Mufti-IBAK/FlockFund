'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import gsap from 'gsap';

interface LedgerEntry {
  id: string;
  type: 'INFLOW' | 'OUTFLOW';
  category: 'Investment' | 'Sale' | 'Expense' | 'Salary' | 'Withdrawal';
  amount: number;
  date: string;
  reference: string;
  status: string;
  metadata: any;
}

export default function FinancialLedgerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLedger();
  }, []);

  async function loadLedger() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Fetch all sources in parallel
      const [
        { data: invs },
        { data: sales },
        { data: reqs },
        { data: withdrawals },
        { data: salaries }
      ] = await Promise.all([
        supabase.from('investments').select('*, profiles(full_name)').eq('status', 'active'),
        supabase.from('sales_reports').select('*, flocks(flock_name)'),
        supabase.from('fund_requests').select('*, flocks(flock_name)').eq('status', 'processed'),
        supabase.from('withdrawals').select('*').eq('status', 'completed'),
        supabase.from('staff_payments').select('*, profiles(full_name)').eq('status', 'completed')
      ]);

      const allEntries: LedgerEntry[] = [];

      // Normalize Investments
      invs?.forEach(i => {
        allEntries.push({
          id: i.id,
          type: 'INFLOW',
          category: 'Investment',
          amount: Number(i.amount_invested || i.cost_paid),
          date: i.created_at,
          reference: i.payment_reference || i.id.slice(0, 8),
          status: 'Confirmed',
          metadata: { name: i.profiles?.full_name || 'Anonymous' }
        });
      });

      // Normalize Sales
      sales?.forEach(s => {
        allEntries.push({
          id: s.id,
          type: 'INFLOW',
          category: 'Sale',
          amount: Number(s.total_revenue),
          date: s.sale_timestamp,
          reference: `SALE-${s.id.slice(0, 5)}`,
          status: 'Received',
          metadata: { name: s.flocks?.flock_name || 'Market Sale', birds: s.amount_birds }
        });
      });

      // Normalize Fund Requests
      reqs?.forEach(r => {
        allEntries.push({
          id: r.id,
          type: 'OUTFLOW',
          category: 'Expense',
          amount: Number(r.amount),
          date: r.updated_at || r.created_at,
          reference: `REQ-${r.id.slice(0, 5)}`,
          status: 'Paid',
          metadata: { name: r.category, flock: r.flocks?.flock_name }
        });
      });

      // Normalize Withdrawals
      withdrawals?.forEach(w => {
        allEntries.push({
          id: w.id,
          type: 'OUTFLOW',
          category: 'Withdrawal',
          amount: Number(w.amount),
          date: w.processed_at || w.created_at,
          reference: w.payment_reference || `WIT-${w.id.slice(0, 5)}`,
          status: 'Settled',
          metadata: { }
        });
      });

      // Normalize Salaries
      salaries?.forEach(p => {
        allEntries.push({
          id: p.id,
          type: 'OUTFLOW',
          category: 'Salary',
          amount: Number(p.amount),
          date: p.created_at,
          reference: p.payment_reference || `PAY-${p.id.slice(0, 5)}`,
          status: 'Paid',
          metadata: { name: p.profiles?.full_name }
        });
      });

      // Sort by date descending
      allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(allEntries);
    } catch (err) {
      console.error("Ledger Load Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return entries.filter(e => 
      e.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.metadata.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  const stats = useMemo(() => {
    const inflow = entries.filter(e => e.type === 'INFLOW').reduce((s, e) => s + e.amount, 0);
    const outflow = entries.filter(e => e.type === 'OUTFLOW').reduce((s, e) => s + e.amount, 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [entries]);

  useEffect(() => {
    if (!loading && filtered.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".entry-row", 
          { x: -10, opacity: 0 }, 
          { x: 0, opacity: 1, stagger: 0.02, duration: 0.4, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, filtered]);

  return (
    <div ref={containerRef} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-primary tracking-tight">Financial Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">Unified audit trail of all platform inflows and outflows.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
              />
           </div>
           <button onClick={() => loadLedger()} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-slate-400">refresh</span>
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Total Inflow (Revenue + Capital)</p>
           <h2 className="text-2xl font-heading font-extrabold text-primary">₦{stats.inflow.toLocaleString()}</h2>
           <div className="mt-2 h-1 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Total Outflow (Expenses + Payouts)</p>
           <h2 className="text-2xl font-heading font-extrabold text-primary">₦{stats.outflow.toLocaleString()}</h2>
           <div className="mt-2 h-1 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 w-full" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-primary text-primary shadow-sm relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Net Platform Liquidity</p>
              <h2 className="text-3xl font-heading font-extrabold">₦{stats.net.toLocaleString()}</h2>
           </div>
           <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl opacity-5">account_balance_wallet</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left order-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-8">Transaction Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Reference / Entity</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-8 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan={5} className="p-20 text-center">
                      <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compiling final accounts...</p>
                   </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 text-sm">No ledger entries found.</td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={`${entry.category}-${entry.id}`} className="entry-row group hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-8">
                      <p className="text-xs text-slate-600 font-medium">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{new Date(entry.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="p-4">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                        ${entry.category === 'Investment' ? 'bg-sky-50 text-sky-600 border-sky-100' : 
                          entry.category === 'Sale' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          entry.category === 'Expense' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                          <span className={`w-1 h-1 rounded-full ${entry.type === 'INFLOW' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {entry.category}
                       </span>
                    </td>
                    <td className="p-4">
                       <p className="text-xs font-bold text-primary tracking-tight">{entry.reference}</p>
                       <p className="text-[10px] text-slate-400 lowercase">{entry.metadata.name || entry.metadata.flock || 'Internal Fund'}</p>
                    </td>
                    <td className="p-4">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.status}</span>
                    </td>
                    <td className={`p-4 pr-8 text-right font-mono text-sm font-bold ${entry.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {entry.type === 'INFLOW' ? '+' : '-'} ₦{entry.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
