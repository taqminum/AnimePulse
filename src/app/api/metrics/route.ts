import { getMetricSnapshot } from '@/lib/metrics';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const token = process.env.METRICS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Metrics endpoint is not configured' }, { status: 404 });
  }

  const authorization = request.headers.get('authorization');

  if (authorization !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(getMetricSnapshot());
}
