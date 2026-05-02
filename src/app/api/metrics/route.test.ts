import { beforeEach, describe, expect, it, vi } from 'vitest';
import { incrementMetric } from '@/lib/metrics';
import { GET } from './route';

describe('GET /api/metrics', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 404 when METRICS_TOKEN is not configured', async () => {
    vi.stubEnv('METRICS_TOKEN', '');

    const response = await GET(new Request('http://localhost/api/metrics'));

    expect(response.status).toBe(404);
  });

  it('returns 401 for invalid token', async () => {
    vi.stubEnv('METRICS_TOKEN', 'secret');

    const response = await GET(new Request('http://localhost/api/metrics', {
      headers: { authorization: 'Bearer wrong' },
    }));

    expect(response.status).toBe(401);
  });

  it('returns metrics for a valid token', async () => {
    vi.stubEnv('METRICS_TOKEN', 'secret');
    incrementMetric('test.metric');

    const response = await GET(new Request('http://localhost/api/metrics', {
      headers: { authorization: 'Bearer secret' },
    }));
    const body = await response.json() as { counters: Record<string, number> };

    expect(response.status).toBe(200);
    expect(body.counters['test.metric']).toBeGreaterThanOrEqual(1);
  });
});
