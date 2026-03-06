"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Footer from "../../components/Footer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function RiskManagementPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.fromTo(
        ".hero-element",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" },
      );

      // Section Animations
      gsap.utils.toArray(".fade-section").forEach((section: any) => {
        gsap.fromTo(
          section,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
            },
          },
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={containerRef}
      className="min-h-screen bg-background-light font-sans text-slate-800"
    >
      {/* ── Hero ── */}

      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-[url('/grain.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="hero-element inline-block py-1.5 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mb-6">
            Investor Protection
          </span>
          <h1 className="hero-element text-4xl md:text-6xl font-heading font-black text-white tracking-tighter mb-6 leading-tight">
            Our Philosophy <br />
            <span className="text-emerald-400">on Risk</span>
          </h1>
          <p className="hero-element text-lg text-white/60 leading-relaxed max-w-2xl mx-auto font-medium">
            We do not hide from risk — we name it, study it, and build systems
            to manage it. Agriculture involves living creatures and inherent
            uncertainties, but we control our preparation, our response, and our
            commitment to transparency.
          </p>
        </div>
      </section>

      {/* ── Overview ── */}
      <section className="fade-section py-24 px-6 border-b border-slate-200/60 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight">
              Understanding Agricultural Risk
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              Specific risks we face and how we mitigate them directly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl">
              <span className="material-symbols-outlined text-rose-500 text-3xl mb-4">
                coronavirus
              </span>
              <h3 className="text-lg font-bold text-primary mb-2">
                Disease Outbreaks
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                The most significant risk. Includes endemic diseases (Newcastle,
                Gumboro, Coccidiosis), epidemic outbreaks (like Avian
                Influenza), and zoonotic concerns (Salmonella).
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">
                    check_circle
                  </span>{" "}
                  Managed with strict biosecurity and veterinary care.
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl">
              <span className="material-symbols-outlined text-amber-500 text-3xl mb-4">
                engineering
              </span>
              <h3 className="text-lg font-bold text-primary mb-2">
                Operational Risks
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Equipment failures, feed quality issues, human errors, or keeper
                absence that disrupt daily care.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">
                    check_circle
                  </span>{" "}
                  Redundant systems, SOPs from vets, and constant training.
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl">
              <span className="material-symbols-outlined text-sky-500 text-3xl mb-4">
                trending_down
              </span>
              <h3 className="text-lg font-bold text-primary mb-2">
                Market Risks
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Price fluctuations, input cost increases, or sales disruption
                over the 6-week cycle.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm">
                    check_circle
                  </span>{" "}
                  Primarily affects profit margin, rarely impacts initial
                  capital entirely.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Multi-Layer Defense ── */}
      <section className="fade-section py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight">
              Our Multi-Layer Defense System
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              Four independent layers that reinforce our operational integrity.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-6 items-start bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                <span className="text-emerald-600 font-bold font-mono text-xl">
                  L1
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary mb-2 border-l-4 border-emerald-500 pl-3">
                  Prevention: Biosecurity & Veterinary Excellence
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Heavy investment in access control, isolation measures, and
                  daily monitoring by certified Keepers overseen by a Farm
                  Manager (Vet). Early warning systems flag mortality spikes{" "}
                  {">"} 2%.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start bg-white p-6 rounded-3xl border border-sky-100 shadow-sm ml-0 md:ml-6">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
                <span className="text-sky-600 font-bold font-mono text-xl">
                  L2
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary mb-2 border-l-4 border-sky-500 pl-3">
                  Mudarabah Negligence Accountability
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Under the Mudarabah Al-Muqayyada model, financial loss from
                  normal business operations is borne by the investor
                  (Rabb-ul-Maal). However, if loss is caused by FlockFund&apos;s
                  negligence — failure to follow biosecurity protocols, ignoring
                  veterinary advice, or mismanagement — FlockFund (Mudarib) is
                  liable to compensate the investor&apos;s full capital. All
                  incidents are investigated and documented transparently.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm ml-0 md:ml-12">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <span className="text-indigo-600 font-bold font-mono text-xl">
                  L3
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary mb-2 border-l-4 border-indigo-500 pl-3">
                  Diversification Strategy
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Geographic dispersion of farms across states in Nigeria, plus
                  temporal staggering. Auto-diversify splits investments across
                  multiple active flocks, preventing a single outbreak from
                  destroying your portfolio.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start bg-white p-6 rounded-3xl border border-amber-100 shadow-sm ml-0 md:ml-16">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                <span className="text-amber-600 font-bold font-mono text-xl">
                  L4
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary mb-2 border-l-4 border-amber-500 pl-3">
                  Legal Structure & Protection
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Separate legal entities (SPV) per flock isolate risk.
                  Segregated accounts mean operational funds and investor funds
                  are never commingled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="fade-section py-24 px-6 bg-white border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight">
              What Happens in a Crisis
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              A step-by-step simulation (e.g., Avian Influenza in Flock 4).
            </p>
          </div>

          <div className="relative border-l-2 border-slate-100 ml-4 md:ml-0 space-y-12 pb-10">
            {[
              {
                day: "Day 1",
                label: "Suspicion",
                desc: "Keeper notices lethargy. Mortality rises. Automated alerts trigger Farm Manager.",
              },
              {
                day: "Day 2",
                label: "Investigation",
                desc: "Vet collects samples. Quarantine implemented. Investors alerted within 48 hours for transparency.",
              },
              {
                day: "Day 4",
                label: "Confirmation",
                desc: "Lab confirms outbreak. Government orders culling. Second notification sent to investors.",
              },
              {
                day: "Day 5-10",
                label: "Culling & Salvage",
                desc: "Birds culled under supervision. Disinfection begins.",
              },
              {
                day: "Day 11",
                label: "Assessment",
                desc: "Under Mudarabah rules, financial loss is assessed. If caused by negligence, FlockFund bears the loss. Otherwise, investors bear the financial loss. FlockFund may waive profit share for next cycles as goodwill.",
              },
              {
                day: "Day 25",
                label: "Payment",
                desc: "Investors receive salvaged/protected funds via wallet.",
              },
              {
                day: "Day 30",
                label: "Review",
                desc: "Detailed report published. Town hall held. New biosecurity measures applied.",
              },
            ].map((step, idx) => (
              <div key={idx} className="relative pl-8 md:pl-10">
                <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-rose-500 ring-4 ring-white" />
                <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                  {step.day}
                </h4>
                <h3 className="text-lg font-bold text-primary mt-1 mb-2">
                  {step.label}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="fade-section py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Can I lose all my money?",
                a: "Yes, it is possible. Under the Mudarabah model, investors bear financial loss from normal business operations (disease, natural disasters, market fluctuations). However, strict biosecurity, veterinary oversight, and diversification drastically reduce this likelihood.",
              },
              {
                q: "What happens if FlockFund is negligent?",
                a: "If an incident is caused by FlockFund's negligence (failure to follow biosecurity protocols, ignoring veterinary advice, misappropriation of funds, or gross mismanagement), FlockFund is fully liable and must compensate investors for their capital. All incidents are investigated and documented transparently.",
              },
              {
                q: "How is negligence determined?",
                a: "Every adverse event triggers a formal incident report. Our investigation process examines whether established protocols were followed. Findings are documented and shared with affected investors. If negligence is confirmed, FlockFund compensates the investor's full capital.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white border border-slate-200 rounded-2xl transition-all open:ring-2 open:ring-accent/50 open:border-accent/50"
              >
                <summary className="flex cursor-pointer items-center justify-between p-6 list-none font-bold text-primary group-open:text-accent">
                  {faq.q}
                  <span className="material-symbols-outlined transition-transform duration-300 group-open:-rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="p-6 pt-0 text-slate-500 text-sm leading-relaxed border-t border-slate-100 mt-2">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
