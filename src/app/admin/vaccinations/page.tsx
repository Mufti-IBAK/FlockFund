"use client";

import { useState, useEffect } from "react";

export default function AdminVaccinationsPage() {
  const [loading, setLoading] = useState(true);
  const [vaccinations, setVaccinations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("vaccinations")
        .select("*, flocks(flock_name, name)")
        .order("scheduled_date", { ascending: true });
      
      setVaccinations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Vaccination Monitoring
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Read-only overview of the vaccine schedules managed by the Farm Manager.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-slate-400 font-bold">
            Loading schedules...
          </div>
        ) : vaccinations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
            No vaccinations tracked yet.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Schedule Details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target Flock
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Requested Funds
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Outcome & Advice
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vaccinations.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="px-6 py-4 text-sm">
                        <p className="font-bold text-slate-700">{v.vaccine_name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                          {new Date(v.scheduled_date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        {v.flocks?.flock_name || v.flocks?.name || "Unknown Flock"}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-bold text-slate-600">
                        {v.amount_requested ? `₦${Number(v.amount_requested).toLocaleString()}` : 'None'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                        {v.outcome ? (
                          <>
                            <p><strong className="text-primary text-[10px] uppercase tracking-wider">Outcome:</strong> {v.outcome}</p>
                            <p className="mt-1"><strong className="text-primary text-[10px] uppercase tracking-wider">Advice:</strong> {v.advice_to_keeper}</p>
                          </>
                        ) : (
                          <span className="italic text-slate-300">Pending Execution</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {v.administered_date ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ml-auto">
                            <span className="material-symbols-outlined text-[10px]">
                              check
                            </span>
                            Done {new Date(v.administered_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-wider w-fit ml-auto block">
                            Upcoming
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 lg:hidden gap-4 p-4">
              {vaccinations.map((v) => (
                <div
                  key={v.id}
                  className="bg-white rounded-md p-5 border border-slate-100 shadow-sm flex flex-col gap-3 relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {new Date(v.scheduled_date).toLocaleDateString()}
                      </p>
                      <h3 className="font-bold text-primary text-sm">
                        {v.flocks?.flock_name || v.flocks?.name}
                      </h3>
                    </div>
                    <div>
                      {v.administered_date ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-600 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[9px]">check</span> Done
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-600 text-[9px] font-bold uppercase tracking-wider block">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-md p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Vaccine
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {v.vaccine_name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 font-bold mt-1 uppercase">
                      Budget: {v.amount_requested ? `₦${Number(v.amount_requested).toLocaleString()}` : "N/A"}
                    </p>
                  </div>
                  
                  {v.outcome && (
                    <div className="bg-emerald-50 rounded-md p-3">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                        Reported Outcome
                      </p>
                      <p className="text-xs font-medium text-emerald-900 mb-2">
                        {v.outcome}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                        Keeper Advice
                      </p>
                      <p className="text-xs font-medium text-emerald-900">
                        {v.advice_to_keeper}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
