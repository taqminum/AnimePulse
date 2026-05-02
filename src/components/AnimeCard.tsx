'use client';

import { Anime } from '../types/anime';
import { Star, Play, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
  index: number;
}

export const AnimeCard = ({ anime, onClick, index }: AnimeCardProps) => {
  const coverSrc =
    anime.images?.medium ||
    anime.images?.large ||
    anime.images?.common ||
    anime.images?.small ||
    anime.images?.grid ||
    '/window.svg';
  const playText = anime.bilibiliPlayTotal && anime.bilibiliPlayTotal >= 10000
    ? `${(anime.bilibiliPlayTotal / 10000).toFixed(1)}万`
    : anime.bilibiliPlayTotal || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative flex items-center gap-6 bg-card hover:bg-secondary border border-border p-5 rounded-[2rem] transition-colors duration-300 cursor-pointer shadow-sm shadow-primary/10 hover:shadow-md hover:shadow-primary/15"
    >
      {/* Rank Number */}
      <div className="flex-shrink-0 w-12 text-center">
        <span className={`text-2xl font-black ${index < 3 ? 'text-accent' : 'text-border'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Cover Image */}
      <div className="flex-shrink-0 w-24 h-32 relative rounded-2xl overflow-hidden shadow-md">
        <Image
          src={coverSrc}
          alt={anime.name_cn || anime.name}
          fill
          sizes="96px"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-xl font-bold text-foreground truncate group-hover:text-accent transition-colors">
            {anime.name_cn || anime.name}
          </h3>
          {index < 5 && (
            <span className="flex-shrink-0 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-primary/20">
              HOT
            </span>
          )}
        </div>
        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {anime.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="bg-secondary text-accent text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ring-border/60">
                {genre}
              </span>
            ))}
          </div>
        )}
        
        <p className={`text-foreground/70 text-sm line-clamp-1 mb-3 ${!anime.summary || anime.summary === '暂无简介' ? 'animate-pulse bg-secondary rounded-full h-4 w-3/4' : ''}`}>
          {(!anime.summary || anime.summary === '暂无简介') ? '' : anime.summary}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-1.5 text-foreground/55 text-sm">
            <Star size={14} className="text-accent fill-accent" />
            <span className="font-bold text-foreground">{anime.rating?.score || 'N/A'}</span>
            <span className="text-[10px] opacity-60">({anime.rating?.total || 0})</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/55 text-sm">
            <TrendingUp size={14} className="text-accent" />
            <span className="font-bold text-foreground">{anime.collection?.doing || 0}</span>
            <span className="text-[10px] opacity-60">正在看</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/55 text-sm">
            <Calendar size={14} />
            <span className="text-[10px]">{anime.air_date || '待定'}</span>
          </div>
          {(anime.bilibiliHeat || 0) > 0 && (
            <div className="flex items-center gap-1.5 text-foreground/55 text-sm">
              <Play size={14} className="text-accent" />
              <span className="font-bold text-foreground">{playText}</span>
              <span className="text-[10px] opacity-60">B站热议</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="hidden md:flex flex-shrink-0 items-center justify-center pr-4">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm shadow-primary/10 group-hover:scale-105">
          <Play size={20} fill="currentColor" className="ml-1" />
        </div>
      </div>
    </motion.div>
  );
};
