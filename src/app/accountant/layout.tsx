"use client";

import { TopBarUserProfile } from "@/components/UserProfile";
import { NotificationBell } from "@/components/NotificationBell";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";

const navItems = [
  { icon: "dashboard", label: "Overview", href: "/accountant" },
  {
    icon: "account_balance_wallet",
    label: "Disbursements",
    href: "/accountant/disbursements",
  },
  {
    icon: "receipt_long",
    label: "Invoices & Receipts",
    href: "/accountant/assets",
  },
  {
    icon: "trending_up",
    label: "Payout Forecasting",
    href: "/accountant/projections",
  },
  { icon: "shopping_cart", label: "Invest", href: "/investor/invest" },
  { icon: "analytics", label: "Data Insights", href: "/accountant/insights" },
  { icon: "settings", label: "Settings", href: "/accountant/settings" },
];

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebar, contentMargin } = CollapsibleSidebar({
    navItems,
    roleLabel: "Accountant / Analyst",
    basePath: "/accountant",
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
