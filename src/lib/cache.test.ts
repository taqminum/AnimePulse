import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMemoryCacheForTest, getCached, setCached } from './cache';

describe('cache memory fallback', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    clearMemoryCacheForTest();
  });

  it('stores and reads cached values without Redis', async () => {
    await setCached('test:key', { value: 1 }, 1000);

    await expect(getCached<{ value: number }>('test:key')).resolves.toEqual({ value: 1 });
  });

  it('expires cached values', async () => {
    vi.useFakeTimers();

    await setCached('test:ttl', 'value', 1000);
    vi.advanceTimersByTime(1001);

    await expect(getCached<string>('test:ttl')).resolves.toBeNull();

    vi.useRealTimers();
  });
});
