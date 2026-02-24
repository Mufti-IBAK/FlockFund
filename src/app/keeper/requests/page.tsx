'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FundRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('fund_requests')
          .select('*, flocks(flock_name, name)')
          .eq('requester_id', user.id)
          .order('created_at', { ascending: false });
        
        setRequests(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Fund Requests</h1>
          <p className="text-slate-400 text-sm mt-1">Request funds for flock operations (feed, drugs, etc.)</p>
        </div>
        <button 
          onClick={() => router.push('/keeper/requests/new')}
          className="px-5 py-2.5 bg-accent text-primary rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
        >
          + New Request
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">payments</span>
            <p className="text-slate-400 text-sm">No fund requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flock</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">{req.flocks?.flock_name || req.flocks?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        {req.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      ₦{Number(req.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'processed' ? 'bg-sky-100 text-sky-700' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
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
