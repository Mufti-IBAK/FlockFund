"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function AccountantPayments() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTransactions();

    // REALTIME SUBSCRIPTION
    let supabase: any;
    const setupRealtime = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      supabase = createClient();
      
      const channel = supabase
        .channel('accountant_payments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fund_requests' }, () => loadTransactions())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => loadTransactions())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_payments' }, () => loadTransactions())
        .subscribe();

      return channel;
    };

    const channelPromise = setupRealtime();
    return () => {
      channelPromise.then(c => c?.unsubscribe());
    };
  }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fade-in",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, [loading]);

  async function loadTransactions() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      // Fetch processed OR pending fund requests
      const { data: requests } = await supabase
        .from("fund_requests")
        .select("id, amount, category, description, created_at, status, profiles(full_name, role)")
        .in("status", ["processed", "approved", "pending"])
        .order("created_at", { ascending: false });

      // Fetch investor payouts (withdrawals)
      const { data: payouts } = await supabase
        .from("withdrawals")
        .select("id, amount, processed_at, created_at, status, investor_id, profiles!withdrawals_investor_id_fkey(full_name, role)")
        .order("created_at", { ascending: false });

      // Fetch staff payments
      const { data: salaries } = await supabase
        .from("staff_payments")
        .select("id, amount, created_at, status, payment_month, payment_year, profiles!staff_payments_staff_id_fkey(full_name, role)")
        .order("created_at", { ascending: false });

      const combined = [
        ...(requests || []).map((r: any) => {
          const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return {
            id: r.id,
            date: r.created_at,
            amount: r.amount,
            type: "Disbursement",
            category: r.category,
            recipient: profile?.full_name,
            role: profile?.role,
            description: r.description,
            status: r.status
          };
        }),
        ...(payouts || []).map((p: any) => {
          const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          
          return {
            id: p.id,
            date: p.processed_at || p.created_at || new Date().toISOString(),
            amount: p.amount,
            type: "Investor Payout",
            category: "Profit Sharing",
            recipient: profile?.full_name || "Unknown Investor",
            role: profile?.role || "investor",
            description: `Round Payout #${p.id.substring(0,8)}`,
            status: p.status
          };
        }),
        ...(salaries || []).map((s: any) => {
          const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          
          return {
            id: s.id,
            date: s.created_at || new Date().toISOString(),
            amount: s.amount,
            type: "Salary Payment",
            category: "Payroll",
            recipient: profile?.full_name || "Staff",
            role: profile?.role || "staff",
            description: `Salary for ${s.payment_month} ${s.payment_year}`,
            status: s.status
          };
        })
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={pageRef} className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
              Payment Transactions
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Complete history of all disbursements, salary payments, and investor payouts.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100/50">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Sync Alpha</span>
          </div>
        </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden fade-in">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Transaction History</h2>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Total Processed</p>
              <p className="text-sm font-black text-primary">₦{transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-20 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-100 mb-4 italic">query_stats</span>
            <p className="text-slate-400 text-sm font-medium">No recorded transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Ref. Date</th>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-primary">{new Date(tx.date).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">#{tx.id.substring(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tx.type}</span>
                        <span className="text-[11px] text-slate-400 max-w-[200px] truncate">{tx.description || tx.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-primary">{tx.recipient}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tx.role?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono font-bold text-primary text-sm">
                      ₦{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded-lg border flex items-center justify-center w-fit gap-1
                        ${tx.status === 'completed' || tx.status === 'processed' 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : tx.status === 'failed' || tx.status === 'rejected'
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"}`}>
                        <span className="material-symbols-outlined text-[10px]">
                          {tx.status === 'completed' || tx.status === 'processed' ? "check_circle" : tx.status === 'failed' || tx.status === 'rejected' ? "cancel" : "pending"}
                        </span>
                        {tx.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
