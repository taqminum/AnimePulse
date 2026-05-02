import { NextResponse } from 'next/server';
import axios from 'axios';
import { getCached, setCached } from '@/lib/cache';
import { incrementMetric, recordTiming } from '@/lib/metrics';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp, readJsonBody } from '@/lib/request';
import { Anime } from '@/types/anime';

export const runtime = 'nodejs';

const CORE_KOLS = ['泛式', '瓶子君152', '凉风Kaze', '哔哩哔哩番剧', '动画区', 'LexBurner', '阿正', '木鱼水心'];
const BLACKLIST_KEYWORDS = ['搬运', '剪辑', '纯享', '熟肉', '生肉', '片段', '合集', '1080P'];
const TREND_CACHE_TTL_MS = 1000 * 60 * 45;
const TREND_RATE_LIMIT = 10;
const TREND_RATE_WINDOW_MS = 1000 * 60;
const MAX_ITEMS = 40;

interface TrendRequestItem {
  id?: unknown;
  name?: unknown;
  name_cn?: unknown;
}

interface BilibiliVideoItem {
  title?: string;
  description?: string;
  author?: string;
  play?: number | string;
  bvid?: string;
}

interface BilibiliResultGroup {
  result_type?: string;
  data?: BilibiliVideoItem[];
}

interface BilibiliSearchResponse {
  code?: number;
  data?: {
    result?: BilibiliResultGroup[];
  };
}

interface BilibiliTrend {
  id: number;
  bilibiliHeat: number;
  bilibiliPlayTotal: number;
  bilibiliVideoCount: number;
  bilibiliKolCount: number;
}

const stripKeywordTags = (value = '') => value.replace(/<em class="keyword">|<\/em>/g, '');

const toNumber = (value: number | string | undefined) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const normalized = value.trim().toLowerCase();
  if (normalized.endsWith('万')) return Number.parseFloat(normalized) * 10000 || 0;
  return Number.parseFloat(normalized.replace(/,/g, '')) || 0;
};

const isRelevantVideo = (video: BilibiliVideoItem, animeName: string) => {
  const rawTitle = video.title || '';
  const title = stripKeywordTags(rawTitle).toLowerCase();
  const lowerAnimeName = animeName.toLowerCase();
  const animeKey = lowerAnimeName.length > 2 ? lowerAnimeName.substring(0, 4) : lowerAnimeName;
  const isRelevant = title.includes(lowerAnimeName) || title.includes(animeKey);
  if (!isRelevant) return false;

  const isBlacklisted = BLACKLIST_KEYWORDS.some((keyword) => title.includes(keyword.toLowerCase()));
  const author = video.author || '';
  const isCoreKol = CORE_KOLS.some((keyword) => author.includes(keyword) || title.includes(keyword.toLowerCase()));
  return !!video.bvid && (isCoreKol || !isBlacklisted);
};

const fetchTrend = async (anime: Pick<Anime, 'id' | 'name' | 'name_cn'>): Promise<BilibiliTrend> => {
  const animeName = anime.name_cn || anime.name;
  const cacheKey = `bilibili-trend:${anime.id}:${animeName}`;
  const cached = await getCached<BilibiliTrend>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get<BilibiliSearchResponse>('https://api.bilibili.com/x/web-interface/search/all/v2', {
      params: { keyword: `${animeName} 评价 热度 新番` },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Referer: 'https://www.bilibili.com/',
        Cookie: 'buvid3=INFOC',
      },
      timeout: 5000,
    });

    const videos = response.data?.data?.result?.find((result) => result.result_type === 'video')?.data || [];
    const relevantVideos = videos.filter((video) => isRelevantVideo(video, animeName)).slice(0, 10);
    const bilibiliPlayTotal = relevantVideos.reduce((total, video) => total + toNumber(video.play), 0);
    const bilibiliVideoCount = relevantVideos.length;
    const bilibiliKolCount = relevantVideos.filter((video) => CORE_KOLS.some((keyword) => (video.author || '').includes(keyword))).length;
    const bilibiliHeat = Math.round(Math.log10(bilibiliPlayTotal + 1) * 1200 + bilibiliVideoCount * 180 + bilibiliKolCount * 700);
    const trend = { id: anime.id, bilibiliHeat, bilibiliPlayTotal, bilibiliVideoCount, bilibiliKolCount };

    await setCached(cacheKey, trend, TREND_CACHE_TTL_MS);
    return trend;
  } catch {
    return { id: anime.id, bilibiliHeat: 0, bilibiliPlayTotal: 0, bilibiliVideoCount: 0, bilibiliKolCount: 0 };
  }
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    incrementMetric('api.bilibili_trends.request');
    const clientIp = getClientIp(request);
    if (await isRateLimited(`bilibili-trends:${clientIp}`, TREND_RATE_LIMIT, TREND_RATE_WINDOW_MS)) {
      incrementMetric('api.bilibili_trends.rate_limited');
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await readJsonBody<{ animeItems?: TrendRequestItem[] }>(request);
    if (!body || !Array.isArray(body.animeItems)) {
      incrementMetric('api.bilibili_trends.bad_request');
      return NextResponse.json({ error: 'animeItems must be an array' }, { status: 400 });
    }

    const animeItems = body.animeItems
      .filter((item): item is Pick<Anime, 'id' | 'name' | 'name_cn'> => typeof item.id === 'number' && typeof item.name === 'string')
      .slice(0, MAX_ITEMS);

    const trends = await Promise.all(animeItems.map(fetchTrend));
    incrementMetric('api.bilibili_trends.success');
    recordTiming('api.bilibili_trends.duration_ms', Date.now() - startedAt);
    return NextResponse.json({ trends });
  } catch (error) {
    incrementMetric('api.bilibili_trends.error');
    console.error('Error in bilibili-trends API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
