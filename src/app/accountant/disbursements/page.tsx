'use client';

import { useState, useEffect } from 'react';

export default function AccountantDisbursements() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    loadApprovedRequests();
  }, []);

  async function loadApprovedRequests() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('fund_requests')
        .select('*, flocks(flock_name, name), profiles(full_name, role)')
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess(id: string) {
    if (!confirm('Are you sure you have disbursed these funds?')) return;

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('fund_requests')
        .update({
          status: 'processed',
          accountant_processed: true,
          processed_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadApprovedRequests();
    } catch (err) {
      console.error(err);
      alert('Processing failed');
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Disbursements</h1>
        <p className="text-slate-400 text-sm mt-1">Process approved fund requests and record payments</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No approved requests waiting for disbursement.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flock</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 text-[11px] text-slate-400 font-mono">
                      {new Date(req.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">{req.profiles?.full_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {req.flocks?.flock_name || req.flocks?.name}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-500">{req.category.toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400 max-w-xs truncate">{req.description}</p>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600 text-sm">
                      ₦{Number(req.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleProcess(req.id)}
                        className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
                      >
                        Mark Disbursed
                      </button>
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
