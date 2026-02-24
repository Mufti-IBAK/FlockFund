"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "report" | "payment" | "badge" | "flock" | "system" | "request";
  read: boolean;
  redirect_url?: string;
  created_at: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const notifs = (data || []) as unknown as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    let channel: any = null;

    async function subscribe() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("realtime-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as unknown as Notification;
            setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);

            if (bellRef.current) {
              gsap.fromTo(
                bellRef.current,
                { rotation: -15 },
                {
                  rotation: 0,
                  duration: 0.5,
                  ease: "elastic.out(1, 0.3)",
                  repeat: 2,
                  yoyo: true,
                },
              );
            }
          },
        )
        .subscribe();
    }

    subscribe();

    return () => {
      if (channel) {
        import("@/lib/supabase/client").then(({ createClient }) => {
          createClient().removeChannel(channel!);
        });
      }
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (panelRef.current && open) {
      gsap.fromTo(
        panelRef.current,
        { y: -10, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" },
      );
    }
  }, [open]);

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", n.id);
        
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    
    if (n.redirect_url) {
      setOpen(false);
      router.push(n.redirect_url);
    }
  }

  async function markAllRead() {
    if (!userId) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  const iconMap: Record<string, string> = {
    report: "assignment",
    payment: "payments",
    badge: "military_tech",
    flock: "egg_alt",
    system: "info",
    request: "account_balance_wallet",
  };

  return (
    <div className="relative">
      <button
        ref={bellRef as React.Ref<HTMLButtonElement>}
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
      >
        <span className="material-symbols-outlined text-slate-500 text-xl">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-accent hover:text-amber-700 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-200 mb-2">
                    notifications_off
                  </span>
                  <p className="text-xs text-slate-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${!n.read ? "bg-accent/5" : "hover:bg-slate-50/50"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? "bg-accent/10" : "bg-slate-50"}`}
                      >
                        <span
                          className={`material-symbols-outlined text-sm ${!n.read ? "text-accent" : "text-slate-300"}`}
                        >
                          {iconMap[n.type] || "info"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-bold ${!n.read ? "text-primary" : "text-slate-400"}`}
                        >
                          {n.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-slate-300 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
