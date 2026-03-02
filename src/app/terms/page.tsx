"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function TermsPage() {
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
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase tracking-widest mb-6">
            Legal & Policy
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tighter mb-4">
            Terms of Service
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            By investing with FlockFund, you agree to a cooperative partnership built on shared risk and transparent rewards.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 prose prose-slate">
          <h2>1. Introduction</h2>
          <p>
            Welcome to FlockFund. These Terms govern your use of our platform and participation in our short-cycle poultry cooperative. By creating an account or making an investment, you enter a mutually binding agreement with us under Nigerian Cooperative Law.
          </p>

          <h2>2. The Investment Cycle</h2>
          <p>
            An investment unit ("bird") represents a slice of the operating capital for a specific flock. You understand that:
          </p>
          <ul>
            <li>Capital is locked for the duration of the cycle (typically 28-35 days).</li>
            <li>Returns are variable, based on market floor pricing and actual sales value at harvest.</li>
            <li>Agriculture involves inherent risk of mortality or market fluctuation, which we mitigate via the FlockFund Reserve but cannot entirely eliminate.</li>
          </ul>

          <h2>3. Disclosures & Liability</h2>
          <p>
            FlockFund provides rearing-as-a-service through our platform. Past cycle performance does not guarantee identical future results. 
            Investors acknowledge the "Force Majeure" clauses covering catastrophic events (e.g. government-mandated culling for Avian Influenza). In such cases, the FlockFund Reserve acts as a partial buffer, not a 100% indemnity insurance.
          </p>

          <h2>4. Profit Split</h2>
          <p>
            Profits from bird sales are distributed on a transparent 70/30 split. Investors receive 70% of the net profit, and FlockFund retains 30% for management fees, farm maintenance, and the Reserve Fund allocation. No hidden fees or arbitrary deductions apply.
          </p>

          <h2>5. Account Termination</h2>
          <p>
            FlockFund reserves the right to suspend or terminate accounts involved in fraudulent activity, money laundering, or breach of these terms.
          </p>

          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
            <span className="material-symbols-outlined text-accent text-2xl">description</span>
            <div>
              <h4 className="font-bold text-primary m-0">Detailed MoU</h4>
              <p className="text-sm text-slate-500 mt-1 mb-0">Upon every investment, a digital MoU is generated detailing specific terms for that flock. It acts as the primary governing document for that transaction.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
