'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AdminBlockchain() {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.from('settings').select('blockchain_enabled').single();
        if (data?.blockchain_enabled) setEnabled(true);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.bc-card'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out', delay: 0.1 });
      });
      return () => ctx.revert();
    }
  }, []);

  async function toggleBlockchain() {
    setSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('settings').update({ blockchain_enabled: !enabled }).eq('id', 1);
      if (!error) setEnabled(!enabled);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Blockchain Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure hash-only proof-of-existence storage for investments and payouts</p>
      </div>

      {/* Toggle Card */}
      <div className="bc-card bg-gradient-to-br from-primary via-[#1a4035] to-primary rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-2">Blockchain Integration</p>
            <p className="font-heading text-3xl font-bold text-white tracking-tight">{enabled ? 'Active' : 'Disabled'}</p>
            <p className="text-white/30 text-sm mt-1">Hash-only storage (no smart contracts)</p>
          </div>
          <button onClick={toggleBlockchain} disabled={saving}
            className={`w-16 h-9 rounded-full relative transition-all duration-300 ${enabled ? 'bg-emerald-400' : 'bg-white/20'}`}>
            <div className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-md transition-all duration-300 ${enabled ? 'left-8' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bc-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-violet-600 text-lg">fingerprint</span>
            </div>
            <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">How It Works</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-500">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-accent mt-0.5">check</span>
              When an investment is created, a SHA-256 hash of the transaction details is stored
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-accent mt-0.5">check</span>
              When a payout is processed, the payout hash is recorded for proof-of-existence
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-accent mt-0.5">check</span>
              Investors can view their transaction hashes for transparency verification
            </li>
          </ul>
        </div>

        <div className="bc-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
            </div>
            <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">Important Notes</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-500">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-amber-500 mt-0.5">info</span>
              This is a hash-only proof-of-existence system, not a full smart contract integration
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-amber-500 mt-0.5">info</span>
              No funds are moved on-chain — blockchain serves as an audit trail only
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-amber-500 mt-0.5">info</span>
              Full smart contract automation is planned for a future phase
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
