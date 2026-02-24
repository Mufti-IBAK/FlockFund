"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { y: 40, opacity: 0, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.2,
          },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("An unexpected error occurred");
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
            <span
              className="material-symbols-outlined text-5xl text-teal-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h2 className="text-4xl font-heading font-extrabold text-primary tracking-tight mb-4">
            Password Updated!
          </h2>
          <p className="text-slate-500 mb-4 leading-relaxed">
            Your password has been reset. Redirecting to login…
          </p>
          <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div ref={cardRef} className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-accent"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychiatry
            </span>
          </div>
          <span className="text-primary font-heading font-extrabold text-xl tracking-tight">
            FlockFund
          </span>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-3xl text-emerald-600">
              lock
            </span>
          </div>
          <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight mb-2">
            Set New Password
          </h2>
          <p className="text-slate-400 text-sm">
            Choose a strong password for your account
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-primary uppercase tracking-wider">
              New Password
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg group-focus-within:text-accent transition-colors duration-300">
                lock
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-primary uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg group-focus-within:text-accent transition-colors duration-300">
                lock
              </span>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-accent/20 focus:border-accent text-primary placeholder:text-slate-300 transition-all duration-300 hover:border-slate-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg hover:text-accent transition-colors duration-300 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirm ? "visibility_off" : "visibility"}
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
                Updating…
              </span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          <a
            href="/login"
            className="text-accent font-bold hover:text-primary transition-colors duration-300"
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
