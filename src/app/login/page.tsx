"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

const ROLES = [
  {
    value: "investor",
    label: "Investor",
    icon: "account_balance_wallet",
    desc: "Track investments & returns",
  },
  {
    value: "admin",
    label: "Admin",
    icon: "admin_panel_settings",
    desc: "Full system management",
  },
  {
    value: "farm_manager",
    label: "Farm Manager",
    icon: "agriculture",
    desc: "Farm oversight & reports",
  },
  {
    value: "keeper",
    label: "Keeper",
    icon: "assignment_ind",
    desc: "Daily bird care & logging",
  },
  {
    value: "accountant",
    label: "Accountant",
    icon: "payments",
    desc: "Financial oversight",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const leftRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (leftRef.current) {
        gsap.fromTo(
          leftRef.current.querySelectorAll(".reveal"),
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 1,
            ease: "power3.out",
            delay: 0.3,
          },
        );
      }
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: 60, opacity: 0 },
          { x: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.5 },
        );
      }
      if (orbitRef.current) {
        gsap.to(orbitRef.current, {
          rotation: 360,
          duration: 30,
          ease: "none",
          repeat: -1,
        });
      }
    });
    return () => ctx.revert();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Get user profile to determine default dashboard
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const dashboardMap: Record<string, string> = {
          admin: "/admin",
          farm_manager: "/manager",
          keeper: "/keeper",
          investor: "/investor",
        };

        // If a role was selected, navigate to that dashboard directly
        // (admins have access to all dashboards via middleware)
        // Otherwise use the profile's role
        const targetRole = selectedRole || profile?.role || "investor";
        const target = dashboardMap[targetRole] || "/investor";

        router.refresh();
        router.push(target);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background-light overflow-hidden">
      {/* ═══════ LEFT PANEL ═══════ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f18] via-primary to-[#0d271e]" />
        <div className="absolute inset-0 hero-gradient opacity-30" />
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-32 left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div
          ref={orbitRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/[0.03] rounded-full pointer-events-none"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent/40 rounded-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-teal-400/40 rounded-full" />
        </div>

        <div
          ref={leftRef}
          className="relative z-10 flex flex-col justify-center p-16 max-w-lg mx-auto"
        >
          <div className="reveal flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-accent"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychiatry
              </span>
            </div>
            <span className="text-white font-heading font-extrabold text-xl tracking-tight">
              FlockFund
            </span>
          </div>

          <h1 className="reveal text-5xl xl:text-6xl font-serif text-white font-semibold leading-[0.95] mb-6 tracking-tight">
            Welcome
            <br />
            <span className="text-gradient-gold">back</span>
          </h1>

          <p className="reveal text-white/40 text-lg font-light leading-relaxed mb-12">
            Track your poultry investments, monitor farm metrics, and grow your
            wealth — all in one premium platform.
          </p>

          <div className="reveal grid grid-cols-3 gap-6">
            {[
              { value: "500+", label: "Investors" },
              { value: "98%", label: "Satisfaction" },
              { value: "₦2.5B", label: "Returns" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-2xl font-bold text-accent tracking-tighter">
                  {s.value}
                </p>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="reveal mt-12 flex items-center gap-3 text-white/20">
            <span className="material-symbols-outlined text-sm">shield</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Bank-grade encryption
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ RIGHT PANEL ═══════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div ref={formRef} className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-accent"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychiatry
              </span>
            </div>
            <span className="text-primary font-heading font-extrabold text-lg tracking-tight">
              FlockFund
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-slate-400 text-sm">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg group-focus-within:text-accent transition-colors duration-300">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-5 focus:ring-2 focus:ring-accent/20 focus:border-accent text-primary placeholder:text-slate-300 transition-all duration-300 hover:border-slate-300"
                  required
                />
              </div>
            </div>

            {/* Password with eye toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-[11px] text-accent font-bold hover:text-primary transition-colors duration-300"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg group-focus-within:text-accent transition-colors duration-300">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-accent/20 focus:border-accent text-primary placeholder:text-slate-300 transition-all duration-300 hover:border-slate-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg hover:text-accent transition-colors duration-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
            </div>

            {/* ═══════ ROLE SELECTOR ═══════ */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                Login As{" "}
                <span className="text-slate-300 lowercase font-normal">
                  (select role for dashboard view)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() =>
                      setSelectedRole(
                        selectedRole === role.value ? "" : role.value,
                      )
                    }
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-300 group
                      ${
                        selectedRole === role.value
                          ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300
                      ${selectedRole === role.value ? "bg-accent/20" : "bg-slate-100 group-hover:bg-slate-200"}`}
                    >
                      <span
                        className={`material-symbols-outlined text-sm transition-colors duration-300
                        ${selectedRole === role.value ? "text-accent" : "text-slate-400"}`}
                      >
                        {role.icon}
                      </span>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold transition-colors duration-300 ${selectedRole === role.value ? "text-primary" : "text-slate-600"}`}
                      >
                        {role.label}
                      </p>
                      <p className="text-[9px] text-slate-400 leading-tight">
                        {role.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {!selectedRole && (
                <p className="text-[10px] text-slate-300 italic">
                  Default: uses your assigned role from database
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-full font-bold text-sm
                         shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99]
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         btn-glow uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  {selectedRole && (
                    <span className="text-accent/80 text-[10px] normal-case tracking-normal">
                      as {ROLES.find((r) => r.value === selectedRole)?.label}
                    </span>
                  )}
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-accent font-bold hover:text-primary transition-colors duration-300"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
