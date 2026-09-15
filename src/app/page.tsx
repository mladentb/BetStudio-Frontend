'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LandingPage from '@/components/LandingPage';
import { AppShell } from '@/components/AppShell';
import { useLiveGames, useUpcomingGames, useSports } from '@/hooks/useApi';
import { GameCard } from '@/components/GameCard';
import { GameDetailModal } from '@/components/GameDetailModal';
import { LoadingGrid } from '@/components/Loading';
import { ErrorMessage, EmptyState } from '@/components/Error';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import { Zap, Clock, Trophy, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Game } from '@/types';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  const { data: liveData, isLoading: liveLoading, error: liveError } = useLiveGames();
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingGames(6);
  const { data: sportsData, isLoading: sportsLoading } = useSports({ with_counts: true });

  const liveGames = liveData?.data || [];
  const upcomingGames = upcomingData?.data || [];
  const sports = sportsData?.data || [];

  return (
    <div className="space-y-8">
      {/* Live Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.liveGames')}</h2>
              <p className="text-sm text-gray-500">{t('dashboard.liveGamesCount', { count: liveGames.length })}</p>
            </div>
          </div>
          <Link 
            href="/live" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            {t('common.showAll')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {liveLoading ? (
          <LoadingGrid count={3} />
        ) : liveError ? (
          <ErrorMessage message={t('common.error')} />
        ) : liveGames.length === 0 ? (
          <div className="card p-6 text-center text-gray-500">
            {t('dashboard.noLiveGames')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map((game) => (
              <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.upcomingGames')}</h2>
              <p className="text-sm text-gray-500">{t('dashboard.upcomingGamesDesc')}</p>
            </div>
          </div>
          <Link 
            href="/upcoming" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            {t('common.showAll')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {upcomingLoading ? (
          <LoadingGrid count={6} />
        ) : upcomingGames.length === 0 ? (
          <EmptyState title={t('dashboard.noUpcomingGames')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} />
            ))}
          </div>
        )}
      </section>

      {/* Sports Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Trophy className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('sports.title')}</h2>
              <p className="text-sm text-gray-500">{t('dashboard.selectSport')}</p>
            </div>
          </div>
          <Link 
            href="/sports" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            {t('sports.title')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {sportsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sports.map((sport) => {
              const SportIcon = getSportIcon(sport.slug);
              const colors = getSportColors(sport.slug);
              
              return (
                <Link 
                  key={sport.id} 
                  href={`/sports/${sport.slug}`}
                  className={cn(
                    'card p-4 hover:shadow-xl transition-all group border-l-4',
                    colors.border
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colors.bg)}>
                      <SportIcon className={cn('h-6 w-6', colors.text)} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {sport.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    {sport.leagues_count || 0} {t('dashboard.leagues')} • {sport.games_count || 0} {t('dashboard.games')}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

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
