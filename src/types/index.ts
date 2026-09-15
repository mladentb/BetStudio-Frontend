// API Response Types

export interface Sport {
  id: number;
  name: string;
  slug: string;
  api_source: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  leagues?: League[];
  leagues_count?: number;
  games_count?: number;
}

export interface League {
  id: number;
  sport_id: number;
  name: string;
  slug: string;
  api_league_id: string | null;
  api_endpoint: string | null;
  gender: 'male' | 'female' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sport?: Sport;
  games?: Game[];
  games_count?: number;
}

export interface Game {
  id: number;
  league_id: number;
  api_game_id: string;
  home_team: string;
  away_team: string;
  game_datetime: string;
  venue: string | null;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  home_score: number | null;
  away_score: number | null;
  live_data: Record<string, unknown> | null;
  is_available_for_sale: boolean;
  price: number | null;
  is_weekend: boolean;
  created_at: string;
  updated_at: string;
  league?: League;
  prices?: Price[];
}

export interface Price {
  id: number;
  game_id: number;
  price_type: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    generated_at?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// Filter Types
export interface GamesFilter {
  league_id?: number;
  sport_id?: number;
  status?: 'scheduled' | 'live' | 'finished' | 'cancelled';
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'game_datetime' | 'home_team' | 'away_team' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface LeaguesFilter {
  sport_id?: number;
  gender?: 'male' | 'female';
  search?: string;
  is_active?: boolean;
  with_games_count?: boolean;
  per_page?: number;
  page?: number;
}

export interface SportsFilter {
  search?: string;
  is_active?: boolean;
  with_leagues?: boolean;
  with_counts?: boolean;
}
