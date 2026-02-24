"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface LeaderEntry {
  investor_id: string;
  full_name: string;
  total_birds: number;
  total_invested: number;
  badge_count: number;
}

export default function InvestorLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setMyId(user.id);

        // Fetch all investments grouped by investor
        const { data: investments } = await supabase
          .from("investments")
          .select("investor_id, birds_owned, amount_invested")
          .in("status", ["active", "completed"]);

        // Aggregate per investor
        const map: Record<string, { birds: number; invested: number }> = {};
        (investments || []).forEach((inv) => {
          if (!map[inv.investor_id])
            map[inv.investor_id] = { birds: 0, invested: 0 };
          map[inv.investor_id].birds += inv.birds_owned || 0;
          map[inv.investor_id].invested += inv.amount_invested || 0;
        });

        // Fetch names and badge counts
        const investorIds = Object.keys(map);
        if (investorIds.length > 0) {
          const [profiles, badgeCounts] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", investorIds),
            supabase.from("investor_badges").select("investor_id"),
          ]);

          const badgeMap: Record<string, number> = {};
          (badgeCounts.data || []).forEach((b) => {
            badgeMap[b.investor_id] = (badgeMap[b.investor_id] || 0) + 1;
          });

          const nameMap: Record<string, string> = {};
          (profiles.data || []).forEach((p) => {
            nameMap[p.id] = p.full_name || "Investor";
          });

          const entries: LeaderEntry[] = investorIds.map((id) => ({
            investor_id: id,
            full_name: nameMap[id] || "Investor",
            total_birds: map[id].birds,
            total_invested: map[id].invested,
            badge_count: badgeMap[id] || 0,
          }));

          // Sort by total birds descending
          entries.sort((a, b) => b.total_birds - a.total_birds);
          setLeaders(entries);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".lb-row"),
          { x: -30, opacity: 0, scale: 0.98 },
          {
            x: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.06,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading, leaders]);

  const medalColors = [
    "from-amber-400 to-yellow-500",
    "from-slate-300 to-slate-400",
    "from-orange-400 to-amber-600",
  ];

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Leaderboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Top investors ranked by portfolio size
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
            leaderboard
          </span>
          <p className="text-sm text-slate-400">
            No investors on the leaderboard yet. Start investing to appear!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaders.length >= 3 && (
            <div className="grid grid-cols-3 gap-5 mb-8">
              {[1, 0, 2].map((idx) => {
                const l = leaders[idx];
                if (!l) return null;
                const rank = idx + 1;
                const isMe = l.investor_id === myId;
                return (
                  <div
                    key={l.investor_id}
                    className={`lb-row bg-white rounded-2xl border ${isMe ? "border-accent/40 shadow-lg shadow-accent/10" : "border-slate-200/80"} p-6 text-center shadow-sm ${idx === 0 ? "transform -translate-y-4" : ""}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${medalColors[idx] || "from-slate-200 to-slate-300"} mx-auto flex items-center justify-center text-white font-bold text-lg mb-3 shadow-md`}
                    >
                      {rank}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-emerald-700 mx-auto flex items-center justify-center text-white font-bold text-lg mb-2">
                      {l.full_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-bold text-primary">
                      {l.full_name}{" "}
                      {isMe && (
                        <span className="text-accent text-[9px]">(You)</span>
                      )}
                    </p>
                    <p className="font-mono text-xl font-bold text-accent mt-1">
                      {l.total_birds}
                    </p>
                    <p className="text-[10px] text-slate-400">birds owned</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-amber-400 text-xs">
                        military_tech
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {l.badge_count} badges
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Rankings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-heading font-bold text-primary uppercase tracking-wider">
                Full Rankings
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {leaders.map((l, i) => {
                const isMe = l.investor_id === myId;
                return (
                  <div
                    key={l.investor_id}
                    className={`lb-row flex items-center gap-4 px-5 py-4 transition-colors ${isMe ? "bg-accent/5" : "hover:bg-slate-50/50"}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold ${
                        i < 3
                          ? `bg-gradient-to-br ${medalColors[i]} text-white shadow-sm`
                          : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                      {l.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary">
                        {l.full_name}{" "}
                        {isMe && (
                          <span className="text-accent text-[9px] font-bold">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        ₦{l.total_invested.toLocaleString()} invested ·{" "}
                        {l.badge_count} badges
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-primary">
                        {l.total_birds}
                      </p>
                      <p className="text-[9px] text-slate-400">birds</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
