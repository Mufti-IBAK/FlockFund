"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface ProfitCycle {
  id: string;
  flock_id: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  investor_pool: number;
  platform_pool: number;
  calculated_at: string;
  flocks?: {
    flock_name: string;
    batch_size: number;
  };
}

export default function BirdSalesReport() {
  const [cycles, setCycles] = useState<ProfitCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/accountant/sales");
        if (!res.ok) throw new Error("Failed to fetch sales data");
        const data = await res.json();
        setCycles(data.cycles || []);
      } catch (err) {
        console.error("Sales Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".fade-in",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" }
        );
      });
      return () => ctx.revert();
    }
  }, [loading]);

  const totalSales = cycles.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
  const totalProfit = cycles.reduce((acc, curr) => acc + (curr.gross_profit || 0), 0);
  const totalUnits = cycles.reduce((acc, curr) => acc + (curr.flocks?.batch_size || 0), 0);

  return (
    <div ref={contentRef}>
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Bird Sales Report
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Revenue, costs, and profit analysis for completed flock cycles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          {
            label: "Total Sales Revenue",
            value: `₦${totalSales.toLocaleString()}`,
            icon: "payments",
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Total Net Profit",
            value: `₦${totalProfit.toLocaleString()}`,
            icon: "trending_up",
            color: "bg-accent/10 text-accent",
          },
          {
            label: "Total Birds Sold",
            value: totalUnits.toLocaleString(),
            icon: "shopping_cart",
            color: "bg-sky-50 text-sky-600",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="fade-in bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center mb-4`}>
              <span className="material-symbols-outlined text-lg">{kpi.icon}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {kpi.label}
            </p>
            <p className="text-xl font-bold text-primary">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden fade-in">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-primary">Sales Ledger</h2>
          <span className="text-xs text-slate-400 font-bold">{cycles.length} cycles completed</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading sales records...</div>
        ) : cycles.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No completed cycles recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Sale Date</th>
                  <th className="p-4">Flock ID</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4 pr-6 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle) => (
                  <tr key={cycle.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-sm text-slate-500 font-medium">
                      {new Date(cycle.calculated_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-primary">
                        {cycle.flocks?.flock_name || "Unknown Flock"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        UID: {cycle.flock_id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="p-4 font-mono font-bold text-primary text-sm">
                      ₦{cycle.total_revenue.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-sm">
                      ₦{cycle.total_cost.toLocaleString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold">
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        ₦{cycle.gross_profit.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
