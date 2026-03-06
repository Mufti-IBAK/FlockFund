"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function AccountantPayments() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTransactions();
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
      
      // Fetch processed fund requests
      const { data: requests } = await supabase
        .from("fund_requests")
        .select("id, amount, category, description, created_at, profiles(full_name, role)")
        .eq("status", "processed")
        .order("created_at", { ascending: false });

      // Fetch investor payouts
      const { data: payouts } = await supabase
        .from("investor_payouts")
        .select("id, withdrawable_amount, created_at, investments(profiles(full_name))")
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
            description: r.description
          };
        }),
        ...(payouts || []).map((p: any) => {
          const investment = Array.isArray(p.investments) ? p.investments[0] : p.investments;
          const profile = investment && Array.isArray(investment.profiles) ? investment.profiles[0] : investment?.profiles;
          
          return {
            id: p.id,
            date: p.created_at,
            amount: p.withdrawable_amount,
            type: "Investor Payout",
            category: "Profit Sharing",
            recipient: profile?.full_name,
            role: "investor",
            description: `Round Payout #${p.id.substring(0,8)}`
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
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Payment Transactions
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete history of all disbursements, salary payments, and investor payouts.
        </p>
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
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase rounded-lg border border-emerald-100">
                        Processed
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
