"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";

const values = [
  {
    title: "Biosecurity First",
    desc: "Every flock is managed under strict bio-secure conditions — controlled entry, routine inspections, and mortality buffers protect investor capital.",
    icon: "shield",
  },
  {
    title: "Investor Transparency",
    desc: "Real-time dashboards, daily keeper reports, and blockchain-backed transaction records ensure you always know where your money is.",
    icon: "visibility",
  },
  {
    title: "Ethical Animal Welfare",
    desc: "Licensed veterinarians oversee all operations. We follow One Health compliance standards across feeding, medication, and housing.",
    icon: "pets",
  },
  {
    title: "Digital Excellence",
    desc: "No offline interactions — every investment, report, sale, and payout is fully digital, automated, and auditable.",
    icon: "devices",
  },
  {
    title: "Sustainability",
    desc: "Short-cycle farming reduces waste and maximizes feed efficiency. Our data-driven approach continually optimizes FCR and growth curves.",
    icon: "eco",
  },
  {
    title: "Fair Returns",
    desc: "A transparent 70/30 profit split — 70% to investors, 30% to operations. No hidden fees, no retroactive cost adjustments.",
    icon: "handshake",
  },
];

const advantages = [
  { label: "Shortest agricultural cycle", value: "28–35 Days", icon: "speed" },
  { label: "Lowest investment barrier", value: "₦37,000", icon: "savings" },
  { label: "Guaranteed market floor", value: "₦8,000/bird", icon: "shield" },
  { label: "Payment options", value: "3 Gateways", icon: "payments" },
];

const roadmap = [
  {
    phase: "Phase 1",
    period: "0–3 months",
    title: "Launch & Validate",
    items: [
      "Digital platform goes live",
      "One farm site operational",
      "300–600 birds per cycle",
      "Friends & family investor cohort",
    ],
    color: "from-emerald-500 to-teal-600",
  },
  {
    phase: "Phase 2",
    period: "3–12 months",
    title: "Scale & Expand",
    items: [
      "Multi-farm expansion",
      "Frozen chicken product line",
      "Investor scaling to 2,000+ birds",
      "B2B data monetisation pilot",
    ],
    color: "from-accent to-amber-500",
  },
  {
    phase: "Phase 3",
    period: "Year 2–3",
    title: "National Reach",
    items: [
      "Nationwide farm franchises",
      "Export-quality processing plant",
      "Tokenised investment via blockchain",
      "Carbon credits exploration",
    ],
    color: "from-sky-500 to-indigo-600",
  },
];

const team = [
  {
    name: "Operations & Management",
    desc: "Experienced cooperative leadership overseeing farm logistics, investor relations, and financial reconciliation.",
    icon: "groups",
  },
  {
    name: "Veterinary Partners",
    desc: "Licensed veterinarians providing animal health oversight, FCR analytics, disease surveillance, and medication approval.",
    icon: "medical_services",
  },
  {
    name: "Technology Team",
    desc: "Full-stack engineers building the Next.js platform, real-time dashboards, payment integrations, and blockchain proof systems.",
    icon: "code",
  },
  {
    name: "Sales & Market Access",
    desc: "Dedicated team managing wholesale buyer relationships, processor contracts, and restaurant partnerships for reliable sales.",
    icon: "store",
  },
  {
    name: "Compliance & Quality",
    desc: "Ensuring cooperative registration, investor MoU governance, food safety compliance, and anti-money-laundering standards.",
    icon: "gavel",
  },
];

export default function AboutPage() {
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
  const floorPrice = settings?.market_floor_price || 8000;
  const targetPrice = settings?.selling_price_per_bird || 10000;

  const dynamicAdvantages = [
    {
      label: "Shortest agricultural cycle",
      value: `${cycleDuration} Days`,
      icon: "speed",
    },
    {
      label: "Lowest investment barrier",
      value: `₦${(minBirds * costPerBird).toLocaleString()}`,
      icon: "savings",
    },
    {
      label: "Guaranteed market floor",
      value: `₦${floorPrice.toLocaleString()}/bird`,
      icon: "shield",
    },
    { label: "Payment options", value: "3 Gateways", icon: "payments" },
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
        pageRef.current!.querySelectorAll(".stat-card"),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out",
          delay: 0.3,
        },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".value-card"),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: "power2.out",
          delay: 0.4,
        },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".team-card"),
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out",
          delay: 0.6,
        },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".roadmap-card"),
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: "power3.out",
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
              className="text-xs font-bold text-accent uppercase tracking-widest"
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
            About FlockFund
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-primary mt-4 tracking-tighter leading-[1.1]">
            Democratising Poultry{" "}
            <span className="text-accent">Investment</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            FlockFund is a digital-first poultry investment cooperative that
            allows individuals to invest in live broiler birds in small units of{" "}
            {minBirds}–{minBirds * 3} birds. We manage the entire rearing
            process for {Math.round(cycleDuration / 7)} weeks and sell at
            premium market prices — investors earn predictable, short-cycle
            returns.
          </p>
        </div>
      </div>

      {/* Company Identity */}
      <div className="max-w-5xl mx-auto px-6 pb-14">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                label: "Sector",
                value: "Agriculture · FinTech · Digital Cooperative",
                icon: "category",
              },
              {
                label: "Location",
                value: "Sokoto Metropolis, Nigeria",
                icon: "location_on",
              },
              {
                label: "Primary Product",
                value: "Short-cycle broiler investment units",
                icon: "egg_alt",
              },
              {
                label: "Structure",
                value: "Cooperative with investor membership",
                icon: "groups",
              },
            ].map((item) => (
              <div key={item.label} className="stat-card text-center">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-accent text-lg">
                    {item.icon}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p className="text-primary font-bold text-xs leading-snug">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitive Advantage Ribbon */}
      <div className="bg-charcoal py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {dynamicAdvantages.map((a) => (
            <div key={a.label} className="stat-card text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-accent text-xl">
                  {a.icon}
                </span>
              </div>
              <p className="font-mono text-xl md:text-2xl font-bold text-accent tracking-tighter">
                {a.value}
              </p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mt-2">
                {a.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vision & Mission */}
      <div className="bg-gradient-to-b from-primary to-[#0a1f1a] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 mb-16">
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">
                Our Vision
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white mt-3 tracking-tight leading-tight">
                West Africa&apos;s Leading Digital Poultry Investment Ecosystem
              </h2>
              <p className="text-white/50 text-sm mt-4 leading-relaxed">
                We envision a future where thousands of people — regardless of
                background or farming experience — can build wealth through
                secure, short-cycle livestock assets. FlockFund is creating a
                new asset class:{" "}
                <strong className="text-accent">
                  Short-cycle Livestock Investment Units (SLIU)
                </strong>
                .
              </p>
            </div>
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">
                Our Mission
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white mt-3 tracking-tight leading-tight">
                Technology. Transparency. Trust.
              </h2>
              <p className="text-white/50 text-sm mt-4 leading-relaxed">
                To democratize poultry investment using digital technology,
                real-time transparency, and veterinary-led management. Every
                bird, every metric, every naira — tracked and verifiable from
                your dashboard.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="mb-4">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Our Values
            </span>
            <h3 className="font-heading text-xl font-extrabold text-white mt-2 tracking-tight">
              What Drives Us
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="value-card bg-white/[0.04] rounded-2xl p-5 border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                  <span className="material-symbols-outlined text-accent text-lg">
                    {v.icon}
                  </span>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{v.title}</h4>
                <p className="text-white/40 text-xs leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Context */}
      <div className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Market Opportunity
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary mt-3 tracking-tight">
              Why Poultry? Why Now?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600">
                    analytics
                  </span>
                </div>
                <h3 className="font-heading text-base font-extrabold text-primary">
                  Massive Demand
                </h3>
              </div>
              <ul className="space-y-2.5 text-slate-500 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>Nigeria consumes
                  over{" "}
                  <strong className="text-primary">
                    2 billion broilers yearly
                  </strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>Sokoto and
                  northern markets have a massive local supply gap
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  {Math.round(cycleDuration / 7 - 1)}–
                  {Math.round(cycleDuration / 7 + 2)} week broilers are in
                  highest demand by roadside sellers, restaurants, and
                  processors
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>DOC pricing: ₦
                  {(costPerBird * 0.48).toLocaleString()}–₦
                  {(costPerBird * 0.6).toLocaleString()} |{" "}
                  {Math.round(cycleDuration / 7)} week broiler: ₦
                  {(floorPrice / 1000).toFixed(0)}K–₦
                  {(targetPrice / 1000 + 2).toFixed(0)}K
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-accent">
                    lightbulb
                  </span>
                </div>
                <h3 className="font-heading text-base font-extrabold text-primary">
                  Our Edge
                </h3>
              </div>
              <ul className="space-y-2.5 text-slate-500 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>Digital
                  investment model blending{" "}
                  <strong className="text-primary">
                    fintech transparency with agriculture
                  </strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>Shortest cycle in
                  agriculture — {cycleDuration} days vs months/years
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>Smallest entry
                  barrier — just ₦{(minBirds * costPerBird).toLocaleString()}{" "}
                  minimum
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>Diversified sales
                  channels and guaranteed market-floor pricing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Our Team
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-primary mt-3 tracking-tight">
              Who Makes It Happen
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              A multidisciplinary team of professionals ensuring every cycle
              runs smoothly.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((t) => (
              <div
                key={t.name}
                className="team-card bg-white rounded-xl border border-slate-200/80 p-5 group hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {t.icon}
                  </span>
                </div>
                <p className="font-bold text-primary text-sm mb-1">{t.name}</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Roadmap */}
      <div className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Growth Roadmap
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-primary mt-3 tracking-tight">
              Where We&apos;re Going
            </h2>
          </div>

          <div className="space-y-5">
            {roadmap.map((r) => (
              <div
                key={r.phase}
                className="roadmap-card flex items-start gap-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-lg transition-all group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <span className="text-white font-mono text-xs font-bold">
                    {r.phase.split(" ")[1]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading text-lg font-bold text-primary">
                      {r.title}
                    </h3>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      {r.period}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {r.items.map((item) => (
                      <p
                        key={item}
                        className="text-slate-500 text-xs flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/40 flex-shrink-0" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal & Governance */}
      <div className="bg-charcoal py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
                Governance
              </span>
              <h3 className="text-white font-heading text-xl font-bold mt-2 mb-4">
                Board & Leadership
              </h3>
              <div className="space-y-3">
                {[
                  "Board of Trustees",
                  "CEO (Founder / Vet)",
                  "Farm Operations Lead",
                  "Sales Lead",
                  "Tech Lead",
                  "Compliance & Quality Lead",
                ].map((role) => (
                  <div
                    key={role}
                    className="flex items-center gap-2 text-white/60 text-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                    {role}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
                Legal Framework
              </span>
              <h3 className="text-white font-heading text-xl font-bold mt-2 mb-4">
                Compliance & Protection
              </h3>
              <div className="space-y-3">
                {[
                  "Registered as a cooperative society",
                  "Monthly investor cycles governed by MoU",
                  "All risks disclosed and agreed before investment",
                  "Anti-money-laundering compliance",
                  "Food safety & slaughter regulation adherence",
                  "Role-based access control & digital audit logs",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-white/60 text-sm"
                  >
                    <span className="material-symbols-outlined text-accent text-sm">
                      check_circle
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 text-center max-w-3xl mx-auto px-6">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-4">
          Ready to Join the <span className="text-accent">Flock</span>?
        </h2>
        <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto">
          Join a growing cooperative of investors building wealth through
          transparent, professionally managed poultry farming.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-primary rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
          >
            <span className="material-symbols-outlined text-lg">
              rocket_launch
            </span>
            Create Account
          </Link>
          <Link
            href="/returns"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary/5 text-primary rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-lg">
              trending_up
            </span>
            See Returns
          </Link>
        </div>
      </div>
    </div>
  );
}
