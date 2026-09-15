'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Calendar, Clock, MapPin, ChevronLeft, Filter } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameCard } from '@/components/GameCard';
import { GameDetailModal } from '@/components/GameDetailModal';
import { LoadingGrid } from '@/components/Loading';
import { ErrorMessage, EmptyState } from '@/components/Error';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import { cn } from '@/lib/utils';
import type { Game } from '@/types';

interface League {
  id: number;
  name: string;
  slug: string;
  sport: {
    id: number;
    name: string;
    slug: string;
  };
  country_name?: string;
  games_count?: number;
}

type StatusFilter = 'all' | 'scheduled' | 'live' | 'finished';

export default function LeaguePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useLanguage();
  
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('scheduled');

  // Fetch league info
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useQuery({
    queryKey: ['league', slug],
    queryFn: async () => {
      const { data } = await api.get(`/leagues/${slug}`);
      return data;
    },
  });

  // Fetch games for this league
  const { data: gamesData, isLoading: gamesLoading, error: gamesError } = useQuery({
    queryKey: ['league-games', slug, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { 
        per_page: '100',
        sort: 'game_datetime',
        direction: 'asc'
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const { data } = await api.get(`/leagues/${slug}/games`, { params });
      return data;
    },
    enabled: !!slug,
  });

  const league: League | null = leagueData?.data || null;
  const games: Game[] = gamesData?.data || [];

  if (leagueLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
        <LoadingGrid count={6} />
      </div>
    );
  }

  if (leagueError || !league) {
    return <ErrorMessage message={t('errors.notFound')} />;
  }

  const SportIcon = getSportIcon(league.sport?.slug || '');
  const colors = getSportColors(league.sport?.slug || '');

  const statusFilters: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'all', label: t('common.all'), color: 'bg-gray-600' },
    { value: 'scheduled', label: t('games.scheduled'), color: 'bg-blue-600' },
    { value: 'live', label: t('games.live'), color: 'bg-green-600' },
    { value: 'finished', label: t('games.finished'), color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link 
        href="/sports"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('leagues.backToSports')}
      </Link>

      {/* League Header */}
      <div className={cn(
        'card p-6 border-l-4',
        colors.border
      )}>
        <div className="flex items-start gap-4">
          <div className={cn('h-14 w-14 rounded-xl flex items-center justify-center', colors.bg)}>
            <SportIcon className={cn('h-8 w-8', colors.text)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span>{league.sport?.name}</span>
              {league.country_name && (
                <>
                  <span>•</span>
                  <span>{league.country_name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {league.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('leagues.gamesCount', { count: games.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-all',
              statusFilter === filter.value
                ? `${filter.color} text-white shadow-md`
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      {gamesLoading ? (
        <LoadingGrid count={6} />
      ) : gamesError ? (
        <ErrorMessage message={t('errors.generic')} />
      ) : games.length === 0 ? (
        <EmptyState 
          title={t('games.noGames')}
          description={t('games.filterByStatus')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard 
              key={game.id} 
              game={game} 
              onClick={() => setSelectedGame(game)} 
            />
          ))}
        </div>
      )}

      {/* Game Detail Modal */}
      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}
