/**
 * Basic In-Memory Rate Limiter for Next.js API Routes.
 * In production 2026 systems, this is backed by Redis (e.g., Upstash).
 * This implementation provides immediate protection against brute force
 * for the current serverless instance footprint.
 */

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitTracker>();

export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimits.get(ip);

  // Clean up expired or create new
  if (!record || now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  // Increment existing
  record.count += 1;
  rateLimits.set(ip, record);

  if (record.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - record.count };
}

/**
 * Standard helper for login endpoints: 5 attempts per 15 minutes.
 */
export function getLoginRateLimit(ip: string) {
  return checkRateLimit(`login_${ip}`, 5, 15 * 60 * 1000);
}

/**
 * Standard helper for sensitive API endpoints (like disbursements): 10 attempts per minute.
 */
export function getApiRateLimit(ip: string) {
  return checkRateLimit(`api_${ip}`, 10, 60 * 1000);
}
