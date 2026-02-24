'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface Referral {
  id: string;
  referee_id: string;
  status: string;
  bonus_amount: number;
  bonus_paid: boolean;
  created_at: string;
  referee?: { full_name: string };
}

export default function InvestorReferrals() {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get referral code from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single();

        if (profile?.referral_code) {
          setReferralCode(profile.referral_code);
        } else {
          // Generate one if missing
          const code = user.id.slice(0, 8).toUpperCase();
          setReferralCode(code);
          await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id);
        }

        // Load referrals
        try {
          const { data } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', user.id)
            .order('created_at', { ascending: false });
          setReferrals((data || []) as Referral[]);
        } catch { /* referrals table may not exist */ }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.fade-in'),
          { y: 25, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out' });
      });
      return () => ctx.revert();
    }
  }, [loading]);

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const converted = referrals.filter((r) => r.status === 'invested').length;
  const signedUp = referrals.filter((r) => r.status === 'signed_up').length;
  const pending = referrals.filter((r) => r.status === 'pending').length;
  const totalBonus = referrals.filter((r) => r.bonus_paid).reduce((s, r) => s + (r.bonus_amount || 0), 0);

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-500',
    signed_up: 'bg-amber-100 text-amber-700',
    invested: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div ref={contentRef}>
      <div className="mb-6 md:mb-8 fade-in">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">Referral Program</h1>
        <p className="text-slate-400 text-sm mt-1">Invite friends to invest and earn bonuses</p>
      </div>

      {/* Referral Code Card */}
      <div className="fade-in bg-gradient-to-br from-primary to-primary/90 rounded-xl p-5 md:p-6 text-white mb-6 shadow-xl">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Your Referral Code</p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl md:text-3xl font-mono font-extrabold tracking-wider">{referralCode || '...'}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2.5">
          <input
            readOnly
            value={referralLink}
            className="flex-1 bg-transparent text-white/80 text-xs font-mono outline-none min-w-0"
          />
          <button onClick={copyLink}
            className="px-3 py-1.5 bg-accent text-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-accent/80 transition-all flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
        {[
          { label: 'Total Referrals', value: referrals.length, icon: 'group', color: 'bg-sky-500/10 text-sky-600' },
          { label: 'Signed Up', value: signedUp, icon: 'person_add', color: 'bg-amber-500/10 text-amber-600' },
          { label: 'Converted', value: converted, icon: 'check_circle', color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Bonus Earned', value: `₦${totalBonus.toLocaleString()}`, icon: 'monetization_on', color: 'bg-accent/10 text-accent' },
        ].map((stat) => (
          <div key={stat.label} className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${stat.color.split(' ')[0]} flex items-center justify-center mb-2`}>
              <span className={`material-symbols-outlined text-base ${stat.color.split(' ')[1]}`}>{stat.icon}</span>
            </div>
            <p className="text-lg font-mono font-extrabold text-primary">{stat.value}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referral History */}
      <div className="fade-in bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">Referral History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">share</span>
            <p className="text-sm text-slate-400 mb-2">No referrals yet</p>
            <p className="text-[10px] text-slate-300">Share your code with friends to start earning!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {referrals.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-primary">{r.referee?.full_name || 'Referred User'}</p>
                  <p className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {r.bonus_paid && <span className="text-xs font-mono font-bold text-emerald-600">+₦{r.bonus_amount?.toLocaleString()}</span>}
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-500'}`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
