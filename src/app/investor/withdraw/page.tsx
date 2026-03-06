"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

interface Investment {
  id: string;
  birds_owned: number;
  amount_invested: number;
  status: string;
  round_count: number;
  flock_id: string;
  flocks: {
    selling_price_per_bird: number;
    cost_per_bird: number;
  } | null;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_reference?: string;
}

interface BankInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export default function WithdrawPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [settings, setSettings] = useState({
    cost_per_bird: 4250,
    selling_price_per_bird: 7500,
  });

  // Modals / states
  const [selectedCapitalInvestment, setSelectedCapitalInvestment] =
    useState<string>("");
  const [profitWithdrawAmount, setProfitWithdrawAmount] = useState<number>(0);

  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [invResult, wdResult, profileResult, settingsResult] =
          await Promise.all([
            supabase
              .from("investments")
              .select("*, flocks(selling_price_per_bird, cost_per_bird)")
              .eq("investor_id", user.id)
              .in("status", ["active", "completed"]),
            supabase
              .from("withdrawals")
              .select("*")
              .eq("investor_id", user.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("profiles")
              .select("bank_name, account_number, account_name")
              .eq("id", user.id)
              .single(),
            supabase.from("settings").select("*").single(),
          ]);

        setInvestments((invResult.data as any) || []);
        setWithdrawals((wdResult.data || []) as unknown as Withdrawal[]);
        if (settingsResult.data) setSettings(settingsResult.data as any);

        const p = profileResult.data;
        if (p && p.bank_name && p.account_number && p.account_name) {
          setBankInfo({
            bank_name: p.bank_name,
            account_number: p.account_number,
            account_name: p.account_name,
          });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".fade-in"),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, [loading]);

  // Calculations
  const totalAccruedProfit = investments.reduce((acc, inv) => {
    const cost = inv.flocks?.cost_per_bird || settings.cost_per_bird;
    const sell =
      inv.flocks?.selling_price_per_bird || settings.selling_price_per_bird;
    // Profit = (Revenue - Cost) * rounds * 30% investor share (Mudarabah)
    const profitPerBird = (sell - cost) * 0.3;
    return acc + inv.birds_owned * profitPerBird * (inv.round_count || 0);
  }, 0);

  const totalWithdrawn = withdrawals
    .filter((w) => w.status !== "failed" && w.status !== "cancelled")
    .reduce((acc, w) => acc + w.amount, 0);

  // We assume any withdrawal mapped without a specific investment payload is a profit withdrawal
  const availableProfit = Math.max(0, totalAccruedProfit - totalWithdrawn);

  const eligibleCapital = investments.filter(
    (i) => i.round_count >= 3 && i.status === "active",
  );
  const lockedCapital = investments.filter(
    (i) => i.round_count < 3 && i.status === "active",
  );

  async function handleProfitWithdraw() {
    if (
      profitWithdrawAmount <= 0 ||
      profitWithdrawAmount > availableProfit ||
      !bankInfo
    )
      return;
    setRequesting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wd, error } = await supabase
        .from("withdrawals")
        .insert({
          investor_id: user.id,
          amount: profitWithdrawAmount,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      const payoutRes = await fetch("/api/payments/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_id: user.id,
          amount: profitWithdrawAmount,
          withdrawal_id: wd.id,
        }),
      });
      const payoutData = await payoutRes.json();

      if (payoutData.success) {
        setWithdrawals((prev) => [
          {
            ...wd,
            status: "processing",
            payment_reference: payoutData.reference,
          },
          ...prev,
        ]);
        setProfitWithdrawAmount(0);
        alert(
          `Profit withdrawal initiated! Reference: ${payoutData.reference}.`,
        );
      } else {
        alert(
          `Request saved but automated transfer failed: ${payoutData.error || "Unknown error"}`,
        );
        setWithdrawals((prev) => [wd, ...prev]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process profit withdrawal.");
    }
    setRequesting(false);
  }

  async function handleCapitalWithdraw() {
    if (!selectedCapitalInvestment || !bankInfo) return;
    setRequesting(true);
    try {
      const inv = investments.find((i) => i.id === selectedCapitalInvestment);
      if (!inv) return;

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Withdraw the original principal invested
      const { data: wd, error } = await supabase
        .from("withdrawals")
        .insert({
          investor_id: user.id,
          investment_id: inv.id,
          amount: inv.amount_invested,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      const payoutRes = await fetch("/api/payments/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_id: user.id,
          amount: inv.amount_invested,
          withdrawal_id: wd.id,
        }),
      });
      const payoutData = await payoutRes.json();

      if (payoutData.success) {
        setWithdrawals((prev) => [
          {
            ...wd,
            status: "processing",
            payment_reference: payoutData.reference,
          },
          ...prev,
        ]);
        setSelectedCapitalInvestment("");
        alert(
          `Capital liquidation initiated! Reference: ${payoutData.reference}.`,
        );
      } else {
        alert("Capital liquidation requested. Admin processing required.");
        setWithdrawals((prev) => [wd, ...prev]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process capital withdrawal.");
    }
    setRequesting(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-6" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      <div className="mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
          Withdraw Funds
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Extract your accrued profit or liquidate mature capital
        </p>
      </div>

      {!bankInfo ? (
        <div className="fade-in bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-500 text-xl flex-shrink-0">
              error
            </span>
            <div>
              <p className="text-sm font-bold text-rose-800">
                Bank details required
              </p>
              <p className="text-xs text-rose-600 mt-1">
                You must add your bank account details before requesting a
                withdrawal.
              </p>
              <Link
                href="/investor/settings"
                className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  settings
                </span>
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="fade-in bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-lg">
              check_circle
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-800">
                Bank Approved
              </p>
              <p className="text-xs text-emerald-600">
                {bankInfo.bank_name} • ****{bankInfo.account_number.slice(-4)}
              </p>
            </div>
          </div>
          <Link
            href="/investor/settings"
            className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-200 transition-colors"
          >
            Update
          </Link>
        </div>
      )}

      {/* Bifurcated Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* 1. Profit Withdrawal */}
        <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-base">
              payments
            </span>
            Profit Withdrawal
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Withdraw your accrued returns. Available at any time after a flock
            cycle completes.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex-1 flex flex-col justify-center items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Available to Withdraw
            </p>
            <p className="font-mono text-3xl font-extrabold text-primary tracking-tighter">
              ₦{availableProfit.toLocaleString()}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Amount (₦)
              </label>
              <input
                type="number"
                max={availableProfit}
                min={0}
                value={profitWithdrawAmount || ""}
                onChange={(e) =>
                  setProfitWithdrawAmount(
                    Math.min(availableProfit, Number(e.target.value)),
                  )
                }
                placeholder="0.00"
                className="w-full bg-white border border-slate-200 text-sm font-mono font-bold text-primary px-4 py-3 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                disabled={availableProfit <= 0}
              />
            </div>
            <button
              onClick={handleProfitWithdraw}
              disabled={
                requesting ||
                profitWithdrawAmount <= 0 ||
                profitWithdrawAmount > availableProfit ||
                !bankInfo
              }
              className="w-full py-3 bg-accent text-primary rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {requesting ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-lg">
                  account_balance_wallet
                </span>
              )}
              Withdraw Profit
            </button>
          </div>
        </div>

        {/* 2. Capital Liquidation */}
        <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-heading font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500 text-base">
              exit_to_app
            </span>
            Capital Liquidation
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Fully extract your principal capital. Requires a minimum maturation
            of 3 completed operational cycles.
          </p>

          <div className="flex-1">
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Eligible Capital Portfolios
              </label>
              {eligibleCapital.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">
                    lock_clock
                  </span>
                  <p className="text-sm text-slate-400 font-medium">
                    No investments have met the 3 cycle requirement yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {eligibleCapital.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedCapitalInvestment(inv.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedCapitalInvestment === inv.id
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-primary">
                            {inv.birds_owned} birds
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Cycles: {inv.round_count} • {inv.id.slice(0, 8)}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-indigo-600 text-sm">
                          ₦{inv.amount_invested.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Locked Capital Visibility */}
            {lockedCapital.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Immature Portfolios ({lockedCapital.length})
                </p>
                <div className="space-y-2">
                  {lockedCapital.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between opacity-70"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          {inv.birds_owned} birds
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {inv.round_count}/3 cycles required
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-amber-500 text-sm">
                        lock
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCapitalWithdraw}
            disabled={requesting || !selectedCapitalInvestment || !bankInfo}
            className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {requesting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">savings</span>
            )}
            Liquidate Capital
          </button>
        </div>
      </div>

      {withdrawals.length > 0 && (
        <div className="mt-2 fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">
            Transaction Ledger
          </h3>
          <div className="space-y-2">
            {withdrawals.map((wd) => (
              <div
                key={wd.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg border border-slate-100 bg-slate-50/50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${wd.payment_reference ? "bg-indigo-100 text-indigo-600" : "bg-accent/20 text-accent"}`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {wd.payment_reference ? "exit_to_app" : "payments"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">
                      ₦{wd.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(wd.created_at).toLocaleDateString()} •{" "}
                      {wd.payment_reference ? `Capital Liq.` : `Profit Extr.`}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    wd.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : wd.status === "processing"
                        ? "bg-sky-100 text-sky-700"
                        : wd.status === "failed"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {wd.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
