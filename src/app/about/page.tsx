"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const values = [
  {
    title: "Transparency",
    desc: "We share what's happening on the farm — good and bad — in real time.",
    icon: "visibility",
  },
  {
    title: "Trust",
    desc: "We earn it daily through honest communication and fair treatment of investors.",
    icon: "handshake",
  },
  {
    title: "Sustainability",
    desc: "We build farms that last and practices that protect the ecosystem and animal welfare.",
    icon: "eco",
  },
  {
    title: "Community",
    desc: "We are all in this together. Your success as an investor is our success as a cooperative.",
    icon: "groups",
  },
];

const team = [
  {
    name: "Dr. Muhammed Jimoh",
    role: "Founder & CEO",
    desc: "Doctor of Veterinary Medicine guiding our agricultural vision and farm health strategies.",
    icon: "medical_services",
  },
  {
    name: "Umar Muhammad",
    role: "Co-Founder",
    desc: "Business Expert & Real Estate Agent, ensuring strategic land use and operational scaling.",
    icon: "business_center",
  },
  {
    name: "Khairat Jimoh",
    role: "Chief Technology Officer",
    desc: "FullStack Developer & Data Analyst architecting our transparent fintech ecosystem.",
    icon: "code",
  },
  {
    name: "Aisha Ismail",
    role: "Head of Investor Relations",
    desc: "Community building expert providing world-class support and transparent communication.",
    icon: "forum",
  },
  {
    name: "Sadiq Aliu",
    role: "Operations Director",
    desc: "Supply chain and farm management lead executing our rapid cycle operations.",
    icon: "local_shipping",
  },
];

const careers = [
  {
    title: "Farm Manager (Veterinarian)",
    requirements: "DVM + poultry experience",
    desc: "Oversee flock health across farm locations, review keeper reports, conduct health inspections, and implement biosecurity protocols.",
  },
  {
    title: "Keeper (Poultry Attendant)",
    requirements: "Training provided",
    desc: "Provide daily care of broiler chickens including feeding, watering, and monitoring. Record mortality, temperature, and feed consumption.",
  },
  {
    title: "Community Manager",
    requirements: "Remote • 2+ years experience",
    desc: "Manage our investor community and social media. Organise webinars and Q&A sessions to boost investor confidence.",
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
        pageRef.current!.querySelectorAll(".stat-card, .value-card, .team-card, .career-card"),
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
            <Link href="/how-it-works" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">How It Works</Link>
            <Link href="/returns" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Returns</Link>
            <Link href="/risk-management" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Risk Management</Link>
            <Link href="/about" className="text-accent text-xs font-bold uppercase tracking-widest">About</Link>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-primary px-4 py-2">Sign In</Link>
            <Link href="/signup" className="px-6 py-2.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">Invest Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-40 pb-16 text-center max-w-4xl mx-auto px-6">
        <div className="hero-text">
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mb-6">
            Our Story & Mission
          </span>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary mb-6 tracking-tighter leading-[1.1]">
            Democratising Poultry{" "}
            <span className="text-accent">Investment</span>
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            FlockFund was born from a simple observation: poultry farming is profitable, but the barrier to entry is high. Land, infrastructure, expertise, and capital — most people don't have all four. We bridge the gap, allowing anyone to co-own broiler chickens, earn profits, and be part of a growing community.
          </p>
        </div>
      </div>

      {/* Competitive Advantage Ribbon */}
      <div className="bg-charcoal py-14 px-6 relative overflow-hidden mt-12">
        <div className="absolute inset-0 bg-[url('/grain.png')] opacity-10 pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
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
      <div className="bg-gradient-to-b from-primary to-[#0a1f1a] py-24 px-6 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">
                Our Mission
              </span>
              <h2 className="font-heading text-3xl font-extrabold text-white mt-3 tracking-tight leading-tight">
                Empowering Everyone
              </h2>
              <p className="text-white/60 text-base mt-4 leading-relaxed">
                To make poultry farming accessible, transparent, and profitable for everyone. No farm required. No expertise needed. Just a belief in something real.
              </p>
            </div>
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">
                Our Philosophy
              </span>
              <h2 className="font-heading text-3xl font-extrabold text-white mt-3 tracking-tight leading-tight">
                Technology meets Agriculture
              </h2>
              <p className="text-white/60 text-base mt-4 leading-relaxed">
                We blend the tangible nature of farming with the speed, verification, and transparency of financial technology. You track every stage from day-old chick to payout.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="text-center mb-12">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Our Values
            </span>
            <h3 className="font-heading text-3xl font-extrabold text-white mt-2 tracking-tight">
              What Drives Us
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="value-card bg-white/[0.03] backdrop-blur-md rounded-2xl p-6 border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <span className="material-symbols-outlined text-accent text-xl">
                    {v.icon}
                  </span>
                </div>
                <h4 className="text-white font-bold text-base mb-2">{v.title}</h4>
                <p className="text-white/40 text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div id="team" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
              Leadership
            </span>
            <h2 className="font-heading text-3xl lg:text-4xl font-extrabold text-primary mt-3 tracking-tight">
              Meet the Team
            </h2>
            <p className="text-slate-500 text-sm mt-4 max-w-xl mx-auto">
              We are a dedicated group of agricultural experts, technologists, and business leaders committed to making farm co-ownership a seamless reality.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((t) => (
              <div
                key={t.name}
                className="team-card bg-white rounded-2xl border border-slate-200/60 p-6 flex items-start gap-4 hover:shadow-lg hover:border-accent/20 transition-all duration-300"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-primary text-white flex items-center justify-center">
                  <span className="material-symbols-outlined">{t.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-primary text-base">{t.name}</h3>
                  <p className="text-accent font-bold text-[10px] uppercase tracking-widest mt-0.5 mb-2">{t.role}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Careers */}
      <div id="careers" className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
                Careers
              </span>
              <h2 className="font-heading text-3xl lg:text-4xl font-extrabold text-primary mt-3 tracking-tight mb-4">
                Join the Flock
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6">
                We're building something different — where technology meets agriculture, and transparency is non-negotiable. Your work here helps people invest in real, tangible assets to build reliable wealth.
              </p>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  </span>
                  <strong>Mission-Driven:</strong> Real impact on food security and wealth generation.
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                  </span>
                  <strong>Growth Environment:</strong> We invest heavily in your learning and development.
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">location_city</span>
                  </span>
                  <strong>Flexible Culture:</strong> Remote-first roles and dynamic farm settings.
                </li>
              </ul>
              
              <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500">
                  <strong className="text-primary block mb-1">How to apply:</strong>
                  Openings are actively being filled internally or via selective referral at this time. When public slots open, we will list application links explicitly here. We remain an equal opportunity employer. 
                </p>
              </div>
            </div>
            
            <div className="lg:col-span-7">
              <h3 className="font-bold text-primary text-xl mb-6">Recognized Roles</h3>
              <div className="space-y-4">
                {careers.map((job) => (
                  <div key={job.title} className="career-card border border-slate-200 rounded-2xl p-6 bg-white hover:border-accent/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                      <h4 className="font-bold text-primary text-base">{job.title}</h4>
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                        {job.requirements}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{job.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="py-24 px-6 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grain.png')] opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="text-accent text-[11px] font-bold uppercase tracking-[0.3em]">
            Get In Touch
          </span>
          <h2 className="font-heading text-3xl lg:text-4xl font-extrabold text-white mt-3 tracking-tight mb-6">
            We're Here to Help
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-12 max-w-2xl mx-auto">
            Whether you are an aspiring investor having trouble setting up your wallet, or a large scale buyer looking to secure off-take of our premium broilers, our team is directly accessible.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-8 border border-white/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-xl">contact_support</span>
              </div>
              <h4 className="text-white font-bold text-lg mb-2">Investor Support</h4>
              <p className="text-white/40 text-sm mb-4">General inquiries, wallet issues, and cycle clarifications.</p>
              <a href="mailto:flockfund001@gmail.com" className="text-accent font-bold hover:underline">flockfund001@gmail.com</a>
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-8 border border-white/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-xl">code</span>
              </div>
              <h4 className="text-white font-bold text-lg mb-2">Technical Team</h4>
              <p className="text-white/40 text-sm mb-4">Platform bugs, security reporting, and API integrations.</p>
              <a href="mailto:tech.plexus001@gmail.com" className="text-accent font-bold hover:underline">tech.plexus001@gmail.com</a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
