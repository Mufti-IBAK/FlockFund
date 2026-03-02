"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function AccountantInsightsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current!.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power3.out" }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Data Insights
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Deep-dive analytics on investment spread, costs, and profit margins.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-accent">
            insights
          </span>
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">Advanced Analytics</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          The data insights dashboard is currently being modeled. Rich visual charts and historical trends will be available soon.
        </p>
      </div>
    </div>
  );
}
