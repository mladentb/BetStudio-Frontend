import { useQuery } from '@tanstack/react-query';
import { sportsApi, leaguesApi, gamesApi } from '@/lib/api';
import type { GamesFilter, LeaguesFilter, SportsFilter } from '@/types';

// Sports Hooks
export function useSports(filters?: SportsFilter) {
  return useQuery({
    queryKey: ['sports', filters],
    queryFn: () => sportsApi.getAll(filters),
  });
}

export function useSport(id: number) {
  return useQuery({
    queryKey: ['sport', id],
    queryFn: () => sportsApi.getById(id),
    enabled: !!id,
  });
}

export function useSportLeagues(sportId: number) {
  return useQuery({
    queryKey: ['sport-leagues', sportId],
    queryFn: () => sportsApi.getLeagues(sportId),
    enabled: !!sportId,
  });
}

// Leagues Hooks
export function useLeagues(filters?: LeaguesFilter) {
  return useQuery({
    queryKey: ['leagues', filters],
    queryFn: () => leaguesApi.getAll(filters),
  });
}

export function useLeague(id: number) {
  return useQuery({
    queryKey: ['league', id],
    queryFn: () => leaguesApi.getById(id),
    enabled: !!id,
  });
}

// Games Hooks
export function useGames(filters?: GamesFilter) {
  return useQuery({
    queryKey: ['games', filters],
    queryFn: () => gamesApi.getAll(filters),
  });
}

export function useGame(id: number) {
  return useQuery({
    queryKey: ['game', id],
    queryFn: () => gamesApi.getById(id),
    enabled: !!id,
  });
}

export function useUpcomingGames(limit?: number) {
  return useQuery({
    queryKey: ['games-upcoming', limit],
    queryFn: () => gamesApi.getUpcoming(limit),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useLiveGames() {
  return useQuery({
    queryKey: ['games-live'],
    queryFn: () => gamesApi.getLive(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTodayGames() {
  return useQuery({
    queryKey: ['games-today'],
    queryFn: () => gamesApi.getToday(),
    refetchInterval: 60000,
  });
}
