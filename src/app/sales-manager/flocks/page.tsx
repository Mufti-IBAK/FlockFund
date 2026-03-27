"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Flock {
  id: string;
  name: string;
  total_birds: number;
  current_count: number;
  start_date: string;
  status: string;
  sold_birds?: number;
  remaining_birds?: number;
}

export default function SalesManagerFlocks() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("flocks")
          .select("id, name, total_birds, current_count, start_date, status")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        const { data: salesData } = await supabase
          .from("sales_reports")
          .select("flock_id, amount_birds, is_manure, keeper_status, accountant_status");

        const soldMap: Record<string, number> = {};
        if (salesData) {
          salesData.forEach(sale => {
            if (!sale.is_manure) {
              soldMap[sale.flock_id] = (soldMap[sale.flock_id] || 0) + (sale.amount_birds || 0);
            }
          });
        }

        const enrichedFlocks = (data || []).map(f => {
          const sold = soldMap[f.id] || 0;
          return {
            ...f,
            sold_birds: sold,
            remaining_birds: Math.max(0, f.current_count - sold)
          };
        });

        setFlocks(enrichedFlocks || []);
      } catch (err) {
        console.error("Load failed:", err);
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
          contentRef.current!.querySelectorAll(".flock-card"),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }
        );
      });
      return () => ctx.revert();
    }
  }, [loading]);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Active Flocks
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Flocks available for sales reporting
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : flocks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
           <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">egg_alt</span>
           <p className="text-slate-400 text-sm">No active flocks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flocks.map((f) => (
            <div key={f.id} className="flock-card bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="font-heading font-bold text-primary text-lg">{f.name}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Started {new Date(f.start_date).toLocaleDateString()}</p>
                 </div>
                 <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
               </div>
               
               <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Birds</p>
                    <p className="font-mono font-bold text-primary">{f.total_birds.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Sold Live</p>
                    <p className="font-mono font-bold text-emerald-600">{f.sold_birds?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-accent/70 font-bold uppercase tracking-widest mb-1">Remaining</p>
                    <p className="font-mono font-bold text-accent">{f.remaining_birds?.toLocaleString()}</p>
                  </div>
               </div>
               
               <a 
                 href={`/sales-manager/sales?flockId=${f.id}`}
                 className="w-full mt-6 py-3 bg-slate-50 hover:bg-slate-100 text-primary text-xs font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all"
               >
                 <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                 Report Sale
               </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
