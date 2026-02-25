"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useRecentActivity } from "@/hooks/useRecentActivity";

export function RecentActivityFeed({ limit = 10 }: { limit?: number }) {
  const { activity, loading } = useRecentActivity(limit);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !listRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        listRef.current!.querySelectorAll(".activity-row"),
        { x: 30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: "power2.out",
        }
      );
    });
    return () => ctx.revert();
  }, [loading, activity]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm animate-pulse">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-32" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-2 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">
          Recent Activity
        </h2>
        <span className="text-xs text-slate-400 font-bold">
          {activity.length} events
        </span>
      </div>
      {activity.length === 0 ? (
        <div className="p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">
            monitoring
          </span>
          <p className="text-sm text-slate-400">
            No recent activity yet. Events will appear here as the platform is
            used.
          </p>
        </div>
      ) : (
        <div ref={listRef} className="divide-y divide-slate-50">
          {activity.map((item, i) => (
            <div
              key={`${item.sortDate}-${i}`}
              className="activity-row flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors duration-300 cursor-default"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-lg ${item.color}`}
                >
                  {item.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">
                  {item.text}
                </p>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
              <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
