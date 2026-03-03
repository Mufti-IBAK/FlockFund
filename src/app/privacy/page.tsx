"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import Footer from "@/components/Footer";

const collectedData = [
  {
    type: "Identity Data",
    icon: "badge",
    examples: "Name, email, phone number",
  },
  {
    type: "Financial Data",
    icon: "account_balance",
    examples: "Bank details (processed securely by gateways)",
  },
  {
    type: "Investment Data",
    icon: "monitoring",
    examples: "Flock selections, transaction history",
  },
  {
    type: "Farm Data",
    icon: "eco",
    examples: "Anonymised feed consumption, weight, mortality",
  },
  {
    type: "Technical Data",
    icon: "devices",
    examples: "Browser type, cookies, IP addresses",
  },
];

export default function PrivacyPage() {
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
            Legal & Policy
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tighter">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Last Updated: March 2026
            <br />
            Your data trust is as critical as your financial trust. This policy
            explains how we collect, use, and safeguard your information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-12">
        <section className="animate-section bg-white rounded-3xl p-8 md:p-10 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">
                database
              </span>
            </div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-primary">
              Information We Collect
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {collectedData.map((d) => (
              <div
                key={d.type}
                className="border border-slate-100 rounded-2xl p-4 bg-slate-50 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-accent text-lg">
                    {d.icon}
                  </span>
                  <h3 className="font-bold text-primary text-sm">{d.type}</h3>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {d.examples}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="animate-section bg-white rounded-3xl p-8 md:p-10 border border-slate-200/60 shadow-sm">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">
                    settings_applications
                  </span>
                </div>
                <h2 className="font-heading text-xl font-bold text-primary">
                  How We Use Your Data
                </h2>
              </div>
              <ul className="space-y-3">
                {[
                  "To provide investment services",
                  "To process transactions",
                  "To communicate with you",
                  "To improve our platform",
                  "To comply with legal obligations",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">
                      check_circle
                    </span>
                    <span className="text-slate-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">
                    insights
                  </span>
                </div>
                <h2 className="font-heading text-xl font-bold text-primary">
                  Data Monetisation
                </h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                We collect{" "}
                <strong className="text-primary">
                  anonymised and aggregated
                </strong>{" "}
                farm data (feed conversion ratios, growth rates, etc.) that may
                be shared with third parties such as feed companies.
              </p>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
                  What this means for you:
                </p>
                <ul className="space-y-2 text-amber-700 text-xs">
                  <li>
                    • Your personal information is <strong>never</strong> sold.
                  </li>
                  <li>• Farm data is stripped of anything identifying.</li>
                  <li>• You cannot be identified from this data.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-6">
          <section className="animate-section md:col-span-2 bg-charcoal rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center justify-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grain.png')] opacity-10 pointer-events-none" />
            <span className="material-symbols-outlined text-accent text-3xl mb-4 relative z-10">
              shield_lock
            </span>
            <h2 className="font-heading text-xl font-bold mb-3 relative z-10">
              Data Security & Sharing
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-4 relative z-10 max-w-sm">
              We implement reasonable security measures, including encryption
              and access controls. We only share info with service providers and
              legal authorities as required. We do <strong>not</strong> sell
              your personal information.
            </p>
          </section>

          <section className="animate-section bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl mb-4">
              person_search
            </span>
            <h2 className="font-heading text-xl font-bold text-primary mb-3">
              Your Rights
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              You may request access to, correction of, or deletion of your
              personal data.
            </p>
            <a
              href="mailto:flockfund001@gmail.com"
              className="inline-block px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
