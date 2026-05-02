'use client';

import { useEffect, useState } from 'react';
import { GENRE_OPTIONS, enrichAnimeDetails, getAnimeCalendar } from '../services/bangumi';
import { Anime, AnimeSummary } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard';
import { AnimeDetail } from '../components/AnimeDetail';
import { Sparkles, TrendingUp, LayoutList, Tags, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// 常见长篇连载/民工漫关键词或 ID
const LONG_RUNNING_KEYWORDS = [
  '航海王', '海贼王', '名侦探柯南', '蜡笔小新', '哆啦A梦', 
  '樱桃小丸子', '宝可梦', '火影忍者', '银魂', '海螺小姐', 
  '面包超人', '龙珠', '死神', 'BLEACH'
];

interface BilibiliTrend {
  id: number;
  bilibiliHeat: number;
  bilibiliPlayTotal: number;
  bilibiliVideoCount: number;
  bilibiliKolCount: number;
}

type GenreOption = typeof GENRE_OPTIONS[number];

const getCompositeHeat = (anime: Anime) => (anime.collection?.doing || 0) + (anime.bilibiliHeat || 0);

const sortByCompositeHeat = (data: Anime[]) => {
  return [...data].sort((a, b) => {
    const heatDiff = getCompositeHeat(b) - getCompositeHeat(a);
    if (heatDiff !== 0) return heatDiff;
    return (b.rating?.score || 0) - (a.rating?.score || 0);
  });
};

export default function Home() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [longRunningList, setLongRunningList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [activeGenre, setActiveGenre] = useState<GenreOption>('全部');

  useEffect(() => {
    const fetchSummaries = async (items: Anime[]) => {
      try {
        const response = await axios.post('/api/anime-summaries', { animeItems: items });
        const { summaries } = response.data as { summaries: AnimeSummary[] };
        
        setAnimeList(prev => prev.map(anime => {
          const found = summaries.find((s) => s.id === anime.id);
          return found ? { ...anime, summary: found.summary } : anime;
        }));
      } catch (err) {
        console.error('Failed to fetch summaries:', err);
      }
    };

    const fetchBilibiliTrends = async (items: Anime[]) => {
      setTrendLoading(true);
      try {
        const response = await axios.post('/api/bilibili-trends', { animeItems: items });
        const { trends } = response.data as { trends: BilibiliTrend[] };
        const trendById = new Map(trends.map((trend) => [trend.id, trend]));
        const mergeTrend = (anime: Anime) => {
          const trend = trendById.get(anime.id);
          return trend ? { ...anime, ...trend } : anime;
        };

        setAnimeList((prev) => sortByCompositeHeat(prev.map(mergeTrend)));
        setLongRunningList((prev) => sortByCompositeHeat(prev.map(mergeTrend)));
      } catch (err) {
        console.error('Failed to fetch Bilibili trends:', err);
      } finally {
        setTrendLoading(false);
      }
    };

    const fetchAndProcessData = async () => {
      try {
        const calendarData = await getAnimeCalendar();
        const flattened = calendarData.flatMap(day => day.items);
        const uniqueAnime = Array.from(new Map(flattened.map(item => [item.id, item])).values());
        
        // 分离长篇连载和当季新番
        const longRunning: Anime[] = [];
        const seasonal: Anime[] = [];

        uniqueAnime.forEach(anime => {
          const name = (anime.name_cn || anime.name).toLowerCase();
          const isLongRunning = LONG_RUNNING_KEYWORDS.some(k => name.includes(k.toLowerCase())) || ((anime.eps ?? 0) > 100);
          
          if (isLongRunning) {
            longRunning.push(anime);
          } else {
            seasonal.push(anime);
          }
        });

        const sortedSeasonal = sortByCompositeHeat(seasonal);
        const sortedLongRunning = sortByCompositeHeat(longRunning);
        const enriched = await enrichAnimeDetails([...sortedSeasonal, ...sortedLongRunning], 40);
        const enrichedById = new Map(enriched.map((anime) => [anime.id, anime]));
        const enrichedSeasonal = sortedSeasonal.map((anime) => enrichedById.get(anime.id) || anime);
        const enrichedLongRunning = sortedLongRunning.map((anime) => enrichedById.get(anime.id) || anime);
        
        setAnimeList(sortByCompositeHeat(enrichedSeasonal));
        setLongRunningList(sortByCompositeHeat(enrichedLongRunning));

        // 异步获取并更新摘要
        fetchSummaries(enrichedSeasonal.slice(0, 15));
        fetchBilibiliTrends(enriched.slice(0, 40));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcessData();
  }, []);

  const allAnime = sortByCompositeHeat([...animeList, ...longRunningList]);
  const genreCounts = GENRE_OPTIONS.reduce<Record<string, number>>((counts, genre) => {
    counts[genre] = genre === '全部'
      ? allAnime.length
      : allAnime.filter((anime) => anime.genres?.includes(genre)).length;
    return counts;
  }, {});
  const visibleAnime = activeGenre === '全部'
    ? allAnime
    : allAnime.filter((anime) => anime.genres?.includes(activeGenre));

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* PC Side Header (Sticky) */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8 md:pt-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm shadow-primary/20">
                <Sparkles className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                Anime<span className="text-accent">Pulse</span>
              </h1>
            </motion.div>
            <p className="text-foreground/70 max-w-md text-sm leading-relaxed">
              聚合 Bangumi 题材标签与 Bilibili 热议线索，用 AI 追踪番剧口碑、热度与社区共识
            </p>
          </div>

          <div className="flex items-center gap-3 bg-card border border-border px-5 py-4 rounded-[1.5rem] shadow-sm shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/15">
            <Flame size={18} className="text-accent" />
            <div>
              <div className="text-xs font-black text-foreground">综合热度排序</div>
              <div className="text-[10px] text-foreground/55">Bangumi 在看 + B站热议{trendLoading ? ' · 更新中' : ''}</div>
            </div>
          </div>
        </header>

        {/* List Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 w-full bg-secondary animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start">
            <aside className="lg:sticky lg:top-8 bg-card border border-border rounded-[2rem] p-4 shadow-sm shadow-primary/10">
              <div className="flex items-center gap-2 px-2 mb-4 text-xs font-black text-foreground uppercase tracking-widest">
                <Tags size={15} className="text-accent" />
                题材分类
              </div>
              <div className="scrollbar-hide flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setActiveGenre(genre)}
                    className={`flex-shrink-0 flex items-center justify-between gap-5 rounded-2xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      activeGenre === genre
                        ? 'bg-primary text-white shadow-sm shadow-primary/25'
                        : 'bg-secondary text-foreground/70 hover:bg-primary/15 hover:text-foreground'
                    }`}
                  >
                    <span>{genre}</span>
                    <span className={`text-[10px] ${activeGenre === genre ? 'text-white/80' : 'text-foreground/45'}`}>{genreCounts[genre] || 0}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs font-semibold text-foreground/55 uppercase tracking-widest px-2 md:px-4 mb-2">
                <div className="flex items-center gap-2">
                  <LayoutList size={14} className="text-accent" />
                  {activeGenre}题材 ({visibleAnime.length})
                </div>
                <div className="flex items-center gap-2 text-[10px] normal-case tracking-normal">
                  <TrendingUp size={13} />
                  前 40 部已补全题材与 B站热度
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {visibleAnime.map((anime, index) => (
                  <AnimeCard 
                    key={anime.id} 
                    anime={anime} 
                    index={index}
                    onClick={() => setSelectedAnime(anime)}
                  />
                ))}
                {visibleAnime.length === 0 && (
                  <div className="rounded-[2rem] border border-dashed border-border bg-card p-10 text-center text-sm font-bold text-foreground/55">
                    当前题材暂无已补全的番剧
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAnime && (
          <AnimeDetail 
            anime={selectedAnime} 
            isOpen={!!selectedAnime} 
            onClose={() => setSelectedAnime(null)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}
