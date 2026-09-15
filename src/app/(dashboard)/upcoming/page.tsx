'use client';

import { useState } from 'react';
import { useGames, useSports, useLeagues } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameCard } from '@/components/GameCard';
import { GameDetailModal } from '@/components/GameDetailModal';
import { LoadingGrid } from '@/components/Loading';
import { ErrorMessage, EmptyState } from '@/components/Error';
import { Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GamesFilter, Game } from '@/types';

export default function UpcomingPage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<GamesFilter>({
    status: 'scheduled',
    sort_by: 'game_datetime',
    sort_dir: 'asc',
    per_page: 12,
    page: 1,
  });
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const { data: gamesData, isLoading, error, refetch } = useGames(filters);
  const { data: sportsData } = useSports();
  const { data: leaguesData } = useLeagues({ 
    sport_id: filters.sport_id, 
    per_page: 0 
  });

  const games = gamesData?.data || [];
  const sports = sportsData?.data || [];
  const leagues = 'data' in (leaguesData || {}) ? (leaguesData as any).data : [];
  const meta = gamesData?.meta;

  const handleFilterChange = (key: keyof GamesFilter, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      page: 1,
      ...(key === 'sport_id' ? { league_id: undefined } : {})
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.upcomingGames')}</h1>
            <p className="text-gray-500">{t('leagues.gamesCount', { count: meta?.total || 0 })}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{t('common.filter')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="input"
            value={filters.sport_id || ''}
            onChange={(e) => handleFilterChange('sport_id', e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">{t('common.all')} {t('sports.title').toLowerCase()}</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>{sport.name}</option>
            ))}
          </select>

          <select
            className="input"
            value={filters.league_id || ''}
            onChange={(e) => handleFilterChange('league_id', e.target.value ? Number(e.target.value) : undefined)}
            disabled={!filters.sport_id}
          >
            <option value="">{t('common.all')} {t('leagues.title').toLowerCase()}</option>
            {leagues.map((league: any) => (
              <option key={league.id} value={league.id}>{league.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder={t('common.search') + '...'}
            className="input"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          />

          <select
            className="input"
            value={filters.per_page}
            onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
          >
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
            <option value={48}>48 / page</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingGrid count={12} />
      ) : error ? (
        <ErrorMessage message={t('errors.generic')} onRetry={refetch} />
      ) : games.length === 0 ? (
        <EmptyState 
          title={t('common.noResults')}
          description={t('games.filterByStatus')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                onClick={() => setSelectedGame(game)}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                disabled={!gamesData?.links?.prev}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.previous')}
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                disabled={!gamesData?.links?.next}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
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
