export interface Anime {
  id: number;
  name: string;
  name_cn: string;
  summary: string;
  images: {
    large: string;
    common: string;
    medium: string;
    small: string;
    grid: string;
  };
  rating: {
    score: number;
    total: number;
  };
  rank: number;
  collection: {
    doing: number;
  };
  air_date: string;
  eps: number;
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
