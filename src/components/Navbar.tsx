"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";

const DASHBOARD_ROUTES = [
  "/admin",
  "/manager",
  "/keeper",
  "/investor",
  "/accountant",
  "/community",
  "/sales-manager",
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Check if we should hide the navbar on dashboard routes
  const isDashboard = DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  useEffect(() => {
    if (isDashboard) return;

    const ctx = gsap.context(() => {
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { y: -100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power3.out" },
        );
      }
    });

    return () => ctx.revert();
  }, [isDashboard]);

  if (isDashboard) return null;

  // For public pages, we use the dark/premium style from the homepage
  const isHomePage = pathname === "/";
  const navBgClass = isHomePage
    ? "bg-primary/70 border-white/10"
    : "bg-white/70 border-slate-200";
  const textColorClass = isHomePage ? "text-white" : "text-primary";
  const linkColorClass = isHomePage ? "text-white/50" : "text-slate-500";
  const activeLinkClass = isHomePage ? "text-accent" : "text-accent";

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div
        className={`max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl ${navBgClass} rounded-2xl px-8 py-3 border shadow-2xl shadow-black/20`}
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-accent text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychiatry
            </span>
          </div>
          <span
            className={`${isHomePage ? "text-white" : "text-primary"} font-heading font-extrabold text-lg tracking-tight`}
          >
            FlockFund
          </span>
        </Link>
        <div className="hidden lg:flex items-center gap-6">
          <Link
            href="/how-it-works"
            className={`${pathname === "/how-it-works" ? activeLinkClass : linkColorClass} text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300`}
          >
            How It Works
          </Link>
          <Link
            href="/returns"
            className={`${pathname === "/returns" ? activeLinkClass : linkColorClass} text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300`}
          >
            Returns
          </Link>
          <Link
            href="/risk-management"
            className={`${pathname === "/risk-management" ? activeLinkClass : linkColorClass} text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300`}
          >
            Risk Management
          </Link>
          <Link
            href="/about"
            className={`${pathname === "/about" ? activeLinkClass : linkColorClass} text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300`}
          >
            About
          </Link>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className={`${isHomePage ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-primary"} text-xs font-bold uppercase tracking-widest transition-colors duration-300 px-4 py-2`}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2.5 bg-accent text-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-accent/90 transition-all duration-300 shadow-lg shadow-accent/20"
          >
            Invest Now
          </Link>
        </div>
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-xl ${isHomePage ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-200 text-primary"} border`}
        >
          <span className="material-symbols-outlined text-xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className={`lg:hidden absolute top-[80px] left-6 right-6 ${isHomePage ? "bg-primary/95 border-white/10" : "bg-white/95 border-slate-200"} backdrop-blur-xl border rounded-2xl p-6 shadow-2xl flex flex-col gap-6 animate-fade-in-down`}
        >
          <div className="flex flex-col gap-4">
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/how-it-works"
              className={`${isHomePage ? "text-white/70" : "text-slate-600"} text-sm font-bold uppercase tracking-wider hover:text-accent`}
            >
              How It Works
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/returns"
              className={`${isHomePage ? "text-white/70" : "text-slate-600"} text-sm font-bold uppercase tracking-wider hover:text-accent`}
            >
              Returns
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/risk-management"
              className={`${isHomePage ? "text-white/70" : "text-slate-600"} text-sm font-bold uppercase tracking-wider hover:text-accent`}
            >
              Risk Management
            </Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/about"
              className={`${isHomePage ? "text-white/70" : "text-slate-600"} text-sm font-bold uppercase tracking-wider hover:text-accent`}
            >
              About
            </Link>
          </div>
          <div
            className={`h-px ${isHomePage ? "bg-white/10" : "bg-slate-100"}`}
          />
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className={`w-full text-center ${isHomePage ? "text-white/80 border-white/20" : "text-slate-600 border-slate-200"} py-3 rounded-xl border font-bold uppercase tracking-wider text-xs`}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full text-center bg-accent text-primary py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-accent/20"
            >
              Invest Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
