'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { sportsApi, leaguesApi } from '@/lib/api';
import { GameCard } from '@/components/GameCard';
import { LoadingGrid } from '@/components/Loading';
import { ErrorMessage, EmptyState } from '@/components/Error';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function SportPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useLanguage();

  // Get sport by slug
  const { data: sportsData, isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: () => sportsApi.getAll({ with_leagues: true }),
  });

  const sport = sportsData?.data?.find(s => s.slug === slug);
  const SportIcon = getSportIcon(slug);
  const colors = getSportColors(slug);

  // Get leagues for this sport
  const { data: leaguesData, isLoading: leaguesLoading } = useQuery({
    queryKey: ['leagues', { sport_id: sport?.id }],
    queryFn: () => leaguesApi.getAll({ sport_id: sport?.id, with_games_count: true, per_page: 0 }),
    enabled: !!sport?.id,
  });

  const leagues = (leaguesData as any)?.data || [];

  if (sportsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-dark-700 rounded-xl animate-pulse" />
        <LoadingGrid count={6} />
      </div>
    );
  }

  if (!sport) {
    return <ErrorMessage message={t('errors.notFound')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn('card p-6 border-l-4', colors.border)}>
        <div className="flex items-center gap-4">
          <div className={cn('h-16 w-16 rounded-xl flex items-center justify-center', colors.bg)}>
            <SportIcon className={cn('h-10 w-10', colors.text)} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sport.name}</h1>
            <p className="text-gray-500">
              {sport.leagues_count || leagues.length} {t('dashboard.leagues')} • {sport.games_count || 0} {t('dashboard.games')}
            </p>
          </div>
        </div>
      </div>

      {/* Leagues */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('leagues.title')}</h2>
        
        {leaguesLoading ? (
          <LoadingGrid count={3} />
        ) : leagues.length === 0 ? (
          <EmptyState title={t('leagues.noLeagues')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map((league: any) => (
              <Link
                key={league.id}
                href={`/leagues/${league.slug}`}
                className="card p-4 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {league.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('leagues.gamesCount', { count: league.games_count || 0 })}
                      {league.gender && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-700 rounded">
                          {league.gender === 'male' ? 'M' : 'F'}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
