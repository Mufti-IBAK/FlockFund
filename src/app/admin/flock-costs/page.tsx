'use client';

import { useEffect, useState } from 'react';

interface FlockCost {
  id: string;
  flock_id: string;
  category: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  verified: boolean;
  verified_by: string | null;
  created_at: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  feed: 'restaurant',
  medication: 'medical_services',
  labor: 'engineering',
  transport: 'local_shipping',
  utilities: 'bolt',
  maintenance: 'build',
  tax: 'account_balance',
  other: 'more_horiz',
};

export default function AdminFlockCostsPage() {
  const [costs, setCosts] = useState<FlockCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchCosts();
  }, []);

  async function fetchCosts() {
    try {
      const res = await fetch('/api/flock-costs');
      const data = await res.json();
      if (data.data) setCosts(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function verifyCost(id: string) {
    setVerifying(id);
    try {
      const res = await fetch('/api/flock-costs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, verified: true }),
      });
      const data = await res.json();
      if (data.data) {
        setCosts(prev => prev.map(c => c.id === id ? { ...c, verified: true, ...data.data } : c));
      }
    } catch (err) {
      console.error(err);
    }
    setVerifying(null);
  }

  const totalCost = costs.reduce((acc, c) => acc + c.amount, 0);
  const verifiedCost = costs.filter(c => c.verified).reduce((acc, c) => acc + c.amount, 0);
  const unverifiedCost = totalCost - verifiedCost;

  // Group by category
  const byCategory = costs.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = { total: 0, count: 0, verified: 0 };
    acc[c.category].total += c.amount;
    acc[c.category].count += 1;
    if (c.verified) acc[c.category].verified += c.amount;
    return acc;
  }, {} as Record<string, { total: number; count: number; verified: number }>);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-6" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
          Flock Cost Tracking
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Mudarabah transparency — all costs must be itemized, verified, and deducted before profit is calculated.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-lg text-primary">receipt_long</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Costs</span>
          </div>
          <p className="font-mono text-2xl font-extrabold text-primary">₦{totalCost.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{costs.length} line items</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-lg text-emerald-600">verified</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verified</span>
          </div>
          <p className="font-mono text-2xl font-extrabold text-emerald-700">₦{verifiedCost.toLocaleString()}</p>
          <p className="text-xs text-emerald-500 mt-1">{costs.filter(c => c.verified).length} verified items</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-lg text-amber-600">pending</span>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Verification</span>
          </div>
          <p className="font-mono text-2xl font-extrabold text-amber-700">₦{unverifiedCost.toLocaleString()}</p>
          <p className="text-xs text-amber-500 mt-1">{costs.filter(c => !c.verified).length} unverified items</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm mb-6">
          <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">Cost Breakdown by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(byCategory).map(([cat, data]) => (
              <div key={cat} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-base text-slate-500">{CATEGORY_ICONS[cat] || 'category'}</span>
                  <span className="text-xs font-bold text-primary capitalize">{cat}</span>
                </div>
                <p className="font-mono text-sm font-bold text-primary">₦{data.total.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">{data.count} items • ₦{data.verified.toLocaleString()} verified</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Items */}
      {costs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">receipt_long</span>
          <h3 className="text-lg font-bold text-primary mb-2">No Costs Recorded</h3>
          <p className="text-sm text-slate-400">Cost entries will appear here as they are submitted by farm managers.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flock</th>
                  <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-center p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {costs.map(cost => (
                  <tr key={cost.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-slate-400">{CATEGORY_ICONS[cost.category] || 'category'}</span>
                        <span className="text-xs font-bold text-primary capitalize">{cost.category}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-600 max-w-[200px] truncate">{cost.description}</td>
                    <td className="p-3 text-xs text-slate-400 font-mono">{cost.flock_id.slice(0, 8)}</td>
                    <td className="p-3 text-right font-mono text-xs font-bold text-primary">₦{cost.amount.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      {cost.verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">check</span>
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {!cost.verified && (
                        <button
                          onClick={() => verifyCost(cost.id)}
                          disabled={verifying === cost.id}
                          className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {verifying === cost.id ? '...' : 'Verify'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
