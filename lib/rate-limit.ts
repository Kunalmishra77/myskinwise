export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the caller may retry. Only meaningful when blocked. */
  retryAfter: number;
  remaining: number;
};

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

/**
 * Fixed-window limiter held in process memory.
 *
 * Honest about what this is: it protects a single server instance. On a
 * multi-instance deployment each instance keeps its own counter, so the
 * effective limit is `limit x instances`. That is still enough to stop the
 * abuse this actually faces — a script hammering the submit endpoint from
 * one address — and it costs nothing.
 *
 * The production upgrade is a shared store (Upstash Redis has a free tier
 * covering this volume; see docs/status/stage-2-completion.md). Swapping it
 * means implementing `RateLimiter` and changing the factory below, with no
 * change at the call site.
 */
export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now >= entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      // Opportunistic sweep so a long-lived process cannot grow unbounded
      // from one-off keys. Cheap because it only runs on a fresh window.
      if (this.hits.size > 5000) {
        for (const [k, v] of this.hits) if (now >= v.resetAt) this.hits.delete(k);
      }
      return { allowed: true, retryAfter: 0, remaining: this.limit - 1 };
    }

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        remaining: 0,
      };
    }

    entry.count += 1;
    return { allowed: true, retryAfter: 0, remaining: this.limit - entry.count };
  }
}

/**
 * Five submissions per IP per ten minutes.
 *
 * Sized against real behaviour rather than a round number: a genuine user
 * submits once, and a household or office behind one NAT address might
 * produce a handful. Anything past five in ten minutes is a script. The
 * key is the IP, never the phone number — anonymous users have no identity
 * to key on, and keying on a submitted field would let an attacker evade
 * the limit by changing it.
 */
export const submitLimiter: RateLimiter = new MemoryRateLimiter(5, 10 * 60 * 1000);

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is client-controlled and trivially spoofed, so this is
 * a speed bump rather than a security boundary — which is the correct
 * expectation for rate limiting. Real enforcement belongs at the edge
 * (Vercel/Cloudflare), which sets a trustworthy value.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
