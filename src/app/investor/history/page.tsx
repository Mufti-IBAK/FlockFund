"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function InvestorHistoryPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current!.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Transaction History
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete ledger of your investments, payouts, and withdrawals.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-accent">
            history
          </span>
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">
          Ledger Synchronization
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Your historical transaction ledger is currently synchronizing with the
          decentralized record. Full history will be visible soon.
        </p>
      </div>
    </div>
  );
}
