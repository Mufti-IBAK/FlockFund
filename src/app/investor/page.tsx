"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface Investment {
  id: string;
  flock_id: string;
  birds_owned: number;
  amount_invested: number;
  status: string;
  round_count: number;
  created_at: string;
  flocks: {
    selling_price_per_bird: number;
    cost_per_bird: number;
  } | null;
}

export default function InvestorPortfolio() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    cost_per_bird: 4250,
    selling_price_per_bird: 7500,
    rounds_before_withdrawal: 3,
  });
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

        const [invResult, setResult] = await Promise.all([
          supabase
            .from("investments")
            .select(`
              *,
              flocks (
                selling_price_per_bird,
                cost_per_bird
              )
            `)
            .eq("investor_id", user.id)
            .in("status", ["active", "completed"])
            .order("created_at", { ascending: false }),
          supabase
            .from("settings")
            .select(
              "cost_per_bird, selling_price_per_bird, rounds_before_withdrawal",
            )
            .single(),
        ]);
        setInvestments((invResult.data as any) || []);
        if (setResult.data) setSettings(setResult.data as typeof settings);
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
          contentRef.current!.querySelector(".hero-card"),
          { y: 30, opacity: 0, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.1,
          },
        );
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".kpi-card"),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.3,
          },
        );
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".inv-card"),
          { y: 30, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "back.out(1.3)",
            delay: 0.5,
          },
        );
      });
      return () => ctx.revert();
    }
  }, []);

  const totalBirds = investments.reduce(
    (s, inv) => s + (inv.birds_owned || 0),
    0,
  );
  const totalInvested = investments.reduce(
    (s, inv) => s + (inv.amount_invested || 0),
    0,
  );
  
  // Per-investment valuation: (birds_owned * flock price)
  const estimatedValue = investments.reduce((s, inv) => {
    const price = inv.flocks?.selling_price_per_bird || settings.selling_price_per_bird;
    return s + (inv.birds_owned * price);
  }, 0);
  
  const projectedProfit = estimatedValue - totalInvested;

  return (
    <div ref={contentRef}>
      {/* ── Portfolio Hero ── */}
      <div className="hero-card bg-gradient-to-br from-primary via-[#1a4035] to-primary rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Your Portfolio
          </p>
          <p className="font-mono text-4xl font-bold text-white tracking-tighter">
            ₦{estimatedValue.toLocaleString()}
          </p>
          <p className="text-white/30 text-sm mt-1">
            Estimated value based on current market price
          </p>
          <div className="flex gap-6 mt-6">
            <div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider">
                Total Invested
              </p>
              <p className="text-white font-mono font-bold text-lg">
                ₦{totalInvested.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider">
                Projected Profit
              </p>
              <p
                className={`font-mono font-bold text-lg ${projectedProfit >= 0 ? "text-accent" : "text-rose-400"}`}
              >
                {projectedProfit >= 0 ? "+" : ""}₦
                {projectedProfit.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider">
                Birds Owned
              </p>
              <p className="text-white font-mono font-bold text-lg">
                {totalBirds.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          {
            label: "Active Investments",
            value: investments.filter((i) => i.status === "active").length,
            icon: "egg_alt",
            color: "from-emerald-500/20 to-teal-500/20",
          },
          {
            label: "Cost/Bird",
            value: `₦${(investments[0]?.flocks?.cost_per_bird || settings.cost_per_bird).toLocaleString()}`,
            icon: "payments",
            color: "from-accent/20 to-amber-500/20",
          },
          {
            label: "Sell Price/Bird",
            value: `₦${(investments[0]?.flocks?.selling_price_per_bird || settings.selling_price_per_bird).toLocaleString()}`,
            icon: "trending_up",
            color: "from-sky-500/20 to-indigo-500/20",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`kpi-card bg-gradient-to-br ${kpi.color} rounded-2xl p-5 border border-white/40`}
          >
            <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-primary text-xl">
                {kpi.icon}
              </span>
            </div>
            <p className="font-mono text-2xl font-bold text-primary tracking-tighter">
              {kpi.value}
            </p>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Investments List ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">
            Your Investments
          </h2>
          <span className="text-xs text-slate-400 font-bold">
            {investments.length} active investments
          </span>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : investments.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
              account_balance_wallet
            </span>
            <p className="text-sm text-slate-400 mb-4">
              No investments yet. Start your poultry investment journey!
            </p>
            <a href="/investor/invest" className="px-6 py-3 bg-accent text-primary rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all inline-block">
              + Invest Now
            </a>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {investments.map((inv) => (
              <div
                key={inv.id}
                className="inv-card p-5 hover:bg-slate-50/50 transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-600 text-lg">
                        egg_alt
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {inv.birds_owned} birds
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Invested: ₦{(inv.amount_invested || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      inv.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : inv.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <span>Reinvestment Progress</span>
                      <span>
                        {inv.round_count || 0} /{" "}
                        {settings.rounds_before_withdrawal} rounds
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((inv.round_count || 0) / settings.rounds_before_withdrawal) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  {(inv.round_count || 0) >=
                    settings.rounds_before_withdrawal && (
                    <button className="text-xs font-bold text-accent hover:text-primary flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        account_balance_wallet
                      </span>
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
