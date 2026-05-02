import axios from 'axios';
import { Anime, CalendarDay } from '../types/anime';

const BANGUMI_API_BASE = 'https://api.bgm.tv';
const DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const detailCache = new Map<number, { value: Anime; expiresAt: number }>();

export const GENRE_OPTIONS = ['全部', '奇幻', '恋爱', '战斗', '日常', '异世界', '悬疑', '科幻', '搞笑', '治愈', '国创', '漫改', '原创', '其他'] as const;

const GENRE_KEYWORDS: Record<string, string[]> = {
  奇幻: ['奇幻', '魔法', '魔女', '妖怪', '神话', '冒险'],
  恋爱: ['恋爱', '爱情', '校园恋爱', 'ラブコメ', 'love'],
  战斗: ['战斗', '动作', '热血', '武侠', '机战', '格斗'],
  日常: ['日常', '校园', '空气系', '生活'],
  异世界: ['异世界', '转生', '穿越'],
  悬疑: ['悬疑', '推理', '犯罪', '惊悚', '侦探'],
  科幻: ['科幻', '机器人', '赛博朋克', '未来', 'SF'],
  搞笑: ['搞笑', '喜剧', '吐槽', 'ギャグ'],
  治愈: ['治愈', '温馨', '萌', '轻百合'],
  国创: ['国创', '国产', '中国', 'WEB'],
  漫改: ['漫画改', '漫改'],
  原创: ['原创'],
};

const normalizeImageUrl = (url: string | undefined) => url?.replace(/^http:\/\/lain\.(bgm|bangumi)\.tv\//, 'https://lain.$1.tv/');

const normalizeCalendarImages = (data: CalendarDay[]): CalendarDay[] =>
  data.map((day) => ({
    ...day,
    items: day.items.map((item) => ({
      ...item,
      images: item.images
        ? {
            large: normalizeImageUrl(item.images.large),
            common: normalizeImageUrl(item.images.common),
            medium: normalizeImageUrl(item.images.medium),
            small: normalizeImageUrl(item.images.small),
            grid: normalizeImageUrl(item.images.grid),
          }
        : item.images,
    })),
  }));

const getCachedDetail = (id: number) => {
  const cached = detailCache.get(id);
  if (!cached || cached.expiresAt <= Date.now()) {
    detailCache.delete(id);
    return null;
  }
  return cached.value;
};

const setCachedDetail = (id: number, value: Anime) => {
  detailCache.set(id, { value, expiresAt: Date.now() + DETAIL_CACHE_TTL_MS });
};

export const getAnimeGenres = (anime: Anime) => {
  const tagNames = [...(anime.meta_tags || []), ...(anime.tags || []).map((tag) => tag.name)];
  const normalized = tagNames.map((tag) => tag.toLowerCase());
  const genres = Object.entries(GENRE_KEYWORDS).flatMap(([genre, keywords]) => {
    const matched = keywords.some((keyword) => normalized.some((tag) => tag.includes(keyword.toLowerCase())));
    return matched ? [genre] : [];
  });

  return genres.length > 0 ? genres : ['其他'];
};

const mergeAnimeDetail = (anime: Anime, detail: Anime): Anime => {
  const merged = {
    ...anime,
    summary: detail.summary || anime.summary,
    images: detail.images || anime.images,
    rating: detail.rating || anime.rating,
    collection: detail.collection || anime.collection,
    eps: detail.eps || anime.eps,
    meta_tags: detail.meta_tags,
    tags: detail.tags,
  };

  return { ...merged, genres: getAnimeGenres(merged) };
};

export const getAnimeCalendar = async (): Promise<CalendarDay[]> => {
  try {
    const response = await axios.get(`${BANGUMI_API_BASE}/calendar`);
    return normalizeCalendarImages(response.data);
  } catch (error) {
    console.error('Error fetching anime calendar:', error);
    return [];
  }
};

export const getAnimeDetails = async (id: number) => {
  const cached = getCachedDetail(id);
  if (cached) return cached;

  try {
    const response = await axios.get(`${BANGUMI_API_BASE}/v0/subjects/${id}`);
    const detail = response.data as Anime;
    setCachedDetail(id, detail);
    return detail;
  } catch (error) {
    console.error(`Error fetching anime details for id ${id}:`, error);
    return null;
  }
};

export const enrichAnimeDetails = async (items: Anime[], limit = 40): Promise<Anime[]> => {
  const itemsToEnrich = items.slice(0, limit);
  const enrichedItems = await Promise.all(itemsToEnrich.map(async (anime) => {
    const detail = await getAnimeDetails(anime.id);
    return detail ? mergeAnimeDetail(anime, detail) : { ...anime, genres: getAnimeGenres(anime) };
  }));

  const enrichedById = new Map(enrichedItems.map((anime) => [anime.id, anime]));

  return items.map((anime) => enrichedById.get(anime.id) || anime);
};
