import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('GET /api/ai-health', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('AI_API_KEY', '');
    vi.stubEnv('OPENAI_API_KEY', '');
  });

  it('returns configuration status without probing', async () => {
    const response = await GET(new Request('http://localhost/api/ai-health'));
    const body = await response.json() as { configured: boolean; model: string };

    expect(response.status).toBe(200);
    expect(body.configured).toBe(false);
    expect(body.model).toBe('deepseek-v4-flash');
  });

  it('returns a safe failure when probe is requested without a key', async () => {
    const response = await GET(new Request('http://localhost/api/ai-health?probe=1'));
    const body = await response.json() as { ok: boolean; reason: string };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('AI_API_KEY not set');
  });
});
