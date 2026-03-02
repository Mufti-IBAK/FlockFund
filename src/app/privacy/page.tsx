"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mb-6">
            Legal & Policy
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tighter mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Your data trust is as critical as your financial trust. Learn how we secure and use your information.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 prose prose-slate">
          <h2>1. Information We Collect</h2>
          <p>
            When you register for a FlockFund account, invest in a cycle, or communicate with us, we collect personal information such as your name, email address, phone number, and bank account details for payouts. All financial transactions are processed securely through our gateway partners (e.g., Paystack, Flutterwave) and we do not store full card numbers on our servers.
          </p>

          <h2>2. How We Use Your Data</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Create and manage your investor dashboard.</li>
            <li>Process your investments and subsequent payouts.</li>
            <li>Communicate critical cycle updates and financial reports.</li>
            <li>Ensure compliance with anti-money laundering (AML) and know-your-customer (KYC) regulations.</li>
          </ul>

          <h2>3. Data Security</h2>
          <p>
            We implement bank-level encryption (AES-256) to secure your personal and financial data. Access to production databases is strictly monitored, role-based, and logged to ensure maximum privacy. 
          </p>

          <h2>4. Third-Party Sharing</h2>
          <p>
            FlockFund does not sell your personal data. We only share information with trusted third parties (like our payment processors and identity verification partners) strictly for operational necessity and legal compliance.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            You have the right to request access to the data we hold about you, request corrections to inaccurate data, and ask for the deletion of your account (subject to retention required by Nigerian financial regulations).
          </p>

          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
            <span className="material-symbols-outlined text-accent text-2xl">mail</span>
            <div>
              <h4 className="font-bold text-primary m-0">Questions about Privacy?</h4>
              <p className="text-sm text-slate-500 mt-1 mb-0">Contact our Data Protection Officer at <a href="mailto:privacy@flockfund.com" className="text-accent font-bold hover:underline">privacy@flockfund.com</a></p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
