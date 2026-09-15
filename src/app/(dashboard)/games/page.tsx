'use client';

import { useState } from 'react';
import { useGames, useSports, useLeagues } from '@/hooks/useApi';
import { GameList } from '@/components/games/GameList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GameFilters } from '@/types';

export default function GamesPage() {
  const [filters, setFilters] = useState<GameFilters>({
    per_page: 12,
    page: 1,
  });
  const [searchInput, setSearchInput] = useState('');

  const { data: gamesData, isLoading } = useGames(filters);
  const { data: sportsData } = useSports();
  const { data: leaguesData } = useLeagues({ sport_id: filters.sport_id, per_page: 0 });

  const games = gamesData?.data || [];
  const meta = gamesData?.meta;
  const sports = sportsData?.data || [];
  const leagues = leaguesData?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handleFilterChange = (key: keyof GameFilters, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined, page: 1 };
    
    // Reset league when sport changes
    if (key === 'sport_id') {
      newFilters.league_id = undefined;
    }
    
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Games</h1>
        {meta && (
          <span className="text-dark-400">
            {meta.total} games found
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>
          </form>

          {/* Sport Filter */}
          <select
            value={filters.sport_id || ''}
            onChange={(e) => handleFilterChange('sport_id', e.target.value ? Number(e.target.value) : undefined)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Sports</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>{sport.name}</option>
            ))}
          </select>

          {/* League Filter */}
          <select
            value={filters.league_id || ''}
            onChange={(e) => handleFilterChange('league_id', e.target.value ? Number(e.target.value) : undefined)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
            disabled={!filters.sport_id}
          >
            <option value="">All Leagues</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>{league.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="finished">Finished</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Games Grid */}
      <GameList games={games} isLoading={isLoading} emptyMessage="No games match your filters" />

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(meta.current_page - 1)}
            disabled={meta.current_page === 1}
            className="p-2 bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(meta.last_page, 5))].map((_, i) => {
              let pageNum = i + 1;
              if (meta.last_page > 5 && meta.current_page > 3) {
                pageNum = meta.current_page - 2 + i;
                if (pageNum > meta.last_page) pageNum = meta.last_page - 4 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    meta.current_page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 hover:bg-dark-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(meta.current_page + 1)}
            disabled={meta.current_page === meta.last_page}
            className="p-2 bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
