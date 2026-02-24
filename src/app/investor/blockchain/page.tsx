"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Investment {
  id: string;
  investor_id: string;
  amount_invested: number;
  birds_owned: number;
  blockchain_tx_hash: string | null;
  created_at: string;
}

interface Payout {
  id: string;
  investor_id: string;
  amount: number;
  blockchain_tx_hash: string | null;
  status: string;
  created_at: string;
}

export default function InvestorBlockchain() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const [inv, pay] = await Promise.all([
          supabase
            .from("investments")
            .select(
              "id, investor_id, amount_invested, birds_owned, blockchain_tx_hash, created_at",
            )
            .eq("investor_id", user.id)
            .in("status", ["active", "completed"])
            .order("created_at", { ascending: false }),
          supabase
            .from("investor_payouts")
            .select(
              "id, investor_id, amount, blockchain_tx_hash, status, created_at",
            )
            .eq("investor_id", user.id)
            .order("created_at", { ascending: false }),
        ]);
        setInvestments(inv.data || []);
        setPayouts((pay.data || []) as unknown as Payout[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".bc-row"),
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.06,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, []);

  const allRecords = [
    ...investments.map((i) => ({
      type: "investment" as const,
      hash: i.blockchain_tx_hash,
      amount: i.amount_invested,
      detail: `${i.birds_owned} birds`,
      date: i.created_at,
    })),
    ...payouts.map((p) => ({
      type: "payout" as const,
      hash: p.blockchain_tx_hash,
      amount: p.amount,
      detail: p.status,
      date: p.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hashCount = allRecords.filter((r) => r.hash).length;

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Blockchain Records
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Proof-of-existence transaction hashes for your investments and payouts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          {
            label: "Total Transactions",
            value: allRecords.length,
            icon: "receipt_long",
            color: "from-primary/10 to-emerald-500/10",
          },
          {
            label: "On-Chain Records",
            value: hashCount,
            icon: "link",
            color: "from-violet-500/20 to-indigo-500/20",
          },
          {
            label: "Pending Hash",
            value: allRecords.length - hashCount,
            icon: "pending",
            color: "from-amber-500/20 to-orange-500/20",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 border border-white/40`}
          >
            <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-primary text-xl">
                {stat.icon}
              </span>
            </div>
            <p className="font-mono text-2xl font-bold text-primary tracking-tighter">
              {stat.value}
            </p>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">
            Transaction Ledger
          </h2>
          <span className="text-xs text-slate-400 font-bold">
            {allRecords.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : allRecords.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
              link
            </span>
            <p className="text-sm text-slate-400">
              No blockchain records yet. Records are created when you invest or
              receive payouts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {allRecords.map((r, i) => (
              <div
                key={i}
                className="bc-row flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    r.type === "investment" ? "bg-emerald-100" : "bg-sky-100"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${r.type === "investment" ? "text-emerald-600" : "text-sky-600"}`}
                  >
                    {r.type === "investment"
                      ? "add_circle"
                      : "account_balance_wallet"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-primary capitalize">
                      {r.type}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      ₦{(r.amount || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {r.detail}
                    </span>
                  </div>
                  {r.hash ? (
                    <p
                      className="text-[10px] font-mono text-violet-600 truncate mt-0.5"
                      title={r.hash}
                    >
                      🔗 {r.hash}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-300 italic mt-0.5">
                      No blockchain hash recorded
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">
                  {new Date(r.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
