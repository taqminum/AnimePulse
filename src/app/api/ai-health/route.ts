import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const probe = url.searchParams.get('probe') === '1';

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const configured = !!openaiApiKey && openaiApiKey !== 'your-api-key';

  if (!probe) {
    return NextResponse.json({ configured, baseURL });
  }

  if (!configured) {
    return NextResponse.json({ configured, baseURL, ok: false, reason: 'OPENAI_API_KEY not set' });
  }

  const startedAt = Date.now();

  try {
    const openai = new OpenAI({ apiKey: openaiApiKey, baseURL });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    });

    return NextResponse.json({
      configured,
      baseURL,
      ok: true,
      model: completion.model,
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json({
      configured,
      baseURL,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: 'OpenAI request failed',
    });
  }
}

