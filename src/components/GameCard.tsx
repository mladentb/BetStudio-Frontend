'use client';

import type { Game } from '@/types';
import { formatDate, formatTime, getStatusColor, cn } from '@/lib/utils';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import { MapPin, Clock, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface GameCardProps {
  game: Game;
  onClick?: () => void;
  showPrice?: boolean;
}

export function GameCard({ game, onClick, showPrice = true }: GameCardProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart, removeFromCart, isInCart, isLoading } = useCart();
  const { format } = useCurrency();
  const { t } = useLanguage();
  
  const isLive = game.status === 'live';
  const isFinished = game.status === 'finished';
  const inCart = isInCart(game.id);
  
  const sportSlug = game.league?.sport?.slug || 'rukomet';
  const SportIcon = getSportIcon(sportSlug);
  const sportColors = getSportColors(sportSlug);
  
  const price = game.price;
  const hasPrice = price !== null && price !== undefined && price > 0;
  const formattedPrice = hasPrice ? format(price) : '';

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return t('games.scheduled');
      case 'live': return t('games.live');
      case 'finished': return t('games.finished');
      case 'cancelled': return t('games.cancelled');
      default: return status;
    }
  };

  const handleCartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) {
      await removeFromCart(game.id);
    } else {
      await addToCart(game.id);
    }
  };

  return (
    <div className={cn('card p-4 hover:shadow-xl transition-all cursor-pointer relative', isLive && 'ring-2 ring-green-500')} onClick={onClick}>
      {hasPrice && game.status === 'scheduled' && (
        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-sm font-bold shadow-lg">{formattedPrice}</div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('h-6 w-6 rounded-md flex items-center justify-center', sportColors.bg)}>
            <SportIcon className={cn('h-4 w-4', sportColors.text)} />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{game.league?.sport?.name}</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{game.league?.name}</span>
        </div>
        {!hasPrice && <span className={cn('badge', getStatusColor(game.status))}>{getStatusText(game.status)}</span>}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white">{game.home_team}</span>
          {(isLive || isFinished) && <span className="text-2xl font-bold text-gray-900 dark:text-white">{game.home_score ?? 0}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white">{game.away_team}</span>
          {(isLive || isFinished) && <span className="text-2xl font-bold text-gray-900 dark:text-white">{game.away_score ?? 0}</span>}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{formatDate(game.game_datetime)} {formatTime(game.game_datetime)}</span></div>
        {game.venue && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span className="truncate max-w-[120px]">{game.venue}</span></div>}
      </div>
      {isAuthenticated && showPrice && game.status === 'scheduled' && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700">
          <button onClick={handleCartClick} disabled={isLoading} className={cn('w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2', inCart ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-primary-600 text-white hover:bg-primary-700')}>
            {inCart ? (<><Check className="h-4 w-4" />{t('games.alreadyInCart')}</>) : (<><ShoppingCart className="h-4 w-4" />{hasPrice ? `${t('games.buyFor')} ${formattedPrice}` : t('games.addToCart')}</>)}
          </button>
        </div>
      )}
    </div>
  );
}
