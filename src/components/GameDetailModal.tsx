'use client';

import { useState } from 'react';
import type { Game } from '@/types';
import { formatDate, formatTime, cn } from '@/lib/utils';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import { X, MapPin, Clock, Calendar, Euro, ShoppingCart, Trophy, Users, Tv, CheckCircle, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface GameDetailModalProps {
  game: Game;
  onClose: () => void;
}

export function GameDetailModal({ game, onClose }: GameDetailModalProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart, removeFromCart, isInCart, isLoading } = useCart();
  const { format, currency } = useCurrency();
  const [error, setError] = useState('');

  const sportSlug = game.league?.sport?.slug || 'rukomet';
  const SportIcon = getSportIcon(sportSlug);
  const sportColors = getSportColors(sportSlug);

  const price = game.price;
  const hasPrice = price !== null && price !== undefined && price > 0;
  const formattedPrice = hasPrice ? format(price) : '';
  const isLive = game.status === 'live';
  const isFinished = game.status === 'finished';
  const canPurchase = game.status === 'scheduled' || game.status === 'live';
  const inCart = isInCart(game.id);

  const gameDate = new Date(game.game_datetime);
  const dayName = gameDate.toLocaleDateString('sr-Latn-RS', { weekday: 'long' });
  const isWeekend = game.is_weekend;

  const handleCartAction = async () => {
    if (!isAuthenticated) { setError('Morate biti prijavljeni da biste kupili.'); return; }
    setError('');
    try {
      if (inCart) { await removeFromCart(game.id); } 
      else { await addToCart(game.id); }
    } catch (err: any) { setError(err.response?.data?.message || 'Greška'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className={cn('p-6 relative', sportColors.bg)}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center"><SportIcon className="h-7 w-7 text-white" /></div>
            <div><p className="text-white/80 text-sm">{game.league?.sport?.name}</p><p className="text-white font-semibold">{game.league?.name}</p></div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-white text-xl font-bold">{game.home_team}</p>
                {(isLive || isFinished) && <p className="text-4xl font-bold text-white mt-2">{game.home_score ?? 0}</p>}
              </div>
              <div className="px-6"><span className="text-white/60 text-2xl font-light">VS</span></div>
              <div className="flex-1 text-center">
                <p className="text-white text-xl font-bold">{game.away_team}</p>
                {(isLive || isFinished) && <p className="text-4xl font-bold text-white mt-2">{game.away_score ?? 0}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div><p className="text-xs text-gray-500">Datum</p><p className="font-medium text-gray-900 dark:text-white">{formatDate(game.game_datetime)}</p><p className="text-xs text-gray-500 capitalize">{dayName}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
              <Clock className="h-5 w-5 text-gray-500" />
              <div><p className="text-xs text-gray-500">Vreme</p><p className="font-medium text-gray-900 dark:text-white">{formatTime(game.game_datetime)}</p></div>
            </div>
            {game.venue && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg col-span-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div><p className="text-xs text-gray-500">Lokacija</p><p className="font-medium text-gray-900 dark:text-white">{game.venue}</p></div>
              </div>
            )}
          </div>
          {hasPrice && canPurchase && (
            <div className="border-t border-b border-gray-200 dark:border-dark-700 py-6">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Streaming Pristup</h3><p className="text-sm text-gray-500">{isWeekend ? 'Vikend cena' : 'Cena radnog dana'} • Jednokratni pristup</p></div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">{formattedPrice}</p>
                  {currency !== 'EUR' && <p className="text-sm text-gray-500">≈ €{price.toFixed(2)}</p>}
                  {isWeekend && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Vikend</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Tv className="h-4 w-4 text-green-500" /><span>HD Streaming</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Users className="h-4 w-4 text-green-500" /><span>Multi-device</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Trophy className="h-4 w-4 text-green-500" /><span>Statistike uživo</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><CheckCircle className="h-4 w-4 text-green-500" /><span>Instant pristup</span></div>
              </div>
              {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3"><AlertCircle className="h-6 w-6" /><p>{error}</p></div>}
              <button onClick={handleCartAction} disabled={isLoading || !isAuthenticated} className={cn('w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all', inCart ? 'bg-green-100 text-green-700 hover:bg-green-200' : isAuthenticated ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}>
                {isLoading ? (<><span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />Obrada...</>) : inCart ? (<><Check className="h-5 w-5" />U korpi - Klikni da ukloniš</>) : (<><ShoppingCart className="h-5 w-5" />{isAuthenticated ? `Kupi za ${formattedPrice}` : 'Prijavite se za kupovinu'}</>)}
              </button>
              {inCart && <p className="text-center text-sm text-green-600 mt-3"><a href="/cart" className="hover:underline font-medium">Idi na korpu →</a></p>}
              {!isAuthenticated && <p className="text-center text-sm text-gray-500 mt-3"><a href="/login" className="text-primary-600 hover:underline">Prijavite se</a> ili <a href="/register" className="text-primary-600 hover:underline">registrujte</a> za kupovinu</p>}
            </div>
          )}
          {!hasPrice && canPurchase && (<div className="text-center py-6 text-gray-500"><Euro className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>Cena nije dostupna za ovaj meč</p></div>)}
          {(isFinished || game.status === 'cancelled') && (<div className="text-center py-6 text-gray-500"><p className="font-medium">{isFinished ? 'Meč je završen' : 'Meč je otkazan'}</p></div>)}
        </div>
      </div>
    </div>
  );
}
