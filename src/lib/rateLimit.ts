type TokenBucket = {
  tokens: number;
  lastRefill: number;
};

type RateLimitConfig = {
  capacity: number;
  refillPerMs: number;
};

const buckets = new Map<string, TokenBucket>();

function getBucket(key: string, config: RateLimitConfig): TokenBucket {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing) {
    const bucket = { tokens: config.capacity, lastRefill: now };
    buckets.set(key, bucket);
    return bucket;
  }

  const elapsed = now - existing.lastRefill;
  if (elapsed > 0) {
    const refill = elapsed * config.refillPerMs;
    existing.tokens = Math.min(config.capacity, existing.tokens + refill);
    existing.lastRefill = now;
  }

  return existing;
}

export function isRateLimited(key: string, config: RateLimitConfig): boolean {
  const bucket = getBucket(key, config);
  if (bucket.tokens < 1) {
    return true;
  }
  bucket.tokens -= 1;
  return false;
}

export const SEARCH_RATE_LIMIT: RateLimitConfig = {
  capacity: 30,
  refillPerMs: 30 / 60000,
};
