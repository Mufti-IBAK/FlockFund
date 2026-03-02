"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Footer from "@/components/Footer";

const terms = [
  {
    title: "Acceptance of Terms",
    desc: "By using FlockFund, you agree to these Terms. If you do not agree, please do not use the Service.",
    icon: "gavel",
  },
  {
    title: "Eligibility & Registration",
    desc: "You must be at least 18 years old and capable of entering binding contracts. You are responsible for maintaining accurate account information and for all activity under your account.",
    icon: "how_to_reg",
  },
];

const investmentServices = [
  {
    title: "Nature of Investment",
    desc: "Investing in FlockFund means you are co-owning physical broiler chickens. You are not purchasing securities or shares. Returns are strictly based on the profitable sale of mature birds.",
  },
  {
    title: "Risk Acknowledgment",
    desc: "Poultry farming involves inherent risks including disease, mortality, and market fluctuations. You may lose part or all of your investment. FlockFund does not guarantee any set return rate.",
  },
  {
    title: "Profit Distribution",
    desc: "Profits from each successful flock cycle are split 70/30. The investors collectively receive 70% of the flock's profits, and FlockFund receives 30% for operational management.",
  },
  {
    title: "Reinvestment Rule",
    desc: "For your first three completed cycles, 20% of your generated profit must be reinvested into the ecosystem. After three completed cycles, you may withdraw any or all funds freely.",
  },
];

export default function TermsPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current!.querySelector(".hero-text"),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      );
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".animate-section"),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: pageRef.current,
            start: "top 80%",
          },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-background-light">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl bg-white/70 rounded-2xl px-8 py-3 border border-slate-200 shadow-sm">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent text-lg">
                psychiatry
              </span>
            </div>
            <span className="text-primary font-heading font-extrabold text-lg tracking-tight">
              FlockFund
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-6">
            <Link
              href="/how-it-works"
              className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/returns"
              className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors"
            >
              Returns
            </Link>
            <Link
              href="/risk-management"
              className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors"
            >
              Risk
            </Link>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-primary px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              Invest Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-40 pb-20 text-center max-w-4xl mx-auto px-6">
        <div className="hero-text">
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mb-6">
            Legal & Policy
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tighter">
            Terms of Service
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Last Updated: March 2026
            <br />
            Please read these terms carefully, as they form a binding agreement
            between you and FlockFund regarding your co-ownership of
            agricultural assets.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        <div className="grid md:grid-cols-2 gap-6">
          {terms.map((t) => (
            <section
              key={t.title}
              className="animate-section bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {t.icon}
                </span>
              </div>
              <h2 className="font-heading text-lg font-bold text-primary mb-3">
                {t.title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">{t.desc}</p>
            </section>
          ))}
        </div>

        <section className="animate-section bg-white rounded-3xl p-8 md:p-12 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent text-2xl">
                account_balance_wallet
              </span>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary">
                Investment Services
              </h2>
              <p className="text-slate-500 text-sm">
                Understanding your SLIU (Short-cycle Livestock Investment Units)
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 relative">
            {investmentServices.map((service, i) => (
              <div
                key={service.title}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400 font-mono mb-2 block">
                  0{i + 1}
                </span>
                <h3 className="font-bold text-primary text-base mb-2">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-12 gap-6">
          <section className="animate-section md:col-span-7 bg-charcoal rounded-3xl p-8 md:p-10 border border-white/5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
            <h2 className="font-heading text-2xl font-bold text-white mb-6 relative z-10 flex items-center gap-3">
              <span className="material-symbols-outlined text-accent">
                policy
              </span>
              Reserve Fund
            </h2>
            <ul className="space-y-4 text-white/70 text-sm relative z-10">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                <strong>8% of FlockFund's profit share</strong> from each flock
                is set aside in a Reserve Fund.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                The fund provides <strong>partial compensation</strong> in case
                of catastrophic losses (like disease outbreaks or government
                culling) — it does not guarantee full recovery.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-1">•</span>
                Once the fund reaches 20% of total active investments, excess is
                distributed as bonus birds to farm workers and as incentives to
                badged investors.
              </li>
            </ul>
          </section>

          <section className="animate-section md:col-span-5 bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm flex flex-col justify-center">
            <h2 className="font-heading text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">
                gavel
              </span>
              Legal Disclaimers
            </h2>
            <div className="space-y-4 text-sm text-slate-500">
              <div>
                <strong className="text-primary block text-xs uppercase tracking-wider mb-1">
                  Limitation of Liability
                </strong>
                To the maximum extent permitted by law, FlockFund is not liable
                for any indirect or consequential damages arising from your use
                of the Service or investment losses. THE SERVICE IS PROVIDED "AS
                IS."
              </div>
              <div>
                <strong className="text-primary block text-xs uppercase tracking-wider mb-1">
                  Governing Law
                </strong>
                These Terms are governed by the laws of the Federal Republic of
                Nigeria.
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
