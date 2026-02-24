"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "Create Your Account",
    desc: 'Sign up with your email and select "Investor" as your role. The process takes less than 2 minutes and gives you immediate access to our available flock cycles.',
    icon: "person_add",
    color: "from-emerald-500 to-teal-600",
  },
  {
    num: "02",
    title: "Fund Your Investment",
    desc: "Browse active flocks, choose your bird count (units of 10, 20, or 30), and pay securely via Flutterwave, Paystack, or PayPal. Your investment is active once payment is confirmed.",
    icon: "payments",
    color: "from-accent to-amber-500",
  },
  {
    num: "03",
    title: "Real-Time Monitoring",
    desc: "Track your investment from Day 1. Professional keepers submit daily reports on weights, feed, and mortality. You watch the growth curve of your flock live on your dashboard.",
    icon: "monitoring",
    color: "from-sky-500 to-indigo-600",
  },
  {
    num: "04",
    title: "Sale & Distribution",
    desc: "At approximately Day 28, birds are sold to our network of buyers. Revenue is split 70% to investors and 30% to operations. Your share is credited directly to your wallet.",
    icon: "account_balance",
    color: "from-violet-500 to-purple-600",
  },
  {
    num: "05",
    title: "Compound or Withdraw",
    desc: "With your returns in your wallet, you can either reinvest in the next cycle for compounding growth or withdraw your profits to your Nigerian bank account.",
    icon: "rocket_launch",
    color: "from-rose-500 to-pink-600",
  },
];

const pricingInfo = [
  {
    item: "Day-Old Chick (DOC)",
    cost: "₦1,800",
    note: "Sourced from top-tier hatcheries",
  },
  {
    item: "Full-Cycle Feed",
    cost: "₦1,200",
    note: "Optimized high-protein broiler feed",
  },
  {
    item: "Vet Care & Bio-security",
    cost: "₦400",
    note: "Vaccines, medication, and sanitation",
  },
  {
    item: "Farm Management",
    cost: "₦300",
    note: "Professional keeper & manager overhead",
  },
];

const faqs = [
  {
    q: "What is the minimum investment?",
    a: "The minimum investment unit is 10 birds. At the current rate of ₦3,700 per bird, this comes to a total of ₦37,000 for one investment cycle.",
  },
  {
    q: "How long is one investment cycle?",
    a: "Broiler cycles are exceptionally short. From funding to sale, a cycle typically lasts 28 to 35 days, making it one of the fastest returns in agriculture.",
  },
  {
    q: "Is my profit guaranteed?",
    a: "While we provide a market floor guarantee of ₦8,000/bird via processor contracts, all agricultural investments carry risk. We mitigate this through professional veterinary oversight and biosecurity.",
  },
  {
    q: "What is the 70/30 profit split?",
    a: "After the birds are sold and the initial capital (bird cost) is accounted for, the remaining profit is split. 70% goes to you (the investor), and 30% goes to FlockFund to cover farm management and growth.",
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Profits are credited to your in-app wallet instantly upon sale confirmation. You can withdraw to any Nigerian bank account via our Flutterwave integration.",
  },
];

export default function HowToInvestPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
        const { data: globalData } = await supabase.from("settings").select("*").single();
        
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

  const minBirds = settings?.min_birds_per_investment || 10;
  const costPerBird = settings?.cost_per_bird || 4250;
  const cycleDuration = settings?.cycle_duration_days || 28;
  const targetPrice = settings?.selling_price_per_bird || 10000;
  const floorPrice = settings?.market_floor_price || 8000;
  const investorShare = settings?.investor_share_percentage || 70;

  const dynamicSteps = steps.map(s => {
    if (s.num === "02") return { ...s, desc: `Browse active flocks, choose your bird count (units of ${minBirds}, ${minBirds * 2}, or ${minBirds * 3}), and pay securely via Flutterwave, Paystack, or PayPal. Your investment is active once payment is confirmed.` };
    if (s.num === "04") return { ...s, desc: `At approximately Day ${cycleDuration}, birds are sold to our network of buyers. Revenue is split ${investorShare}% to investors and ${100 - investorShare}% to operations. Your share is credited directly to your wallet.` };
    return s;
  });

  const dynamicPricing = [
    { item: "Day-Old Chick (DOC)", cost: `₦${Math.round(costPerBird * 0.486).toLocaleString()}`, note: "Sourced from top-tier hatcheries" },
    { item: "Full-Cycle Feed", cost: `₦${Math.round(costPerBird * 0.324).toLocaleString()}`, note: "Optimized high-protein broiler feed" },
    { item: "Vet Care & Bio-security", cost: `₦${Math.round(costPerBird * 0.108).toLocaleString()}`, note: "Vaccines, medication, and sanitation" },
    { item: "Farm Management", cost: `₦${Math.round(costPerBird * 0.082).toLocaleString()}`, note: "Professional keeper & manager overhead" },
  ];

  const dynamicFaqs = [
    {
      q: "What is the minimum investment?",
      a: `The minimum investment unit is ${minBirds} birds. At the current rate of ₦${costPerBird.toLocaleString()} per bird, this comes to a total of ₦${(minBirds * costPerBird).toLocaleString()} for one investment cycle.`,
    },
    {
      q: "How long is one investment cycle?",
      a: `Broiler cycles are exceptionally short. From funding to sale, a cycle typically lasts ${cycleDuration} days, making it one of the fastest returns in agriculture.`,
    },
    {
      q: "Is my profit guaranteed?",
      a: `While we provide a market floor guarantee of ₦${floorPrice.toLocaleString()}/bird via processor contracts, all agricultural investments carry risk. We mitigate this through professional veterinary oversight and biosecurity.`,
    },
    {
      q: "What is the 70/30 profit split?",
      a: `After the birds are sold and the initial capital (bird cost) is accounted for, the remaining profit is split. ${investorShare}% goes to you (the investor), and ${100 - investorShare}% goes to FlockFund to cover farm management and growth.`,
    },
    {
      q: "How do I withdraw my earnings?",
      a: "Profits are credited to your in-app wallet instantly upon sale confirmation. You can withdraw to any Nigerian bank account via our Flutterwave integration.",
    },
  ];

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current!.querySelector(".hero-text"),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".step-card"),
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "back.out(1.2)",
          delay: 0.3,
        },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".pricing-item"),
        { x: -20, opacity: 0 },
        {
          x: 0,
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
              className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
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
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-16 text-center max-w-4xl mx-auto px-6">
        <div className="hero-text">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">
            Step-By-Step Guide
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-primary mt-4 tracking-tighter leading-[1.1]">
            Your Journey to <span className="text-accent">Smarter</span>{" "}
            Investing
          </h1>
          <p className="text-slate-400 text-base md:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about making your first poultry
            investment, tracking your birds, and withdrawing your profits.
          </p>
        </div>
      </div>

      {/* Investment Steps */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-4">
          {dynamicSteps.map((step) => (
            <div
              key={step.num}
              className="step-card bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex items-start gap-6 hover:shadow-xl transition-all duration-300 group"
            >
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <span className="material-symbols-outlined text-white text-2xl md:text-3xl">
                  {step.icon}
                </span>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-1 block">
                  Step {step.num}
                </span>
                <h3 className="font-heading text-xl font-bold text-primary mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gradient-to-b from-primary to-[#0a1f1a] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Cost Infrastructure
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
              Financial Transparency
            </h2>
            <p className="text-white/40 text-sm mt-3 max-w-lg mx-auto">
              We break down every naira spent on your birds. No hidden fees,
              ever.
            </p>
          </div>

          <div className="bg-white/[0.04] rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-sm">
            {dynamicPricing.map((p, i) => (
              <div
                key={p.item}
                className={`pricing-item flex flex-col sm:flex-row sm:items-center justify-between p-6 ${i < dynamicPricing.length - 1 ? "border-b border-white/[0.06]" : ""}`}
              >
                <div className="mb-2 sm:mb-0">
                  <p className="text-white font-bold text-base">{p.item}</p>
                  <p className="text-white/30 text-xs">{p.note}</p>
                </div>
                <div className="text-accent font-mono text-xl font-bold">
                  {p.cost}
                </div>
              </div>
            ))}
            <div className="bg-accent/10 p-6 flex items-center justify-between">
              <p className="text-white font-heading font-extrabold text-lg">
                Total Unit Cost
              </p>
              <p className="text-accent font-mono text-2xl font-bold">₦{costPerBird.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-center text-white/30 text-[10px] uppercase font-bold tracking-widest mt-6">
            Prices are dynamic and updated based on current market DOC and feed
            rates.
          </p>
        </div>
      </div>

      {/* FAQ Grid */}
      <div className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Questions & Answers
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-primary mt-3 tracking-tight">
              Got Questions? We Have Answers.
            </h2>
          </div>

          <div className="grid gap-4">
            {dynamicFaqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="font-bold text-primary text-base md:text-lg pr-4">
                    {faq.q}
                  </span>
                  <span
                    className={`material-symbols-outlined text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 pt-2">
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-slate-50 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-6">
            Your First Flock is{" "}
            <span className="text-accent">Just a Click</span> Away
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-xl mx-auto">
            Join thousands of smart investors who are growing their wealth
            through sustainable and transparent poultry farming.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-10 py-4 bg-accent text-primary rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
            >
              Create Your Account
            </Link>
            <Link
              href="/returns"
              className="w-full sm:w-auto px-10 py-4 border border-slate-200 text-primary rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-white transition-all"
            >
              View ROI Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
