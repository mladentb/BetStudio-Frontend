'use client';

import type { Game } from '@/types';
import { GameCard } from './GameCard';

interface GameListProps {
  games: Game[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function GameList({ games, isLoading, emptyMessage = 'No games found' }: GameListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

function GameCardSkeleton() {
  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-dark-700 rounded w-32" />
        <div className="h-6 bg-dark-700 rounded w-20" />
      </div>
      <div className="space-y-3">
        <div className="h-6 bg-dark-700 rounded w-40" />
        <div className="h-4 bg-dark-700 rounded w-12 mx-auto" />
        <div className="h-6 bg-dark-700 rounded w-36" />
      </div>
      <div className="mt-4 pt-4 border-t border-dark-700">
        <div className="h-4 bg-dark-700 rounded w-48" />
      </div>
    </div>
  );
}
