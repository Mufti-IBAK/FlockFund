"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ────── Counter Component (animates numbers on scroll) ──────
function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    ScrollTrigger.create({
      trigger: ref.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (counted.current) return;
        counted.current = true;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: value,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            if (ref.current) {
              ref.current.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`;
            }
          },
        });
      },
    });
  }, [value, prefix, suffix]);

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}

// ────── Floating Particles (pure CSS, lightweight) ──────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => {
        const size = Math.random() * 4 + 1;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const duration = Math.random() * 12 + 10;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-accent/20"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              bottom: "-5%",
              animation: `floatUp ${duration}s ${delay}s infinite linear`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroTagRef = useRef<HTMLParagraphElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Sticky Nav reveal ──
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { y: -100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power3.out" },
        );
      }

      // ── Hero entrance sequence ──
      const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
      heroTl
        .fromTo(
          heroTagRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, delay: 0.5 },
        )
        .fromTo(
          heroTitleRef.current,
          { y: 80, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1.2 },
          "-=0.4",
        )
        .fromTo(
          heroSubRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          "-=0.6",
        )
        .fromTo(
          heroCTARef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.4",
        );

      // ── Hero parallax on scroll ──
      if (heroRef.current) {
        gsap.to(heroRef.current.querySelector(".hero-inner"), {
          yPercent: 30,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      }

      // ── Stats: animated reveal ──
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.querySelectorAll(".stat-item"),
          { y: 60, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.15,
            duration: 0.8,
            ease: "back.out(1.3)",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 80%",
            },
          },
        );
      }

      // ── Steps: staggered card reveal ──
      if (stepsRef.current) {
        gsap.fromTo(
          stepsRef.current.querySelectorAll(".step-card"),
          { y: 80, opacity: 0, rotateX: 15 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            stagger: 0.2,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 75%",
            },
          },
        );
      }

      // ── CTA: scale-in + glow ──
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { scale: 0.9, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 80%",
            },
          },
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden bg-background-light">
      {/* ═══════ Fixed Navigation ═══════ */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl bg-primary/70 rounded-2xl px-8 py-3 border border-white/10 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-accent text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychiatry
              </span>
            </div>
            <span className="text-white font-heading font-extrabold text-lg tracking-tight">
              FlockFund
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/how-it-works"
              className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300"
            >
              How It Works
            </Link>
            <Link
              href="/returns"
              className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300"
            >
              Returns
            </Link>
            <Link
              href="/about"
              className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors duration-300 px-4 py-2"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="px-6 py-2.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent/90 transition-all duration-300 shadow-lg shadow-accent/20"
            >
              Invest Now
            </a>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f18] via-primary to-[#0d271e]" />
        <div className="absolute inset-0 hero-gradient opacity-40" />
        <FloatingParticles />
        <div className="absolute inset-0 grain-overlay" />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />

        {/* Content */}
        <div className="hero-inner relative z-10 max-w-6xl mx-auto px-6 text-center">
          <p
            ref={heroTagRef}
            className="inline-flex items-center gap-2 text-accent font-mono text-[11px] tracking-[0.35em] uppercase mb-8 font-bold opacity-0 bg-accent/10 px-5 py-2 rounded-full border border-accent/20"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Premium Ag-Fintech Platform
          </p>
          <h1
            ref={heroTitleRef}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-serif font-semibold leading-[0.92] tracking-tight text-white mb-8 opacity-0"
          >
            Own a Piece
            <br />
            <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
              of the Flock
            </span>
          </h1>
          <p
            ref={heroSubRef}
            className="text-white/45 text-lg md:text-xl max-w-2xl mx-auto mb-14 font-light leading-relaxed opacity-0"
          >
            Democratizing high-yield poultry farming through collective
            investment. Track every bird, every metric, every naira — in real
            time.
          </p>
          <div
            ref={heroCTARef}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0"
          >
            <a
              href="/signup"
              className="group relative px-10 py-4 bg-accent text-primary font-bold text-sm rounded-full
                         shadow-2xl shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.03] active:scale-[0.98]
                         transition-all duration-300 uppercase tracking-wider overflow-hidden"
            >
              <span className="relative z-10">Start Investing</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </a>
            <Link
              href="/how-it-works"
              className="px-10 py-4 border border-white/15 text-white/80 font-bold text-sm
                         rounded-full hover:bg-white/10 hover:border-white/25 transition-all duration-300
                         uppercase tracking-wider backdrop-blur-sm shadow-xl shadow-black/20"
            >
              How It Works
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-40">
            <span className="text-white/60 text-[10px] tracking-[0.3em] uppercase font-bold">
              Scroll
            </span>
            <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS RIBBON ═══════ */}
      <section
        ref={statsRef}
        className="relative bg-charcoal py-20 px-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/50 via-transparent to-primary/50 opacity-50" />
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          {[
            {
              value: 15000,
              suffix: "+",
              prefix: "",
              label: "Birds Funded",
              icon: "egg_alt",
            },
            {
              value: 500,
              suffix: "+",
              prefix: "",
              label: "Active Investors",
              icon: "group",
            },
            {
              value: 2500,
              suffix: "M",
              prefix: "₦",
              label: "Total Returns",
              icon: "trending_up",
            },
            {
              value: 98,
              suffix: "%",
              prefix: "",
              label: "Client Satisfaction",
              icon: "verified",
            },
          ].map((stat) => (
            <div key={stat.label} className="stat-item group">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-500">
                <span className="material-symbols-outlined text-accent text-2xl">
                  {stat.icon}
                </span>
              </div>
              <p className="font-mono text-3xl md:text-4xl font-bold text-accent tracking-tighter">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
              </p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section
        ref={stepsRef}
        id="how-it-works"
        className="bg-background-light py-28 px-6 relative"
      >
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.35em] mb-4 inline-flex items-center gap-2">
              <span className="w-8 h-px bg-accent" />
              Simplified Process
              <span className="w-8 h-px bg-accent" />
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-primary tracking-tight">
              Three Steps to Your
              <br />
              <span className="bg-gradient-to-r from-primary via-emerald-700 to-primary bg-clip-text text-transparent">
                First Investment
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Flock",
                desc: "Browse active flock cycles, review projected returns, and pick how many birds you want to own.",
                icon: "search",
                gradient: "from-emerald-500/10 to-teal-500/10",
              },
              {
                step: "02",
                title: "Fund Your Birds",
                desc: "Pay via Flutterwave, Paystack, or PayPal. Your investment is securely recorded on the ledger.",
                icon: "account_balance_wallet",
                gradient: "from-accent/10 to-amber-500/10",
              },
              {
                step: "03",
                title: "Track & Earn",
                desc: "Monitor real-time farm metrics, receive profit payouts, and reinvest for compound growth.",
                icon: "monitoring",
                gradient: "from-sky-500/10 to-indigo-500/10",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`step-card group relative bg-gradient-to-br ${item.gradient} rounded-3xl p-8 
                           border border-white/60 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 
                           transition-all duration-500 hover:-translate-y-2 cursor-default perspective-[1000px]`}
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/5 group-hover:to-transparent transition-all duration-700 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:bg-accent/20 group-hover:shadow-accent/10 transition-all duration-500">
                      <span className="material-symbols-outlined text-primary group-hover:text-accent text-2xl transition-colors duration-500">
                        {item.icon}
                      </span>
                    </div>
                    <span className="font-mono text-5xl font-bold text-primary/5 group-hover:text-accent/15 transition-colors duration-500 select-none">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-primary mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Features Grid ═══════ */}
      <section className="bg-primary py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[200px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-accent text-[11px] font-bold uppercase tracking-[0.35em] mb-4">
              Why FlockFund
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-semibold text-white tracking-tight leading-tight">
              Built for Transparency.
              <br />
              Designed for Growth.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "shield",
                title: "Bank-Grade Security",
                desc: "End-to-end encryption with blockchain-backed transaction records.",
              },
              {
                icon: "monitoring",
                title: "Real-Time Tracking",
                desc: "Live farm metrics, mortality rates, feed conversion ratios — updated daily.",
              },
              {
                icon: "account_balance_wallet",
                title: "Multi-Gateway Payments",
                desc: "Flutterwave, Paystack, PayPal — invest and withdraw with ease.",
              },
              {
                icon: "recycling",
                title: "Auto-Reinvestment",
                desc: "Compound your returns automatically into the next flock cycle.",
              },
              {
                icon: "groups",
                title: "Community Hub",
                desc: "Connect with other investors, share insights, and build collectively.",
              },
              {
                icon: "insights",
                title: "Smart Analytics",
                desc: "FCR calculations, weight projections, and profit forecasts in one view.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="group p-6 rounded-2xl border border-white/5 hover:border-accent/20 bg-white/[0.03] backdrop-blur-sm
                           hover:bg-white/[0.06] transition-all duration-500 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined text-accent text-xl">
                    {feat.icon}
                  </span>
                </div>
                <h3 className="text-white font-heading font-bold text-lg mb-2">
                  {feat.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section ref={ctaRef} className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background-light via-accent/5 to-background-light" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[200px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse" />
            <span className="text-primary text-[11px] font-bold uppercase tracking-[0.2em]">
              Limited Spots Available
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-semibold text-primary leading-tight mb-6 tracking-tight">
            Ready to grow your wealth{" "}
            <span className="bg-gradient-to-r from-accent via-amber-500 to-accent bg-clip-text text-transparent">
              one bird at a time?
            </span>
          </h2>
          <p className="text-slate-500 mb-12 max-w-xl mx-auto text-lg leading-relaxed">
            Join hundreds of investors earning consistent returns from
            professionally managed poultry farms.
          </p>
          <a
            href="/signup"
            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-primary text-white font-bold text-sm
                       rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03]
                       active:scale-[0.98] transition-all duration-300 uppercase tracking-wider overflow-hidden"
          >
            <span className="relative z-10">Create Free Account</span>
            <span className="relative z-10 material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform duration-300">
              arrow_forward
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </a>
        </div>
      </section>

      {/* ═══════ Footer ═══════ */}
      <footer className="bg-charcoal py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 grain-overlay" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 pb-10 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-accent text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    psychiatry
                  </span>
                </div>
                <span className="text-white font-heading font-extrabold text-lg tracking-tight">
                  FlockFund
                </span>
              </div>
              <p className="text-white/30 text-sm max-w-xs leading-relaxed">
                Democratizing poultry investment for sustainable, transparent
                returns.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
                  Platform
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/how-it-works"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/how-to-invest"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    How to Invest
                  </Link>
                  <Link
                    href="/returns"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    Returns
                  </Link>
                  <Link
                    href="/about#security"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    Security
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
                  Company
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/about"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    About
                  </Link>
                  <Link
                    href="/about#careers"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    Careers
                  </Link>
                  <Link
                    href="/about#contact"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    Contact
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
                  Legal
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/about#privacy"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/about#terms"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    Terms
                  </Link>
                  <Link
                    href="/about#compliance"
                    className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                  >
                    Compliance
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
            <div className="flex items-center gap-2 opacity-30">
              <span className="material-symbols-outlined text-white text-sm">
                shield
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                Encrypted Ag-Fintech Network
              </span>
            </div>
            <p className="text-[11px] font-bold text-white/20 tracking-tight">
              © 2024 FlockFund International. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
