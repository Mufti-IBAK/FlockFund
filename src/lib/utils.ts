/* ------------------------------------------------------------------ */
/*  FlockFund  —  Shared Utility Functions                            */
/*  Reusable helpers used across dashboard pages and hooks            */
/* ------------------------------------------------------------------ */

/**
 * Returns a human-readable relative time string (e.g. "3 min ago").
 * Used in activity feeds, dashboards, notification timestamps.
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/**
 * Formats a number as Nigerian Naira with abbreviation.
 * Examples: 1500000 → "₦1.5M", 45000 → "₦45K", 800 → "₦800"
 */
export function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}
