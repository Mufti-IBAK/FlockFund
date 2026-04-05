"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";

interface FarmActivity {
  id: string;
  activity_name: string;
  scheduled_time: string; // TIME format from DB
  icon_name: string;
  status: "done" | "current" | "pending"; // Computed locally
}

export default function KeeperDashboard() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<FarmActivity[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState<"alert" | "vet">("alert");
  const [urgencyGrade, setUrgencyGrade] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFlocks, setActiveFlocks] = useState<{ id: string; name: string }[]>([]);
  const [selectedFlockId, setSelectedFlockId] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUser(user);

        const { data: flocks } = await supabase.from("flocks").select("id, name").eq("status", "active");
        if (flocks && flocks.length > 0) {
          setActiveFlocks(flocks);
          setSelectedFlockId(flocks[0].id);
        }

        fetchTasks(user?.id);
      } catch (err) {
        console.error("Failed init:", err);
      }
    }
    loadInitialData();

    // Set up Realtime listener
    const setupRealtime = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const channel = supabase
        .channel('keeper_dashboard_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'farm_activity_logs' }, () => {
           const { data: { user } } = JSON.parse(localStorage.getItem('sb-auth-token') || '{}'); // Quick way to get user if available, or just fetch again
           // Better: just trigger the existing loadInitialData or fetchTasks
           loadInitialData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'flocks' }, () => loadInitialData())
        .subscribe();
        
      return channel;
    };

    const channelPromise = setupRealtime();
    return () => {
      channelPromise.then(ch => {
        const { createClient } = require("@/lib/supabase/client");
        createClient().removeChannel(ch);
      });
    };
  }, []);

  async function fetchTasks(userId?: string) {
    if (!userId) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data: activities } = await supabase
        .from("farm_activities")
        .select("*")
        .order("scheduled_time", { ascending: true });

      const today = new Date().toISOString().split("T")[0];
      const { data: logs } = await supabase
        .from("farm_activity_logs")
        .select("activity_id")
        .eq("completion_date", today);

      const completedIds = new Set((logs || []).map(l => l.activity_id));
      const nowIdx = new Date();
      const currentHour = nowIdx.getHours();
      const currentMin = nowIdx.getMinutes();

      const merged: FarmActivity[] = (activities || []).map(act => {
        let status: "done" | "current" | "pending" = "pending";
        if (completedIds.has(act.id)) {
          status = "done";
        } else {
          // Parse time "06:00:00"
          const [hStr, mStr] = act.scheduled_time.split(":");
          const actH = parseInt(hStr, 10);
          const actM = parseInt(mStr, 10);
          // Current is within 1 hour ahead
          if (actH <= currentHour && (currentHour - actH) <= 1) {
             status = "current";
          }
        }
        return {
          id: act.id,
          activity_name: act.activity_name,
          scheduled_time: act.scheduled_time,
          icon_name: act.icon_name || "assignment",
          status
        };
      });

      setTasks(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function handleMarkDone(taskId: string) {
    if (!currentUser) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { error } = await supabase.from("farm_activity_logs").insert({
        activity_id: taskId,
        completed_by: currentUser.id
      });
      if (!error) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done" } : t));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!contentRef.current) return;
      gsap.fromTo(
        contentRef.current.querySelector(".greeting-card"),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 },
      );
      gsap.fromTo(
        contentRef.current.querySelectorAll(".quick-action"),
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: "back.out(2)",
          delay: 0.8,
        },
      );
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (loadingTasks || tasks.length === 0) return;
    const ctx = gsap.context(() => {
      if (!contentRef.current) return;
      gsap.fromTo(
        contentRef.current.querySelectorAll(".task-card"),
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          duration: 0.65,
          ease: "back.out(1.3)",
        },
      );
    });
    return () => ctx.revert();
  }, [loadingTasks, tasks]);

  async function handleQuickAction(type: "alert" | "vet") {
    setEmergencyType(type);
    setShowEmergencyModal(true);
  }

  async function handleSubmitEmergency() {
    if (!description.trim()) {
      alert("Please provide a description of the emergency.");
      return;
    }
    if (!selectedFlockId) {
      alert("No active flock selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!currentUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .single();
      const name = profile?.full_name || "A keeper";

      // 1. Create Incident Report
      const { error: incidentErr } = await supabase
        .from("incident_reports")
        .insert({
          flock_id: selectedFlockId,
          incident_date: new Date().toISOString().split("T")[0],
          description: `[${emergencyType.toUpperCase()}] ${description}`,
          cause: emergencyType === "vet" ? "disease" : "other",
          reported_by: currentUser.id,
          urgency_grade: urgencyGrade,
          is_emergency: true,
        });

      if (incidentErr) throw incidentErr;

      // 2. Send Notifications
      const { data: recipients } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "farm_manager"]);

      if (recipients) {
        const notifs = recipients.map((r) => ({
          user_id: r.id,
          title:
            emergencyType === "vet"
              ? `🚑 Vet Requested (${urgencyGrade.toUpperCase()})`
              : `⚠️ Emergency Alert (${urgencyGrade.toUpperCase()})`,
          message: `${name} reported: ${description}`,
          type: "system",
          redirect_url: "/manager/incidents",
        }));

        await supabase.from("notifications").insert(notifs);
        alert("Emergency report submitted and management notified.");
        setShowEmergencyModal(false);
        setDescription("");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit emergency report");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Format DB time to 12H am/pm
  function formatTime(t: string) {
    const [h, m] = t.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  }

  return (
    <div ref={contentRef}>
      {/* Greeting */}
      <div className="greeting-card bg-gradient-to-br from-primary via-[#1a4035] to-primary rounded-md p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-2">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight mb-1">
            Good Morning, Keeper
          </h1>
          <p className="text-white/40 text-sm">
            You have {tasks.filter((t) => t.status === "pending").length} tasks remaining today
          </p>
        </div>
      </div>

      {/* Daily Tasks */}
      <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">
        Daily Tasks
      </h2>
      <div className="grid gap-3 mb-8">
        {loadingTasks ? (
          <div className="p-8 text-center text-slate-400 font-bold border border-slate-100 rounded-md bg-white">Loading routines...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold border border-slate-100 rounded-md bg-white">No scheduled activities.</div>
        ) : tasks.map((task, i) => (
          <div
            key={i}
            className={`task-card flex items-center gap-4 p-4 rounded-md border transition-all duration-300 ${
              task.status === "done"
                ? "bg-emerald-50/50 border-emerald-100"
                : task.status === "current"
                  ? "bg-accent/5 border-accent/20 shadow-sm"
                  : "bg-white border-slate-200/80 hover:border-slate-300"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-md flex items-center justify-center ${
                task.status === "done"
                  ? "bg-emerald-100"
                  : task.status === "current"
                    ? "bg-accent/20"
                    : "bg-slate-100"
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${
                  task.status === "done"
                    ? "text-emerald-600"
                    : task.status === "current"
                      ? "text-amber-700"
                      : "text-slate-400"
                }`}
              >
                {task.status === "done" ? "check_circle" : task.icon_name}
              </span>
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-bold ${task.status === "done" ? "text-emerald-700 line-through" : "text-primary"}`}
              >
                {task.activity_name}
              </p>
              <p className="text-[10px] text-slate-400">{formatTime(task.scheduled_time)}</p>
            </div>
            
            <div className="flex gap-2 items-center">
              {task.status === "current" && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-accent text-primary animate-pulse hidden md:inline-block">
                  In Progress
                </span>
              )}
              {task.status !== "done" && (
                <button 
                  onClick={() => handleMarkDone(task.id)}
                  className="bg-primary text-white text-[10px] px-3 py-1.5 uppercase font-bold rounded-md hover:bg-primary/90 transition-all border border-primary/20"
                >
                  Verify Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: "add_circle",
            label: "New Report",
            href: "/keeper/new-report",
            color: "bg-primary text-white",
          },
          {
            icon: "history",
            label: "My Reports",
            href: "/keeper/reports",
            color: "bg-sky-500 text-white",
          },
          {
            icon: "warning",
            label: "Alert VET",
            onClick: () => handleQuickAction("alert"),
            color: "bg-rose-500 text-white",
          },
          {
            icon: "local_hospital",
            label: "Vet Request",
            onClick: () => handleQuickAction("vet"),
            color: "bg-amber-500 text-white",
          },
        ].map((action) =>
          action.onClick ? (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`quick-action ${action.color} rounded-md p-5 flex flex-col items-center gap-3 shadow-lg hover:scale-[1.03] transition-all duration-300`}
            >
              <span className="material-symbols-outlined text-2xl">
                {action.icon}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                {action.label}
              </span>
            </button>
          ) : (
            <a
              key={action.label}
              href={action.href}
              className={`quick-action ${action.color} rounded-md p-5 flex flex-col items-center gap-3 shadow-lg hover:scale-[1.03] transition-all duration-300`}
            >
              <span className="material-symbols-outlined text-2xl">
                {action.icon}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                {action.label}
              </span>
            </a>
          ),
        )}
      </div>

      <RecentActivityFeed limit={5} />

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-md shadow-2xl shadow-primary/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div
              className={`p-6 ${emergencyType === "vet" ? "bg-amber-500" : "bg-rose-500"} text-white`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="material-symbols-outlined text-3xl">
                  {emergencyType === "vet" ? "local_hospital" : "warning"}
                </span>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <h3 className="text-xl font-heading font-bold tracking-tight">
                {emergencyType === "vet" ? "Veterinary Request" : "Alert VET"}
              </h3>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider mt-1">
                Immediate Notification will be sent to the Farm Manager (VET)
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Flock Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Target Flock
                </label>
                <select
                  value={selectedFlockId}
                  onChange={(e) => setSelectedFlockId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                >
                  {activeFlocks.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Urgency Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["low", "medium", "high", "critical"] as const).map(
                    (level) => (
                      <button
                        key={level}
                        onClick={() => setUrgencyGrade(level)}
                        className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-all ${
                          urgencyGrade === level
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {level}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Situation Details
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the situation as clearly as possible..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-4 text-sm text-primary placeholder:text-slate-300 focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSubmitEmergency}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-md font-bold text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  emergencyType === "vet"
                    ? "bg-amber-500 shadow-amber-500/20"
                    : "bg-rose-500 shadow-rose-500/20"
                } text-white disabled:opacity-50`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isSubmitting ? "sync" : "send"}
                </span>
                {isSubmitting ? "Sending Alert..." : "Broadcast Alert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
