"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

interface WeightSample {
  bird_id: string;
  weight_kg: number;
}

export default function KeeperNewReport() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [flocks, setFlocks] = useState<
    { id: string; flock_name: string; name: string }[]
  >([]);
  const [form, setForm] = useState({
    flock_id: "",
    mortality_count: 0,
    clinical_signs: "",
    temperature_celsius: 0,
    feed_available: true,
    water_available: true,
    feed_consumed_kg: 0,
    feed_brand: "",
    litter_status: "Dry",
    ventilation_status: "Good",
    handover_notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [weightSamples, setWeightSamples] = useState<WeightSample[]>([
    { bird_id: "", weight_kg: 0 },
  ]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadFlocks() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("flocks")
          .select("id, flock_name, name")
          .eq("status", "active");
        setFlocks(data || []);
        if (data && data.length > 0)
          setForm((f) => ({ ...f, flock_id: data[0].id }));
      } catch (err) {
        console.error(err);
      }
    }
    loadFlocks();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".form-section"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.6,
            ease: "power3.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, []);

  function addWeightSample() {
    setWeightSamples([...weightSamples, { bird_id: "", weight_kg: 0 }]);
  }

  function removeWeightSample(i: number) {
    setWeightSamples(weightSamples.filter((_, idx) => idx !== i));
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!form.flock_id) errs.flock_id = "Please select a flock";
    if (!form.feed_brand.trim()) errs.feed_brand = "Feed brand is required";
    if (form.mortality_count < 0) errs.mortality_count = "Cannot be negative";
    if (form.feed_consumed_kg < 0) errs.feed_consumed_kg = "Cannot be negative";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date().toISOString();
      const today = now.split("T")[0];

      // Submit farm report — write to both reporter_id AND keeper_id
      const { error: reportError } = await supabase
        .from("farm_reports")
        .insert({
          flock_id: form.flock_id,
          reporter_id: user.id,
          keeper_id: user.id,
          mortality_count: form.mortality_count,
          clinical_signs: form.clinical_signs || null,
          temperature: form.temperature_celsius || null,
          temperature_celsius: form.temperature_celsius || null,
          feed_available: form.feed_available,
          water_available: form.water_available,
          feed_consumed_kg: form.feed_consumed_kg || null,
          feed_brand: form.feed_brand || null,
          litter_status: form.litter_status,
          ventilation_status: form.ventilation_status,
          handover_notes: form.handover_notes || null,
          status: "pending",
          report_date: today,
          created_at: now,
        });
      if (reportError) {
        console.error("Report error details:", reportError);
        alert(`Failed to submit report: ${reportError.message}`);
        setSubmitting(false);
        return;
      }

      // Submit feed log
      if (form.feed_consumed_kg > 0) {
        await supabase.from("feed_logs").insert({
          flock_id: form.flock_id,
          quantity_kg: form.feed_consumed_kg,
          report_date: today,
        });
      }

      // Submit weight records
      const validSamples = weightSamples.filter((s) => s.weight_kg > 0);
      if (validSamples.length > 0) {
        await supabase.from("weight_records").insert(
          validSamples.map((s) => ({
            flock_id: form.flock_id,
            bird_identifier: s.bird_id || "",
            weight_kg: s.weight_kg,
            sample_date: today,
          })),
        );
      }

      router.push("/keeper/reports");
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Failed to submit. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  }

  const getFlockName = (f: { flock_name: string; name: string }) =>
    f.flock_name || f.name || "Unnamed";

  return (
    <div ref={contentRef}>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
          Daily Report
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Submit your daily flock health and feeding report
        </p>
      </div>

      <div className="max-w-3xl space-y-4 md:space-y-6">
        {/* Flock Selection */}
        <div className="form-section bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">
                egg_alt
              </span>
            </div>
            <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">
              Flock *
            </h3>
          </div>
          <select
            value={form.flock_id}
            onChange={(e) => {
              setForm({ ...form, flock_id: e.target.value });
              setErrors((e2) => ({ ...e2, flock_id: "" }));
            }}
            className={`w-full bg-slate-50 border ${errors.flock_id ? "border-rose-400" : "border-slate-200"} rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all`}
          >
            {flocks.length === 0 && <option value="">No active flocks</option>}
            {flocks.map((f) => (
              <option key={f.id} value={f.id}>
                {getFlockName(f)}
              </option>
            ))}
          </select>
          {errors.flock_id && (
            <p className="text-rose-500 text-[10px] font-bold mt-1">
              {errors.flock_id}
            </p>
          )}
        </div>

        {/* Health Data */}
        <div className="form-section bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-rose-500 text-lg">
                health_and_safety
              </span>
            </div>
            <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">
              Health
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mortality Count
              </label>
              <input
                type="number"
                min="0"
                value={form.mortality_count}
                onChange={(e) =>
                  setForm({ ...form, mortality_count: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-mono font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.temperature_celsius}
                onChange={(e) =>
                  setForm({
                    ...form,
                    temperature_celsius: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-mono font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Clinical Signs / Notes
              </label>
              <textarea
                rows={3}
                value={form.clinical_signs}
                placeholder="Describe any observed symptoms, behaviors, or conditions…"
                onChange={(e) =>
                  setForm({ ...form, clinical_signs: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Handover Notes / Instructions
              </label>
              <textarea
                rows={2}
                value={form.handover_notes}
                placeholder="Notes for the next shift or manager…"
                onChange={(e) =>
                  setForm({ ...form, handover_notes: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Feed & Water */}
        <div className="form-section bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-700 text-lg">
                set_meal
              </span>
            </div>
            <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">
              Feed & Water
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Feed Brand / Name *
              </label>
              <input
                type="text"
                placeholder="e.g. TopFeed Starter"
                value={form.feed_brand}
                onChange={(e) => {
                  setForm({ ...form, feed_brand: e.target.value });
                  setErrors((e2) => ({ ...e2, feed_brand: "" }));
                }}
                className={`w-full bg-slate-50 border ${errors.feed_brand ? "border-rose-400" : "border-slate-200"} rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all`}
              />
              {errors.feed_brand && (
                <p className="text-rose-500 text-[10px] font-bold mt-1">
                  {errors.feed_brand}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Feed Consumed (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.feed_consumed_kg}
                onChange={(e) =>
                  setForm({ ...form, feed_consumed_kg: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-mono font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Litter Condition
              </label>
              <select
                value={form.litter_status}
                onChange={(e) =>
                  setForm({ ...form, litter_status: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              >
                <option value="Dry">Dry</option>
                <option value="Damp">Damp</option>
                <option value="Wet">Wet / Needs Change</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Ventilation
              </label>
              <select
                value={form.ventilation_status}
                onChange={(e) =>
                  setForm({ ...form, ventilation_status: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              >
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor / Dusty</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-300 bg-slate-50 border-slate-200 hover:border-accent/30">
              <input
                type="checkbox"
                checked={form.feed_available}
                onChange={(e) =>
                  setForm({ ...form, feed_available: e.target.checked })
                }
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <div>
                <p className="text-sm font-bold text-primary">Feed Available</p>
                <p className="text-[10px] text-slate-400">
                  Sufficient supply for today
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-300 bg-slate-50 border-slate-200 hover:border-accent/30">
              <input
                type="checkbox"
                checked={form.water_available}
                onChange={(e) =>
                  setForm({ ...form, water_available: e.target.checked })
                }
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <div>
                <p className="text-sm font-bold text-primary">
                  Water Available
                </p>
                <p className="text-[10px] text-slate-400">
                  Clean supply running
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Weight Samples */}
        <div className="form-section bg-white rounded-xl border border-slate-200/80 p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-sky-600 text-lg">
                  monitor_weight
                </span>
              </div>
              <h3 className="font-heading font-bold text-primary text-sm uppercase tracking-wider">
                Weight Samples
              </h3>
            </div>
            <button
              onClick={addWeightSample}
              className="text-xs font-bold text-accent hover:text-primary flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add
              Sample
            </button>
          </div>
          <div className="space-y-3">
            {weightSamples.map((s, i) => (
              <div key={i} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Bird ID / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={s.bird_id}
                    onChange={(e) => {
                      const ws = [...weightSamples];
                      ws[i].bird_id = e.target.value;
                      setWeightSamples(ws);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={s.weight_kg}
                    onChange={(e) => {
                      const ws = [...weightSamples];
                      ws[i].weight_kg = Number(e.target.value);
                      setWeightSamples(ws);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-primary text-sm font-mono font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
                {weightSamples.length > 1 && (
                  <button
                    onClick={() => removeWeightSample(i)}
                    className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all mb-0.5"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp display */}
        <div className="form-section bg-slate-50 rounded-lg border border-slate-200 p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-base">
            schedule
          </span>
          <p className="text-xs text-slate-500">
            This report will be timestamped:{" "}
            <strong className="text-primary">
              {new Date().toLocaleString()}
            </strong>
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              {submitting ? "sync" : "send"}
            </span>
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
