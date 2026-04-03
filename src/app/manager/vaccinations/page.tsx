"use client";

import { useState, useEffect } from "react";

export default function ManagerVaccinationsPage() {
  const [loading, setLoading] = useState(true);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState<string | null>(null);

  // Add Form Mode
  const [newVac, setNewVac] = useState({
    flock_id: "",
    vaccine_name: "",
    scheduled_date: "",
    amount_requested: "",
    notes: "",
  });

  // Done Form Mode
  const [doneForm, setDoneForm] = useState({
    outcome: "",
    advice_to_keeper: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const [vResult, fResult] = await Promise.all([
        supabase
          .from("vaccinations")
          .select("*, flocks(flock_name, name)")
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("flocks")
          .select("id, flock_name, name")
          .eq("status", "active"),
      ]);
      setVaccinations(vResult.data || []);
      setFlocks(fResult.data || []);
      if (fResult.data && fResult.data.length > 0)
        setNewVac((v) => ({ ...v, flock_id: fResult.data[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const payload: any = { ...newVac };
      if (!payload.amount_requested) {
        delete payload.amount_requested;
      }
      
      await supabase.from("vaccinations").insert(payload);
      setShowAdd(false);
      resetAddForm();
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  function resetAddForm() {
    setNewVac({
      flock_id: flocks[0]?.id || "",
      vaccine_name: "",
      scheduled_date: "",
      amount_requested: "",
      notes: ""
    });
  }

  async function handleSubmitMarkDone(e: React.FormEvent) {
    e.preventDefault();
    if (!showDoneModal) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("vaccinations")
        .update({ 
          administered_date: new Date().toISOString().split("T")[0],
          outcome: doneForm.outcome,
          advice_to_keeper: doneForm.advice_to_keeper
        })
        .eq("id", showDoneModal);
        
      setShowDoneModal(null);
      setDoneForm({ outcome: "", advice_to_keeper: "" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Veterinary Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage flock health, schedule vaccines, and record outcomes.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2.5 bg-primary text-white rounded-md font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          + Request Vaccine
        </button>
      </div>

      {showAdd && (
        <div className="mb-8 bg-white rounded-md border border-slate-200 p-6 shadow-sm max-w-xl animate-in slide-in-from-top-4">
          <h3 className="font-bold text-primary mb-4">
            Schedule New Vaccination
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Target Flock
                </label>
                <select
                  value={newVac.flock_id}
                  onChange={(e) =>
                    setNewVac({ ...newVac, flock_id: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm font-bold"
                >
                  {flocks.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flock_name || f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Execution Date
                </label>
                <input
                  type="date"
                  value={newVac.scheduled_date}
                  onChange={(e) =>
                    setNewVac({ ...newVac, scheduled_date: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm font-bold text-primary"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Vaccine / Medicine Details
              </label>
              <input
                type="text"
                placeholder="e.g. Gumboro (IBD)"
                value={newVac.vaccine_name}
                onChange={(e) =>
                  setNewVac({ ...newVac, vaccine_name: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm font-bold text-primary"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Funds Requested (₦)
              </label>
              <input
                type="number"
                placeholder="Optional budget request..."
                value={newVac.amount_requested}
                onChange={(e) =>
                  setNewVac({ ...newVac, amount_requested: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm font-bold text-primary font-mono"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowAdd(false); resetAddForm(); }}
                className="flex-1 py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-primary text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-md shadow-primary/10"
              >
                Schedule Let's Go
              </button>
            </div>
          </form>
        </div>
      )}

      {showDoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-md shadow-2xl p-6 w-full max-w-md animate-in slide-in-from-bottom-5">
            <h3 className="font-heading font-extrabold text-xl text-primary mb-1">Verify Administration</h3>
            <p className="text-xs text-slate-400 mb-6">Complete your post-action report below.</p>
            
            <form onSubmit={handleSubmitMarkDone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Outcome of Procedure
                </label>
                <textarea
                  required
                  placeholder="E.g. Successfully administered via water line. Birds responded well."
                  rows={2}
                  value={doneForm.outcome}
                  onChange={(e) => setDoneForm({ ...doneForm, outcome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-medium text-primary resize-none placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Advice / Instructions for Keepers
                </label>
                <textarea
                  required
                  placeholder="E.g. Monitor water intake closely. Report any lethargy immediately."
                  rows={3}
                  value={doneForm.advice_to_keeper}
                  onChange={(e) => setDoneForm({ ...doneForm, advice_to_keeper: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-medium text-emerald-800 resize-none placeholder:text-emerald-200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowDoneModal(null); setDoneForm({ outcome: "", advice_to_keeper: ""}); }}
                  className="flex-1 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-emerald-600 transition-all"
                >
                  Save & Mark Done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-slate-400 font-bold">
            Loading schedule...
          </div>
        ) : vaccinations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold border border-slate-100 rounded-md bg-white">
            No vaccinations scheduled yet.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Scheduled
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target Flock
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Vaccine details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Status / Request
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vaccinations.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">
                        {new Date(v.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        {v.flocks?.flock_name || v.flocks?.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        {v.vaccine_name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {v.amount_requested && (
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                              Req: ₦{Number(v.amount_requested).toLocaleString()}
                            </span>
                          )}
                          {v.administered_date ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-[10px]">
                                check
                              </span>
                              Done {new Date(v.administered_date).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-wider w-fit block">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!v.administered_date && (
                          <button
                            onClick={() => setShowDoneModal(v.id)}
                            className="px-4 py-2 opacity-0 group-hover:opacity-100 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-md shadow-emerald-500/20 hover:scale-[1.05] transition-all"
                          >
                            Mark Done
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 md:hidden gap-4 p-4">
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
                          <span className="material-symbols-outlined text-[9px]">
                            check
                          </span>
                          Done
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
                    {v.administered_date && (
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                        Administered:{" "}
                        {new Date(v.administered_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {!v.administered_date && (
                    <button
                      onClick={() => setShowDoneModal(v.id)}
                      className="w-full mt-2 py-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-emerald-600 transition-all font-bold shadow-md shadow-emerald-500/20"
                    >
                      Process & Mark Done
                    </button>
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
