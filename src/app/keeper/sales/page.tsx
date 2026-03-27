"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface SaleResponse {
  id: string;
  flock_id: string;
  amount_birds: number;
  weight_kg: number;
  customer_name: string;
  product_type: string;
  is_manure: boolean;
  total_revenue: number;
  sale_timestamp: string;
  accountant_status: string;
  keeper_status: string;
  profiles: { full_name: string };
}

export default function KeeperSalesPage() {
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      const res = await fetch("/api/sales");
      let data = await res.json();
      if (Array.isArray(data)) setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".sale-card"),
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, stagger: 0.1, duration: 0.4, ease: "back.out(1.7)" }
        );
      });
      return () => ctx.revert();
    }
  }, [loading, sales]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keeper_status: status }),
      });
      if (res.ok) {
        setSales((prev) =>
          prev.map((s) => (s.id === id ? { ...s, keeper_status: status } : s))
        );
      } else {
        alert("Verification failed. Make sure DB is updated.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div ref={contentRef} className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Physical Stock Verification
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review reported sales and confirm the exact count of birds removed from the farm.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white/60 backdrop-blur rounded-3xl p-12 text-center border border-slate-200 border-dashed">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory</span>
          <p className="text-slate-400 text-sm font-medium">No sales requiring your recount.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sales.map((sale) => (
            <div key={sale.id} className="sale-card bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              
              <div className="flex gap-4 items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sale.is_manure ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined">{sale.is_manure ? 'agriculture' : 'pets'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      Reported by {sale.profiles?.full_name}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-primary leading-tight">
                    {sale.is_manure ? 'Manure Sale' : `${sale.amount_birds}x Birds / ${sale.weight_kg}KG`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Customer: {sale.customer_name}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] font-medium text-slate-400">
                  {new Date(sale.sale_timestamp).toLocaleString()}
                </div>
                
                {(sale.keeper_status === 'pending' || !sale.keeper_status) ? (
                  <button 
                    disabled={updating === sale.id}
                    onClick={() => updateStatus(sale.id, 'confirmed')}
                    className="px-5 py-2.5 bg-accent text-primary text-[10px] font-bold uppercase tracking-[0.1em] rounded-xl shadow-lg shadow-accent/20 cursor-pointer hover:bg-accent/90 transition-all disabled:opacity-50"
                  >
                    {updating === sale.id ? 'PROCESSING...' : 'CONFIRM STOCK'}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-3 py-1.5 bg-emerald-50 rounded-lg">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Confirmed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
