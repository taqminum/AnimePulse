import { NextResponse } from 'next/server';
import { createAiClient } from '@/lib/ai';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const probe = url.searchParams.get('probe') === '1';

  const { client, config } = createAiClient();

  if (!probe) {
    return NextResponse.json({ configured: config.configured, baseURL: config.baseURL, model: config.model });
  }

  if (!config.configured || !client) {
    return NextResponse.json({
      configured: config.configured,
      baseURL: config.baseURL,
      model: config.model,
      ok: false,
      reason: 'AI_API_KEY not set',
    });
  }

  const startedAt = Date.now();

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    });

    return NextResponse.json({
      configured: config.configured,
      baseURL: config.baseURL,
      ok: true,
      model: completion.model,
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json({
      configured: config.configured,
      baseURL: config.baseURL,
      model: config.model,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: 'AI request failed',
    });
  }
}

