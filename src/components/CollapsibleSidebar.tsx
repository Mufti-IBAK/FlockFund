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
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "false") setCollapsed(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!sidebarRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sidebarRef.current!.querySelectorAll(".nav-item"),
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.04, duration: 0.4, ease: "power3.out", delay: 0.1 },
      );
    });
    return () => ctx.revert();
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidth = collapsed ? "w-[64px]" : "w-56";
  const contentMargin = collapsed ? "lg:ml-[64px]" : "lg:ml-56";

  const sidebarContent = (
    <>
      {/* Logo — compact, fixed height */}
      <div
        className={`px-2 py-2.5 flex items-center gap-2 flex-shrink-0 border-b border-white/[0.06] ${
          collapsed && !mobileOpen ? "justify-center" : "justify-start"
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-accent"
            style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
          >
            psychiatry
          </span>
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="min-w-0">
            <p className="text-white font-heading font-extrabold text-[13px] leading-tight tracking-tight">
              FlockFund
            </p>
            <p className="text-white/30 text-[8px] font-bold uppercase tracking-[0.2em]">
              {roleLabel}
            </p>
          </div>
        )}
      </div>

      {/* Nav — flex-1 min-h-0 + overflow-hidden: never overflows, no scroll bar */}
      <div
        className={`flex-1 min-h-0 overflow-hidden ${
          collapsed && !mobileOpen ? "px-1.5 py-1.5" : "px-2 py-1.5"
        }`}
      >
        <nav className="flex flex-col gap-[2px]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== basePath && pathname.startsWith(item.href));
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`nav-item flex items-center gap-2.5 ${
                    collapsed && !mobileOpen
                      ? "justify-center px-1.5"
                      : "justify-start px-2.5"
                  } py-[5px] rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-accent"
                      : "text-white/45 hover:text-white/80 hover:bg-white/[0.06]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined flex-shrink-0 transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-white/40 group-hover:text-white/65"
                    }`}
                    style={{ fontSize: "20px" }}
                  >
                    {item.icon}
                  </span>
                  {(!collapsed || mobileOpen) && (
                    <span className="text-[12px] font-semibold truncate leading-none">
                      {item.label}
                    </span>
                  )}
                </Link>

                {/* Tooltip — only in collapsed desktop mode */}
                {collapsed && !mobileOpen && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#0f2e28] text-white text-[11px] font-semibold rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-[60]">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[4px] border-r-[#0f2e28]" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle — desktop only, flex-shrink-0 so it stays at bottom */}
      <div className="hidden lg:flex flex-shrink-0 px-2 pb-2 pt-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center py-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-all ${
            collapsed && !mobileOpen ? "justify-center" : "justify-start px-2 gap-2"
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
          >
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
          {!collapsed && (
            <span className="font-bold uppercase tracking-wider text-[9px]">
              Collapse
            </span>
          )}
        </button>
      </div>

      {/* User profile — only when expanded */}
      {(!collapsed || mobileOpen) && (
        <div className="flex-shrink-0 px-2 pb-2">
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
          className="lg:hidden fixed top-3 left-3 z-50 w-9 h-9 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center"
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: "20px" }}
          >
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
              className="absolute left-0 top-0 bottom-0 w-[55vw] min-w-[220px] max-w-[260px] sidebar-gradient flex flex-col z-10 overflow-y-auto"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  close
                </span>
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Desktop sidebar — fixed, full height, NO scroll ever */}
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
