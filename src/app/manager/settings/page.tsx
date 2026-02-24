'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface Profile {
  full_name: string;
  phone: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

export default function ManagerSettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    full_name: '', phone: '', bank_name: '', account_number: '', account_name: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase.from('profiles').select('full_name, phone, bank_name, account_number, account_name').eq('id', user.id).single();
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            phone: data.phone || '',
            bank_name: data.bank_name || '',
            account_number: data.account_number || '',
            account_name: data.account_name || '',
          });
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

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        phone: profile.phone,
        bank_name: profile.bank_name,
        account_number: profile.account_number,
        account_name: profile.account_name,
      }).eq('id', user.id);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const nigerianBanks = [
    'Access Bank', 'Citibank', 'Ecobank', 'Fidelity Bank', 'First Bank', 'First City Monument Bank (FCMB)',
    'Globus Bank', 'Guaranty Trust Bank (GTBank)', 'Heritage Bank', 'Jaiz Bank', 'Keystone Bank',
    'Kuda Bank', 'Opay', 'Palmpay', 'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank',
    'Standard Chartered Bank', 'Sterling Bank', 'SunTrust Bank', 'Titan Trust Bank',
    'Union Bank', 'United Bank for Africa (UBA)', 'Unity Bank', 'Wema Bank', 'Zenith Bank',
  ];

  return (
    <div ref={pageRef}>
      <div className="mb-6 fade-in">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Update your professional profile and bank details for disbursements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Personal Info */}
        <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-accent">person</span>
            Professional Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none bg-slate-50/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
              <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+234..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none bg-slate-50/50" />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-accent">account_balance</span>
            Payment Disbursement Details
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider ml-auto tracking-tighter">Required for Fund Payouts</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Bank Name</label>
              <select value={profile.bank_name} onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none bg-slate-50/50">
                <option value="">Select your bank</option>
                {nigerianBanks.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Account Number</label>
              <input type="text" value={profile.account_number} onChange={(e) => setProfile({ ...profile, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit account number"
                maxLength={10}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-primary font-mono focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none bg-slate-50/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Account Name</label>
              <input type="text" value={profile.account_name} onChange={(e) => setProfile({ ...profile, account_name: e.target.value })}
                placeholder="Name on your bank account"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none bg-slate-50/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 fade-in flex items-center gap-4">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-3 bg-accent text-primary rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center gap-2">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">save</span>
              Save Changes
            </>
          )}
        </button>
        {saved && (
          <span className="text-emerald-600 text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Saved successfully!
          </span>
        )}
      </div>

      {/* Warning if no bank details */}
      {(!profile.bank_name || !profile.account_number || !profile.account_name) && (
        <div className="mt-4 fade-in bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-lg flex-shrink-0">warning</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Bank details missing</p>
            <p className="text-xs text-amber-600 mt-0.5">Ensure your bank details are accurate to receive operational fund disbursements.</p>
          </div>
        </div>
      )}
    </div>
  );
}
