'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Save, Calendar, CalendarDays, Trophy, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import api from '@/lib/api';

interface LeagueWithPrice {
  id: number;
  name: string;
  sport: { id: number; name: string; slug: string };
  weekday_price: number;
  weekend_price: number;
  currency: string;
  is_active: boolean;
  has_price: boolean;
}

export default function AdminPricingPage() {
  const queryClient = useQueryClient();
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [prices, setPrices] = useState<Record<number, { weekday: string; weekend: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sports for filter
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const { data } = await api.get('/sports');
      return data.data;
    },
  });

  // Leagues with prices
  const { data, isLoading } = useQuery({
    queryKey: ['admin-prices', selectedSport],
    queryFn: async () => {
      const params = selectedSport ? `?sport_id=${selectedSport}` : '';
      const { data } = await api.get(`/admin/prices${params}`);
      return data.data;
    },
  });

  const leagues: LeagueWithPrice[] = data || [];

  // Initialize prices when data loads
  useEffect(() => {
    if (leagues.length > 0) {
      const initial: Record<number, { weekday: string; weekend: string }> = {};
      leagues.forEach(l => {
        initial[l.id] = {
          weekday: String(l.weekday_price || '0'),
          weekend: String(l.weekend_price || '0'),
        };
      });
      setPrices(initial);
      setHasChanges(false);
    }
  }, [data]);

  const updatePrice = (leagueId: number, type: 'weekday' | 'weekend', value: string) => {
    setPrices(prev => ({
      ...prev,
      [leagueId]: { ...prev[leagueId], [type]: value }
    }));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const pricesArray = Object.entries(prices).map(([leagueId, p]) => ({
        league_id: Number(leagueId),
        weekday_price: parseFloat(p.weekday) || 0,
        weekend_price: parseFloat(p.weekend) || 0,
      }));
      await api.post('/admin/prices/bulk', { prices: pricesArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prices'] });
      setHasChanges(false);
      alert('Cene sačuvane!');
    },
  });

  // Group by sport
  const groupedBySport = leagues.reduce((acc, league) => {
    const sportId = league.sport.id;
    if (!acc[sportId]) {
      acc[sportId] = { sport: league.sport, leagues: [] };
    }
    acc[sportId].leagues.push(league);
    return acc;
  }, {} as Record<number, { sport: any; leagues: LeagueWithPrice[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <Tag className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cenovnik</h1>
            <p className="text-gray-500">Cene za lige - radni dani i vikend</p>
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          className={cn(
            'btn-primary flex items-center gap-2',
            !hasChanges && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Čuvanje...' : 'Sačuvaj sve'}
        </button>
      </div>

      {/* Sport Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-500" />
        <button
          onClick={() => setSelectedSport(null)}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            selectedSport === null
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
          )}
        >
          Svi sportovi
        </button>
        {sports?.map((sport: any) => {
          const SportIcon = getSportIcon(sport.slug);
          const colors = getSportColors(sport.slug);
          return (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                selectedSport === sport.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
              )}
            >
              <SportIcon className="h-4 w-4" />
              {sport.name}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <div className="flex gap-4 text-sm text-blue-700 dark:text-blue-300">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Radni dani: Pon-Pet</span>
          <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Vikend: Sub-Ned</span>
        </div>
      </div>

      {/* Pricing Table */}
      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Učitavanje...</div>
      ) : leagues.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">Nema liga</div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedBySport).map(({ sport, leagues: sportLeagues }) => {
            const SportIcon = getSportIcon(sport.slug);
            const colors = getSportColors(sport.slug);
            
            return (
              <div key={sport.id} className="card overflow-hidden">
                {/* Sport Header */}
                <div className={cn('px-4 py-3 flex items-center gap-3', colors.bg)}>
                  <SportIcon className={cn('h-5 w-5', colors.text)} />
                  <h3 className={cn('font-semibold', colors.text)}>{sport.name}</h3>
                  <span className="text-sm opacity-75 ml-auto">{sportLeagues.length} liga</span>
                </div>
                
                {/* Leagues Table */}
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liga</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-40">
                        <span className="flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" /> Radni dan (€)
                        </span>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-40">
                        <span className="flex items-center justify-center gap-1">
                          <CalendarDays className="h-3 w-3" /> Vikend (€)
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {sportLeagues.map((league) => (
                      <tr key={league.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900 dark:text-white">{league.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={prices[league.id]?.weekday ?? ''}
                            onChange={(e) => updatePrice(league.id, 'weekday', e.target.value)}
                            className="input w-full text-center"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={prices[league.id]?.weekend ?? ''}
                            onChange={(e) => updatePrice(league.id, 'weekend', e.target.value)}
                            className="input w-full text-center"
                            placeholder="0.00"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary shadow-lg flex items-center gap-2 px-6 py-3"
          >
            <Save className="h-5 w-5" />
            {saveMutation.isPending ? 'Čuvanje...' : 'Sačuvaj promene'}
          </button>
        </div>
      )}
    </div>
  );
}
