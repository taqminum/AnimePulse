import { isRedisConfigured, redisCommand } from './redis';
import { incrementMetric } from './metrics';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const getMemoryCached = <T>(key: string): T | null => {
  const entry = cache.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
};

const setMemoryCached = <T>(key: string, value: T, ttlMs: number) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

export const getCached = async <T>(key: string): Promise<T | null> => {
  if (!isRedisConfigured()) {
    const value = getMemoryCached<T>(key);
    incrementMetric(value ? 'cache.memory.hit' : 'cache.memory.miss');
    return value;
  }

  try {
    const value = await redisCommand<string>(['GET', key]);
    incrementMetric(value ? 'cache.redis.hit' : 'cache.redis.miss');
    return value ? JSON.parse(value) as T : null;
  } catch {
    incrementMetric('cache.redis.error');
    const value = getMemoryCached<T>(key);
    incrementMetric(value ? 'cache.memory.hit' : 'cache.memory.miss');
    return value;
  }
};

export const setCached = async <T>(key: string, value: T, ttlMs: number) => {
  if (!isRedisConfigured()) {
    setMemoryCached(key, value, ttlMs);
    incrementMetric('cache.memory.set');
    return;
  }

  try {
    await redisCommand(['SET', key, JSON.stringify(value), 'EX', Math.ceil(ttlMs / 1000)]);
    incrementMetric('cache.redis.set');
  } catch {
    incrementMetric('cache.redis.error');
    setMemoryCached(key, value, ttlMs);
    incrementMetric('cache.memory.set');
  }
};

export const clearMemoryCacheForTest = () => {
  cache.clear();
};
