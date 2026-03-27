"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  farm_manager: "Farm Manager",
  keeper: "Keeper",
  investor: "Investor",
  sales_manager: "Sales Manager",
  accountant: "Accountant",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700",
  farm_manager: "bg-sky-100 text-sky-700",
  keeper: "bg-amber-100 text-amber-700",
  investor: "bg-emerald-100 text-emerald-700",
};

export function useUserInfo() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", authUser.id)
            .single();

          setUser({
            email: authUser.email || "",
            fullName:
              profile?.full_name || authUser.user_metadata?.full_name || "User",
            role: profile?.role || "investor",
            avatarUrl: authUser.user_metadata?.avatar_url,
          });
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      localStorage.setItem("flockfund_was_admin", "true");
    }
  }, [user?.role]);

  return { user, loading };
}

/**
 * Sidebar user profile card — for sidebars (admin, etc.)
 */
export function SidebarUserProfile() {
  const { user, loading } = useUserInfo();
  const router = useRouter();

  async function handleLogout() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading || !user) {
    return (
      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06] animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-3 w-20 bg-white/10 rounded mb-1.5" />
            <div className="h-2 w-28 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/30 to-teal-500/30 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0">
          {user.fullName.charAt(0) || user.email.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-bold truncate">
            {user.fullName}
          </p>
          <p className="text-white/30 text-[10px] truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"}`}
        >
          {ROLE_LABELS[user.role] || user.role}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-white/30 text-[10px] font-bold hover:text-rose-400 transition-colors duration-300 uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-xs">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}

/**
 * Top-bar user profile — for pages without sidebar (investor, keeper, manager)
 */
export function TopBarUserProfile() {
  const { user, loading } = useUserInfo();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const canSwitchRole =
    user?.role === "admin" ||
    (typeof window !== "undefined" &&
      localStorage.getItem("flockfund_was_admin") === "true");

  async function handleSwitchRole(newRole: string) {
    setIsSwitching(true);
    try {
      const res = await fetch("/api/user/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        // Redirect to new role dashboard
        let dest = "/investor";
        if (newRole === "admin") dest = "/admin";
        if (newRole === "farm_manager") dest = "/manager";
        if (newRole === "keeper") dest = "/keeper";
        if (newRole === "accountant") dest = "/accountant";
        if (newRole === "sales_manager") dest = "/sales-manager";
        window.location.href = dest;
      } else {
        alert("Failed to switch role");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to switch role");
    } finally {
      setIsSwitching(false);
    }
  }

  async function handleLogout() {
    localStorage.removeItem("flockfund_was_admin");
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading || !user) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-3 py-2 transition-all duration-300 group"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-emerald-700 flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0 shadow-md">
          {user.fullName.charAt(0) || user.email.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-bold text-primary truncate max-w-[120px]">
            {user.fullName}
          </p>
          <p className="text-[10px] text-slate-400">
            {ROLE_LABELS[user.role] || user.role}
          </p>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-primary transition-colors">
          expand_more
        </span>
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-2xl shadow-black/10 z-50 overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-slate-100">
              <p className="text-sm font-bold text-primary truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
              <span
                className={`inline-block mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"}`}
              >
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
            <div className="p-2 animate-fade-in">
              {canSwitchRole && (
                <div className="mb-2 pb-2 border-b border-slate-100">
                  <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Role
                  </p>
                  {[
                    "admin",
                    "farm_manager",
                    "sales_manager",
                    "accountant",
                    "keeper",
                    "investor",
                  ].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSwitchRole(r)}
                      disabled={isSwitching || user.role === r}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                        user.role === r
                          ? "bg-accent/10 text-accent/80 cursor-default"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {ROLE_LABELS[r] || r}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-lg">
                  logout
                </span>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
