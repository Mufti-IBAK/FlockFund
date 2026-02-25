"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          accountant: "/accountant",
          investor: "/investor",
        };

        const targetRole = profile?.role || "investor";
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

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) setError(authError.message);
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

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-6 py-4 bg-white border border-slate-200 text-primary rounded-full font-bold text-sm
                       flex items-center justify-center gap-3 hover:bg-slate-50 transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

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
