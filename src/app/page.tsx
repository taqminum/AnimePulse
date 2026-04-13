'use client';

import { useEffect, useState } from 'react';
import { getAnimeCalendar } from '../services/bangumi';
import { CalendarDay, Anime } from '../types/anime';
import { AnimeCard } from '../components/AnimeCard';
import { AnimeDetail } from '../components/AnimeDetail';
import { Sparkles, TrendingUp, LayoutList, SortAsc, Filter, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// 常见长篇连载/民工漫关键词或 ID
const LONG_RUNNING_KEYWORDS = [
  '航海王', '海贼王', '名侦探柯南', '蜡笔小新', '哆啦A梦', 
  '樱桃小丸子', '宝可梦', '火影忍者', '银魂', '海螺小姐', 
  '面包超人', '龙珠', '死神', 'BLEACH'
];

export default function Home() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [longRunningList, setLongRunningList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [sortBy, setSortBy] = useState<'heat' | 'rating'>('heat');

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const calendarData = await getAnimeCalendar();
        let flattened = calendarData.flatMap(day => day.items);
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

        const sortedSeasonal = sortData(seasonal, sortBy);
        const sortedLongRunning = sortData(longRunning, sortBy);
        
        setAnimeList(sortedSeasonal);
        setLongRunningList(sortedLongRunning);

        // 异步获取并更新摘要
        fetchSummaries(sortedSeasonal.slice(0, 15));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcessData();
  }, [sortBy]);

  const fetchSummaries = async (items: Anime[]) => {
    try {
      const response = await axios.post('/api/anime-summaries', { animeItems: items });
      const { summaries } = response.data;
      
      setAnimeList(prev => prev.map(anime => {
        const found = summaries.find((s: any) => s.id === anime.id);
        return found ? { ...anime, summary: found.summary } : anime;
      }));
    } catch (err) {
      console.error('Failed to fetch summaries:', err);
    }
  };

  const sortData = (data: Anime[], type: 'heat' | 'rating') => {
    return [...data].sort((a, b) => {
      if (type === 'heat') {
        return (b.collection?.doing || 0) - (a.collection?.doing || 0);
      } else {
        return (b.rating?.score || 0) - (a.rating?.score || 0);
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#4b3b47] pb-20">
      {/* PC Side Header (Sticky) */}
      <div className="max-w-5xl mx-auto px-6 pt-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-[#f4a7c3] rounded-2xl flex items-center justify-center shadow-sm">
                <Sparkles className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                Animax <span className="text-[#e88fb2]">Insight</span>
              </h1>
            </motion.div>
            <p className="text-[#705463] max-w-md text-sm leading-relaxed">
              实时追踪本季度最热番剧，聚合 B 站/Bangumi 深度舆论，为你打造的柔和看板
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#fff0f6] p-1.5 rounded-2xl border border-[#f3d6e3]">
            <button
              onClick={() => setSortBy('heat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                sortBy === 'heat' 
                ? 'bg-white text-[#e88fb2] shadow-sm' 
                : 'text-[#9a7b8a] hover:text-[#705463]'
              }`}
            >
              <TrendingUp size={16} />
              按热度
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                sortBy === 'rating' 
                ? 'bg-white text-[#e88fb2] shadow-sm' 
                : 'text-[#9a7b8a] hover:text-[#705463]'
              }`}
            >
              <SortAsc size={16} />
              按评分
            </button>
          </div>
        </header>

        {/* List Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 w-full bg-[#fff0f6] animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Seasonal Anime */}
            <section className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#9a7b8a] uppercase tracking-widest px-4 mb-2">
                <div className="flex items-center gap-2">
                  <LayoutList size={14} className="text-[#e88fb2]" />
                  当季热门番剧 ({animeList.length})
                </div>
                <div className="flex items-center gap-4">
                  <span>实时热度</span>
                  <span>综合评分</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {animeList.map((anime, index) => (
                  <AnimeCard 
                    key={anime.id} 
                    anime={anime} 
                    index={index}
                    onClick={() => setSelectedAnime(anime)}
                  />
                ))}
              </div>
            </section>

            {/* Long Running Classics */}
            {longRunningList.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#9a7b8a] uppercase tracking-widest px-4 mb-2">
                  <History size={14} className="text-[#f3d6e3]" />
                  经典长篇连载 ({longRunningList.length})
                </div>
                <div className="grid grid-cols-1 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                  {longRunningList.map((anime, index) => (
                    <AnimeCard 
                      key={anime.id} 
                      anime={anime} 
                      index={animeList.length + index}
                      onClick={() => setSelectedAnime(anime)}
                    />
                  ))}
                </div>
              </section>
            )}
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
