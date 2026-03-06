"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function CompliancePage() {
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
      {/* Hero */}

      <div className="pt-40 pb-20 text-center max-w-4xl mx-auto px-6">
        <div className="hero-text">
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mb-6">
            Regulatory & Integrity
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tighter">
            Compliance Statement
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Last Updated: March 2026
            <br />
            FlockFund operates with integrity, transparency, and in accordance
            with applicable agricultural and financial laws to protect our
            cooperative.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-8">
        <section className="animate-section bg-gradient-to-br from-primary to-[#0f2922] text-white rounded-3xl p-8 md:p-10 border border-primary/20 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <span className="material-symbols-outlined text-accent text-3xl">
              schema
            </span>
            <h2 className="font-heading text-2xl font-bold">
              Investment Structure
            </h2>
          </div>
          <p className="text-white/80 text-base leading-relaxed mb-6 relative z-10">
            It is critical for all stakeholders to understand our structural
            model. We operate via a{" "}
            <strong>direct co-ownership agreement</strong>:
          </p>
          <div className="grid sm:grid-cols-3 gap-6 relative z-10">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
              <span className="material-symbols-outlined text-accent text-xl mb-2">
                inventory_2
              </span>
              <p className="text-sm text-white/90 font-bold mb-1">
                Physical Assets
              </p>
              <p className="text-xs text-white/50">
                Investors jointly own physical broiler chickens, not company
                equity.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
              <span className="material-symbols-outlined text-accent text-xl mb-2">
                monitoring
              </span>
              <p className="text-sm text-white/90 font-bold mb-1">
                Performance Based
              </p>
              <p className="text-xs text-white/50">
                Profits are strictly shared based on actual farm sale
                performance.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
              <span className="material-symbols-outlined text-accent text-xl mb-2">
                gavel
              </span>
              <p className="text-sm text-white/90 font-bold mb-1">
                Non-Security
              </p>
              <p className="text-xs text-white/50">
                This model is distinct from securities or collective investment
                schemes.
              </p>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="animate-section bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-accent text-xl">
                  admin_panel_settings
                </span>
              </div>
              <h2 className="font-heading text-xl font-bold text-primary">
                Investor Protection
              </h2>
            </div>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="text-accent font-bold mt-1">—</span>
                <div>
                  <strong className="text-primary block">
                    Clear Risk Disclosure
                  </strong>
                  All investors must acknowledge and accept agricultural risks
                  before participating. Disclosures are prominently displayed.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold mt-1">—</span>
                <div>
                  <strong className="text-primary block">
                    Segregated Funds
                  </strong>
                  Investor capital is held separately from operational funds,
                  utilized only for rearing the specific cycle.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold mt-1">—</span>
                <div>
                  <strong className="text-primary block">
                    Dispute Resolution
                  </strong>
                  Fair 3-step process: Internal Support Review → Management
                  Escalation → Agreed Mediation.
                </div>
              </li>
            </ul>
          </section>

          <section className="animate-section bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-xl">
                  verified
                </span>
              </div>
              <h2 className="font-heading text-xl font-bold text-primary">
                AML & Tax Standards
              </h2>
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-sm">
                    money_off
                  </span>
                  Anti-Money Laundering
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We take strong steps to prevent misuse of our platform,
                  including identity verification for large investments and
                  continuous monitoring for suspicious transaction activity via
                  our payment gateways.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-sm">
                    account_balance
                  </span>
                  Tax Compliance
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  FlockFund pays all applicable corporate taxes on its 70%
                  Mudarib share. Individual investors are responsible for reporting and
                  paying taxes on their 30% profit share based on their
                  jurisdiction.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="animate-section bg-white rounded-3xl p-8 text-center border border-slate-200/60 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-primary mb-2">
            Advertising & Risk Management
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed mb-6">
            Our marketing is honest and transparent. We never make exaggerated
            claims, guarantee specific returns, or target vulnerable
            populations. Under the Mudarabah Al-Muqayyada model, we maintain
            continuous veterinary oversight, biosecurity protocols, and
            negligence-based loss accountability to manage systemic risk.
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6">
            * These documents are for informational purposes. Investors should
            consult advisors before participating.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
