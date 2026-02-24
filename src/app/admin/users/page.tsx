"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  email?: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700",
  farm_manager: "bg-sky-100 text-sky-700",
  keeper: "bg-amber-100 text-amber-700",
  investor: "bg-emerald-100 text-emerald-700",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  farm_manager: "Farm Manager",
  keeper: "Keeper",
  investor: "Investor",
};

const ROLES = ["admin", "farm_manager", "keeper", "investor"];

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  async function loadUsers() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!loading && contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".user-row"),
          { x: 30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            stagger: 0.05,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.1,
          },
        );
      });
      return () => ctx.revert();
    }
  }, [loading, users, filterRole]);

  async function changeRole(userId: string, newRole: string) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      console.error("Failed to change role:", err);
    }
  }

  const filteredUsers =
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    farm_manager: users.filter((u) => u.role === "farm_manager").length,
    keeper: users.filter((u) => u.role === "keeper").length,
    investor: users.filter((u) => u.role === "investor").length,
  };

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          User Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          View and manage all registered users
        </p>
      </div>

      {/* ── Role Filter Tabs ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "All Users", icon: "group" },
          { key: "admin", label: "Admins", icon: "admin_panel_settings" },
          { key: "farm_manager", label: "Managers", icon: "agriculture" },
          { key: "keeper", label: "Keepers", icon: "assignment_ind" },
          {
            key: "investor",
            label: "Investors",
            icon: "account_balance_wallet",
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterRole(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              filterRole === tab.key
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {tab.icon}
            </span>
            {tab.label}
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${
                filterRole === tab.key ? "bg-white/20" : "bg-slate-100"
              }`}
            >
              {roleCounts[tab.key as keyof typeof roleCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">Loading users…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
              person_off
            </span>
            <p className="text-sm text-slate-400">
              No users found for this filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>User</span>
              <span>Role</span>
              <span>Joined</span>
              <span>ID</span>
              <span>Actions</span>
            </div>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="user-row grid grid-cols-5 gap-4 px-5 py-4 items-center hover:bg-slate-50/50 transition-colors duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-emerald-700 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0">
                    {(user.full_name || "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-primary truncate">
                      {user.full_name || "Unnamed"}
                    </p>
                  </div>
                </div>

                <div>
                  {editingId === user.id ? (
                    <select
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-primary focus:ring-2 focus:ring-accent/20"
                      defaultValue={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      autoFocus
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"}`}
                    >
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] text-slate-300 font-mono truncate">
                  {user.id.slice(0, 8)}…
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditingId(editingId === user.id ? null : user.id)
                    }
                    className="text-xs font-bold text-accent hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {editingId === user.id ? "close" : "edit"}
                    </span>
                    {editingId === user.id ? "Cancel" : "Change Role"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
