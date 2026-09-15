'use client';

import { useTodayGames } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameCard } from '@/components/GameCard';
import { LoadingGrid } from '@/components/Loading';
import { ErrorMessage, EmptyState } from '@/components/Error';
import { Calendar } from 'lucide-react';

export default function TodayPage() {
  const { t, locale } = useLanguage();
  const { data, isLoading, error, refetch } = useTodayGames();
  const games = data?.data || [];

  const today = new Date().toLocaleDateString(locale === 'sr' ? 'sr-Latn-RS' : locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.today')}</h1>
          <p className="text-gray-500 capitalize">{today}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{games.length}</p>
          <p className="text-sm text-gray-500">{t('common.all')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {games.filter(g => g.status === 'live').length}
          </p>
          <p className="text-sm text-gray-500">{t('games.live')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {games.filter(g => g.status === 'scheduled').length}
          </p>
          <p className="text-sm text-gray-500">{t('games.scheduled')}</p>
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
          title={t('games.noGames')}
          description={t('common.noResults')}
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
