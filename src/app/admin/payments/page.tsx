"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Transaction {
  id: string;
  investor_id: string;
  type: string;
  amount: number;
  status: string;
  gateway: string;
  reference: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface Investment {
  id: string;
  investor_id: string;
  birds_owned: number;
  amount_invested: number;
  cost_paid: number;
  status: string;
  payment_gateway: string;
  payment_reference: string;
  created_at: string;
  profiles?: { full_name: string };
}

function formatNaira(n: number): string {
  return `₦${n.toLocaleString()}`;
}

export default function AdminPayments() {
  const [gateway, setGateway] = useState("flutterwave");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // Get payment gateway setting
        const { data: settings } = await supabase
          .from("settings")
          .select("payment_gateway")
          .single();
        if (settings?.payment_gateway) setGateway(settings.payment_gateway);

        // Load investments as transactions
        const { data: invData } = await supabase
          .from("investments")
          .select("*, profiles!investments_investor_id_fkey(full_name)")
          .order("created_at", { ascending: false })
          .limit(50);
        setInvestments((invData || []) as Investment[]);

        // Load transactions table if exists
        try {
          const { data: txData } = await supabase
            .from("transactions")
            .select("*, profiles(full_name)")
            .order("created_at", { ascending: false })
            .limit(50);
          setTransactions((txData || []) as Transaction[]);
        } catch {
          /* transactions table may not exist yet */
        }
      } catch (err) {
        console.error("Load error:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".fade-in"),
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.5,
            ease: "power3.out",
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading]);

  // Calculate KPIs from investments
  const totalCollected = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + (i.amount_invested || i.cost_paid || 0), 0);
  const pendingAmount = investments
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + (i.amount_invested || i.cost_paid || 0), 0);
  const totalTxCount = investments.length + transactions.length;

  // Merge all into one timeline
  const allEntries = [
    ...investments.map((i) => ({
      id: i.id,
      investor: i.profiles?.full_name || "Investor",
      type: "Investment",
      amount: i.amount_invested || i.cost_paid || 0,
      status: i.status || "pending",
      gateway: i.payment_gateway || gateway,
      reference: i.payment_reference || "—",
      date: i.created_at,
    })),
    ...transactions.map((t) => ({
      id: t.id,
      investor: t.profiles?.full_name || "Investor",
      type: t.type?.charAt(0).toUpperCase() + t.type?.slice(1) || "Transaction",
      amount: t.amount,
      status: t.status,
      gateway: t.gateway || gateway,
      reference: t.reference || "—",
      date: t.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
  };

  return (
    <div ref={contentRef}>
      <div className="mb-6 md:mb-8 fade-in">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
          Payments & Transactions
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gateway configuration, transaction history, and financial overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
        <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-lg">
                payments
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Collected
            </span>
          </div>
          <p className="text-xl md:text-2xl font-mono font-extrabold text-primary">
            {formatNaira(totalCollected)}
          </p>
        </div>
        <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-lg">
                pending
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending
            </span>
          </div>
          <p className="text-xl md:text-2xl font-mono font-extrabold text-primary">
            {formatNaira(pendingAmount)}
          </p>
        </div>
        <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-sky-600 text-lg">
                swap_horiz
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Transactions
            </span>
          </div>
          <p className="text-xl md:text-2xl font-mono font-extrabold text-primary">
            {totalTxCount}
          </p>
        </div>
      </div>

      {/* Gateway Config */}
      <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm mb-6">
        <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-3">
          Active Gateway
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-accent text-lg">
              credit_card
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-primary capitalize">
              {gateway}
            </p>
            <p className="text-[10px] text-slate-400">
              Configured in Settings tab
            </p>
          </div>
          <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Active
          </span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="fade-in bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">
            Transaction History
          </h2>
          <span className="text-xs text-slate-400 font-bold">
            {allEntries.length} total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : allEntries.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
              receipt_long
            </span>
            <p className="text-sm text-slate-400">
              No transactions yet. Transactions will appear here once
              investments are made.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Header */}
            <div className="hidden md:grid grid-cols-7 gap-4 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Investor</span>
              <span>Type</span>
              <span>Amount</span>
              <span>Gateway</span>
              <span>Reference</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {allEntries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-2 md:grid-cols-7 gap-3 md:gap-4 px-4 md:px-5 py-3 items-center hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm font-bold text-primary col-span-2 md:col-span-1 truncate">
                  {entry.investor}
                </span>
                <span className="text-xs text-slate-500">{entry.type}</span>
                <span className="text-sm font-mono font-bold text-primary">
                  {formatNaira(entry.amount)}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {entry.gateway}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {entry.reference}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block w-fit ${STATUS_COLORS[entry.status] || "bg-slate-100 text-slate-500"}`}
                >
                  {entry.status}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
