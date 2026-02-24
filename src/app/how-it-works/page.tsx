'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Link from 'next/link';

const steps = [
  {
    num: '01',
    title: 'Create Your Account',
    description: 'Sign up with your email and select your role — Investor, Farm Manager, or Keeper. Each role gets a purpose-built dashboard designed for their specific workflows. The onboarding process includes identity verification for secure investment.',
    details: [
      'Email or social login with password protection',
      'Role selection determines your dashboard experience',
      'KYC verification for withdrawal eligibility',
      'Two-factor authentication available for enhanced security',
    ],
    icon: 'person_add',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    num: '02',
    title: 'Choose & Fund Your Birds',
    description: 'Browse active flock cycles and choose your investment tier — 10, 20, or 30 birds. The cost-per-bird is dynamically calculated based on current Day-Old Chick (DOC) prices, feed costs, and overhead. Pay securely through your preferred gateway.',
    details: [
      'Investment tiers: 10 birds (₦37K), 20 birds (₦74K), or 30 birds (₦111K)',
      'Pay via Flutterwave, Paystack, or PayPal',
      'System generates Investment ID, MoU contract, and timeline',
      'Investment goes active immediately upon payment confirmation',
    ],
    icon: 'account_balance_wallet',
    gradient: 'from-accent to-amber-500',
  },
  {
    num: '03',
    title: 'Farm Operations & Daily Monitoring',
    description: 'Once your investment is active, our professional keepers manage daily care — feeding, weighing, health checks, and medication. Farm Managers (licensed veterinarians) review and approve every report. You watch it all unfold in real time from your dashboard.',
    details: [
      'Daily keeper reports: mortality, feed usage, weight samples, temperature',
      'Farm Manager approval ensures data quality and vet oversight',
      'Automated FCR (Feed Conversion Ratio) analytics and growth curves',
      'Disease surveillance with escalation levels: Safe → Watch → Alert → Outbreak',
    ],
    icon: 'monitoring',
    gradient: 'from-sky-500 to-indigo-600',
  },
  {
    num: '04',
    title: 'Bird Sales & Revenue Collection',
    description: 'At approximately Day 28, birds reach market weight and are sold through our diversified sales channels. The Admin confirms the sale price, quantity, and buyer details. Revenue is automatically calculated and recorded on the ledger.',
    details: [
      'Target sale price: ₦10,000/bird through wholesale and retail channels',
      'Market floor guarantee: ₦8,000/bird via processor contracts',
      'Fallback options: frozen/cut-up sales and restaurant partnerships',
      'All sales transactions are digitally recorded and verifiable',
    ],
    icon: 'storefront',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    num: '05',
    title: 'Profit Distribution & Reinvestment',
    description: 'After the sale, the system automatically computes profits using the transparent 70/30 model — 70% to investors, 30% to FlockFund operations. Your share is credited to your wallet, where you can reinvest for compounding growth or withdraw to your bank account.',
    details: [
      'Profit = (Revenue − Cost) × 70% — calculated automatically',
      'Credited directly to your FlockFund wallet',
      '20% minimum reinvestment (lower lock-in = higher liquidity)',
      'Withdraw to your bank via Flutterwave Transfer',
    ],
    icon: 'rocket_launch',
    gradient: 'from-rose-500 to-pink-600',
  },
];

const roles = [
  {
    role: 'Investor',
    desc: 'Fund birds, track real-time metrics, earn returns. Full portfolio dashboard with badges & leaderboard.',
    features: ['Real-time flock tracking', 'Profit/loss statements', 'Wallet & withdrawals', 'Badges & referrals', '3D investment visualisation'],
    icon: 'trending_up',
    color: 'bg-emerald-500',
  },
  {
    role: 'Farm Manager',
    desc: 'Licensed veterinarians who review keeper reports, approve health data, and provide veterinary oversight.',
    features: ['Report review & approval', 'Health trends analytics', 'FCR & growth insights', 'Outbreak flagging system', 'Treatment recommendations'],
    icon: 'medical_services',
    color: 'bg-sky-500',
  },
  {
    role: 'Keeper',
    desc: 'On-the-ground caretakers who submit daily reports — mortality, feed, weight, medication, and farm conditions.',
    features: ['Daily report submission', 'Mortality logging', 'Feed & weight recording', 'Photo/video uploads', 'Task checklists'],
    icon: 'agriculture',
    color: 'bg-amber-500',
  },
  {
    role: 'Admin',
    desc: 'Platform owner overseeing all operations — user management, pricing, financial reconciliation, and payouts.',
    features: ['User management', 'Dynamic pricing controls', 'Financial dashboards', 'Withdrawal approvals', 'System-wide settings'],
    icon: 'admin_panel_settings',
    color: 'bg-violet-500',
  },
];

const safeguards = [
  { title: 'Transparent Tracking', desc: 'Every farm report, transaction, and metrics update is digitally recorded and visible from your dashboard in real time.', icon: 'visibility' },
  { title: 'Blockchain Proof', desc: 'Investment and payout hashes are stored on-chain, providing an immutable audit trail for every financial transaction.', icon: 'link' },
  { title: 'Veterinary Oversight', desc: 'Licensed farm managers review every health report. Veterinary protocols are followed for medication, vaccination, and disease control.', icon: 'medical_services' },
  { title: 'Smart Pricing', desc: 'Cost-per-bird is dynamically calculated from real DOC, feed, and medicine costs. Once invested, only the sale price affects your returns.', icon: 'calculate' },
  { title: 'Gamification', desc: 'Earn badges for milestones, climb leaderboards, refer friends for bonuses, and engage with the investor community forum.', icon: 'military_tech' },
  { title: 'Data-Driven Intelligence', desc: 'FCR analytics, weight curves, mortality patterns, and growth projections give you deep insight into flock performance.', icon: 'analytics' },
];

export default function HowItWorks() {
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

  const dynamicSteps = [
    {
      ...steps[0],
    },
    {
      ...steps[1],
      description: `Browse active flock cycles and choose your investment tier — ${minBirds}, ${minBirds * 2}, or ${minBirds * 3} birds. The cost-per-bird is dynamically calculated based on current Day-Old Chick (DOC) prices, feed costs, and overhead. Pay securely through your preferred gateway.`,
      details: [
        `Investment tiers: ${minBirds} birds (₦${(minBirds * costPerBird / 1000).toFixed(0)}K), ${minBirds * 2} birds (₦${(minBirds * 2 * costPerBird / 1000).toFixed(0)}K), or ${minBirds * 3} birds (₦${(minBirds * 3 * costPerBird / 1000).toFixed(0)}K)`,
        'Pay via Flutterwave, Paystack, or PayPal',
        'System generates Investment ID, MoU contract, and timeline',
        'Investment goes active immediately upon payment confirmation',
      ],
    },
    {
      ...steps[2],
    },
    {
      ...steps[3],
      description: `At approximately Day ${cycleDuration}, birds reach market weight and are sold through our diversified sales channels. The Admin confirms the sale price, quantity, and buyer details. Revenue is automatically calculated and recorded on the ledger.`,
      details: [
        `Target sale price: ₦${targetPrice.toLocaleString()}/bird through wholesale and retail channels`,
        `Market floor guarantee: ₦${floorPrice.toLocaleString()}/bird via processor contracts`,
        'Fallback options: frozen/cut-up sales and restaurant partnerships',
        'All sales transactions are digitally recorded and verifiable',
      ],
    },
    {
      ...steps[4],
      description: `After the sale, the system automatically computes profits using the transparent ${investorShare}/${100 - investorShare} model — ${investorShare}% to investors, ${100 - investorShare}% to FlockFund operations. Your share is credited to your wallet, where you can reinvest for compounding growth or withdraw to your bank account.`,
      details: [
        `Profit = (Revenue − Cost) × ${investorShare}% — calculated automatically`,
        'Credited directly to your FlockFund wallet',
        '20% minimum reinvestment (lower lock-in = higher liquidity)',
        'Withdraw to your bank via Flutterwave Transfer',
      ],
    },
  ];

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(pageRef.current!.querySelector('.hero-text'),
        { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo(pageRef.current!.querySelectorAll('.step-card'),
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.7, ease: 'back.out(1.3)', delay: 0.3 });
      gsap.fromTo(pageRef.current!.querySelectorAll('.role-card'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out', delay: 0.5 });
      gsap.fromTo(pageRef.current!.querySelectorAll('.safeguard-card'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.6 });
    });
    return () => ctx.revert();
  }, []);

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-background-light">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
            <span className="font-heading font-extrabold text-primary text-lg tracking-tight">FlockFund</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/how-it-works" className="text-xs font-bold text-accent uppercase tracking-widest">How It Works</Link>
            <Link href="/returns" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Returns</Link>
            <Link href="/about" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Log In</Link>
            <Link href="/signup" className="px-5 py-2.5 bg-accent text-primary rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-16 text-center max-w-4xl mx-auto px-6">
        <div className="hero-text">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">How It Works</span>
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-primary mt-4 tracking-tighter leading-[1.1]">
            From Sign-Up to <span className="text-accent">Profit</span> in 5 Steps
          </h1>
          <p className="text-slate-400 text-base md:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            FlockFund digitises the entire poultry investment lifecycle — from funding Day-Old Chicks to receiving your profit share in just {cycleDuration} days. Zero offline interaction, complete digital transparency, automated returns.
          </p>
        </div>
      </div>

      {/* Investment Lifecycle Steps */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-5">
          {dynamicSteps.map((step) => (
            <div key={step.num} className="step-card bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden">
              <div className="flex items-start gap-5 p-6 md:p-8">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-white text-2xl">{step.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">Step {step.num}</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-primary mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{step.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.details.map((d) => (
                      <p key={d} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-accent text-sm mt-0.5 flex-shrink-0">check_circle</span>
                        {d}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Roles */}
      <div className="bg-gradient-to-b from-primary to-[#0a1f1a] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">User Roles</span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">Four Roles, One Ecosystem</h2>
            <p className="text-white/40 text-sm mt-3 max-w-xl mx-auto">Every role has a dedicated dashboard and workflow. Together, they form an integrated digital farm management system.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {roles.map((r) => (
              <div key={r.role} className="role-card bg-white/[0.04] rounded-2xl p-6 border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl ${r.color}/20 flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-xl">{r.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-heading font-bold text-base">{r.role}</h3>
                  </div>
                </div>
                <p className="text-white/50 text-xs leading-relaxed mb-4">{r.desc}</p>
                <div className="space-y-1.5">
                  {r.features.map((f) => (
                    <p key={f} className="text-white/40 text-xs flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-accent/60 flex-shrink-0" />
                      {f}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safeguards & Features */}
      <div className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">Platform Features</span>
            <h2 className="font-heading text-3xl font-extrabold text-primary mt-3 tracking-tight">Built for Trust & Transparency</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">Every feature is designed to give you confidence in your investment and clarity on your returns.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {safeguards.map((s) => (
              <div key={s.title} className="safeguard-card bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                  <span className="material-symbols-outlined text-accent text-lg">{s.icon}</span>
                </div>
                <h4 className="text-primary font-bold text-sm mb-1">{s.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment Lifecycle Visual */}
      <div className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">Investment Statuses</span>
            <h2 className="font-heading text-2xl font-extrabold text-primary mt-3 tracking-tight">Track Your Investment Through Every Stage</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { status: 'Pending Payment', icon: 'hourglass_top', color: 'bg-slate-100 text-slate-600' },
              { status: 'Active', icon: 'play_circle', color: 'bg-emerald-100 text-emerald-700' },
              { status: 'In Grow-Out', icon: 'grass', color: 'bg-lime-100 text-lime-700' },
              { status: 'Ready to Sell', icon: 'store', color: 'bg-amber-100 text-amber-700' },
              { status: 'Sold', icon: 'receipt_long', color: 'bg-blue-100 text-blue-700' },
              { status: 'Payout Ready', icon: 'payments', color: 'bg-violet-100 text-violet-700' },
              { status: 'Completed', icon: 'check_circle', color: 'bg-teal-100 text-teal-700' },
            ].map((s, i) => (
              <div key={s.status} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${s.color} text-xs font-bold`}>
                  <span className="material-symbols-outlined text-sm">{s.icon}</span>
                  {s.status}
                </div>
                {i < 6 && <span className="material-symbols-outlined text-slate-300 text-sm hidden md:block">arrow_forward</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 text-center max-w-3xl mx-auto px-6">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-4">
          Ready to <span className="text-accent">Get Started</span>?
        </h2>
        <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto">
          Join hundreds of investors already earning predictable returns from professionally managed poultry farming.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-primary rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            Create Your Account
          </Link>
          <Link href="/returns"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary/5 text-primary rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-primary/10 transition-all">
            <span className="material-symbols-outlined text-lg">trending_up</span>
            See Returns
          </Link>
        </div>
      </div>
    </div>
  );
}
