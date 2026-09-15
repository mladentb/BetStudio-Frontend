import axios from 'axios';
import type { 
  Sport, League, Game, 
  ApiResponse, PaginatedResponse,
  GamesFilter, LeaguesFilter, SportsFilter 
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Sports API
export const sportsApi = {
  getAll: async (filters?: SportsFilter): Promise<ApiResponse<Sport[]>> => {
    const { data } = await api.get('/sports', { params: filters });
    return data;
  },

  getById: async (id: number): Promise<ApiResponse<Sport>> => {
    const { data } = await api.get(`/sports/${id}`);
    return data;
  },

  getLeagues: async (sportId: number): Promise<ApiResponse<League[]>> => {
    const { data } = await api.get(`/sports/${sportId}/leagues`);
    return data;
  },
};

// Leagues API
export const leaguesApi = {
  getAll: async (filters?: LeaguesFilter): Promise<PaginatedResponse<League> | ApiResponse<League[]>> => {
    const { data } = await api.get('/leagues', { params: filters });
    return data;
  },

  getById: async (id: number): Promise<ApiResponse<League>> => {
    const { data } = await api.get(`/leagues/${id}`);
    return data;
  },

  getGames: async (leagueId: number, filters?: GamesFilter): Promise<PaginatedResponse<Game>> => {
    const { data } = await api.get(`/leagues/${leagueId}/games`, { params: filters });
    return data;
  },
};

// Games API
export const gamesApi = {
  getAll: async (filters?: GamesFilter): Promise<PaginatedResponse<Game>> => {
    const { data } = await api.get('/games', { params: filters });
    return data;
  },

  getById: async (id: number): Promise<ApiResponse<Game>> => {
    const { data } = await api.get(`/games/${id}`);
    return data;
  },

  getUpcoming: async (limit?: number): Promise<ApiResponse<Game[]>> => {
    const { data } = await api.get('/games-upcoming', { params: { limit } });
    return data;
  },

  getLive: async (): Promise<ApiResponse<Game[]>> => {
    const { data } = await api.get('/games-live');
    return data;
  },

  getToday: async (): Promise<ApiResponse<Game[]>> => {
    const { data } = await api.get('/games-today');
    return data;
  },
};

export default api;
