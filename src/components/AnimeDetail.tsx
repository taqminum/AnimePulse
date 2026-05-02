'use client';

import { Anime } from '../types/anime';
import { AnimeInsight, BilibiliReference } from '../types/anime';
import { Star, Play, ArrowLeft, TrendingUp, Award, Users, Copy, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MouseEvent, useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface AnimeDetailProps {
  anime: Anime;
  isOpen: boolean;
  onClose: () => void;
}

const ReferenceItem = ({ refData }: { refData: BilibiliReference }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(refData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <a
      href={refData.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-1 p-3 bg-[#fff5f8] hover:bg-[#fff0f5] border border-[#f8bbd0] rounded-xl transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#880e4f] group-hover:text-[#ff4081] truncate font-medium flex-grow pr-2">{refData.title}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 rounded-full p-1 text-[#f8bbd0] transition-colors hover:bg-white hover:text-[#ff4081]"
          aria-label="复制 Bilibili 链接"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
      </div>
      <span className="text-[9px] text-[#f06292] font-bold truncate">UP: {refData.author} · {refData.play} 播放</span>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#ff4081] text-white text-[10px] px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
          链接已复制
        </span>
      )}
    </a>
  );
};

export const AnimeDetail = ({ anime, isOpen, onClose }: AnimeDetailProps) => {
  const [insight, setInsight] = useState<AnimeInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const coverSrc =
    anime.images?.large ||
    anime.images?.medium ||
    anime.images?.common ||
    anime.images?.small ||
    anime.images?.grid ||
    '/window.svg';

  useEffect(() => {
    if (isOpen && !insight) {
      const fetchInsight = async () => {
        setLoading(true);
        try {
          const response = await axios.post<AnimeInsight>('/api/anime-insight', { animeName: anime.name_cn || anime.name });
          setInsight(response.data);
        } catch (error) {
          console.error('Error fetching insight:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInsight();
    }
  }, [isOpen, anime, insight]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2a1420]/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="absolute inset-y-0 right-0 w-full md:w-[calc(100vw-56px)] xl:w-[1180px] bg-white overflow-y-auto shadow-2xl border-l border-[#f8bbd0]"
          >
            <button
              onClick={onClose}
              className="sticky top-5 left-5 ml-5 mt-5 z-20 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#ff4081] shadow-lg ring-1 ring-[#f8bbd0] backdrop-blur transition-all hover:bg-[#ff80ab] hover:text-white"
            >
              <ArrowLeft size={18} />
              返回列表
            </button>

            {/* Hero: Info */}
            <div className="relative min-h-[460px] md:min-h-[560px] border-b border-[#fce4ec]">
              <Image
                src={coverSrc}
                alt={anime.name_cn || anime.name}
                fill
                sizes="100vw"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a0610]/95 via-[#1a0610]/60 to-[#1a0610]/20" />
              <div className="absolute inset-x-0 bottom-0 p-7 md:p-14">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="bg-[#ff4081] text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Bangumi</span>
                    {anime.genres?.slice(0, 4).map((genre) => (
                      <span key={genre} className="bg-white/15 text-white text-[10px] px-3 py-1 rounded-full font-black backdrop-blur">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight max-w-3xl">{anime.name_cn || anime.name}</h2>
                  <div className="flex flex-wrap gap-4 text-white/90 text-sm md:text-base font-bold">
                    <span className="flex items-center gap-1.5"><Star size={18} className="text-[#ffeb3b] fill-[#ffeb3b]" /> {anime.rating?.score || 'N/A'} 分</span>
                    <span className="flex items-center gap-1.5"><Users size={18} /> {anime.rating?.total || 0} 人评分</span>
                    <span className="flex items-center gap-1.5"><TrendingUp size={18} /> {anime.collection?.doing || 0} 正在看</span>
                    {(anime.bilibiliHeat || 0) > 0 && <span className="flex items-center gap-1.5"><Play size={18} /> B站热度 {anime.bilibiliHeat}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="p-6 md:p-12 bg-white">
              {loading ? (
                <div className="min-h-[360px] flex flex-col items-center justify-center gap-6 py-12">
                  <div className="w-16 h-16 border-4 border-[#fce4ec] border-t-[#ff4081] rounded-full animate-spin" />
                  <p className="text-[#f06292] animate-pulse font-black text-lg">AI 正在全力加载中...</p>
                </div>
              ) : insight ? (
                <div className="space-y-10">
                  {/* Consensus */}
                  <section className="bg-[#fff5f8] p-8 rounded-[2.5rem] border-2 border-[#f8bbd0] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles size={80} className="text-[#ff4081]" />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-[#ff4081] font-black uppercase tracking-widest text-xs">
                        <TrendingUp size={18} /> AI 深度洞察
                      </div>
                      <span className="text-[10px] bg-[#ff80ab] text-white px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm">AI 分析</span>
                    </div>
                    <p className="text-xl font-bold leading-relaxed text-[#4a148c] mb-6 relative z-10">{insight.consensus}</p>
                    {insight.weighted_score !== 'N/A' && (
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[#f06292] text-[10px] uppercase font-black tracking-widest">综合加权评分</span>
                          <span className="text-4xl font-black text-[#ff4081]">{insight.weighted_score}</span>
                        </div>
                        <div className="h-10 w-0.5 bg-[#f8bbd0]" />
                        <div className="flex flex-col">
                          <span className="text-[#f06292] text-[10px] uppercase font-black tracking-widest">当前舆论风向</span>
                          <span className="text-xl font-black text-[#4a148c]">{insight.trend}</span>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Highlights */}
                  <section>
                    <div className="flex items-center gap-2 text-[#ec407a] mb-6 font-black uppercase tracking-widest text-xs">
                      <Award size={18} /> 精彩时刻追踪
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {insight.highlights.map((h: string, i: number) => (
                        <div key={i} className="flex items-center gap-4 bg-[#fff5f8] p-4 rounded-2xl border border-[#f8bbd0] hover:scale-[1.01] transition-transform">
                          <div className="w-8 h-8 flex-shrink-0 bg-[#ff4081] text-white flex items-center justify-center rounded-xl text-sm font-black shadow-sm">{i + 1}</div>
                          <span className="text-sm text-[#4a148c] font-bold">{h}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Expert Opinions */}
                  <section>
                    <div className="flex items-center gap-2 text-[#4a148c] mb-6 font-black uppercase tracking-widest text-xs">
                      <Users size={18} /> 大 UP 主深度点评
                    </div>
                    <div className="space-y-4">
                      {insight.expert_opinions.map((o, i) => {
                        const isKOL = insight.references?.some((r) => r.author === o.author && r.isKOL);
                        return (
                          <div key={i} className={`p-6 rounded-[2rem] shadow-sm border-2 ${
                            isKOL 
                            ? 'bg-white border-[#ff80ab]' 
                            : 'bg-white border-[#fce4ec]'
                          }`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner ${
                                isKOL ? 'bg-[#ff4081] text-white' : 'bg-[#fce4ec] text-[#f06292]'
                              }`}>
                                {isKOL ? 'PRO' : 'UP'}
                              </div>
                              <span className="font-black text-base text-[#4a148c]">
                                @{o.author}
                                {isKOL && <span className="ml-2 text-[10px] bg-[#ff4081] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">认证大UP</span>}
                              </span>
                            </div>
                            <p className="text-sm text-[#880e4f] leading-relaxed font-bold italic">“{o.opinion}”</p>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* References (Real Bilibili Links) */}
                  {insight.references && insight.references.length > 0 && (
                    <section className="pt-10 border-t-2 border-dashed border-[#f8bbd0]">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-[#f06292] font-black uppercase tracking-widest text-[10px]">
                          <Play size={16} /> 原始参考资料 (Bilibili)
                        </div>
                        <span className="text-[10px] bg-[#fce4ec] text-[#ff4081] px-3 py-1 rounded-full font-black shadow-sm">点击卡片打开 Bilibili</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insight.references.slice(0, 4).map((ref) => (
                          <ReferenceItem key={ref.url} refData={ref} />
                        ))}
                      </div>
                    </section>
                  )}
                </div>


              ) : (
                <div className="py-12 text-center text-zinc-500">无法获取舆论分析，请稍后再试。</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
