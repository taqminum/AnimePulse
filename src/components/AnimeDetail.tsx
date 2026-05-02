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
      className="group relative flex flex-col gap-1 p-3 bg-secondary hover:bg-primary/15 border border-border rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-foreground group-hover:text-accent truncate font-medium flex-grow pr-2">{refData.title}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 rounded-full p-1 text-foreground/45 transition-colors hover:bg-card hover:text-accent active:scale-95"
          aria-label="复制 Bilibili 链接"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
      </div>
      <span className="text-[9px] text-accent font-bold truncate">UP: {refData.author} · {refData.play} 播放</span>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
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
  const playText = anime.bilibiliPlayTotal && anime.bilibiliPlayTotal >= 10000
    ? `${(anime.bilibiliPlayTotal / 10000).toFixed(1)}万`
    : anime.bilibiliPlayTotal || 0;

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
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 sm:inset-y-3 sm:right-3 sm:left-auto w-full sm:w-[92vw] lg:w-[860px] xl:w-[960px] bg-background overflow-hidden shadow-2xl shadow-primary/10 border border-border sm:rounded-[2.5rem]"
          >
            <div className="scrollbar-hide h-full overflow-y-auto">
              <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-5 py-4 backdrop-blur md:px-7">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-black text-accent shadow-sm shadow-primary/10 ring-1 ring-border transition-all hover:bg-primary hover:text-white active:scale-95"
                >
                  <ArrowLeft size={18} />
                  返回列表
                </button>
                <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent ring-1 ring-border">
                  Anime Detail
                </span>
              </div>

              <div className="p-5 md:p-7">
                <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-sm shadow-primary/10 md:p-7">
                  <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-secondary" />
                  <div className="relative flex flex-col gap-5 sm:flex-row">
                    <div className="relative mx-auto h-56 w-40 flex-shrink-0 overflow-hidden rounded-[1.5rem] border border-border shadow-md shadow-primary/10 sm:mx-0 sm:h-64 sm:w-44">
                      <Image
                        src={coverSrc}
                        alt={anime.name_cn || anime.name}
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Bangumi</span>
                        {anime.genres?.slice(0, 4).map((genre) => (
                          <span key={genre} className="rounded-full bg-secondary px-3 py-1 text-[10px] font-black text-accent ring-1 ring-border">
                            {genre}
                          </span>
                        ))}
                      </div>
                      <h2 className="mb-3 text-3xl font-black leading-tight text-foreground md:text-5xl">{anime.name_cn || anime.name}</h2>
                      {anime.name_cn && anime.name_cn !== anime.name && (
                        <p className="mb-5 text-sm font-bold text-foreground/55">{anime.name}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-2xl bg-secondary p-3 ring-1 ring-border">
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black text-accent"><Star size={13} />评分</div>
                          <div className="text-xl font-black text-foreground">{anime.rating?.score || 'N/A'}</div>
                        </div>
                        <div className="rounded-2xl bg-secondary p-3 ring-1 ring-border">
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black text-accent"><Users size={13} />评分人数</div>
                          <div className="text-xl font-black text-foreground">{anime.rating?.total || 0}</div>
                        </div>
                        <div className="rounded-2xl bg-secondary p-3 ring-1 ring-border">
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black text-accent"><TrendingUp size={13} />正在看</div>
                          <div className="text-xl font-black text-foreground">{anime.collection?.doing || 0}</div>
                        </div>
                        <div className="rounded-2xl bg-secondary p-3 ring-1 ring-border">
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black text-accent"><Play size={13} />B站热议</div>
                          <div className="text-xl font-black text-foreground">{playText}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
                  <aside className="space-y-4">
                    <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm shadow-primary/10">
                      <div className="mb-4 text-xs font-black uppercase tracking-widest text-accent">基础信息</div>
                      <div className="space-y-3 text-sm font-bold text-foreground/65">
                        <div className="flex items-center justify-between gap-3"><span>放送日期</span><span className="text-foreground">{anime.air_date || '待定'}</span></div>
                        <div className="flex items-center justify-between gap-3"><span>话数</span><span className="text-foreground">{anime.eps || '未知'}</span></div>
                        <div className="flex items-center justify-between gap-3"><span>B站视频</span><span className="text-foreground">{anime.bilibiliVideoCount || 0}</span></div>
                        <div className="flex items-center justify-between gap-3"><span>头部UP</span><span className="text-foreground">{anime.bilibiliKolCount || 0}</span></div>
                      </div>
                    </section>
                    <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm shadow-primary/10">
                      <div className="mb-4 text-xs font-black uppercase tracking-widest text-accent">题材标签</div>
                      <div className="flex flex-wrap gap-2">
                        {(anime.genres && anime.genres.length > 0 ? anime.genres : ['其他']).map((genre) => (
                          <span key={genre} className="rounded-full bg-secondary px-3 py-1 text-[10px] font-black text-accent ring-1 ring-border">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </section>
                  </aside>

                  <div className="min-w-0">
              {loading ? (
                <div className="min-h-[360px] flex flex-col items-center justify-center gap-6 py-12">
                  <div className="w-16 h-16 border-4 border-secondary border-t-accent rounded-full animate-spin" />
                  <p className="text-accent animate-pulse font-black text-lg">AI 正在全力加载中...</p>
                </div>
              ) : insight ? (
                <div className="space-y-10">
                  {/* Consensus */}
                  <section className="bg-card p-8 rounded-[2.5rem] border-2 border-border relative overflow-hidden shadow-sm shadow-primary/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles size={80} className="text-accent" />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-accent font-black uppercase tracking-widest text-xs">
                        <TrendingUp size={18} /> AI 深度洞察
                      </div>
                      <span className="text-[10px] bg-primary text-white px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm shadow-primary/20">AI 分析</span>
                    </div>
                    <p className="text-xl font-bold leading-relaxed text-foreground mb-6 relative z-10">{insight.consensus}</p>
                    {insight.weighted_score !== 'N/A' && (
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col">
                          <span className="text-accent text-[10px] uppercase font-black tracking-widest">综合加权评分</span>
                          <span className="text-4xl font-black text-accent">{insight.weighted_score}</span>
                        </div>
                        <div className="h-10 w-0.5 bg-border" />
                        <div className="flex flex-col">
                          <span className="text-accent text-[10px] uppercase font-black tracking-widest">当前舆论风向</span>
                          <span className="text-xl font-black text-foreground">{insight.trend}</span>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Highlights */}
                  <section>
                    <div className="flex items-center gap-2 text-accent mb-6 font-black uppercase tracking-widest text-xs">
                      <Award size={18} /> 精彩时刻追踪
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {insight.highlights.map((h: string, i: number) => (
                        <div key={i} className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border hover:scale-[1.01] transition-transform shadow-sm shadow-primary/5">
                          <div className="w-8 h-8 flex-shrink-0 bg-accent text-white flex items-center justify-center rounded-xl text-sm font-black shadow-sm shadow-primary/20">{i + 1}</div>
                          <span className="text-sm text-foreground font-bold">{h}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Expert Opinions */}
                  <section>
                    <div className="flex items-center gap-2 text-foreground mb-6 font-black uppercase tracking-widest text-xs">
                      <Users size={18} /> 大 UP 主深度点评
                    </div>
                    <div className="space-y-4">
                      {insight.expert_opinions.map((o, i) => {
                        const isKOL = insight.references?.some((r) => r.author === o.author && r.isKOL);
                        return (
                          <div key={i} className={`p-6 rounded-[2rem] shadow-sm shadow-primary/10 border-2 ${
                            isKOL 
                            ? 'bg-card border-primary' 
                            : 'bg-card border-border'
                          }`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner ${
                                isKOL ? 'bg-accent text-white' : 'bg-secondary text-accent'
                              }`}>
                                {isKOL ? 'PRO' : 'UP'}
                              </div>
                              <span className="font-black text-base text-foreground">
                                @{o.author}
                                {isKOL && <span className="ml-2 text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">认证大UP</span>}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/75 leading-relaxed font-bold italic">“{o.opinion}”</p>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* References (Real Bilibili Links) */}
                  {insight.references && insight.references.length > 0 && (
                    <section className="pt-10 border-t-2 border-dashed border-border">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-accent font-black uppercase tracking-widest text-[10px]">
                          <Play size={16} /> 原始参考资料 (Bilibili)
                        </div>
                        <span className="text-[10px] bg-secondary text-accent px-3 py-1 rounded-full font-black shadow-sm shadow-primary/10">点击卡片打开 Bilibili</span>
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
                <div className="py-12 text-center text-foreground/55">无法获取舆论分析，请稍后再试。</div>
              )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
