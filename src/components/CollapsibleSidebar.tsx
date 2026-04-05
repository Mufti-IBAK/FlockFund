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

  // Persist collapsed state — default to collapsed
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
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
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.04, duration: 0.4, ease: "power3.out", delay: 0.1 },
      );
    });
    return () => ctx.revert();
  }, [mobileOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidth = collapsed ? "w-[60px]" : "w-56";
  const contentMargin = collapsed ? "lg:ml-[60px]" : "lg:ml-56";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className={`px-2 pt-3 pb-1 flex items-center gap-2 flex-shrink-0 ${
          collapsed && !mobileOpen ? "justify-center" : "justify-start"
        }`}
      >
        <div className="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-accent"
            style={{ fontSize: "15px", fontVariationSettings: "'FILL' 1" }}
          >
            psychiatry
          </span>
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="min-w-0 flex flex-col items-start text-left">
            <span className="text-white font-heading font-extrabold text-sm tracking-tight block">
              FlockFund
            </span>
            <span className="text-white/30 text-[8px] font-bold uppercase tracking-[0.2em]">
              {roleLabel}
            </span>
          </div>
        )}
      </div>

      {/* Nav — flex-1 min-h-0 keeps it fully contained within h-screen */}
      <div
        className={`${
          collapsed && !mobileOpen ? "px-1" : "px-1.5"
        } flex-1 min-h-0 overflow-hidden`}
      >
        <nav className="space-y-[1px]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== basePath && pathname.startsWith(item.href));
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`nav-item flex items-center gap-2 ${
                    collapsed && !mobileOpen
                      ? "justify-center px-1"
                      : "justify-start px-2"
                  } py-[4px] rounded-md transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-accent"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined flex-shrink-0 transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-white/35 group-hover:text-white/60"
                    }`}
                    style={{ fontSize: "16px" }}
                  >
                    {item.icon}
                  </span>
                  {(!collapsed || mobileOpen) && (
                    <span className="text-[11px] font-medium truncate">
                      {item.label}
                    </span>
                  )}
                </Link>

                {/* Tooltip — shows on hover when sidebar is collapsed */}
                {collapsed && !mobileOpen && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 bg-primary text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-[60]">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[4px] border-y-transparent border-r-[4px] border-r-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block px-2 py-2 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "14px" }}
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
        <div className="px-2 pb-2 flex-shrink-0">
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
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
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
              className="absolute left-0 top-0 bottom-0 w-[45vw] min-w-[200px] sidebar-gradient flex flex-col z-10"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Desktop sidebar — fixed, full height, NO scroll */}
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
