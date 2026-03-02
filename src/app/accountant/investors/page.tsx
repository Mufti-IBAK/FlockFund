"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface InvestorProfile {
  id: string;
  full_name: string;
  email: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  total_invested?: number;
  total_birds?: number;
  active_investments?: any[];
}

export default function AccountantInvestorsPage() {
  const [investors, setInvestors] = useState<InvestorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] =
    useState<InvestorProfile | null>(null);
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    fetchInvestors();
  }, []);

  async function fetchInvestors() {
    try {
      setLoading(true);
      const supabase = createClient();

      // We need to fetch profiles WHERE role is investor.
      // Since an accountant might not have RLS permission to view all profiles,
      // we'll hit a dedicated server API route shortly if this fails, but
      // currently the RLS allows admins and often others depending on the exact policy.
      // For this implementation, we will use a server action or API route to securely fetch this
      // bypassing RLS since Accountants need full visibility.
      const res = await fetch("/api/accountant/investors");
      if (!res.ok) throw new Error("Failed to fetch investors");
      const data = await res.json();
      setInvestors(data.investors || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load investor data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisburse() {
    if (!selectedInvestor) return;

    if (!selectedInvestor.bank_name || !selectedInvestor.account_number) {
      alert("Investor is missing bank details.");
      return;
    }

    const confirmPayout = confirm(
      `Process disbursement for ${selectedInvestor.full_name}?`
    );
    if (!confirmPayout) return;

    setProcessingPayout(true);
    try {
      const res = await fetch("/api/payments/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId: selectedInvestor.id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Disbursement failed");
      }

      alert("Disbursement processed successfully.");
      setSelectedInvestor(null);
      fetchInvestors(); // Refresh list
    } catch (err: any) {
      console.error("Disbursement Error:", err);
      alert(err.message || "Failed to process disbursement.");
    } finally {
      setProcessingPayout(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Investors & Payouts
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review investor portfolios and process disbursements securely.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-12">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-primary">Investor Directory</h2>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search investors..."
              className="text-sm border-none focus:ring-0 outline-none w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">
            Loading investors...
          </div>
        ) : investors.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No investors found.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-6">Investor</th>
                    <th className="p-4">Bank Details</th>
                    <th className="p-4">Active Birds</th>
                    <th className="p-4">Total Invested</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        <p className="font-bold text-sm text-primary">
                          {inv.full_name || "Unnamed Investor"}
                        </p>
                        <p className="text-xs text-slate-400">{inv.email}</p>
                      </td>
                      <td className="p-4">
                        {inv.bank_name && inv.account_number ? (
                          <div>
                            <p className="text-xs font-medium text-slate-700">
                              {inv.bank_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {inv.account_number}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">
                            Missing Bank Info
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-accent text-sm">
                            egg_alt
                          </span>
                          <span className="font-bold text-sm text-slate-700">
                            {inv.total_birds || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono font-bold text-primary">
                        ₦{(inv.total_invested || 0).toLocaleString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => setSelectedInvestor(inv)}
                          disabled={!inv.bank_name}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                            ${
                              inv.bank_name
                                ? "bg-primary text-white hover:bg-emerald-900 shadow-lg shadow-primary/20"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                        >
                          Disburse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 md:hidden gap-4 p-4">
              {investors.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-primary">
                        {inv.full_name || "Unnamed Investor"}
                      </h3>
                      <p className="text-xs text-slate-400">{inv.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Active Birds
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-accent text-sm">
                          egg_alt
                        </span>
                        <span className="font-bold text-sm text-slate-700">
                          {inv.total_birds || 0}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Total Invested
                      </p>
                      <p className="text-sm font-mono font-bold text-primary">
                        ₦{(inv.total_invested || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Bank Details
                    </p>
                    {inv.bank_name && inv.account_number ? (
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          {inv.bank_name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {inv.account_number}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">
                        Missing Bank Info
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedInvestor(inv)}
                    disabled={!inv.bank_name}
                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                      ${
                        inv.bank_name
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                  >
                    Disburse
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Disbursement Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-primary">
                Process Payout
              </h3>
              <button
                onClick={() => setSelectedInvestor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Recipient
                </p>
                <p className="font-bold text-primary text-lg">
                  {selectedInvestor.full_name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Bank
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedInvestor.bank_name}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Account
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-700">
                    {selectedInvestor.account_number}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800">
                    Total Invested
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-900">
                    ₦{(selectedInvestor.total_invested || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">
                    Est. Profit (15%)
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-700">
                    +₦{((selectedInvestor.total_invested || 0) * 0.15).toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-emerald-200/50 my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-900">
                    Total Payout
                  </span>
                  <span className="text-lg font-mono font-bold text-emerald-600">
                    ₦{((selectedInvestor.total_invested || 0) * 1.15).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDisburse}
                disabled={processingPayout}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-wider relative overflow-hidden flex items-center justify-center disabled:opacity-70"
              >
                {processingPayout ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Confirm & Transfer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
