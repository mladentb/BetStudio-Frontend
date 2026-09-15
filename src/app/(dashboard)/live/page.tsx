'use client';

import { useLiveGames } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameCard } from '@/components/GameCard';
import { LoadingGrid } from '@/components/Loading';
import { ErrorMessage, EmptyState } from '@/components/Error';
import { Zap } from 'lucide-react';

export default function LivePage() {
  const { t } = useLanguage();
  const { data, isLoading, error, refetch } = useLiveGames();
  const games = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <Zap className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('games.live')}</h1>
            <p className="text-gray-500">
              {t('dashboard.liveGamesCount', { count: games.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-500">Auto-refresh</span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingGrid count={6} />
      ) : error ? (
        <ErrorMessage 
          message={t('errors.generic')} 
          onRetry={refetch} 
        />
      ) : games.length === 0 ? (
        <EmptyState 
          title={t('dashboard.noLiveGames')}
          description={t('common.tryAgain')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
