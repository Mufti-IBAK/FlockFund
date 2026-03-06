"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface FlockCost {
  id: string;
  flock_id: string;
  category: string;
  amount: number;
  disbursement_date: string;
  notes: string;
  flocks: { name: string };
}

export default function ManagerFlockCosts() {
  const [costs, setCosts] = useState<FlockCost[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("flock_costs")
          .select("*, flocks(name)")
          .order("disbursement_date", { ascending: false });
        
        if (error) throw error;
        setCosts(data || []);
      } catch (err) {
        console.error("Failed to load flock costs:", err);
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
          contentRef.current!.querySelectorAll(".cost-row"),
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, stagger: 0.05, duration: 0.5, ease: "power2.out" }
        );
      });
      return () => ctx.revert();
    }
  }, [loading]);

  const categories: Record<string, string> = {
    feed: "bg-emerald-100 text-emerald-700",
    medication: "bg-amber-100 text-amber-700",
    labor: "bg-sky-100 text-sky-700",
    combined_operational_fees: "bg-primary/10 text-primary",
    bird_purchase: "bg-rose-100 text-rose-700",
    other: "bg-slate-100 text-slate-600",
  };

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Operational Expenditures
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Detailed log of accountant-verified disbursements for your flocks
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Disbursement History</h3>
          <span className="text-[10px] font-bold text-primary px-3 py-1 bg-accent/20 rounded-full border border-accent/20">{costs.length} Records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
             <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : costs.length === 0 ? (
          <div className="p-16 text-center text-slate-300">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-20">payments</span>
            <p className="text-sm font-medium">No disbursement records found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Flock</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {costs.map((c) => (
                  <tr key={c.id} className="cost-row hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-primary">{new Date(c.disbursement_date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 font-heading font-bold text-sm text-primary">
                      {c.flocks?.name || "Global / Other"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${categories[c.category] || categories.other}`}>
                        {c.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                       ₦{c.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {c.notes || "—"}
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
