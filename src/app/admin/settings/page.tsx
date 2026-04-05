"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Settings {
  cost_per_bird: number;
  cost_breakdown: Record<string, number>;
  age_of_purchase_days: number;
  selling_price_per_bird: number;
  market_floor_price: number;
  market_cost: number;
  investor_share_percentage: number;
  flockfund_share_percentage: number;
  reinvest_percentage: number;
  rounds_before_withdrawal: number;
  enabled_gateways: string[];
  blockchain_enabled: boolean;
  data_monetization_enabled: boolean;
  cycle_duration_days: number;
  min_birds_per_investment: number;
  package_basic_birds: number;
  package_standard_birds: number;
  package_premium_birds: number;
  package_basic_name: string;
  package_standard_name: string;
  package_premium_name: string;
  salary_keeper: number;
  salary_manager: number;
  salary_sales_manager: number;
  estimated_profit_per_bird: number;
}

const DEFAULT_SETTINGS: Settings = {
  cost_per_bird: 4250,
  cost_breakdown: {
    "Bird Purchase": 800,
    "Feed": 2200,
    "Medication": 350,
    "Operational Fees": 900,
    "Structural Fees": 0,
  },
  selling_price_per_bird: 7500,
  market_floor_price: 6800,
  market_cost: 7200,
  investor_share_percentage: 30,
  flockfund_share_percentage: 70,
  reinvest_percentage: 100,
  rounds_before_withdrawal: 3,
  enabled_gateways: ["flutterwave"],
  age_of_purchase_days: 0,
  blockchain_enabled: false,
  data_monetization_enabled: false,
  cycle_duration_days: 28,
  min_birds_per_investment: 10,
  package_basic_birds: 10,
  package_standard_birds: 25,
  package_premium_birds: 50,
  package_basic_name: "Basic",
  package_standard_name: "Standard",
  package_premium_name: "Premium",
  salary_keeper: 45000,
  salary_manager: 85000,
  salary_sales_manager: 65000,
  estimated_profit_per_bird: 1500,
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

function TextField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300 hover:border-slate-300 disabled:opacity-50 disabled:bg-slate-100"
      />
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
            cost_breakdown: (data.cost_breakdown as Record<string, number>) ?? DEFAULT_SETTINGS.cost_breakdown,
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
            enabled_gateways:
              data.enabled_gateways ?? DEFAULT_SETTINGS.enabled_gateways,
            age_of_purchase_days:
              data.age_of_purchase_days ??
              DEFAULT_SETTINGS.age_of_purchase_days,
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
            package_basic_birds: data.package_basic_birds ?? DEFAULT_SETTINGS.package_basic_birds,
            package_standard_birds: data.package_standard_birds ?? DEFAULT_SETTINGS.package_standard_birds,
            package_premium_birds: data.package_premium_birds ?? DEFAULT_SETTINGS.package_premium_birds,
            package_basic_name: data.package_basic_name ?? DEFAULT_SETTINGS.package_basic_name,
            package_standard_name: data.package_standard_name ?? DEFAULT_SETTINGS.package_standard_name,
            package_premium_name: data.package_premium_name ?? DEFAULT_SETTINGS.package_premium_name,
            salary_keeper: data.salary_keeper ?? DEFAULT_SETTINGS.salary_keeper,
            salary_manager: data.salary_manager ?? DEFAULT_SETTINGS.salary_manager,
            salary_sales_manager: data.salary_sales_manager ?? DEFAULT_SETTINGS.salary_sales_manager,
            estimated_profit_per_bird: data.estimated_profit_per_bird ?? DEFAULT_SETTINGS.estimated_profit_per_bird,
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
          package_basic_birds: payload.package_basic_birds,
          package_standard_birds: payload.package_standard_birds,
          package_premium_birds: payload.package_premium_birds,
          package_basic_name: payload.package_basic_name,
          package_standard_name: payload.package_standard_name,
          package_premium_name: payload.package_premium_name,
        };
        const { error: err } = await supabase
          .from("flocks")
          .update(flockPayload)
          .eq("id", selectedContext);
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
        {/* ── Operational Salaries ── */}
        <SettingCard title="Operational Salaries" icon="payments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <NumberField 
                label="Keeper Salary (Monthly)" 
                value={settings.salary_keeper} 
                prefix="₦"
                onChange={(v) => setSettings(s => ({ ...s, salary_keeper: v }))} 
             />
             <NumberField 
                label="Manager Salary (Monthly)" 
                value={settings.salary_manager} 
                prefix="₦"
                onChange={(v) => setSettings(s => ({ ...s, salary_manager: v }))} 
             />
             <NumberField 
                label="Sales Manager Salary (Monthly)" 
                value={settings.salary_sales_manager} 
                prefix="₦"
                onChange={(v) => setSettings(s => ({ ...s, salary_sales_manager: v }))} 
             />
             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Mortality Profit Index</p>
                <div className="flex items-center gap-3">
                   <NumberField 
                      label="Est. Profit/Bird" 
                      value={settings.estimated_profit_per_bird} 
                      prefix="₦"
                      onChange={(v) => setSettings(s => ({ ...s, estimated_profit_per_bird: v }))} 
                   />
                </div>
                <p className="text-[9px] text-emerald-800/40 mt-2 italic">* Used for loss calculation upon bird mortality.</p>
             </div>
          </div>
        </SettingCard>

        {/* ── Cost Breakdown ── */}
        <SettingCard title="Cost Breakdown (per bird)" icon="calculate">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.cost_breakdown).map(([key, val]) => (
                <div key={key} className="flex items-end gap-2 group">
                  <div className="flex-1">
                    <NumberField
                      label={key}
                      value={val}
                      prefix="₦"
                      onChange={(v) =>
                        setSettings((s) => ({
                          ...s,
                          cost_breakdown: { ...s.cost_breakdown, [key]: v },
                        }))
                      }
                    />
                  </div>
                  <button
                    onClick={() => {
                      const next = { ...settings.cost_breakdown };
                      delete next[key];
                      setSettings((s) => ({ ...s, cost_breakdown: next }));
                    }}
                    className="mb-1 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const label = prompt(
                    "Enter new cost item label (e.g., Insurance, Logistics):",
                  );
                  if (label && !settings.cost_breakdown[label]) {
                    setSettings((s) => ({
                      ...s,
                      cost_breakdown: { ...s.cost_breakdown, [label]: 0 },
                    }));
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add New Cost Item
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total Cost/Bird
            </span>
            <div className="text-right">
              <p className="font-mono text-2xl font-bold text-primary">
                ₦{calculatedCost.toLocaleString()}
              </p>
              <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                Dynamic Summation from Breakdown
              </p>
            </div>
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
              label="Basic Pkg Birds"
              value={settings.package_basic_birds}
              suffix="birds"
              onChange={(v) =>
                setSettings((s) => ({ ...s, package_basic_birds: v }))
              }
            />
            <NumberField
              label="Standard Pkg Birds"
              value={settings.package_standard_birds}
              suffix="birds"
              onChange={(v) =>
                setSettings((s) => ({ ...s, package_standard_birds: v }))
              }
            />
            <NumberField
              label="Premium Pkg Birds"
              value={settings.package_premium_birds}
              suffix="birds"
              onChange={(v) =>
                setSettings((s) => ({ ...s, package_premium_birds: v }))
              }
            />
            <TextField
              label="Basic Pkg Name"
              value={settings.package_basic_name}
              onChange={(v) =>
                setSettings((s) => ({ ...s, package_basic_name: v }))
              }
            />
            <TextField
              label="Standard Pkg Name"
              value={settings.package_standard_name}
              onChange={(v) =>
                setSettings((s) => ({ ...s, package_standard_name: v }))
              }
            />
            <TextField
              label="Premium Pkg Name"
              value={settings.package_premium_name}
              onChange={(v) =>
                setSettings((s) => ({ ...s, package_premium_name: v }))
              }
            />
            <NumberField
              label="Age of Purchase"
              value={settings.age_of_purchase_days}
              suffix="Days Old"
              onChange={(v) =>
                setSettings((s) => ({ ...s, age_of_purchase_days: v }))
              }
            />
          </div>
        </SettingCard>

        {/* ── Payment Gateways ── */}
        <SettingCard title="Payment Gateways" icon="credit_card">
          <div className="space-y-3">
            {["flutterwave", "paystack", "paypal"].map((gw) => (
              <label
                key={gw}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  settings.enabled_gateways.includes(gw)
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.enabled_gateways.includes(gw)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...settings.enabled_gateways, gw]
                      : settings.enabled_gateways.filter((x) => x !== gw);
                    setSettings((s) => ({ ...s, enabled_gateways: next }));
                  }}
                  className="w-4 h-4 text-accent accent-accent rounded"
                />
                <span className="font-bold text-sm text-primary capitalize">
                  {gw}
                </span>
                {settings.enabled_gateways.includes(gw) && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-amber-700">
                    Enabled
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
