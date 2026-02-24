'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';

interface Investment {
  id: string;
  birds_owned: number;
  amount_invested: number;
  status: string;
  round_count: number;
  flock_id: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_reference?: string;
}

interface BankInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export default function WithdrawPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<string>('');
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [invResult, wdResult, profileResult] = await Promise.all([
          supabase.from('investments').select('*').eq('investor_id', user.id).eq('status', 'active'),
          supabase.from('withdrawals').select('*').eq('investor_id', user.id).order('created_at', { ascending: false }),
          supabase.from('profiles').select('bank_name, account_number, account_name').eq('id', user.id).single(),
        ]);

        setInvestments(invResult.data || []);
        setWithdrawals((wdResult.data || []) as unknown as Withdrawal[]);

        const p = profileResult.data;
        if (p && p.bank_name && p.account_number && p.account_name) {
          setBankInfo({ bank_name: p.bank_name, account_number: p.account_number, account_name: p.account_name });
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(pageRef.current!.querySelectorAll('.fade-in'),
        { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, [loading]);

  const eligibleInvestments = investments.filter((i) => i.round_count >= 2);
  const lockedInvestments = investments.filter((i) => i.round_count < 2);

  async function handleWithdrawRequest() {
    if (!selectedInvestment || !bankInfo) return;
    setRequesting(true);
    try {
      const inv = investments.find((i) => i.id === selectedInvestment);
      if (!inv) return;

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create withdrawal record
      const { data: wd, error } = await supabase.from('withdrawals').insert({
        investor_id: user.id,
        investment_id: inv.id,
        amount: inv.amount_invested,
        status: 'pending',
      }).select().single();

      if (error) throw error;

      // Trigger payout via API
      const payoutRes = await fetch('/api/payments/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_id: user.id,
          amount: inv.amount_invested,
          withdrawal_id: wd.id,
        }),
      });

      const payoutData = await payoutRes.json();

      if (payoutData.success) {
        setWithdrawals((prev) => [{ ...wd, status: 'processing', payment_reference: payoutData.reference }, ...prev]);
        setSelectedInvestment('');
        alert(`Withdrawal initiated! Reference: ${payoutData.reference}. Funds will arrive within 24 hours.`);
      } else {
        alert(`Withdrawal request saved but transfer failed: ${payoutData.error}. Our team will process it manually.`);
        setWithdrawals((prev) => [wd, ...prev]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process withdrawal.');
    }
    setRequesting(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-6" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      <div className="mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">Withdraw Funds</h1>
        <p className="text-slate-400 text-sm mt-1">Request withdrawal for eligible investments</p>
      </div>

      {/* Bank Details Status */}
      {!bankInfo ? (
        <div className="fade-in bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-500 text-xl flex-shrink-0">error</span>
            <div>
              <p className="text-sm font-bold text-rose-800">Bank details required</p>
              <p className="text-xs text-rose-600 mt-1">You must add your bank account details before requesting a withdrawal.</p>
              <Link href="/investor/settings"
                className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors">
                <span className="material-symbols-outlined text-sm">settings</span>
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="fade-in bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
              <div>
                <p className="text-sm font-bold text-emerald-800">Bank account verified</p>
                <p className="text-xs text-emerald-600">{bankInfo.bank_name} • ****{bankInfo.account_number.slice(-4)} • {bankInfo.account_name}</p>
              </div>
            </div>
            <Link href="/investor/settings" className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 uppercase tracking-wider">Edit</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Eligible Investments */}
        <div className="fade-in">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5">
            <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
              Eligible ({eligibleInvestments.length})
            </h3>
            {eligibleInvestments.length === 0 ? (
              <p className="text-slate-400 text-sm">No investments are eligible for withdrawal yet. Complete at least 2 reinvestment rounds.</p>
            ) : (
              <div className="space-y-2">
                {eligibleInvestments.map((inv) => (
                  <button key={inv.id} onClick={() => setSelectedInvestment(inv.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedInvestment === inv.id ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-primary">{inv.birds_owned} birds</p>
                        <p className="text-[10px] text-slate-400">Round {inv.round_count} • ID: {inv.id.slice(0, 8)}</p>
                      </div>
                      <span className="font-mono font-bold text-accent text-sm">₦{inv.amount_invested.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {eligibleInvestments.length > 0 && bankInfo && (
              <button onClick={handleWithdrawRequest} disabled={requesting || !selectedInvestment}
                className="w-full mt-4 py-3 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {requesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                    Request Withdrawal
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Locked Investments */}
        <div className="fade-in">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5">
            <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-base">lock</span>
              Locked ({lockedInvestments.length})
            </h3>
            {lockedInvestments.length === 0 ? (
              <p className="text-slate-400 text-sm">No locked investments.</p>
            ) : (
              <div className="space-y-2">
                {lockedInvestments.map((inv) => (
                  <div key={inv.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-primary">{inv.birds_owned} birds</p>
                        <p className="text-[10px] text-slate-400">Round {inv.round_count}/2 required</p>
                      </div>
                      <span className="font-mono text-sm text-slate-400">₦{inv.amount_invested.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(inv.round_count / 2) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="mt-6 fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5">
          <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">Withdrawal History</h3>
          <div className="space-y-2">
            {withdrawals.map((wd) => (
              <div key={wd.id} className="flex items-center justify-between py-3 px-3 rounded-lg border border-slate-100 bg-slate-50/30">
                <div>
                  <p className="text-sm font-bold text-primary">₦{wd.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">{new Date(wd.created_at).toLocaleDateString()}{wd.payment_reference ? ` • Ref: ${wd.payment_reference}` : ''}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  wd.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  wd.status === 'processing' ? 'bg-sky-100 text-sky-700' :
                  wd.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{wd.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
