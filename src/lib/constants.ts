/* ------------------------------------------------------------------ */
/*  FlockFund  —  Shared Constants                                    */
/*  Single source of truth for role definitions, colors, and labels   */
/* ------------------------------------------------------------------ */

import type { UserRole } from "@/types";

/**
 * All valid user roles in the system.
 * Update this array when adding new roles — it propagates everywhere.
 */
export const ROLES: UserRole[] = [
  "admin",
  "farm_manager",
  "sales_manager",
  "accountant",
  "keeper",
  "investor",
];

/**
 * Human-readable labels for each role.
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  farm_manager: "Farm Manager",
  keeper: "Keeper",
  investor: "Investor",
  sales_manager: "Sales Manager",
  accountant: "Accountant",
};

/**
 * Tailwind class pairs for role badge styling.
 */
export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700",
  farm_manager: "bg-sky-100 text-sky-700",
  keeper: "bg-amber-100 text-amber-700",
  investor: "bg-emerald-100 text-emerald-700",
  sales_manager: "bg-purple-100 text-purple-700",
  accountant: "bg-blue-100 text-blue-700",
};

/**
 * Maps a role string to its dashboard base path.
 * Used by middleware and role-switch redirect logic.
 */
export const ROLE_DASHBOARD_MAP: Record<string, string> = {
  admin: "/admin",
  farm_manager: "/manager",
  keeper: "/keeper",
  investor: "/investor",
  accountant: "/accountant",
  sales_manager: "/sales-manager",
};

/**
 * All dashboard route prefixes that require authentication.
 * Derived from ROLE_DASHBOARD_MAP values + /community.
 */
export const DASHBOARD_ROUTES: string[] = [
  "/admin",
  "/manager",
  "/keeper",
  "/investor",
  "/accountant",
  "/sales-manager",
  "/community",
];
