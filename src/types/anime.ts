export interface Anime {
  id: number;
  name: string;
  name_cn?: string;
  summary?: string;
  images?: {
    large?: string;
    common?: string;
    medium?: string;
    small?: string;
    grid?: string;
  } | null;
  rating?: {
    score?: number;
    total?: number;
  } | null;
  rank?: number;
  collection?: {
    doing?: number;
  } | null;
  air_date?: string;
  eps?: number;
}

export interface CalendarDay {
  weekday: {
    en: string;
    cn: string;
    ja: string;
    id: number;
  };
  items: Anime[];
}

export interface BilibiliReference {
  title: string;
  description: string;
  author: string;
  play: number | string;
  url: string;
  isKOL: boolean;
  type: string;
}

export interface ExpertOpinion {
  author: string;
  opinion: string;
}

export interface AnimeInsight {
  weighted_score: string;
  consensus: string;
  highlights: string[];
  expert_opinions: ExpertOpinion[];
  trend: string;
  references?: BilibiliReference[];
}

export interface AnimeSummary {
  id: number;
  summary: string;
}
