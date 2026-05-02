import { NextResponse } from 'next/server';
import axios from 'axios';
import { createAiClient } from '@/lib/ai';
import { getCached, setCached } from '@/lib/cache';
import { incrementMetric, recordTiming } from '@/lib/metrics';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp, readJsonBody } from '@/lib/request';
import { Anime, AnimeSummary } from '@/types/anime';

export const runtime = 'nodejs';

const BANGUMI_API_BASE = 'https://api.bgm.tv';
const SUMMARY_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const SUMMARY_RATE_LIMIT = 20;
const SUMMARY_RATE_WINDOW_MS = 1000 * 60;

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    incrementMetric('api.anime_summaries.request');
    const clientIp = getClientIp(request);
    if (await isRateLimited(`summaries:${clientIp}`, SUMMARY_RATE_LIMIT, SUMMARY_RATE_WINDOW_MS)) {
      incrementMetric('api.anime_summaries.rate_limited');
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await readJsonBody<{ animeItems?: Pick<Anime, 'id'>[] }>(request);
    if (!body) {
      incrementMetric('api.anime_summaries.bad_request');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { animeItems } = body;
    if (!Array.isArray(animeItems)) {
      incrementMetric('api.anime_summaries.bad_request');
      return NextResponse.json({ error: 'animeItems must be an array' }, { status: 400 });
    }
    
    // 为了 Demo 性能，我们只对前 15 个番剧进行摘要生成
    const itemsToProcess = animeItems.slice(0, 15);
    
    const summarizedItems: AnimeSummary[] = await Promise.all(itemsToProcess.map(async (item) => {
      try {
        if (typeof item.id !== 'number') return { id: 0, summary: '简介加载失败' };

        const cacheKey = `anime-summary:${item.id}`;
        const cachedSummary = await getCached<AnimeSummary>(cacheKey);
        if (cachedSummary) return cachedSummary;

        // 1. 获取详细简介
        const detailRes = await axios.get(`${BANGUMI_API_BASE}/v0/subjects/${item.id}`);
        const fullSummary = detailRes.data.summary || '';
        
        if (!fullSummary) return { id: item.id, summary: '暂无简介' };

        // 2. 如果没有 API Key，进行简单的截断
        const { client, config } = createAiClient();

        if (!config.configured || !client) {
          const summary = { id: item.id, summary: fullSummary.slice(0, 50) + '...' };
          await setCached(cacheKey, summary, SUMMARY_CACHE_TTL_MS);
          return summary;
        }

        // 3. 使用 LLM 生成极简一句话摘要
        const prompt = `将以下动画简介缩减为一句话（20字以内），要求吸引人且保留核心设定：\n${fullSummary}`;
        const completion = await client.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
        });

        const summary = { 
          id: item.id, 
          summary: completion.choices[0].message.content?.trim() || fullSummary.slice(0, 50) 
        };
        await setCached(cacheKey, summary, SUMMARY_CACHE_TTL_MS);
        return summary;
      } catch {
        return { id: item.id, summary: '简介加载失败' };
      }
    }));

    incrementMetric('api.anime_summaries.success');
    recordTiming('api.anime_summaries.duration_ms', Date.now() - startedAt);
    return NextResponse.json({ summaries: summarizedItems });
  } catch (error) {
    incrementMetric('api.anime_summaries.error');
    console.error('Error in anime-summaries API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
