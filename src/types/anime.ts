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
