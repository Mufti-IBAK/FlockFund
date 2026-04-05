"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Greeting } from "@/components/Greeting";

interface PayoutRecord {
  id: string;
  investor_id: string;
  full_name: string;
  email: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  flock_name: string;
  amount_to_disburse: number;
  capital_returned: number;
  profit_shared: number;
  mortality_loss: number;
  status: 'draft' | 'verified';
  payout_date: string;
}

export default function AccountantInvestorsPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'draft' | 'verified'>('draft');

  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    try {
      setLoading(true);
      const res = await fetch("/api/accountant/investors");
      const data = await res.json();
      setPayouts(data.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(payoutId: string) {
    setProcessing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('investor_payouts')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (error) throw error;
      await fetchPayouts();
      setSelectedPayout(null);
    } catch (err) {
      alert("Verification failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDisburse() {
    if (!selectedPayout) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/payments/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId: selectedPayout.id }),
      });

      const data = await res.json();
      if (data.transfer_url) {
        window.location.href = data.transfer_url;
        return;
      }
      
      if (res.ok) {
        alert("Disbursement completed!");
        fetchPayouts();
        setSelectedPayout(null);
      } else {
        throw new Error(data.error || "Disbursement failed");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  }

  const filtered = payouts.filter(p => p.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <Greeting role="Accountant" userName="Admin" />
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
             <button 
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'draft' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
                PENDING VERIFICATION
             </button>
             <button 
                onClick={() => setFilter('verified')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'verified' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
                READY TO DISBURSE
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse">
                   <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
                   <div className="h-8 w-48 bg-slate-100 rounded mb-6" />
                   <div className="space-y-3">
                      <div className="h-10 w-full bg-slate-50 rounded-xl" />
                      <div className="h-10 w-full bg-slate-50 rounded-xl" />
                   </div>
                </div>
             ))
        ) : filtered.length === 0 ? (
             <div className="col-span-full py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-4 block opacity-20">payments</span>
                <p className="font-heading font-extrabold uppercase tracking-widest text-[10px]">No {filter} payouts found</p>
             </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all group">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <span className="material-symbols-outlined text-xl">person</span>
                 </div>
                 <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest ${filter === 'draft' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {filter === 'draft' ? 'Review Needed' : 'Verified'}
                 </span>
              </div>
              
              <h3 className="font-heading font-extrabold text-primary text-lg mb-1">{p.full_name}</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-6 flex items-center gap-1">
                 <span className="material-symbols-outlined text-[12px]">egg_alt</span> {p.flock_name}
              </p>

              <div className="space-y-2 mb-8">
                 <div className="flex justify-between text-xs p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Capital Return</span>
                    <span className="font-bold text-primary">₦{p.capital_returned.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-xs p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                    <span className="text-emerald-600">Net Profit Share</span>
                    <span className="font-bold text-emerald-700">+ ₦{p.profit_shared.toLocaleString()}</span>
                 </div>
                 {p.mortality_loss > 0 && (
                    <div className="flex justify-between text-[10px] px-3 font-bold text-rose-500 uppercase tracking-tighter italic">
                       <span>Biological Loss Impact</span>
                       <span>- ₦{p.mortality_loss.toLocaleString()}</span>
                    </div>
                 )}
              </div>

              <button 
                 onClick={() => setSelectedPayout(p)}
                 className={`w-full py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg transition-all ${filter === 'draft' ? 'bg-primary text-white hover:bg-emerald-900 shadow-primary/20' : 'bg-accent text-white hover:bg-indigo-700 shadow-accent/20'}`}
              >
                 {filter === 'draft' ? 'Verify Calculation' : 'Process Transfer'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl scale-in-center border border-white/20">
              <div className="p-8 pb-4 flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-heading font-extrabold text-primary">Financial Review</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Mudarabah Distribution</p>
                 </div>
                 <button onClick={() => setSelectedPayout(null)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300">close</span>
                 </button>
              </div>

              <div className="p-8 pt-0 space-y-6">
                 <div className="p-5 bg-slate-50 rounded-[30px] border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Investor Name</span>
                       <span className="font-bold text-primary">{selectedPayout.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Bank Selection</span>
                       <span className="font-bold text-primary">{selectedPayout.bank_name || 'NOT SET'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Account Number</span>
                       <span className="font-mono font-bold text-primary">{selectedPayout.account_number || 'NOT SET'}</span>
                    </div>
                 </div>

                 <div className="bg-primary rounded-[30px] p-6 text-white shadow-xl shadow-primary/20">
                    <p className="text-[10px] font-bold uppercase tracking-[4px] opacity-60 mb-2">Total Estimated Payout</p>
                    <h2 className="text-3xl font-heading font-extrabold tracking-tight">₦{selectedPayout.amount_to_disburse.toLocaleString()}</h2>
                    <div className="h-px bg-white/10 my-4" />
                    <p className="text-[10px] italic opacity-80 leading-relaxed font-medium">
                       Calculation includes capital return (adjusted for mortality) and {selectedPayout.profit_shared > 0 ? 'net profit share' : 'no profit due to cycle loss'}.
                    </p>
                 </div>

                 <button 
                    disabled={processing || (!selectedPayout.bank_name && filter === 'verified')}
                    onClick={() => filter === 'draft' ? handleVerify(selectedPayout.id) : handleDisburse()}
                    className="w-full py-4 rounded-[20px] bg-accent text-white font-bold text-xs uppercase tracking-[2px] shadow-lg shadow-accent/30 hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {processing ? (
                       <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                       <>
                          <span className="material-symbols-outlined text-[16px]">{filter === 'draft' ? 'verified_user' : 'rocket_launch'}</span>
                          {filter === 'draft' ? 'Authorize Calculation' : 'Submit Final Disburse'}
                       </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
