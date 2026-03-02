"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-background-light font-sans text-slate-800">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl bg-primary/70 rounded-2xl px-8 py-3 border border-white/10 shadow-2xl shadow-black/20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent text-lg">
                psychiatry
              </span>
            </div>
            <span className="text-white font-heading font-extrabold text-lg tracking-tight">
              FlockFund
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/how-it-works" className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">How It Works</Link>
            <Link href="/returns" className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Returns</Link>
            <Link href="/risk-management" className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Risk Management</Link>
            <Link href="/about" className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">About</Link>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white px-4 py-2">Sign In</Link>
            <Link href="/signup" className="px-6 py-2.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">Invest Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[url('/grain.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mb-6">
            Legal & Policy
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tighter mb-4">
            Compliance & Due Diligence
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Integrity in every transaction. Learn how we meet regulatory standards for agricultural cooperatives and digital finance.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 prose prose-slate">
          <h2>1. Cooperative Registration</h2>
          <p>
            FlockFund operates under the legal framework of a registered Cooperative Society in Nigeria. This allows us to pool funds from members purely for the purpose of executing agricultural cycles, returning the profits back to members. We are not a bank, nor do we act as a traditional investment fund manager trading securities.
          </p>

          <h2>2. Anti-Money Laundering (AML) & KYC</h2>
          <p>
            To prevent fraud and adhere to national AML standards, all investors are required to undergo a Know Your Customer (KYC) verification before they can initiate withdrawals. Large transactions may be subject to additional scrutiny and reporting to relevant financial intelligence authorities.
          </p>

          <h2>3. Veterinary & Agricultural Compliance</h2>
          <p>
            We strictly enforce standard operating procedures prescribed by licensed Vet Consultants. Our operations align with the "One Health" approach, minimizing antimicrobial resistance risk and adhering to safe slaughter guidelines for food security.
          </p>

          <h2>4. Blockchain Proof-of-Record</h2>
          <p>
            All investments, cycle start dates, and payout outcomes are cryptographically logged to a blockchain ledge. This creates an immutable, public audit trail that members can independently verify—preventing retrospective alterations of financial data.
          </p>

          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
            <span className="material-symbols-outlined text-emerald-500 text-2xl">verified_user</span>
            <div>
              <h4 className="font-bold text-primary m-0">Report a Compliance Issue</h4>
              <p className="text-sm text-slate-500 mt-1 mb-0">We take compliance seriously. If you spot a potential breach, contact our compliance team directly at <a href="mailto:compliance@flockfund.com" className="text-accent font-bold hover:underline">compliance@flockfund.com</a></p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
