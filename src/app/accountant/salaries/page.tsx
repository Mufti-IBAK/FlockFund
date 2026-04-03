"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  bank_name: string;
  account_number: string;
  salary_amount: number;
}

export default function AccountantSalaries() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fade-in",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, [loading]);

  async function loadStaff() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, bank_name, account_number, salary_amount")
        .neq("role", "investor")
        .order("role", { ascending: true });

      setStaff(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaySalary(member: StaffProfile) {
    if (!member.salary_amount || member.salary_amount === 0) {
      alert("Please set a salary amount for this staff member first.");
      return;
    }

    if (!member.bank_name || !member.account_number) {
      alert("Staff member has not set their bank details.");
      return;
    }

    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });
    const currentYear = new Date().getFullYear();

    if (
      !confirm(
        `Confirm salary payment of ₦${member.salary_amount.toLocaleString()} to ${member.full_name} for ${currentMonth} ${currentYear}?`,
      )
    )
      return;

    setPayingId(member.id);
    try {
      const res = await fetch("/api/payments/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "salary",
          staff_id: member.id,
          amount: member.salary_amount,
          month: currentMonth,
          year: currentYear,
        }),
      });

      const data = await res.json();
      if (data.transfer_url) {
        window.location.href = data.transfer_url;
      } else if (data.success) {
        alert(`Salary processed for ${member.full_name}`);
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Payment failed");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div ref={pageRef} className="max-w-6xl mx-auto">
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Staff Payroll Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review and disburse monthly salaries to farm staff and administrators.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden fade-in">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : staff.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-slate-400 text-sm">No staff members found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Bank Details</th>
                    <th className="px-6 py-4">Monthly Salary</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {staff.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-primary">
                            {s.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {s.email || "No email"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-lg">
                          {s.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {s.bank_name ? (
                          <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-primary uppercase">
                              {s.bank_name}
                            </p>
                            <p className="text-[10px] font-mono text-emerald-600 font-bold">
                              {s.account_number}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[9px] text-rose-500 font-bold uppercase p-1.5 bg-rose-50 rounded-lg">
                            Missing Details
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 font-mono font-bold text-primary text-sm">
                        ₦{(s.salary_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handlePaySalary(s)}
                          disabled={payingId === s.id || !s.bank_name}
                          className="px-4 py-2.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 ml-auto"
                        >
                          {payingId === s.id ? (
                            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-xs">
                              payments
                            </span>
                          )}
                          {payingId === s.id
                            ? "Processing..."
                            : "Disburse"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Enhanced Responsiveness */}
            <div className="grid grid-cols-1 md:hidden gap-5 p-5">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col gap-5 relative group transition-all hover:shadow-xl hover:border-slate-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-primary tracking-tight">
                        {s.full_name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium lowercase">
                        {s.email || "No email"}
                      </p>
                      <div className="pt-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {s.role.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Monthly
                      </p>
                      <p className="font-mono font-bold text-primary text-base">
                        ₦{(s.salary_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Bank / Institution
                      </p>
                      <p className="text-[11px] font-bold text-primary uppercase line-clamp-1">
                        {s.bank_name || "---"}
                      </p>
                    </div>
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Account No.
                      </p>
                      <p className="text-[11px] font-mono text-emerald-600 font-bold">
                        {s.account_number || "---"}
                      </p>
                    </div>
                  </div>

                  {!s.bank_name && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-xl border border-rose-100">
                      <span className="material-symbols-outlined text-rose-500 text-sm">warning</span>
                      <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">Missing Bank Details</p>
                    </div>
                  )}

                  <button
                    onClick={() => handlePaySalary(s)}
                    disabled={payingId === s.id || !s.bank_name}
                    className="w-full py-4 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group-active:scale-[0.97]"
                  >
                    {payingId === s.id ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-base">
                        payments
                      </span>
                    )}
                    {payingId === s.id ? "Processing Payment..." : "Disburse Monthly Salary"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
