"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface PerformanceSale {
  id: string;
  flock_id: string;
  amount_birds: number;
  weight_kg: number;
  customer_name: string;
  product_type: string;
  is_manure: boolean;
  total_revenue: number;
  sale_timestamp: string;
}

export default function SalesReportingPage() {
  const [activeFlocks, setActiveFlocks] = useState<{ id: string; name: string }[]>([]);
  const [sales, setSales] = useState<PerformanceSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [isManure, setIsManure] = useState(false);
  const [flockId, setFlockId] = useState("");
  const [amountBirds, setAmountBirds] = useState(0);
  const [weightKg, setWeightKg] = useState(0);
  const [customer, setCustomer] = useState("");
  const [productType, setProductType] = useState("live");
  const [otherDetails, setOtherDetails] = useState("");
  const [revenue, setRevenue] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        const { data: flocks } = await supabase.from("flocks").select("id, name").eq("status", "active");
        if (flocks) {
          setActiveFlocks(flocks);
          if (flocks.length > 0) setFlockId(flocks[0].id);
        }

        const res = await fetch("/api/sales");
        const salesData = await res.json();
        if (Array.isArray(salesData)) setSales(salesData);
      } catch (err) {
        console.error("Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSubmit() {
    if (!flockId || !customer || revenue <= 0) {
      alert("Please fill all required fields and ensure revenue is greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        flock_id: flockId,
        is_manure: isManure,
        customer_name: customer,
        total_revenue: revenue,
        amount_birds: isManure ? 0 : amountBirds,
        weight_kg: isManure ? 0 : weightKg,
        product_type: isManure ? "other" : productType,
        other_product_details: otherDetails
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save sale");
      
      const newSale = await res.json();
      setSales([newSale, ...sales]);
      
      // Reset
      setCustomer("");
      setAmountBirds(0);
      setWeightKg(0);
      setRevenue(0);
      setOtherDetails("");
      alert("Sale reported successfully!");
    } catch (err) {
      console.error(err);
      alert("Error reporting sale.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={contentRef} className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Report Sales
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Record transactions for birds, processed poultry, or manure
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button 
                onClick={() => setIsManure(false)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${!isManure ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Poultry
              </button>
              <button 
                onClick={() => setIsManure(true)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${isManure ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Manure
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Active Flock</label>
                <select 
                  value={flockId} 
                  onChange={(e) => setFlockId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-accent/20 outline-none"
                >
                  {activeFlocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              {!isManure && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount (Birds)</label>
                      <input 
                        type="number" 
                        value={amountBirds} 
                        onChange={(e) => setAmountBirds(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-primary outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Weight (KG)</label>
                      <input 
                        type="number" 
                        value={weightKg} 
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Product Type</label>
                    <select 
                      value={productType} 
                      onChange={(e) => setProductType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none"
                    >
                      <option value="live">Live Bird</option>
                      <option value="frozen">Frozen Whole</option>
                      <option value="peppered">Grilled/Peppered</option>
                      <option value="other">Other Processed</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Customer / Buyer</label>
                <input 
                  type="text" 
                  value={customer} 
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Retail customer or Whole-saler"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none"
                />
              </div>

              <div className="space-y-1.5 text-accent">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Total Revenue (₦)</label>
                <input 
                  type="number" 
                  value={revenue} 
                  onChange={(e) => setRevenue(Number(e.target.value))}
                  className="w-full bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 text-lg font-mono font-bold text-primary outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Finalize Sale'}
              </button>
            </div>
          </div>
        </div>

        {/* History Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">Sale History</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200">{sales.length} transactions</span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
              </div>
            ) : sales.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">receipt_long</span>
                <p className="text-sm">No sales recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Customer</th>
                      <th className="px-6 py-4 text-left">Items</th>
                      <th className="px-6 py-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-primary">{new Date(s.sale_timestamp).toLocaleDateString()}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-tighter">
                            {new Date(s.sale_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{s.customer_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary">
                              {s.is_manure ? 'Manure Sale' : `${s.amount_birds}x ${s.product_type}`}
                            </span>
                            {!s.is_manure && <span className="text-[9px] text-slate-400 uppercase">{s.weight_kg}KG total</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-xs font-bold text-emerald-600">₦{s.total_revenue.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
