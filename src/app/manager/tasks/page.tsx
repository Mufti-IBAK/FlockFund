"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";

interface FarmActivity {
  id: string;
  activity_name: string;
  scheduled_time: string;
  icon_name: string;
}

export default function ManagerTasks() {
  const [tasks, setTasks] = useState<FarmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: "",
    activity_name: "",
    scheduled_time: "06:00",
    icon_name: "assignment"
  });

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("farm_activities")
        .select("*")
        .order("scheduled_time", { ascending: true });
        
      if (data) setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();

      const timeWithSeconds = form.scheduled_time.includes(":") && form.scheduled_time.split(":").length === 2 
        ? `${form.scheduled_time}:00` 
        : form.scheduled_time;

      if (form.id) {
        // Update
        await supabase.from("farm_activities").update({
          activity_name: form.activity_name,
          scheduled_time: timeWithSeconds,
          icon_name: form.icon_name,
          updated_at: new Date().toISOString()
        }).eq("id", form.id);
        
        // Notify keeper
        const { data: keepers } = await supabase.from("profiles").select("id").eq("role", "keeper");
        if (keepers) {
          await supabase.from("notifications").insert(keepers.map(k => ({
            user_id: k.id,
            title: "Task Schedule Updated",
            message: `Farm Manager modified the task: ${form.activity_name}`,
            type: "system",
            redirect_url: "/keeper"
          })));
        }
      } else {
        // Create
        await supabase.from("farm_activities").insert({
          activity_name: form.activity_name,
          scheduled_time: timeWithSeconds,
          icon_name: form.icon_name,
          created_by: user?.id
        });
      }
      
      setShowAdd(false);
      resetForm();
      loadTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this routine entirely?")) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("farm_activities").delete().eq("id", id);
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  }

  function resetForm() {
    setForm({ id: "", activity_name: "", scheduled_time: "06:00", icon_name: "assignment" });
  }

  const ICONS = ["vaccines", "water_drop", "set_meal", "assignment", "nest_cam_wired_stand", "clean_hands", "thermostat"];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Daily Routines & Schedules
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure the required daily checklists for farm keepers.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="px-5 py-2.5 bg-primary text-white rounded-md font-bold text-[11px] uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all"
        >
          + Add Routine
        </button>
      </div>

      {showAdd && (
        <div className="mb-8 bg-white rounded-md border border-slate-200 p-6 shadow-sm max-w-xl animate-in slide-in-from-top-4">
          <h3 className="font-bold text-primary mb-4">
            {form.id ? "Edit Routine" : "Create New Routine"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Task Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Check Water Supply"
                  value={form.activity_name}
                  onChange={(e) => setForm({ ...form, activity_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm font-bold text-primary focus:ring-accent outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Execution Time
                </label>
                <input
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-sm focus:ring-accent outline-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Icon
              </label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm({ ...form, icon_name: ic })}
                    className={`w-10 h-10 rounded-md flex items-center justify-center border transition-all ${
                      form.icon_name === ic ? "bg-accent/20 border-accent text-primary" : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{ic}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowAdd(false); resetForm(); }}
                className="flex-1 py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Route"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 text-center rounded-md border border-slate-100 shadow-sm animate-pulse text-slate-400 font-bold">
          Loading schedules...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-md border border-slate-100 shadow-sm text-slate-400 font-bold">
          No automated routines have been configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-md border border-slate-200 p-5 shadow-sm group hover:border-accent transition-all relative">
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-all gap-2">
                <button 
                  onClick={() => {
                    setForm({
                      id: task.id,
                      activity_name: task.activity_name,
                      scheduled_time: task.scheduled_time.substring(0, 5),
                      icon_name: task.icon_name || "assignment"
                    });
                    setShowAdd(true);
                  }}
                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-primary"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="w-7 h-7 rounded bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>

              <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl text-primary/60">{task.icon_name || "assignment"}</span>
              </div>
              <h3 className="font-bold text-primary text-base">{task.activity_name}</h3>
              <p className="text-xs text-slate-400 mt-1">Scheduled for: <strong className="text-primary">{task.scheduled_time.substring(0, 5)}</strong></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
