import axios from 'axios';
import { CalendarDay } from '../types/anime';

const BANGUMI_API_BASE = 'https://api.bgm.tv';

export const getAnimeCalendar = async (): Promise<CalendarDay[]> => {
  try {
    const response = await axios.get(`${BANGUMI_API_BASE}/calendar`);
    return response.data;
  } catch (error) {
    console.error('Error fetching anime calendar:', error);
    return [];
  }
};

export const getAnimeDetails = async (id: number) => {
  try {
    const response = await axios.get(`${BANGUMI_API_BASE}/v0/subjects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching anime details for id ${id}:`, error);
    return null;
  }
};
