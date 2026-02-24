"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Settings {
  cost_per_bird: number;
  cost_breakdown: {
    doc: number;
    feed: number;
    medication: number;
    labor: number;
    overhead: number;
  };
  selling_price_per_bird: number;
  market_floor_price: number;
  market_cost: number;
  investor_share_percentage: number;
  flockfund_share_percentage: number;
  reinvest_percentage: number;
  rounds_before_withdrawal: number;
  payment_gateway: string;
  blockchain_enabled: boolean;
  data_monetization_enabled: boolean;
  cycle_duration_days: number;
  min_birds_per_investment: number;
}

const DEFAULT_SETTINGS: Settings = {
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
  reinvest_percentage: 100,
  rounds_before_withdrawal: 3,
  payment_gateway: "flutterwave",
  blockchain_enabled: false,
  data_monetization_enabled: false,
  cycle_duration_days: 28,
  min_birds_per_investment: 10,
};

function SettingCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-lg">
            {icon}
          </span>
        </div>
        <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix = "",
  suffix = "",
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 ${prefix ? "pl-8" : "pl-4"} ${suffix ? "pr-10" : "pr-4"} text-primary text-sm font-mono font-bold
            focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300 hover:border-slate-300
            disabled:opacity-50 disabled:bg-slate-100`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [marketUpdateNote, setMarketUpdateNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Context Management
  const [selectedContext, setSelectedContext] = useState<string>("global");
  const [activeFlocks, setActiveFlocks] = useState<
    { id: string; name: string }[]
  >([]);

  const contentRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Active Flocks for the selector
  useEffect(() => {
    async function fetchFlocks() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("flocks")
          .select("id, name")
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (data) setActiveFlocks(data);
      } catch (err) {
        console.error("Failed to fetch flocks:", err);
      }
    }
    fetchFlocks();
  }, []);

  // 2. Load Settings based on Context
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        let result;
        if (selectedContext === "global") {
          result = await supabase.from("settings").select("*").single();
        } else {
          result = await supabase
            .from("flocks")
            .select("*")
            .eq("id", selectedContext)
            .single();
        }

        const data = result.data;
        if (data) {
          setSettings({
            cost_per_bird: data.cost_per_bird ?? DEFAULT_SETTINGS.cost_per_bird,
            cost_breakdown:
              data.cost_breakdown ?? DEFAULT_SETTINGS.cost_breakdown,
            selling_price_per_bird:
              data.selling_price_per_bird ??
              DEFAULT_SETTINGS.selling_price_per_bird,
            market_floor_price:
              data.market_floor_price ?? DEFAULT_SETTINGS.market_floor_price,
            market_cost: data.market_cost ?? DEFAULT_SETTINGS.market_cost,
            investor_share_percentage:
              data.investor_share_percentage ??
              DEFAULT_SETTINGS.investor_share_percentage,
            flockfund_share_percentage:
              data.flockfund_share_percentage ??
              DEFAULT_SETTINGS.flockfund_share_percentage,
            reinvest_percentage:
              data.reinvest_percentage ?? DEFAULT_SETTINGS.reinvest_percentage,
            rounds_before_withdrawal:
              data.rounds_before_withdrawal ??
              DEFAULT_SETTINGS.rounds_before_withdrawal,
            payment_gateway:
              data.payment_gateway ?? DEFAULT_SETTINGS.payment_gateway,
            blockchain_enabled:
              data.blockchain_enabled ?? DEFAULT_SETTINGS.blockchain_enabled,
            data_monetization_enabled:
              data.data_monetization_enabled ??
              DEFAULT_SETTINGS.data_monetization_enabled,
            cycle_duration_days:
              data.cycle_duration_days ?? DEFAULT_SETTINGS.cycle_duration_days,
            min_birds_per_investment:
              data.min_birds_per_investment ??
              DEFAULT_SETTINGS.min_birds_per_investment,
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        // setLoading(false)
      }
    }
    loadSettings();
  }, [selectedContext]);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".setting-card"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "power3.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, [selectedContext]);

  // Auto-calculate cost_per_bird from breakdown
  const calculatedCost = Object.values(settings.cost_breakdown).reduce(
    (a, b) => a + b,
    0,
  );

  async function handleSave() {
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const payload = {
        ...settings,
        cost_per_bird: calculatedCost,
      };

      let error;
      if (selectedContext === "global") {
        const { error: err } = await supabase.from("settings").upsert({
          id: 1,
          ...payload,
        });
        error = err;
      } else {
        // Filter payload for flocks table (only investment/pricing columns)
        const flockPayload = {
          cost_per_bird: payload.cost_per_bird,
          cost_breakdown: payload.cost_breakdown,
          selling_price_per_bird: payload.selling_price_per_bird,
          market_floor_price: payload.market_floor_price,
          market_cost: payload.market_cost,
          investor_share_percentage: payload.investor_share_percentage,
          flockfund_share_percentage: payload.flockfund_share_percentage,
          reinvest_percentage: payload.reinvest_percentage,
          rounds_before_withdrawal: payload.rounds_before_withdrawal,
          cycle_duration_days: payload.cycle_duration_days,
          min_birds_per_investment: payload.min_birds_per_investment,
        };
        const { error: err } = await supabase.from("flocks").update(flockPayload).eq("id", selectedContext);
        error = err;
      }

      if (error) throw error;

      // Log market update if prices changed or note is provided
      if (marketUpdateNote) {
        await supabase.from("market_updates").insert({
          floor_price: settings.market_floor_price,
          market_cost: settings.market_cost,
          note: marketUpdateNote,
        });
        setMarketUpdateNote("");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={contentRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Settings Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedContext === "global"
              ? "Configure platform-wide rules and fallback pricing"
              : "Adjust specific parameters for this active flock cycle"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Context Selector */}
          <div className="relative group">
            <span className="absolute -top-2 left-3 px-1.5 bg-white text-[9px] font-bold text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-accent">
              Configuration Target
            </span>
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-5 py-3 pr-10 text-sm font-bold text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer min-w-[220px] outline-none shadow-sm"
            >
              <option value="global">🌍 Global Default Settings</option>
              <optgroup label="Active Flocks">
                {activeFlocks.map((f) => (
                  <option key={f.id} value={f.id}>
                    📦 {f.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
              unfold_more
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider
              shadow-lg transition-all duration-300 ${
                saved
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-primary text-white shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02]"
              } disabled:opacity-50`}
          >
            <span className="material-symbols-outlined text-lg">
              {saved ? "check" : saving ? "sync" : "save"}
            </span>
            {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Cost Breakdown ── */}
        <SettingCard title="Cost Breakdown (per bird)" icon="calculate">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(settings.cost_breakdown).map(([key, val]) => (
              <NumberField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={val}
                prefix="₦"
                onChange={(v) =>
                  setSettings((s) => ({
                    ...s,
                    cost_breakdown: { ...s.cost_breakdown, [key]: v },
                  }))
                }
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total Cost/Bird
            </span>
            <span className="font-mono text-xl font-bold text-primary">
              ₦{calculatedCost.toLocaleString()}
            </span>
          </div>
        </SettingCard>

        {/* ── Market Pricing ── */}
        <SettingCard title="Market Pricing" icon="storefront">
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Selling Price/Bird"
              value={settings.selling_price_per_bird}
              prefix="₦"
              onChange={(v) =>
                setSettings((s) => ({ ...s, selling_price_per_bird: v }))
              }
            />
            <NumberField
              label="Market Floor Price"
              value={settings.market_floor_price}
              prefix="₦"
              onChange={(v) =>
                setSettings((s) => ({ ...s, market_floor_price: v }))
              }
            />
            <NumberField
              label="Market Cost"
              value={settings.market_cost}
              prefix="₦"
              onChange={(v) => setSettings((s) => ({ ...s, market_cost: v }))}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Update Note (for history)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Seasonal price adjustment or logistics cost increase..."
              value={marketUpdateNote}
              onChange={(e) => setMarketUpdateNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Profit/Bird
            </span>
            <span
              className={`font-mono text-xl font-bold ${settings.selling_price_per_bird - calculatedCost > 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              ₦
              {(
                settings.selling_price_per_bird - calculatedCost
              ).toLocaleString()}
            </span>
          </div>
        </SettingCard>

        {/* ── Revenue Split ── */}
        <SettingCard title="Revenue Split" icon="pie_chart">
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Investor Share"
              value={settings.investor_share_percentage}
              suffix="%"
              onChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  investor_share_percentage: v,
                  flockfund_share_percentage: 100 - v,
                }))
              }
            />
            <NumberField
              label="Platform Share"
              value={settings.flockfund_share_percentage}
              suffix="%"
              onChange={() => {}}
              disabled
            />
          </div>
          <div className="mt-4">
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-accent to-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: `${settings.investor_share_percentage}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-r-full transition-all duration-500"
                style={{ width: `${settings.flockfund_share_percentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="text-emerald-600">
                Investors: {settings.investor_share_percentage}%
              </span>
              <span className="text-primary">
                Platform: {settings.flockfund_share_percentage}%
              </span>
            </div>
          </div>
        </SettingCard>

        {/* ── Investment Rules ── */}
        <SettingCard title="Investment Rules" icon="rule">
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Reinvestment Rate"
              value={settings.reinvest_percentage}
              suffix="%"
              onChange={(v) =>
                setSettings((s) => ({ ...s, reinvest_percentage: v }))
              }
            />
            <NumberField
              label="Rounds Before Withdrawal"
              value={settings.rounds_before_withdrawal}
              onChange={(v) =>
                setSettings((s) => ({ ...s, rounds_before_withdrawal: v }))
              }
            />
            <NumberField
              label="Cycle Duration"
              value={settings.cycle_duration_days}
              suffix="Days"
              onChange={(v) =>
                setSettings((s) => ({ ...s, cycle_duration_days: v }))
              }
            />
            <NumberField
              label="Min birds per unit"
              value={settings.min_birds_per_investment}
              suffix="birds"
              onChange={(v) =>
                setSettings((s) => ({ ...s, min_birds_per_investment: v }))
              }
            />
          </div>
        </SettingCard>

        {/* ── Payment Gateway ── */}
        <SettingCard title="Payment Gateway" icon="credit_card">
          <div className="space-y-3">
            {["flutterwave", "paystack", "paypal"].map((gw) => (
              <label
                key={gw}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  settings.payment_gateway === gw
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="gateway"
                  value={gw}
                  checked={settings.payment_gateway === gw}
                  onChange={() =>
                    setSettings((s) => ({ ...s, payment_gateway: gw }))
                  }
                  className="w-4 h-4 text-accent accent-accent"
                />
                <span className="font-bold text-sm text-primary capitalize">
                  {gw}
                </span>
                {settings.payment_gateway === gw && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-amber-700">
                    Active
                  </span>
                )}
              </label>
            ))}
          </div>
        </SettingCard>

        {/* ── Feature Toggles ── */}
        <SettingCard title="Feature Toggles" icon="toggle_on">
          <div className="space-y-4">
            {[
              {
                label: "Blockchain Transparency",
                desc: "Record investment hashes on-chain",
                key: "blockchain_enabled" as const,
                icon: "token",
              },
              {
                label: "Data Monetisation",
                desc: "Sell anonymised FCR & growth data",
                key: "data_monetization_enabled" as const,
                icon: "analytics",
              },
            ].map((toggle) => (
              <div
                key={toggle.key}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg text-slate-400">
                    {toggle.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {toggle.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{toggle.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, [toggle.key]: !s[toggle.key] }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    settings[toggle.key] ? "bg-accent" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                      settings[toggle.key] ? "left-[26px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
