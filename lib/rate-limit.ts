import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Lazy singleton — only instantiated when first called.
 * This prevents a module-load crash when UPSTASH_* env vars are absent
 * (e.g. local dev without Redis, or Vercel before env vars are set).
 */
let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
    });
  }
  return _ratelimit;
}

export const ratelimit = {
  limit: (identifier: string) => getRatelimit().limit(identifier),
};
