"use client";

import { TopBarUserProfile } from "@/components/UserProfile";
import { NotificationBell } from "@/components/NotificationBell";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";

const navItems = [
  { icon: "dashboard", label: "Overview", href: "/manager" },
  { icon: "shopping_cart", label: "Invest", href: "/investor/invest" },
  { icon: "egg_alt", label: "Flocks", href: "/manager/flocks" },
  {
    icon: "pending_actions",
    label: "Pending Reports",
    href: "/manager/pending",
  },
  {
    icon: "assignment_turned_in",
    label: "Approved",
    href: "/manager/approved",
  },
  {
    icon: "monitoring",
    label: "Health Trends",
    href: "/manager/health-trends",
  },
  { icon: "analytics", label: "FCR Insights", href: "/manager/fcr-insights" },
  { icon: "payments", label: "Fund Requests", href: "/manager/requests" },
  { icon: "vaccines", label: "Vaccinations", href: "/manager/vaccinations" },
  { icon: "settings", label: "Settings", href: "/manager/settings" },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebar, contentMargin } = CollapsibleSidebar({
    navItems,
    roleLabel: "Farm Manager",
    basePath: "/manager",
  });

  return (
    <div className="flex min-h-screen bg-background-light">
      {sidebar}
      <div className={`flex-1 ${contentMargin} transition-all duration-300`}>
        <div className="sticky top-0 z-30 flex items-center justify-end gap-3 px-4 py-3 md:px-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
          <NotificationBell />
          <TopBarUserProfile />
        </div>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
