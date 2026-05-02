import { NextResponse } from 'next/server';
import { summarizeAnimeInsight } from '@/services/llm';
import { getCached, setCached } from '@/lib/cache';
import { incrementMetric, recordTiming } from '@/lib/metrics';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp, readJsonBody } from '@/lib/request';
import { BilibiliReference } from '@/types/anime';
import axios from 'axios';

export const runtime = 'nodejs';

// 核心 KOL 库：这些是具有原创评价能力的头部 UP 主
const CORE_KOLS = [
  '泛式', '瓶子君152', '凉风Kaze', '哔哩哔哩番剧', '动画区', 'LexBurner', '阿正', '木鱼水心'
];

// 排除搬运/剪辑的黑名单关键词
const BLACKLIST_KEYWORDS = ['搬运', '剪辑', '纯享', '熟肉', '生肉', '片段', '合集', '1080P'];
const INSIGHT_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const BILIBILI_CACHE_TTL_MS = 1000 * 60 * 30;
const INSIGHT_RATE_LIMIT = 12;
const INSIGHT_RATE_WINDOW_MS = 1000 * 60;

interface BilibiliVideoItem {
  title?: string;
  description?: string;
  author?: string;
  play?: number | string;
  bvid?: string;
  typename?: string;
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

const stripKeywordTags = (value = '') => value.replace(/<em class="keyword">|<\/em>/g, '');

const fetchRealBilibiliInfo = async (animeName: string): Promise<BilibiliReference[]> => {
  const cacheKey = `bilibili-search:${animeName}`;
  const cachedData = await getCached<BilibiliReference[]>(cacheKey);
  if (cachedData) return cachedData;

  try {
    // 搜索词组合，优先搜索番剧名+评价类关键词
    const searchKeywords = `${animeName} 评价 锐评 泛式 瓶子君`;
    const response = await axios.get<BilibiliSearchResponse>(`https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${encodeURIComponent(searchKeywords)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Cookie': 'buvid3=INFOC'
      },
      timeout: 5000
    });

    if (response.data?.code === 0 && response.data?.data?.result) {
      const videoResult = response.data.data.result.find((r) => r.result_type === 'video');
      if (videoResult && videoResult.data) {
        const references = videoResult.data
          .filter((v) => {
            const rawTitle = v.title || '';
            const title = stripKeywordTags(rawTitle).toLowerCase();
            const lowerAnimeName = animeName.toLowerCase();
            
            // 1. 强匹配：标题中必须包含番剧名的关键部分
            // 考虑中文名可能被拆分，我们取前两个字或完整名字进行匹配
            const animeKey = lowerAnimeName.length > 2 ? lowerAnimeName.substring(0, 4) : lowerAnimeName;
            const isRelevant = title.includes(lowerAnimeName) || title.includes(animeKey);
            
            if (!isRelevant) return false;

            // 2. 过滤搬运号
            const isBlacklisted = BLACKLIST_KEYWORDS.some(k => title.includes(k.toLowerCase()));
            const author = v.author || '';
            const isCoreKOL = CORE_KOLS.some(k => author.includes(k) || title.includes(k.toLowerCase()));
            return !!v.bvid && (isCoreKOL || !isBlacklisted);
          })
          .slice(0, 10)
          .map((v) => ({
            title: stripKeywordTags(v.title),
            description: v.description || '',
            author: v.author || '未知 UP 主',
            play: v.play || 0,
            url: `https://www.bilibili.com/video/${v.bvid}`,
            isKOL: CORE_KOLS.some(k => (v.author || '').includes(k)),
            type: v.typename || 'video'
          }));
        await setCached(cacheKey, references, BILIBILI_CACHE_TTL_MS);
        return references;
      }
    }
    return [];
  } catch {
    console.warn('Real Bilibili search failed.');
    return [];
  }
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    incrementMetric('api.anime_insight.request');
    const clientIp = getClientIp(request);
    if (await isRateLimited(`insight:${clientIp}`, INSIGHT_RATE_LIMIT, INSIGHT_RATE_WINDOW_MS)) {
      incrementMetric('api.anime_insight.rate_limited');
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await readJsonBody<{ animeName?: unknown }>(request);
    if (!body) {
      incrementMetric('api.anime_insight.bad_request');
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { animeName } = body;
    if (typeof animeName !== 'string' || animeName.trim().length === 0) {
      incrementMetric('api.anime_insight.bad_request');
      return NextResponse.json({ error: 'animeName is required' }, { status: 400 });
    }
    const normalizedAnimeName = animeName.trim();
    const cacheKey = `anime-insight:${normalizedAnimeName}`;
    const cachedInsight = await getCached(cacheKey);
    if (cachedInsight) {
      incrementMetric('api.anime_insight.success');
      recordTiming('api.anime_insight.duration_ms', Date.now() - startedAt);
      return NextResponse.json(cachedInsight);
    }
    
    // 1. 获取 B 站真实搜索结果
    const realBiliData = await fetchRealBilibiliInfo(normalizedAnimeName);
    
    // 2. 调用 LLM 进行深度汇总
    const insight = await summarizeAnimeInsight(normalizedAnimeName, realBiliData);
    
    if (!insight) {
      incrementMetric('api.anime_insight.ai_failed');
      return NextResponse.json({ error: 'LLM failed' }, { status: 500 });
    }
    
    // 返回包含原始参考资料的结果
    const responseBody = {
      ...insight,
      references: realBiliData
    };
    await setCached(cacheKey, responseBody, INSIGHT_CACHE_TTL_MS);
    incrementMetric('api.anime_insight.success');
    recordTiming('api.anime_insight.duration_ms', Date.now() - startedAt);
    return NextResponse.json(responseBody);
  } catch (error) {
    incrementMetric('api.anime_insight.error');
    console.error('Error in anime-insight API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
