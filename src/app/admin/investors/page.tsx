"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface InvestorData {
  id: string;
  full_name: string;
  created_at: string;
  stats: {
    totalInvested: number;
    activePackages: number;
    completedPackages: number;
  };
}

export default function AdminInvestorsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestors();
  }, []);

  async function loadInvestors() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          created_at,
          investments (
            amount,
            status,
            package_size
          )
        `)
        .eq("role", "investor")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        const processed = data.map((inv: any) => {
          let totalInvested = 0;
          let activePackages = 0;
          let completedPackages = 0;
          
          if (inv.investments) {
            inv.investments.forEach((i: any) => {
              if (i.status === "active") {
                totalInvested += Number(i.amount) * (i.package_size || 1);
                activePackages += 1;
              } else if (i.status === "completed") {
                completedPackages += 1;
              }
            });
          }
          
          return {
            id: inv.id,
            full_name: inv.full_name,
            created_at: inv.created_at,
            stats: { totalInvested, activePackages, completedPackages }
          };
        });
        setInvestors(processed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading || investors.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".investor-card",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading, investors]);

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Investor Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed overview of all active investors, portfolios, and lifecycle statuses.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-md border border-slate-200/80 p-12 text-center shadow-sm animate-pulse">
           <p className="font-bold text-slate-400">Loading metrics...</p>
        </div>
      ) : investors.length === 0 ? (
        <div className="bg-white rounded-md border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-accent">
              group
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">
            No Investors Found
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            The platform currently has zero registered investors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {investors.map((inv) => (
            <div key={inv.id} className="investor-card bg-white rounded-md border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/20 rounded-full flex items-center justify-center mb-3">
                <span className="font-heading font-bold text-primary text-xl uppercase">
                  {inv.full_name?.charAt(0) || "?"}
                </span>
              </div>
              <h3 className="font-bold text-primary text-sm line-clamp-1 w-full">{inv.full_name || "Unknown Investor"}</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">Joined {new Date(inv.created_at).toLocaleDateString()}</p>
              
              <div className="w-full h-[1px] bg-slate-100 my-4" />
              
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="bg-slate-50 rounded-md p-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Active</p>
                  <p className="font-bold text-primary text-sm">{inv.stats.activePackages} pkg</p>
                </div>
                <div className="bg-slate-50 rounded-md p-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Portfolio</p>
                  <p className="font-bold text-emerald-600 text-xs mt-[1px]">₦{inv.stats.totalInvested.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
