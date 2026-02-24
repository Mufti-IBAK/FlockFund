'use client';

import { useState, useEffect } from 'react';

export default function AccountantAssets() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    async function loadProcessed() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('fund_requests')
          .select('*, flocks(flock_name, name), profiles!fund_requests_requester_id_fkey(full_name)')
          .eq('status', 'processed')
          .order('updated_at', { ascending: false });
        
        setAssets(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProcessed();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Invoices & Receipts</h1>
        <p className="text-slate-400 text-sm mt-1">Audit trail for all processed farm expenditures</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-12 text-center animate-pulse text-slate-400">Loading archives...</div>
        ) : assets.length === 0 ? (
           <div className="col-span-full py-12 text-center text-slate-400">No records found.</div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-lg">description</span>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase">Processed</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{asset.category}</p>
              <p className="text-lg font-mono font-bold text-primary mb-3">₦{Number(asset.amount).toLocaleString()}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-slate-600 font-medium">{new Date(asset.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Flock:</span>
                  <span className="text-slate-600 font-medium">{asset.flocks?.flock_name || asset.flocks?.name}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="text-slate-600 font-medium">{asset.profiles?.full_name}</span>
                </div>
              </div>

              <button className="w-full py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                Upload Receipt
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
