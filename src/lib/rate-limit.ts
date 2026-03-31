// Simple in-memory sliding window rate limiter for API routes
// For production, replace with Redis-based implementation

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL = 5 * 60_000; // Clean every 5 minutes

// Periodic cleanup to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
}

export function checkRateLimit(
  ip: string,
  maxRequests: number = 30
): RateLimitResult {
  const now = Date.now();
  const key = `rl:${ip}`;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: new Date(now + WINDOW_MS).toISOString(),
    };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed: entry.count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetAt: new Date(entry.resetAt).toISOString(),
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt,
  };
}
