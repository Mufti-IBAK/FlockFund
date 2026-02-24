"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div ref={cardRef} className="w-full max-w-md relative z-10">
        {/* Logo */}
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

        {sent ? (
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6 animate-float">
              <span
                className="material-symbols-outlined text-4xl text-accent"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mail
              </span>
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight mb-3">
              Check Your Email
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-bold text-primary">{email}</span>. Click the
              link in the email to set a new password.
            </p>
            <div className="space-y-3">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-full font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all duration-300 uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Back to Login
              </a>
              <p className="text-xs text-slate-400">
                Didn&apos;t receive it?{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-accent font-bold hover:text-primary transition-colors"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/10 to-amber-500/10 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-3xl text-accent">
                  lock_reset
                </span>
              </div>
              <h2 className="text-3xl font-heading font-extrabold text-primary tracking-tight mb-2">
                Forgot Password?
              </h2>
              <p className="text-slate-400 text-sm">
                No worries — enter your email and we&apos;ll send you a reset
                link.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
                  <span className="material-symbols-outlined text-lg">
                    error
                  </span>
                  {error}
                </div>
              )}

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
                    Sending…
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Remember your password?{" "}
              <a
                href="/login"
                className="text-accent font-bold hover:text-primary transition-colors duration-300"
              >
                Sign in
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
