import { describe, expect, it } from 'vitest';
import { getClientIp, readJsonBody } from './request';

describe('request helpers', () => {
  it('uses the first x-forwarded-for IP', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' },
    });

    expect(getClientIp(request)).toBe('1.1.1.1');
  });

  it('falls back to x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '3.3.3.3' },
    });

    expect(getClientIp(request)).toBe('3.3.3.3');
  });

  it('returns null for invalid JSON', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: 'not-json',
    });

    await expect(readJsonBody(request)).resolves.toBeNull();
  });
});
