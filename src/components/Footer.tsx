import Link from "next/link";

export default function Footer() {
  return (
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
                  href="/risk-management"
                  className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                >
                  Security & Risk
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
                  href="/privacy"
                  className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-white/30 text-sm hover:text-accent transition-colors duration-300"
                >
                  Terms
                </Link>
                <Link
                  href="/compliance"
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
  );
}
