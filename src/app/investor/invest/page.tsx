"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Flock {
  id: string;
  name: string;
  flock_name: string;
  current_count: number;
  total_birds: number;
  batch_size: number;
  status: string;
  cost_per_bird?: number;
  min_birds_per_investment?: number;
}

function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}Th`;
  return `₦${n.toLocaleString()}`;
}

export default function InvestPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [selectedFlock, setSelectedFlock] = useState("");
  const [birdCount, setBirdCount] = useState(10);
  const [costPerBird, setCostPerBird] = useState(4250);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setEmail(user.email || "");

        const { data: settings } = await supabase
          .from("settings")
          .select("cost_per_bird")
          .single();
        const defaultCost = settings?.cost_per_bird || 4250;
        setCostPerBird(defaultCost);

        const { data: flockData } = await supabase
          .from("flocks")
          .select(
            "id, name, flock_name, current_count, total_birds, batch_size, status, cost_per_bird, min_birds_per_investment",
          )
          .eq("status", "active");

        setFlocks(flockData || []);
        if (flockData && flockData.length > 0) {
          setSelectedFlock(flockData[0].id);
          if (flockData[0].cost_per_bird) {
            setCostPerBird(flockData[0].cost_per_bird);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current!.querySelectorAll(".fade-in"),
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, [loading]);

  const totalCost = birdCount * costPerBird;

  async function handleInvest() {
    const f = flocks.find(fl => fl.id === selectedFlock);
    const min = f?.min_birds_per_investment || 10;
    const max = f?.current_count || 1000;
    
    if (!selectedFlock || birdCount < min) {
      alert(`Minimum investment for this flock is ${min} birds.`);
      return;
    }
    if (birdCount > max) {
      alert(`Only ${max} birds available in this flock.`);
      return;
    }
    setSubmitting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_id: user.id,
          birds_count: birdCount,
          gateway: "flutterwave",
          email: user.email,
          flock_id: selectedFlock,
        }),
      });

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert("Payment initiated! Reference: " + (data.reference || "N/A"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment. Please try again.");
    }
    setSubmitting(false);
  }

  const getFlockName = (f: Flock) => f.flock_name || f.name || "Unnamed";
  const getFlockCount = (f: Flock) =>
    f.current_count || f.batch_size || f.total_birds || 0;

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
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
          Invest in a Flock
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Choose your flock, select bird count, and pay securely
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Flock selector */}
          <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Select a Flock
            </label>
            {flocks.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No active flocks available right now. Check back soon!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flocks.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFlock(f.id);
                      if (f.cost_per_bird) setCostPerBird(f.cost_per_bird);
                      const min = f.min_birds_per_investment || 10;
                      if (birdCount < min) setBirdCount(min);
                      if (birdCount > (f.current_count || 0)) setBirdCount(f.current_count || 0);
                    }}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedFlock === f.id
                        ? "border-accent bg-accent/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedFlock === f.id ? "bg-accent/10" : "bg-slate-50"}`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${selectedFlock === f.id ? "text-accent" : "text-slate-400"}`}
                        >
                          egg_alt
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {getFlockName(f)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {getFlockCount(f).toLocaleString()} birds in flock
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bird count */}
          <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Number of Birds
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const min = flocks.find(f => f.id === selectedFlock)?.min_birds_per_investment || 10;
                  setBirdCount(Math.max(min, birdCount - 5));
                }}
                className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg text-slate-600">
                  remove
                </span>
              </button>
              <input
                type="number"
                min={flocks.find(f => f.id === selectedFlock)?.min_birds_per_investment || 10}
                max={flocks.find(f => f.id === selectedFlock)?.current_count || 1000}
                value={birdCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const f = flocks.find(fl => fl.id === selectedFlock);
                  const min = f?.min_birds_per_investment || 10;
                  const max = f?.current_count || 1000;
                  setBirdCount(Math.min(max, Math.max(0, val))); // Allowed to type 0 while typing, but handleInvest will block
                }}
                className="flex-1 text-center text-2xl font-mono font-bold text-primary bg-slate-50 rounded-lg py-3 border border-slate-200 focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none"
              />
              <button
                onClick={() => {
                  const max = flocks.find(f => f.id === selectedFlock)?.current_count || 1000;
                  setBirdCount(Math.min(max, birdCount + 5));
                }}
                className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg text-slate-600">
                  add
                </span>
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              {[10, 25, 50, 100].map((n) => {
                const f = flocks.find(fl => fl.id === selectedFlock);
                const max = f?.current_count || 1000;
                const min = f?.min_birds_per_investment || 10;
                const disabled = n < min || n > max;
                return (
                  <button
                    key={n}
                    disabled={disabled}
                    onClick={() => setBirdCount(n)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      birdCount === n
                        ? "bg-accent text-primary"
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50"
                    }`}
                  >
                    {n} birds
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment gateway — only Flutterwave active */}
          <div className="fade-in bg-white rounded-xl border border-slate-200/80 p-4 md:p-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Flutterwave — active */}
              <div className="p-4 rounded-lg border-2 border-accent bg-accent/5">
                <span className="material-symbols-outlined text-xl mb-2 text-accent">
                  credit_card
                </span>
                <p className="text-sm font-bold text-primary">Flutterwave</p>
                <p className="text-[10px] text-slate-400">Cards, Bank, USSD</p>
                <span className="inline-block mt-2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>
              {/* Paystack — unavailable */}
              <div className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed relative">
                <span className="material-symbols-outlined text-xl mb-2 text-slate-300">
                  account_balance
                </span>
                <p className="text-sm font-bold text-slate-400">Paystack</p>
                <p className="text-[10px] text-slate-300">
                  Cards, Bank Transfer
                </p>
                <span className="inline-block mt-2 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Unavailable
                </span>
              </div>
              {/* PayPal — unavailable */}
              <div className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed relative">
                <span className="material-symbols-outlined text-xl mb-2 text-slate-300">
                  language
                </span>
                <p className="text-sm font-bold text-slate-400">PayPal</p>
                <p className="text-[10px] text-slate-300">International</p>
                <span className="inline-block mt-2 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Unavailable
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="fade-in">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 sticky top-20">
            <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">
              Investment Summary
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cost per bird</span>
                <span className="font-mono font-bold text-primary">
                  ₦{costPerBird.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Birds</span>
                <span className="font-mono font-bold text-primary">
                  {birdCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Gateway</span>
                <span className="font-bold text-primary">Flutterwave</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between text-base">
                <span className="font-bold text-primary">Total</span>
                <span className="font-mono font-extrabold text-accent text-lg">
                  {formatNaira(totalCost)}
                </span>
              </div>
            </div>

            <button
              onClick={handleInvest}
              disabled={submitting || flocks.length === 0}
              className="w-full py-3 md:py-3.5 bg-accent text-primary rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    shopping_cart
                  </span>
                  Pay Now
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-300 text-center mt-3">
              Secure payment powered by Flutterwave
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
