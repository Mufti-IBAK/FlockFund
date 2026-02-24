"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Flock {
  id: string;
  flock_name: string;
  name: string;
  batch_size: number;
  total_birds: number;
  start_date: string;
  expected_end_date: string;
  status: string;
  mortality_count: number;
  total_feed_kg: number;
  current_count: number;
  created_at: string;
  // Investment settings
  cost_per_bird?: number;
  selling_price_per_bird?: number;
  investor_share_percentage?: number;
  flockfund_share_percentage?: number;
  reinvest_percentage?: number;
  min_birds_per_investment?: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  growing: "bg-sky-100 text-sky-700",
  harvesting: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
};

function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}Th`;
  return `₦${n.toLocaleString()}`;
}

export default function AdminFlocks() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFlock, setNewFlock] = useState({
    flock_name: "",
    batch_size: 1000,
    start_date: "",
    expected_end_date: "",
    // Default Settings
    cost_per_bird: 4250,
    cost_breakdown: {
      doc: 800,
      feed: 2200,
      medication: 350,
      labor: 500,
      overhead: 400,
    },
    selling_price_per_bird: 7500,
    market_floor_price: 6800,
    market_cost: 7200,
    investor_share_percentage: 70,
    flockfund_share_percentage: 30,
    reinvest_percentage: 30,
    rounds_before_withdrawal: 3,
    cycle_duration_days: 28,
    min_birds_per_investment: 10,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  async function loadInitialData() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Load Flocks
      const { data: flockData, error: flockErr } = await supabase
        .from("flocks")
        .select("*")
        .order("created_at", { ascending: false });
      if (flockErr) throw flockErr;
      setFlocks(flockData || []);

      // Load Global Defaults to pre-fill new flock form
      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .single();
      if (settingsData) {
        setNewFlock((prev) => ({
          ...prev,
          cost_per_bird: settingsData.cost_per_bird ?? prev.cost_per_bird,
          cost_breakdown: settingsData.cost_breakdown ?? prev.cost_breakdown,
          selling_price_per_bird:
            settingsData.selling_price_per_bird ?? prev.selling_price_per_bird,
          market_floor_price:
            settingsData.market_floor_price ?? prev.market_floor_price,
          market_cost: settingsData.market_cost ?? prev.market_cost,
          investor_share_percentage:
            settingsData.investor_share_percentage ??
            prev.investor_share_percentage,
          flockfund_share_percentage:
            settingsData.flockfund_share_percentage ??
            prev.flockfund_share_percentage,
          reinvest_percentage:
            settingsData.reinvest_percentage ?? prev.reinvest_percentage,
          rounds_before_withdrawal:
            settingsData.rounds_before_withdrawal ??
            prev.rounds_before_withdrawal,
          cycle_duration_days:
            settingsData.cycle_duration_days ?? prev.cycle_duration_days,
          min_birds_per_investment:
            settingsData.min_birds_per_investment ??
            prev.min_birds_per_investment,
        }));
      }
    } catch (err) {
      console.error("Failed to load flocks:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".flock-row"),
          { x: 30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.06,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading, flocks]);

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!newFlock.flock_name.trim()) errs.flock_name = "Flock name is required";
    if (newFlock.batch_size < 1)
      errs.batch_size = "Batch size must be at least 1";
    if (!newFlock.start_date) errs.start_date = "Start date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!validateForm()) return;
    setCreating(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.from("flocks").insert({
        name: newFlock.flock_name,
        flock_name: newFlock.flock_name,
        total_birds: newFlock.batch_size,
        batch_size: newFlock.batch_size,
        current_count: newFlock.batch_size,
        start_date: newFlock.start_date,
        expected_end_date: newFlock.expected_end_date || null,
        status: "active",
        mortality_count: 0,
        total_feed_kg: 0,
        // Investment settings
        cost_per_bird: newFlock.cost_per_bird,
        cost_breakdown: newFlock.cost_breakdown,
        selling_price_per_bird: newFlock.selling_price_per_bird,
        market_floor_price: newFlock.market_floor_price,
        market_cost: newFlock.market_cost,
        investor_share_percentage: newFlock.investor_share_percentage,
        flockfund_share_percentage: newFlock.flockfund_share_percentage,
        reinvest_percentage: newFlock.reinvest_percentage,
        rounds_before_withdrawal: newFlock.rounds_before_withdrawal,
        cycle_duration_days: newFlock.cycle_duration_days,
        min_birds_per_investment: newFlock.min_birds_per_investment,
      });
      if (error) {
        console.error("Flock creation error:", error);
        alert(`Failed to create flock: ${error.message}`);
        return;
      }
      setShowCreate(false);
      await loadInitialData();
    } catch (err) {
      console.error("Failed to create flock:", err);
      alert("Failed to create flock. Check console for details.");
    } finally {
      setCreating(false);
    }
  }

  async function markCompleted(flockId: string) {
    if (
      !confirm(
        "Mark this flock as completed? This will trigger profit calculations.",
      )
    )
      return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .from("flocks")
        .update({ status: "completed" })
        .eq("id", flockId);
      if (error) throw error;
      await loadInitialData();
    } catch (err) {
      console.error("Failed to mark completed:", err);
    }
  }

  function daysProgress(start: string | null, end: string | null) {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return 0;

    const now = Date.now();
    const total = e - s;

    if (total <= 0) return now >= s ? 100 : 0;
    if (now >= e) return 100;
    if (now <= s) return 0;

    return Math.min(100, Math.max(0, Math.round(((now - s) / total) * 100)));
  }

  const getFlockName = (f: Flock) => f.flock_name || f.name || "Unnamed";
  const getBatchSize = (f: Flock) => f.batch_size || f.total_birds || 0;

  return (
    <div ref={contentRef}>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
            Flock Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create, monitor, and complete flock cycles
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300"
        >
          <span className="material-symbols-outlined text-lg">
            {showCreate ? "close" : "add"}
          </span>
          {showCreate ? "Cancel" : "New Flock"}
        </button>
      </div>

      {/* ── Create Form ── */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-accent/20 p-4 md:p-6 mb-6 shadow-sm animate-fade-in-up">
          <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider mb-4">
            Create New Flock
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Flock Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Bravo-12"
                value={newFlock.flock_name}
                onChange={(e) => {
                  setNewFlock((f) => ({ ...f, flock_name: e.target.value }));
                  setErrors((e2) => ({ ...e2, flock_name: "" }));
                }}
                className={`w-full bg-slate-50 border ${errors.flock_name ? "border-rose-400" : "border-slate-200"} rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all`}
              />
              {errors.flock_name && (
                <p className="text-rose-500 text-[10px] font-bold">
                  {errors.flock_name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Batch Size *
              </label>
              <input
                type="number"
                value={newFlock.batch_size}
                min={1}
                onChange={(e) => {
                  setNewFlock((f) => ({
                    ...f,
                    batch_size: Number(e.target.value),
                  }));
                  setErrors((e2) => ({ ...e2, batch_size: "" }));
                }}
                className={`w-full bg-slate-50 border ${errors.batch_size ? "border-rose-400" : "border-slate-200"} rounded-lg py-3 px-4 text-primary text-sm font-mono font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all`}
              />
              {errors.batch_size && (
                <p className="text-rose-500 text-[10px] font-bold">
                  {errors.batch_size}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Start Date *
              </label>
              <input
                type="date"
                value={newFlock.start_date}
                onChange={(e) => {
                  setNewFlock((f) => ({ ...f, start_date: e.target.value }));
                  setErrors((e2) => ({ ...e2, start_date: "" }));
                }}
                className={`w-full bg-slate-50 border ${errors.start_date ? "border-rose-400" : "border-slate-200"} rounded-lg py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all`}
              />
              {errors.start_date && (
                <p className="text-rose-500 text-[10px] font-bold">
                  {errors.start_date}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Expected End
              </label>
              <input
                type="date"
                value={newFlock.expected_end_date}
                onChange={(e) =>
                  setNewFlock((f) => ({
                    ...f,
                    expected_end_date: e.target.value,
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider hover:text-accent transition-colors mb-4"
            >
              <span className="material-symbols-outlined">
                {showSettings ? "expand_less" : "settings"}
              </span>
              {showSettings
                ? "Hide Profit & Investment Settings"
                : "Configure Profit & Investment Settings"}
            </button>

            {showSettings && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Cost per Bird (₦)
                  </label>
                  <input
                    type="number"
                    value={newFlock.cost_per_bird}
                    onChange={(e) =>
                      setNewFlock((f) => ({
                        ...f,
                        cost_per_bird: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Selling Price (₦)
                  </label>
                  <input
                    type="number"
                    value={newFlock.selling_price_per_bird}
                    onChange={(e) =>
                      setNewFlock((f) => ({
                        ...f,
                        selling_price_per_bird: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Investor Share (%)
                  </label>
                  <input
                    type="number"
                    value={newFlock.investor_share_percentage}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setNewFlock((f) => ({
                        ...f,
                        investor_share_percentage: v,
                        flockfund_share_percentage: 100 - v,
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Reinvest Rate (%)
                  </label>
                  <input
                    type="number"
                    value={newFlock.reinvest_percentage}
                    onChange={(e) =>
                      setNewFlock((f) => ({
                        ...f,
                        reinvest_percentage: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-primary rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                {creating ? "sync" : "check"}
              </span>
              {creating ? "Creating…" : "Create Flock"}
            </button>
          </div>
        </div>
      )}

      {/* ── Flock Table ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">
            All Flocks
          </h2>
          <span className="text-xs text-slate-400 font-bold">
            {flocks.length} total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">Loading flocks…</p>
          </div>
        ) : flocks.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
              egg_alt
            </span>
            <p className="text-sm text-slate-400">
              No flocks yet. Create your first flock to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Header - hidden on mobile */}
            <div className="hidden md:grid grid-cols-7 gap-4 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Name</span>
              <span>Birds</span>
              <span>Start</span>
              <span>End</span>
              <span>Progress</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {flocks.map((flock) => (
              <div
                key={flock.id}
                className="flock-row grid grid-cols-2 md:grid-cols-7 gap-3 md:gap-4 px-4 md:px-5 py-4 items-center hover:bg-slate-50/50 transition-colors duration-300"
              >
                <span className="font-bold text-sm text-primary col-span-2 md:col-span-1">
                  {getFlockName(flock)}
                </span>
                <span className="font-mono text-sm text-primary font-bold">
                  {(
                    flock.current_count ?? getBatchSize(flock)
                  ).toLocaleString()}
                  <span className="text-[10px] text-slate-400 block font-normal">
                    of {getBatchSize(flock).toLocaleString()}
                  </span>
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(flock.start_date).toLocaleDateString()}
                </span>
                <span className="text-xs text-slate-500">
                  {flock.expected_end_date
                    ? new Date(flock.expected_end_date).toLocaleDateString()
                    : "—"}
                </span>
                <div>
                  {flock.expected_end_date ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              flock.status === "completed"
                                ? "bg-emerald-500"
                                : daysProgress(
                                      flock.start_date,
                                      flock.expected_end_date,
                                    ) >= 100
                                  ? "bg-rose-400"
                                  : "bg-gradient-to-r from-accent to-emerald-500"
                            }`}
                            style={{
                              width: `${flock.status === "completed" ? 100 : daysProgress(flock.start_date, flock.expected_end_date)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            flock.status !== "completed" &&
                            daysProgress(
                              flock.start_date,
                              flock.expected_end_date,
                            ) >= 100
                              ? "text-rose-500"
                              : "text-slate-400"
                          }`}
                        >
                          {flock.status === "completed"
                            ? "100"
                            : daysProgress(
                                flock.start_date,
                                flock.expected_end_date,
                              )}
                          %
                        </span>
                      </div>
                      {flock.status !== "completed" &&
                        daysProgress(
                          flock.start_date,
                          flock.expected_end_date,
                        ) >= 100 && (
                          <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter animate-pulse">
                            Overdue Cycle
                          </span>
                        )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-200 w-1/4 rounded-full" />
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono">
                        No end date
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block w-fit ${STATUS_COLORS[flock.status] || "bg-slate-100 text-slate-600"}`}
                >
                  {flock.status}
                </span>
                <div>
                  {flock.status !== "completed" && (
                    <button
                      onClick={() => markCompleted(flock.id)}
                      className="text-xs font-bold text-accent hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        check_circle
                      </span>
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
