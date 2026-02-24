'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface MarketUpdate {
  id: string;
  floor_price: number;
  market_cost: number;
  note: string;
  created_at: string;
}

export default function InvestorMarket() {
  const [updates, setUpdates] = useState<MarketUpdate[]>([]);
  const [settings, setSettings] = useState({ market_floor_price: 0, market_cost: 0, selling_price_per_bird: 0 });
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const [mkt, sets] = await Promise.all([
          supabase.from('market_updates').select('*').order('created_at', { ascending: false }).limit(20),
          supabase.from('settings').select('market_floor_price, market_cost, selling_price_per_bird').single(),
        ]);
        setUpdates(mkt.data || []);
        if (sets.data) setSettings(sets.data as typeof settings);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.market-card'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, []);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Market Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Current market prices and historical updates</p>
      </div>

      {/* Current Prices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Selling Price', value: `₦${settings.selling_price_per_bird.toLocaleString()}`, icon: 'trending_up', color: 'from-emerald-500/20 to-teal-500/20' },
          { label: 'Market Cost', value: `₦${settings.market_cost.toLocaleString()}`, icon: 'storefront', color: 'from-accent/20 to-amber-500/20' },
          { label: 'Floor Price', value: `₦${settings.market_floor_price.toLocaleString()}`, icon: 'shield', color: 'from-sky-500/20 to-indigo-500/20' },
        ].map((kpi) => (
          <div key={kpi.label} className={`market-card bg-gradient-to-br ${kpi.color} rounded-2xl p-5 border border-white/40`}>
            <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-outlined text-primary text-xl">{kpi.icon}</span>
            </div>
            <p className="font-mono text-2xl font-bold text-primary tracking-tighter">{kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Update History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">Price History</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">timeline</span>
            <p className="text-sm text-slate-400">No market updates yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {updates.map((u) => (
              <div key={u.id} className="market-card flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sky-600 text-lg">timeline</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary">
                    Floor: ₦{(u.floor_price || 0).toLocaleString()} → Market: ₦{(u.market_cost || 0).toLocaleString()}
                  </p>
                  {u.note && <p className="text-xs text-slate-400">{u.note}</p>}
                </div>
                <span className="text-[10px] text-slate-300 font-mono">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
