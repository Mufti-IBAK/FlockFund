"use client";

import { TopBarUserProfile } from "@/components/UserProfile";
import { NotificationBell } from "@/components/NotificationBell";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";

const navItems = [
  { icon: "dashboard", label: "Overview", href: "/sales-manager" },
  { icon: "shopping_bag", label: "Report Sale", href: "/sales-manager/sales" },
  { icon: "egg_alt", label: "Flocks", href: "/sales-manager/flocks" },
  { icon: "settings", label: "Settings", href: "/sales-manager/settings" },
];

export default function SalesManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebar, contentMargin } = CollapsibleSidebar({
    navItems,
    roleLabel: "Sales Manager",
    basePath: "/sales-manager",
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
