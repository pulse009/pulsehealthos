import 'server-only';
import { logger, Events } from '@/lib/logger';

/**
 * Fixed-window rate limiting.
 *
 * The default store is in-process, which means limits are enforced *per
 * instance*. That is honest and adequate for a single-node deployment and for
 * blunting credential-stuffing, but it is not a distributed limiter: behind N
 * replicas the effective ceiling is N × limit. `RATE_LIMIT_REDIS_URL` is
 * reserved for a shared store; until one is wired up, treat these numbers as a
 * per-instance guard rail rather than a hard quota.
 */

interface Counter {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Counter>();
let lastSweep = Date.now();

/** Drop expired counters so the map cannot grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, counter] of buckets) {
    if (counter.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1_000;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1_000),
  };
}

/** Named policies, so limits are declared in one place. */
export const RateLimits = {
  LOGIN: { limit: 8, windowSeconds: 300 },
  WEBHOOK: { limit: 600, windowSeconds: 60 },
  API_WRITE: { limit: 120, windowSeconds: 60 },
  API_READ: { limit: 600, windowSeconds: 60 },
  CRON: { limit: 30, windowSeconds: 60 },
} as const;

export function enforce(
  key: string,
  policy: { limit: number; windowSeconds: number },
  context?: Record<string, unknown>,
): RateLimitResult {
  const result = rateLimit(key, policy.limit, policy.windowSeconds);
  if (!result.allowed) {
    logger.warn(Events.RATE_LIMITED, 'Rate limit exceeded', { key, ...context });
  }
  return result;
}

/**
 * Best-effort client address. `x-forwarded-for` is only trustworthy behind a
 * proxy that overwrites it; treat the result as a heuristic, never as identity.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? 'unknown';
}

/** Clears state between tests. */
export function __resetRateLimits(): void {
  buckets.clear();
}
