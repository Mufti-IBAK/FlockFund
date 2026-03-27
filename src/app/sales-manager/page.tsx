"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";

interface Stats {
  totalBirdsSold: number;
  totalWeightSold: number;
  totalManureRevenue: number;
  totalRevenue: number;
}

export default function SalesManagerDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBirdsSold: 0,
    totalWeightSold: 0,
    totalManureRevenue: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sales_reports")
          .select("*");
        if (error) throw error;

        if (data) {
          const s = data.reduce(
            (acc, r) => {
              if (r.is_manure) {
                acc.totalManureRevenue += r.total_revenue;
              } else {
                acc.totalBirdsSold += r.amount_birds;
                acc.totalWeightSold += Number(r.weight_kg);
              }
              acc.totalRevenue += r.total_revenue;
              return acc;
            },
            {
              totalBirdsSold: 0,
              totalWeightSold: 0,
              totalManureRevenue: 0,
              totalRevenue: 0,
            },
          );
          setStats(s);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".stat-card"),
          { scale: 0.9, opacity: 0, y: 20 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "back.out(1.7)",
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading]);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Sales Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Performance and revenue tracking for bird and manure sales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Birds Sold"
          value={stats.totalBirdsSold.toLocaleString()}
          icon="shopping_basket"
          color="accent"
        />
        <StatCard
          title="Weight (KG)"
          value={stats.totalWeightSold.toFixed(1)}
          icon="weight"
          color="emerald"
        />
        <StatCard
          title="Manure Revenue"
          value={`₦${stats.totalManureRevenue.toLocaleString()}`}
          icon="compost"
          color="amber"
        />
        <StatCard
          title="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          icon="payments"
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityFeed limit={5} />
        </div>

        <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="relative z-10">
            <h3 className="font-heading font-bold text-xl mb-2">
              Ready to sell?
            </h3>
            <p className="text-white/60 text-sm mb-6">
              Record a new transaction to update inventory and revenue.
            </p>
            <a
              href="/sales-manager/sales"
              className="inline-flex items-center gap-2 bg-accent text-primary px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-[1.02] transition-all shadow-lg shadow-accent/20"
            >
              <span className="material-symbols-outlined text-lg">
                add_shopping_cart
              </span>
              New Record
            </a>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    accent: "bg-accent/10 text-accent",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    primary: "bg-primary/10 text-primary",
  };

  return (
    <div className="stat-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div
        className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}
      >
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
        {title}
      </p>
      <p className="text-2xl font-mono font-bold text-primary">{value}</p>
    </div>
  );
}
