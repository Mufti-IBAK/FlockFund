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

export default function AccountantSalesPage() {
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
      if (Array.isArray(data)) {
        // Find sales that are strictly pending validation by accountant or just show all recent
        setSales(data);
      }
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
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }
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
        body: JSON.stringify({ accountant_status: status }),
      });
      if (res.ok) {
        setSales((prev) =>
          prev.map((s) => (s.id === id ? { ...s, accountant_status: status } : s))
        );
      } else {
        alert("Failed to confirm sale. Ensure the DB is updated.");
      }
    } catch (err) {
      console.error(err);
      alert("Error confirming sale");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div ref={contentRef} className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Sales Verifications
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Verify physical bank deposits/transfers against the recorded sales.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
          <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">account_balance</span>
          <p className="text-slate-400 text-sm">No sales require verification.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sales.map((sale) => (
            <div key={sale.id} className="sale-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
              
              <div className="flex gap-4 items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sale.is_manure ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  <span className="material-symbols-outlined">{sale.is_manure ? 'compost' : 'inventory_2'}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">
                    {sale.is_manure ? 'Manure Batch' : `${sale.amount_birds}x Birds Output`}
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {sale.customer_name} • Reported by {sale.profiles?.full_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(sale.sale_timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                <p className="text-xl font-mono font-bold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-100 self-start md:self-end">
                  ₦{sale.total_revenue.toLocaleString()}
                </p>

                <div className="flex gap-2 w-full">
                  {(sale.accountant_status === 'pending' || !sale.accountant_status) ? (
                    <>
                      <button 
                        disabled={updating === sale.id}
                        onClick={() => updateStatus(sale.id, 'confirmed')}
                        className="flex-1 md:flex-none px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow cursor-pointer disabled:opacity-50"
                      >
                        {updating === sale.id ? 'VERIFYING...' : 'CONFIRM FUNDS'}
                      </button>
                    </>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-3 py-1.5 bg-emerald-50 rounded-lg">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
