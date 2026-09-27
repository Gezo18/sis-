import { Request, Response, NextFunction } from 'express';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class TokenBucketRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.capacity = maxRequests;
    this.windowMs = windowMs;
    this.refillRatePerSecond = maxRequests / (windowMs / 1000);

    // Periodically clean up stale buckets every 5 minutes to avoid memory leaks
    setInterval(() => this.cleanupStaleBuckets(), 5 * 60 * 1000);
  }

  private cleanupStaleBuckets() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > this.windowMs * 2) {
        this.buckets.delete(key);
      }
    }
  }

  private getBucket(key: string): TokenBucket {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
      return bucket;
    }

    // Refill tokens based on elapsed time
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSeconds * this.refillRatePerSecond);
    bucket.lastRefill = now;
    return bucket;
  }

  public check(key: string): { allowed: boolean; remaining: number; resetSeconds: number } {
    const bucket = this.getBucket(key);
    const resetSeconds = Math.ceil((this.capacity - bucket.tokens) / this.refillRatePerSecond);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetSeconds: Math.max(1, resetSeconds),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }
}

// Instantiate tier-specific limiters
export const publicRateLimiter = new TokenBucketRateLimiter(60, 60 * 1000); // 60 req/min
export const authRateLimiter = new TokenBucketRateLimiter(15, 60 * 1000);   // 15 req/min (anti-brute force)
export const healthRateLimiter = new TokenBucketRateLimiter(30, 60 * 1000); // 30 req/min

export function createRateLimiterMiddleware(limiter: TokenBucketRateLimiter, endpointType = 'general') {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Derive client identifier: Prefer authenticated user ID, fall back to forwarded IP or socket remote address
    const userId = (req.headers['x-user-id'] as string) || (req.headers['authorization'] as string) || '';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const clientKey = `${endpointType}:${userId ? `user_${userId}` : `ip_${ip}`}`;

    const { allowed, remaining, resetSeconds } = limiter.check(clientKey);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', 60);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (!allowed) {
      res.setHeader('Retry-After', resetSeconds);
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded for ${endpointType}. Please retry in ${resetSeconds} seconds.`,
        retryAfter: resetSeconds,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
