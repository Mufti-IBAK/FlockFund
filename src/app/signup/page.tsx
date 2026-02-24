'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

const ROLES = [
  { value: 'investor', label: 'Investor', icon: 'account_balance_wallet', desc: 'Track investments & returns' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings', desc: 'Full system management' },
  { value: 'farm_manager', label: 'Farm Manager', icon: 'agriculture', desc: 'Farm oversight & reports' },
  { value: 'keeper', label: 'Keeper', icon: 'assignment_ind', desc: 'Daily bird care & logging' },
  { value: 'accountant', label: 'Accountant', icon: 'payments', desc: 'Financial oversight & assets' },
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('investor');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const leftRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (leftRef.current) {
        gsap.fromTo(leftRef.current.querySelectorAll('.reveal'),
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: 'power3.out', delay: 0.2 }
        );
      }
      if (formRef.current) {
        gsap.fromTo(formRef.current,
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.4 }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: selectedRole } },
      });
      if (authError) { setError(authError.message); return; }
      setSuccess(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light p-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-md text-center animate-fade-in-up relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-8 animate-float">
            <span className="material-symbols-outlined text-5xl text-teal-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-4xl font-heading font-extrabold text-primary tracking-tight mb-4">Account Created!</h2>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Check your email for a confirmation link before signing in.
          </p>
          <a href="/login" className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-full font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all duration-300 uppercase tracking-wider btn-glow">
            Go to Login
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </a>
        </div>
      </div>
    );
  }

  const passwordFields = [
    { label: 'Password', icon: 'lock', value: password, setter: setPassword, placeholder: 'At least 8 characters', show: showPassword, toggleShow: () => setShowPassword(!showPassword) },
    { label: 'Confirm Password', icon: 'lock', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Re-enter your password', show: showConfirm, toggleShow: () => setShowConfirm(!showConfirm) },
  ];

  return (
    <div className="min-h-screen flex bg-background-light overflow-hidden">
      {/* ═══════ LEFT PANEL ═══════ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f18] via-primary to-[#0d271e]" />
        <div className="absolute inset-0 hero-gradient opacity-30" />
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-32 left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div ref={leftRef} className="relative z-10 flex flex-col justify-center p-16 max-w-lg mx-auto">
          <div className="reveal flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
            </div>
            <span className="text-white font-heading font-extrabold text-xl tracking-tight">FlockFund</span>
          </div>

          <h1 className="reveal text-5xl xl:text-6xl font-serif text-white font-semibold leading-[0.95] mb-6 tracking-tight">
            Start your
            <br />
            <span className="text-gradient-gold">investment</span>
            <br />
            journey
          </h1>

          <p className="reveal text-white/40 text-lg font-light leading-relaxed mb-12">
            Join thousands of investors earning consistent returns from professionally managed poultry farms across Nigeria.
          </p>

          <div className="reveal grid grid-cols-2 gap-6">
            {[
              { value: '₦4,250', label: 'Per Bird' },
              { value: '70%', label: 'Your Share' },
              { value: '45 days', label: 'Avg. Cycle' },
              { value: '3x', label: 'Reinvest Bonus' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                <p className="font-mono text-2xl font-bold text-accent tracking-tighter">{s.value}</p>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ RIGHT PANEL ═══════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div ref={formRef} className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>psychiatry</span>
            </div>
            <span className="text-primary font-heading font-extrabold text-lg tracking-tight">FlockFund</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight mb-2">Create Account</h2>
            <p className="text-slate-400 text-sm">Choose your role and get started in under a minute</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {/* ── Role Selector ── */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-primary uppercase tracking-wider">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                      selectedRole === role.value
                        ? 'bg-primary/5 border-accent shadow-sm shadow-accent/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                      selectedRole === role.value
                        ? 'bg-accent/20'
                        : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}>
                      <span className={`material-symbols-outlined text-sm transition-colors duration-300 ${
                        selectedRole === role.value ? 'text-accent' : 'text-slate-400'
                      }`} style={{ fontVariationSettings: "'FILL' 1" }}>{role.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold transition-colors duration-300 ${
                        selectedRole === role.value ? 'text-primary' : 'text-slate-600'
                      }`}>{role.label}</p>
                      <p className="text-[9px] text-slate-400 truncate">{role.desc}</p>
                    </div>
                    {selectedRole === role.value && (
                      <span className="absolute top-1.5 right-1.5 material-symbols-outlined text-accent text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-primary uppercase tracking-wider">Full Name</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg group-focus-within:text-accent transition-colors duration-300">person</span>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-5 focus:ring-2 focus:ring-accent/20 focus:border-accent text-primary text-sm placeholder:text-slate-300 transition-all duration-300 hover:border-slate-300" required />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-primary uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg group-focus-within:text-accent transition-colors duration-300">mail</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-5 focus:ring-2 focus:ring-accent/20 focus:border-accent text-primary text-sm placeholder:text-slate-300 transition-all duration-300 hover:border-slate-300" required />
              </div>
            </div>

            {/* Password fields with eye toggles */}
            {passwordFields.map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="block text-[10px] font-bold text-primary uppercase tracking-wider">{field.label}</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg group-focus-within:text-accent transition-colors duration-300">{field.icon}</span>
                  <input
                    type={field.show ? 'text' : 'password'}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-accent/20 focus:border-accent text-primary text-sm placeholder:text-slate-300 transition-all duration-300 hover:border-slate-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={field.toggleShow}
                    className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg hover:text-accent transition-colors duration-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {field.show ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-full font-bold text-sm mt-2
                         shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99]
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         btn-glow uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <a href="/login" className="text-accent font-bold hover:text-primary transition-colors duration-300">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
