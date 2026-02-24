"use client";

import { TopBarUserProfile } from "@/components/UserProfile";
import { NotificationBell } from "@/components/NotificationBell";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";

const navItems = [
  { icon: "dashboard", label: "Overview", href: "/admin" },
  { icon: "settings", label: "Settings", href: "/admin/settings" },
  { icon: "egg_alt", label: "Flocks", href: "/admin/flocks" },
  { icon: "groups", label: "Users", href: "/admin/users" },
  { icon: "assignment", label: "Reports", href: "/admin/reports" },
  {
    icon: "account_balance",
    label: "Profit Cycles",
    href: "/admin/profit-cycles",
  },
  { icon: "payments", label: "Payments", href: "/admin/payments" },
  { icon: "request_quote", label: "Fund Requests", href: "/admin/requests" },
  { icon: "vaccines", label: "Vaccinations", href: "/admin/vaccinations" },
  { icon: "analytics", label: "Data", href: "/admin/data" },
  { icon: "forum", label: "Community", href: "/admin/community" },
  { icon: "public", label: "Globe", href: "/admin/globe" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebar, contentMargin } = CollapsibleSidebar({
    navItems,
    roleLabel: "Admin",
    basePath: "/admin",
  });

  return (
    <div className="flex min-h-screen bg-background-light">
      {sidebar}
      <div className={`flex-1 ${contentMargin} transition-all duration-300`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-end gap-3 px-4 py-3 md:px-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
          <NotificationBell />
          <TopBarUserProfile />
        </div>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
