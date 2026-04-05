"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import { TopBarUserProfile } from "@/components/UserProfile";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/keeper" },
  { icon: "shopping_cart", label: "Invest", href: "/keeper/invest" },
  { icon: "add_circle", label: "New Report", href: "/keeper/new-report" },
  { icon: "assignment", label: "My Reports", href: "/keeper/reports" },
  { icon: "payments", label: "Fund Requests", href: "/keeper/requests" },
  { icon: "shopping_bag", label: "Sales Review", href: "/keeper/sales" },
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
        className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm shadow-black/[0.005]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-5">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center border border-slate-100"
            >
              <span className="material-symbols-outlined text-primary text-sm">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary text-[12px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychiatry
                </span>
              </div>
              <span className="font-heading font-extrabold text-primary text-[13px] tracking-tight">
                FlockFund
              </span>
            </div>
            {/* Desktop nav */}
            <nav className="hidden lg:flex gap-0 px-1 border-l border-slate-100 ml-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? "text-primary bg-primary/[0.03]"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${isActive ? "text-primary" : "text-slate-300"}`}
                      style={{ fontSize: '15px' }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 md:gap-2.5 scale-90 origin-right">
            <NotificationBell />
            <TopBarUserProfile />
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 px-4 py-1.5 bg-white shadow-lg">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
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
