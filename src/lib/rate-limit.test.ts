import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRateLimitBucketsForTest, isRateLimited } from './rate-limit';

describe('rate limit memory fallback', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    clearRateLimitBucketsForTest();
  });

  it('allows requests up to the limit and blocks after it', async () => {
    await expect(isRateLimited('test:ip', 2, 1000)).resolves.toBe(false);
    await expect(isRateLimited('test:ip', 2, 1000)).resolves.toBe(false);
    await expect(isRateLimited('test:ip', 2, 1000)).resolves.toBe(true);
  });

  it('resets after the window', async () => {
    vi.useFakeTimers();

    await expect(isRateLimited('test:reset', 1, 1000)).resolves.toBe(false);
    await expect(isRateLimited('test:reset', 1, 1000)).resolves.toBe(true);

    vi.advanceTimersByTime(1001);

    await expect(isRateLimited('test:reset', 1, 1000)).resolves.toBe(false);

    vi.useRealTimers();
  });
});
