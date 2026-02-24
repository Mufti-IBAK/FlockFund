'use client';

import { useState, useEffect } from 'react';

export default function VaccinationsPage() {
  const [loading, setLoading] = useState(true);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newVac, setNewVac] = useState({ flock_id: '', vaccine_name: '', scheduled_date: '', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const [vResult, fResult] = await Promise.all([
        supabase.from('vaccinations').select('*, flocks(flock_name, name)').order('scheduled_date', { ascending: true }),
        supabase.from('flocks').select('id, flock_name, name').eq('status', 'active')
      ]);
      setVaccinations(vResult.data || []);
      setFlocks(fResult.data || []);
      if (fResult.data && fResult.data.length > 0) setNewVac(v => ({ ...v, flock_id: fResult.data[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.from('vaccinations').insert(newVac);
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdministered(id: string) {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.from('vaccinations').update({ administered_date: new Date().toISOString().split('T')[0] }).eq('id', id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Vaccination Schedule</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track vaccinations across all active flocks</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          + Schedule Vaccine
        </button>
      </div>

      {showAdd && (
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-xl">
           <h3 className="font-bold text-primary mb-4">Schedule New Vaccination</h3>
           <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Flock</label>
                    <select value={newVac.flock_id} onChange={e => setNewVac({...newVac, flock_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold">
                       {flocks.map(f => <option key={f.id} value={f.id}>{f.flock_name || f.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                    <input type="date" value={newVac.scheduled_date} onChange={e => setNewVac({...newVac, scheduled_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm" required />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Vaccine Name</label>
                 <input type="text" placeholder="e.g. Gumboro (IBD)" value={newVac.vaccine_name} onChange={e => setNewVac({...newVac, vaccine_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold" required />
              </div>
              <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 text-slate-400 font-bold text-xs uppercase">Cancel</button>
                 <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold text-xs uppercase shadow-md shadow-primary/10">Schedule</button>
              </div>
           </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-slate-400">Loading schedule...</div>
        ) : vaccinations.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No vaccinations scheduled yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flock</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vaccine</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vaccinations.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {new Date(v.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      {v.flocks?.flock_name || v.flocks?.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {v.vaccine_name}
                    </td>
                    <td className="px-6 py-4">
                      {v.administered_date ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-[10px]">check</span>
                          Administered {new Date(v.administered_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-wider w-fit block">
                           Upcoming
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!v.administered_date && (
                        <button 
                          onClick={() => handleAdministered(v.id)}
                          className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:scale-[1.05] transition-all"
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
        )}
      </div>
    </div>
  );
}
