"use client";

import { TopBarUserProfile } from "@/components/UserProfile";
import { NotificationBell } from "@/components/NotificationBell";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";

const navItems = [
  { icon: "dashboard", label: "Portfolio", href: "/investor" },
  { icon: "shopping_cart", label: "Invest", href: "/investor/invest" },
  { icon: "monitoring", label: "Activity Feed", href: "/investor/activity" },
  { icon: "trending_up", label: "Market", href: "/investor/market" },
  {
    icon: "account_balance_wallet",
    label: "Withdraw",
    href: "/investor/withdraw",
  },
  { icon: "military_tech", label: "Badges", href: "/investor/badges" },
  { icon: "leaderboard", label: "Leaderboard", href: "/investor/leaderboard" },
  { icon: "history", label: "History", href: "/investor/history" },
  { icon: "settings", label: "Settings", href: "/investor/settings" },
];

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebar, contentMargin } = CollapsibleSidebar({
    navItems,
    roleLabel: "Investor",
    basePath: "/investor",
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
