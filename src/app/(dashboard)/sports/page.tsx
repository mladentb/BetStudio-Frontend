'use client';

import { useSports } from '@/hooks/useApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingSpinner } from '@/components/Loading';
import { ErrorMessage } from '@/components/Error';
import { Trophy, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SportsPage() {
  const { t } = useLanguage();
  const { data, isLoading, error, refetch } = useSports({ 
    with_leagues: true, 
    with_counts: true 
  });
  
  const sports = data?.data || [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={t('errors.generic')} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <Trophy className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sports.title')}</h1>
          <p className="text-gray-500">{t('sports.activeSports', { count: sports.length })}</p>
        </div>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sports.map((sport) => (
          <div key={sport.id} className="card overflow-hidden">
            {/* Sport Header */}
            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
              <h2 className="text-xl font-bold">{sport.name}</h2>
              <p className="text-primary-100 mt-1">
                {sport.leagues_count || 0} {t('dashboard.leagues')} • {sport.games_count || 0} {t('dashboard.games')}
              </p>
            </div>

            {/* Leagues */}
            <div className="p-4">
              {sport.leagues && sport.leagues.length > 0 ? (
                <ul className="space-y-2">
                  {sport.leagues.slice(0, 5).map((league) => (
                    <li key={league.id}>
                      <Link 
                        href={`/leagues/${league.slug}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors group"
                      >
                        <span className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600">
                          {league.name}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                      </Link>
                    </li>
                  ))}
                  {sport.leagues.length > 5 && (
                    <li className="text-center pt-2">
                      <Link 
                        href={`/sports/${sport.slug}`}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {t('leagues.showAllLeagues', { count: sport.leagues.length })}
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">{t('leagues.noLeagues')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
