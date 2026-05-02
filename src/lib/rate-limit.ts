import { isRedisConfigured, redisCommand } from './redis';
import { incrementMetric } from './metrics';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

const isMemoryRateLimited = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (bucket.count >= limit) {
    return true;
  }

  bucket.count += 1;
  return false;
};

export const isRateLimited = async (key: string, limit: number, windowMs: number) => {
  if (!isRedisConfigured()) {
    const limited = isMemoryRateLimited(key, limit, windowMs);
    incrementMetric(limited ? 'rate_limit.memory.blocked' : 'rate_limit.memory.allowed');
    return limited;
  }

  try {
    const count = await redisCommand<number>(['INCR', key]);

    if (count === 1) {
      await redisCommand(['EXPIRE', key, Math.ceil(windowMs / 1000)]);
    }

    const limited = (count || 0) > limit;
    incrementMetric(limited ? 'rate_limit.redis.blocked' : 'rate_limit.redis.allowed');
    return limited;
  } catch {
    incrementMetric('rate_limit.redis.error');
    const limited = isMemoryRateLimited(key, limit, windowMs);
    incrementMetric(limited ? 'rate_limit.memory.blocked' : 'rate_limit.memory.allowed');
    return limited;
  }
};

export const clearRateLimitBucketsForTest = () => {
  buckets.clear();
};
