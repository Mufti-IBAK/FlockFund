"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function NewFundRequestPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [form, setForm] = useState({
    flock_id: "",
    category: "feed",
    amount: "",
    description: "",
  });

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("flocks")
        .select("id, flock_name, name")
        .eq("status", "active");
      setFlocks(data || []);
      if (data && data.length > 0)
        setForm((f) => ({ ...f, flock_id: data[0].id }));
    }
    load();
  }, []);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.flock_id || !form.amount) return;
    setSubmitting(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: requestData, error } = await supabase
        .from("fund_requests")
        .insert({
          requester_id: user.id,
          flock_id: form.flock_id,
          category: form.category,
          amount: Number(form.amount),
          description: form.description,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Notify Admins
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins) {
        const notifs = admins.map((admin) => ({
          user_id: admin.id,
          title: "💰 New Fund Request",
          message: `${profile?.full_name || "A keeper"} requested ₦${Number(form.amount).toLocaleString()} for ${form.category}.`,
          type: "request",
          redirect_url: "/admin/requests",
        }));
        await supabase.from("notifications").insert(notifs);
      }
      router.push("/keeper/requests");
    } catch (err) {
      console.error(err);
      alert("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          New Fund Request
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Specify what you need and for which flock
        </p>
      </div>

      <div
        ref={formRef}
        className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Target Flock
            </label>
            <select
              value={form.flock_id}
              onChange={(e) => setForm({ ...form, flock_id: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary font-bold focus:ring-2 focus:ring-accent/20 transition-all outline-none"
            >
              {flocks.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.flock_name || f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary font-bold focus:ring-2 focus:ring-accent/20 transition-all outline-none"
              >
                <option value="feed">Feed</option>
                <option value="drugs">Drugs / Vaccines</option>
                <option value="water">Water supply</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Amount Required (₦)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary font-mono font-bold focus:ring-2 focus:ring-accent/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Justification / Description
            </label>
            <textarea
              rows={4}
              placeholder="Explain why these funds are needed..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-primary focus:ring-2 focus:ring-accent/20 transition-all outline-none resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3.5 rounded-xl text-slate-400 font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.amount}
              className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
