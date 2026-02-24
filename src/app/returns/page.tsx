"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";

/* ───── ROI Calculator (interactive) ───── */
function ROICalculator({ settings }: { settings: any }) {
  const [birds, setBirds] = useState(settings.min_birds_per_investment || 10);

  const costPerBird = settings.cost_per_bird || 4250;
  const targetPrice = settings.selling_price_per_bird || 10000;
  const floorPrice = settings.market_floor_price || 8000;
  const investorSharePct = settings.investor_share_percentage || 70;
  const investorShare = investorSharePct / 100;
  const cycleDays = settings.cycle_duration_days || 28;

  const totalCost = birds * costPerBird;
  const targetRevenue = birds * targetPrice;
  const floorRevenue = birds * floorPrice;

  // Profit = (Revenue - Cost) * InvestorShare
  const targetProfit = (targetRevenue - totalCost) * investorShare;
  const floorProfit = (floorRevenue - totalCost) * investorShare;

  const targetROI = ((targetProfit / totalCost) * 100).toFixed(0);
  const floorROI = ((floorProfit / totalCost) * 100).toFixed(0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-6 md:p-8">
      <h3 className="font-heading text-lg font-extrabold text-primary mb-1 tracking-tight">
        Investment Calculator
      </h3>
      <p className="text-slate-400 text-xs mb-6">
        Drag the slider to see projections for different flock sizes
      </p>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Number of Birds
          </span>
          <span className="font-mono text-2xl font-extrabold text-accent">
            {birds}
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={birds}
          onChange={(e) => setBirds(Number(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <div className="flex justify-between text-[10px] text-slate-300 mt-1">
          <span>10</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-primary/5 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Your Investment
          </p>
          <p className="font-mono text-xl font-extrabold text-primary">
            ₦{totalCost.toLocaleString()}
          </p>
        </div>
        <div className="bg-accent/5 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Cycle Duration
          </p>
          <p className="font-mono text-xl font-extrabold text-accent">
            {cycleDays} Days
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                trending_up
              </span>
              Target Market (₦{targetPrice.toLocaleString()}/bird)
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              {targetROI}% ROI
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="font-mono text-2xl font-extrabold text-emerald-700">
              ₦{targetProfit.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-500">
              profit in {cycleDays} days
            </p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">shield</span>
              Market Floor (₦{floorPrice.toLocaleString()}/bird)
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              {floorROI}% ROI
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="font-mono text-2xl font-extrabold text-amber-700">
              ₦{floorProfit.toLocaleString()}
            </p>
            <p className="text-xs text-amber-500">profit in {cycleDays} days</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-300 mt-4 text-center">
        Projections based on current market data. Actual returns may vary.
      </p>
    </div>
  );
}

export default function ReturnsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // 1. Fetch Latest Active Flock for specific pricing
        const { data: flockData } = await supabase
          .from("flocks")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 2. Fetch Global Defaults
        const { data: globalData } = await supabase
          .from("settings")
          .select("*")
          .single();

        // 3. Merge: Global settings take precedence for marketing pages
        const merged = {
          ...flockData,
          ...globalData,
        };

        if (merged) setSettings(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current!.querySelector(".hero-text"),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".tier-card"),
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          duration: 0.6,
          ease: "back.out(1.2)",
          delay: 0.3,
        },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".info-card"),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: "power2.out",
          delay: 0.5,
        },
      );
    });
    return () => ctx.revert();
  }, []);

  const minBirds = settings?.min_birds_per_investment || 10;
  const costPerBird = settings?.cost_per_bird || 3700;
  const targetPrice = settings?.selling_price_per_bird || 10000;
  const investorShare = (settings?.investor_share_percentage || 70) / 100;

  const tiers = [
    {
      birds: minBirds,
      cost: minBirds * costPerBird,
      targetRev: minBirds * targetPrice,
      profit: (minBirds * targetPrice - minBirds * costPerBird) * investorShare,
      roi: `${((((minBirds * targetPrice - minBirds * costPerBird) * investorShare) / (minBirds * costPerBird)) * 100).toFixed(0)}%`,
      popular: false,
    },
    {
      birds: minBirds * 2,
      cost: minBirds * 2 * costPerBird,
      targetRev: minBirds * 2 * targetPrice,
      profit:
        (minBirds * 2 * targetPrice - minBirds * 2 * costPerBird) *
        investorShare,
      roi: `${((((minBirds * 2 * targetPrice - minBirds * 2 * costPerBird) * investorShare) / (minBirds * 2 * costPerBird)) * 100).toFixed(0)}%`,
      popular: true,
    },
    {
      birds: minBirds * 3,
      cost: minBirds * 3 * costPerBird,
      targetRev: minBirds * 3 * targetPrice,
      profit:
        (minBirds * 3 * targetPrice - minBirds * 3 * costPerBird) *
        investorShare,
      roi: `${((((minBirds * 3 * targetPrice - minBirds * 3 * costPerBird) * investorShare) / (minBirds * 3 * costPerBird)) * 100).toFixed(0)}%`,
      popular: false,
    },
  ];

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cycleDays = settings?.cycle_duration_days || 28;

  return (
    <div ref={pageRef} className="min-h-screen bg-background-light">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-accent text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychiatry
            </span>
            <span className="font-heading font-extrabold text-primary text-lg tracking-tight">
              FlockFund
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/how-it-works"
              className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/returns"
              className="text-xs font-bold text-accent uppercase tracking-widest"
            >
              Returns
            </Link>
            <Link
              href="/about"
              className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-500 hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-accent text-primary rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
            >
              Invest Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-16 text-center max-w-4xl mx-auto px-6">
        <div className="hero-text">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">
            Returns & Projections
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-primary mt-4 tracking-tighter leading-[1.1]">
            Predictable, <span className="text-accent">Short-Cycle</span>{" "}
            Returns
          </h1>
          <p className="text-slate-400 text-base md:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            FlockFund delivers consistent {settings.cycle_duration_days}-day
            investment cycles backed by real poultry production. Our transparent
            financial model ensures you know exactly what drives your returns —
            before you invest a single naira.
          </p>
        </div>
      </div>

      {/* Investment Tiers */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-10">
          <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
            Investment Packages
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-primary mt-3 tracking-tight">
            Choose Your Entry Point
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            All tiers follow the same {settings.cycle_duration_days}-day growth
            cycle. Your returns scale proportionally to the number of birds you
            own.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {tiers.map((t) => (
            <div
              key={t.birds}
              className={`tier-card relative bg-white rounded-2xl border p-6 shadow-sm hover:shadow-xl transition-all duration-300 group ${t.popular ? "border-accent ring-2 ring-accent/20" : "border-slate-200/80"}`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-primary text-[9px] font-bold uppercase tracking-wider rounded-full shadow-md">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-5 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-accent text-2xl">
                    egg_alt
                  </span>
                </div>
                <p className="font-mono text-4xl font-extrabold text-primary">
                  {t.birds}
                </p>
                <p className="text-slate-400 text-xs mt-1">Birds per Cycle</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">
                    Investment Cost
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    ₦{t.cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Target Revenue</span>
                  <span className="font-mono text-sm font-bold text-primary">
                    ₦{t.targetRev.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">
                    Your Profit (70%)
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-600">
                    ₦{t.profit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-400">ROI per Cycle</span>
                  <span className="font-mono text-lg font-extrabold text-accent">
                    {t.roi}
                  </span>
                </div>
              </div>

              <Link
                href="/signup"
                className={`w-full block text-center py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${t.popular ? "bg-accent text-primary shadow-lg shadow-accent/20 hover:scale-[1.02]" : "bg-primary/5 text-primary hover:bg-primary/10"}`}
              >
                Start Investing
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Model Breakdown */}
      <div className="bg-gradient-to-b from-primary to-[#0a1f1a] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Financial Model
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
              How Your Returns Are Calculated
            </h2>
            <p className="text-white/40 text-sm mt-3 max-w-xl mx-auto">
              Complete transparency. Every variable that affects your profit is
              visible and verifiable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue Formula */}
            <div className="info-card bg-white/[0.04] rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-400 text-lg">
                    calculate
                  </span>
                </div>
                <h3 className="text-white font-bold text-base">
                  Profit Formula
                </h3>
              </div>
              <div className="bg-black/20 rounded-xl p-4 font-mono text-sm text-emerald-300 leading-loose mb-4">
                <p>TotalRevenue = BirdsSold × SalePrice</p>
                <p>GrossProfit = TotalRevenue − TotalCost</p>
                <p className="text-accent font-bold">
                  YourProfit = GrossProfit ×{" "}
                  {settings.investor_share_percentage}%
                </p>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                The {settings.investor_share_percentage}/
                {100 - (settings.investor_share_percentage || 70)} split is
                fixed. {settings.investor_share_percentage}% goes to investors,{" "}
                {100 - (settings.investor_share_percentage || 70)}% covers
                FlockFund&apos;s farm management, veterinary supervision, and
                operational overhead. No hidden fees.
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="info-card bg-white/[0.04] rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-accent text-lg">
                    receipt_long
                  </span>
                </div>
                <h3 className="text-white font-bold text-base">
                  Cost Per Bird Breakdown
                </h3>
              </div>
              <div className="space-y-2.5 mb-4">
                {(settings.cost_breakdown
                  ? [
                      {
                        label: "Day-Old Chick (DOC)",
                        val: settings.cost_breakdown.doc,
                      },
                      {
                        label: "Feed (28-day broiler ration)",
                        val: settings.cost_breakdown.feed,
                      },
                      {
                        label: "Medication & Vaccines",
                        val: settings.cost_breakdown.medication,
                      },
                      {
                        label: "Labor & Management",
                        val: settings.cost_breakdown.labor,
                      },
                      {
                        label: "Operational Overhead",
                        val: settings.cost_breakdown.overhead,
                      },
                    ]
                  : [
                      { label: "Day-Old Chick (DOC)", val: 1800 },
                      { label: "Feed (28-day broiler ration)", val: 2500 },
                      { label: "Medication & Vaccines", val: 400 },
                      { label: "Labor & Management", val: 500 },
                      { label: "Operational Overhead", val: 400 },
                    ]
                ).map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center justify-between py-1.5 border-b border-white/5"
                  >
                    <span className="text-white/60 text-xs">{c.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/30 text-[10px]">
                        {settings.cost_per_bird
                          ? Math.round((c.val / settings.cost_per_bird) * 100)
                          : 0}
                        %
                      </span>
                      <span className="font-mono text-xs text-white font-bold">
                        ₦{c.val?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                Cost per bird is dynamically calculated by the admin based on
                current DOC and feed prices. Once you invest,{" "}
                <strong className="text-accent">
                  only the market sale price
                </strong>{" "}
                affects your returns — not retroactive cost changes.
              </p>
            </div>

            {/* Market Pricing */}
            <div className="info-card bg-white/[0.04] rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sky-400 text-lg">
                    store
                  </span>
                </div>
                <h3 className="text-white font-bold text-base">
                  Pricing & Sales Strategy
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/80 text-sm font-bold">
                      Target Price: ₦
                      {settings.selling_price_per_bird?.toLocaleString()}/bird
                    </p>
                    <p className="text-white/40 text-xs">
                      Primary sales to wholesale and retail buyers
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/80 text-sm font-bold">
                      Market Floor: ₦
                      {settings.market_floor_price?.toLocaleString()}/bird
                    </p>
                    <p className="text-white/40 text-xs">
                      Guaranteed minimum via bulk buyers and processor contracts
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/80 text-sm font-bold">
                      Fallback: Frozen/Cut-Up Sales
                    </p>
                    <p className="text-white/40 text-xs">
                      If live market dips, processed poultry sales provide a
                      safety net
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Scenarios */}
            <div className="info-card bg-white/[0.04] rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-violet-400 text-lg">
                    rocket_launch
                  </span>
                </div>
                <h3 className="text-white font-bold text-base">
                  Compounding Growth
                </h3>
              </div>
              <p className="text-white/50 text-xs mb-4 leading-relaxed">
                Reinvesting your profits creates exponential growth. Here&apos;s
                what ₦37,000 could become if you reinvest your full returns each
                cycle:
              </p>
              <div className="space-y-2">
                {[
                  {
                    cycle: "Cycle 1",
                    value: `₦${(settings.cost_per_bird * minBirds + (settings.selling_price_per_bird - settings.cost_per_bird) * minBirds * investorShare).toLocaleString()}`,
                    gain: `+₦${((settings.selling_price_per_bird - settings.cost_per_bird) * minBirds * investorShare).toLocaleString()}`,
                  },
                ].map((c, i) => (
                  <div
                    key={c.cycle}
                    className="flex items-center justify-between py-2 border-b border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-accent/60 text-[10px] font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-white/70 text-xs">{c.cycle}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 text-[10px] font-bold">
                        {c.gain}
                      </span>
                      <span className="font-mono text-sm text-white font-bold">
                        {c.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-[10px] mt-3 text-center">
                Projections assume{" "}
                {(
                  (((settings.selling_price_per_bird - settings.cost_per_bird) *
                    investorShare) /
                    settings.cost_per_bird) *
                  100
                ).toFixed(0)}
                % ROI per cycle at target market price
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Calculator */}
      <div className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
                Try It Yourself
              </span>
              <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary mt-3 tracking-tight leading-tight">
                Calculate Your{" "}
                <span className="text-accent">Potential Returns</span>
              </h2>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                Use our interactive calculator to explore different investment
                sizes. Adjust the number of birds and instantly see your
                projected profit at both target and floor market prices.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: "verified",
                    title: "Veterinary-Supervised",
                    desc: "Every flock is managed by licensed professionals with daily health inspections",
                  },
                  {
                    icon: "lock",
                    title: "Transparent Cost Model",
                    desc: "Only market sale price affects your returns after investment — no retroactive cost changes",
                  },
                  {
                    icon: "speed",
                    title: "Fastest Agricultural ROI",
                    desc: "28-day cycles mean your capital is never locked up for months or years",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-accent text-base">
                        {f.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-primary font-bold text-sm">
                        {f.title}
                      </p>
                      <p className="text-slate-400 text-xs">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ROICalculator settings={settings} />
          </div>
        </div>
      </div>

      {/* Risk Disclaimers */}
      <div className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Risk & Mitigation
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-primary mt-3 tracking-tight">
              Informed Investing
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              We believe in full disclosure. Here are the risks and how
              FlockFund mitigates each one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                risk: "Disease Outbreaks",
                mitigation:
                  "Full biosecurity, controlled farm entry, routine vet inspection, and mortality buffer allocation per cycle",
                icon: "coronavirus",
              },
              {
                risk: "Market Price Crash",
                mitigation: `Guaranteed floor price of ₦${settings.market_floor_price?.toLocaleString()}/bird. Backup channels include frozen sales, restaurant partnerships, and processor contracts`,
                icon: "trending_down",
              },
              {
                risk: "Feed Price Inflation",
                mitigation:
                  "Bulk feed contracts, alternative feed optimization, and dynamic cycle pricing adjustment",
                icon: "local_shipping",
              },
              {
                risk: "High Mortality",
                mitigation:
                  "Farm manager accountability, stipulated mortality ratios, automated alerts, and professional veterinary oversight",
                icon: "warning",
              },
            ].map((r) => (
              <div
                key={r.risk}
                className="info-card bg-white rounded-xl border border-slate-200/80 p-5 group hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                    <span className="material-symbols-outlined text-rose-400 text-lg">
                      {r.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-sm mb-1">
                      {r.risk}
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {r.mitigation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <p className="text-amber-800 text-xs leading-relaxed">
              <strong>Important:</strong> All investment carries risk. Past
              performance does not guarantee future returns. Market conditions,
              disease, and other factors may affect profitability. FlockFund
              does not guarantee fixed returns.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 text-center max-w-3xl mx-auto px-6">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-4">
          Start Earning in <span className="text-accent">{cycleDays} Days</span>
        </h2>
        <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto">
          Join hundreds of investors already earning predictable returns from
          professionally managed poultry farming.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-primary rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
          >
            <span className="material-symbols-outlined text-lg">
              rocket_launch
            </span>
            Create Account & Invest
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary/5 text-primary rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-lg">info</span>
            How It Works
          </Link>
        </div>
      </div>
    </div>
  );
}
