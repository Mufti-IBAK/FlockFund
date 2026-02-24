"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { SidebarUserProfile } from "@/components/UserProfile";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

interface Props {
  navItems: NavItem[];
  roleLabel: string;
  basePath: string;
}

export function CollapsibleSidebar({ navItems, roleLabel, basePath }: Props) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(true); // DEFAULT COLLAPSED
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state — default to collapsed
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    // Only expand if explicitly saved as 'false'
    if (saved === "false") setCollapsed(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // GSAP nav item entrance
  useEffect(() => {
    if (!sidebarRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sidebarRef.current!.querySelectorAll(".nav-item"),
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.06,
          duration: 0.5,
          ease: "power3.out",
          delay: 0.15,
        },
      );
    });
    return () => ctx.revert();
  }, [mobileOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidth = collapsed ? "w-[72px]" : "w-60";
  const contentMargin = collapsed ? "lg:ml-[72px]" : "lg:ml-60";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className={`p-4 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-accent text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            psychiatry
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-white font-heading font-extrabold text-base tracking-tight block">
              FlockFund
            </span>
            <span className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em]">
              {roleLabel}
            </span>
          </div>
        )}
      </div>

      {/* Nav — no scroll, fit screen */}
      <div className={`${collapsed ? "px-2" : "px-3"} mt-1 flex-1`}>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== basePath && pathname.startsWith(item.href));
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`nav-item flex items-center gap-3 ${collapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive ? "bg-white/10 text-accent" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${isActive ? "text-accent" : "text-white/30 group-hover:text-white/50"} transition-colors`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </Link>
                {/* Tooltip on hover when collapsed */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-[60]">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all text-xs"
        >
          <span className="material-symbols-outlined text-sm">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
          {!collapsed && (
            <span className="font-bold uppercase tracking-wider text-[9px]">
              Collapse
            </span>
          )}
        </button>
      </div>

      {/* User profile */}
      {!collapsed && (
        <div className="p-3">
          <SidebarUserProfile />
        </div>
      )}
    </>
  );

  return {
    sidebarWidth,
    contentMargin,
    sidebar: (
      <>
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-primary text-xl">
            menu
          </span>
        </button>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              ref={sidebarRef}
              className="absolute left-0 top-0 bottom-0 w-64 sidebar-gradient flex flex-col z-10"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Desktop sidebar — no overflow scroll */}
        <aside
          ref={!mobileOpen ? sidebarRef : undefined}
          className={`hidden lg:flex ${sidebarWidth} sidebar-gradient flex-col fixed h-screen z-40 transition-all duration-300`}
        >
          {sidebarContent}
        </aside>
      </>
    ),
  };
}
