"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import { TopBarUserProfile } from "@/components/UserProfile";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/keeper" },
  { icon: "add_circle", label: "New Report", href: "/keeper/new-report" },
  { icon: "assignment", label: "My Reports", href: "/keeper/reports" },
  { icon: "payments", label: "Fund Requests", href: "/keeper/requests" },
  { icon: "settings", label: "Settings", href: "/keeper/settings" },
];

export default function KeeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* TOP NAVBAR */}
      <header
        ref={headerRef}
        className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm shadow-black/[0.02]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary text-lg">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary text-base"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychiatry
                </span>
              </div>
              <span className="font-heading font-extrabold text-primary text-base tracking-tight">
                FlockFund
              </span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-1 hidden sm:inline">
                Keeper
              </span>
            </div>
            {/* Desktop nav */}
            <nav className="hidden lg:flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-base ${isActive ? "text-primary" : "text-slate-400"}`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <NotificationBell />
            <TopBarUserProfile />
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 px-4 py-2 bg-white">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
