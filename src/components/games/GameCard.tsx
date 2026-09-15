'use client';

import type { Game } from '@/types';
import { cn, formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface GameCardProps {
  game: Game;
  onClick?: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const { format } = useCurrency();
  const isLive = game.status === 'live';
  const isFinished = game.status === 'finished';
  const hasPrice = game.price !== null && game.price !== undefined && game.price > 0;
  const formattedPrice = hasPrice ? format(game.price) : '';

  return (
    <div onClick={onClick} className={cn('bg-dark-800 rounded-xl p-4 border border-dark-700 transition-all cursor-pointer relative', 'hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10', isLive && 'border-red-500/50 bg-dark-800/80')}>
      {hasPrice && game.status === 'scheduled' && (
        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-sm font-bold">{formattedPrice}</div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary-400" />
          <span className="text-sm text-dark-400">{game.league?.sport?.name} • {game.league?.name}</span>
        </div>
        {!hasPrice && <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(game.status))}>{game.status.toUpperCase()}</span>}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">{game.home_team}</span>
          {(isLive || isFinished) && <span className="text-2xl font-bold text-primary-400">{game.home_score ?? 0}</span>}
        </div>
        <div className="flex items-center gap-2"><div className="flex-1 h-px bg-dark-700" /><span className="text-dark-500 text-sm">VS</span><div className="flex-1 h-px bg-dark-700" /></div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">{game.away_team}</span>
          {(isLive || isFinished) && <span className="text-2xl font-bold text-primary-400">{game.away_score ?? 0}</span>}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-between text-sm text-dark-400">
        <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{formatDate(game.game_datetime)} {formatTime(game.game_datetime)}</span></div>
        {game.venue && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span className="truncate max-w-[150px]">{game.venue}</span></div>}
      </div>
    </div>
  );
}
