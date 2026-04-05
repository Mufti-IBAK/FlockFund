"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import gsap from "gsap";

interface InvestorData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    loadInvestors();

    // Set up Realtime listeners
    const setupRealtime = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const channel = supabase
        .channel('admin_investors_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.investor" }, () => loadInvestors())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => loadInvestors())
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

  async function loadInvestors() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          email,
          phone,
          created_at,
          investments (
            amount_invested,
            status,
            birds_owned
          )
        `)
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
                totalInvested += Number(i.amount_invested || 0);
                activePackages += 1;
              } else if (i.status === "completed") {
                completedPackages += 1;
              }
            });
          }
          
          return {
            id: inv.id,
            full_name: inv.full_name || "Unknown Investor",
            email: inv.email || "No email",
            phone: inv.phone || "No phone",
            created_at: inv.created_at,
            stats: { totalInvested, activePackages, completedPackages }
          };
        });
        setInvestors(processed);
      }
    } catch (err) {
      console.error("Failed to load investors:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredInvestors = useMemo(() => {
    return investors.filter(inv => {
      const matchesSearch = 
        inv.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isActive = inv.stats.activePackages > 0;
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);
        
      return matchesSearch && matchesStatus;
    });
  }, [investors, searchQuery, statusFilter]);

  useEffect(() => {
    if (loading || filteredInvestors.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".investor-row",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.03, duration: 0.3, ease: "power2.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading, filteredInvestors]);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Investor Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {investors.length} registered investors found on the platform.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-accent transition-colors">
              search
            </span>
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all w-full md:w-64"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          >
            <option value="all">All Investors</option>
            <option value="active">Active Portfolio</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm animate-pulse">
           <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
           <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Hydrating data from Supabase...</p>
        </div>
      ) : filteredInvestors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-300">
              person_search
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary mb-1">
            No matches found
          </h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Try adjusting your search or filters to find the investor you are looking for.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-8">Investor</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Portfolio</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvestors.map((inv) => (
                  <tr key={inv.id} className="investor-row group hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                          <span className="font-heading font-bold text-primary text-xs uppercase">
                            {inv.full_name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm line-clamp-1">{inv.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {inv.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 leading-none">
                          <span className="material-symbols-outlined text-[14px]">mail</span>
                          {inv.email}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 leading-none mt-1">
                          <span className="material-symbols-outlined text-[14px]">phone</span>
                          {inv.phone}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {inv.stats.activePackages > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-primary text-sm">₦{inv.stats.totalInvested.toLocaleString()}</p>
                        <p className="text-[10px] text-accent font-bold uppercase tracking-widest">{inv.stats.activePackages} Active Packages</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-500">{new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </td>
                    <td className="p-4 pr-8 text-right">
                      <button className="text-slate-300 hover:text-accent transition-colors">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
