"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function AccountantDisbursements() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadApprovedRequests();
  }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".fade-in", 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" }
      );
    });
    return () => ctx.revert();
  }, [loading]);

  async function loadApprovedRequests() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from("fund_requests")
        .select(
          "*, flocks(flock_name, name), profiles!fund_requests_requester_id_fkey(full_name, role, bank_name, account_number, account_name)",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualProcess(id: string) {
    if (!confirm("Are you sure you have disbursed these funds MANUALLY?")) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("fund_requests")
        .update({
          status: "processed",
          accountant_processed: true,
          processed_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      loadApprovedRequests();
    } catch (err) {
      console.error(err);
      alert("Processing failed");
    }
  }

  async function handleAutomatedPay(req: any) {
    const profile = req.profiles;
    if (!profile?.bank_name || !profile?.account_number) {
      alert("Recipient has not set their bank details. Please ask them to update their Settings.");
      return;
    }

    const confirmMsg = `PAYMENT VERIFICATION:
-----------------------------
Recipient: ${profile.full_name}
Bank: ${profile.bank_name}
Acc No: ${profile.account_number}
Acc Name: ${profile.account_name}
Amount: ₦${Number(req.amount).toLocaleString()}

Proceed with real-time transfer?`;

    if (!confirm(confirmMsg)) return;

    setPayingId(req.id);
    try {
      const res = await fetch('/api/payments/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: req.id,
          amount: req.amount,
          user_id: req.requester_id,
          category: req.category
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Disbursement successful! The recipient has been notified.");
        loadApprovedRequests();
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Automated payment failed. Try manual processing.");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div ref={pageRef}>
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Financial Disbursements
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Securely process approved fund requests for staff and operations.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden fade-in">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-14 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">payments</span>
            <p className="text-slate-400 text-sm">No pending disbursements at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Req. Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recipient / Bank
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Purpose / Flock
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="px-6 py-4 text-[11px] text-slate-400 font-mono">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">
                        {req.profiles?.full_name}
                      </p>
                      {req.profiles?.bank_name ? (
                        <p className="text-[10px] font-mono text-emerald-600 font-bold uppercase">
                          {req.profiles.bank_name} • {req.profiles.account_number}
                        </p>
                      ) : (
                        <p className="text-[10px] text-rose-500 font-bold uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          No Bank Details
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-500">
                        {req.category.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-slate-400 italic">
                        Flock: {req.flocks?.flock_name || req.flocks?.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-primary text-sm">
                      ₦{Number(req.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleManualProcess(req.id)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-400 text-[9px] font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 transition-all"
                        >
                          Manual
                        </button>
                        <button
                          onClick={() => handleAutomatedPay(req)}
                          disabled={payingId === req.id || !req.profiles?.bank_name}
                          className="px-4 py-1.5 bg-accent text-primary text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-1.5"
                        >
                          {payingId === req.id ? (
                            <div className="w-2.5 h-2.5 border border-primary/20 border-t-primary rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-xs">bolt</span>
                          )}
                          {payingId === req.id ? "Paying..." : "Pay via Flutterwave"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 fade-in">
        <span className="material-symbols-outlined text-primary">security</span>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          Automated disbursements are processed via encrypted channels and require verified bank details from the recipient. 
          Manual processing should only be used as a fallback if the automated system fails or for bank-to-bank cash transfers.
        </p>
      </div>
    </div>
  );
}
