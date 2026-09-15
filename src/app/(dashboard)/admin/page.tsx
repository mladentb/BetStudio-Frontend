'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Trash2, RefreshCw, Edit2, CheckCircle, XCircle, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface League {
  id: number;
  name: string;
  name_en: string | null;
  slug: string;
  sport_id: number;
  api_league_id: string;
  api_endpoint: string;
  api_source: string;
  api_token: string | null;
  gender: string;
  country_code: string | null;
  country_name: string | null;
  is_active: boolean;
  sport?: { id: number; name: string; slug: string };
  games_count?: number;
}

interface Sport {
  id: number;
  name: string;
  slug: string;
}

// Countries list
const COUNTRIES = [
  { code: 'SRB', name: 'Srbija' },
  { code: 'HRV', name: 'Hrvatska' },
  { code: 'BIH', name: 'Bosna i Hercegovina' },
  { code: 'MNE', name: 'Crna Gora' },
  { code: 'SLO', name: 'Slovenija' },
  { code: 'MKD', name: 'Severna Makedonija' },
  { code: 'GER', name: 'Nemačka' },
  { code: 'ESP', name: 'Španija' },
  { code: 'FRA', name: 'Francuska' },
  { code: 'ITA', name: 'Italija' },
  { code: 'ENG', name: 'Engleska' },
  { code: 'EUR', name: 'Evropa' },
  { code: 'INT', name: 'Internacionalno' },
];

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [syncingLeague, setSyncingLeague] = useState<number | null>(null);

  const { data: leaguesData, isLoading } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: async () => {
      const { data } = await api.get('/leagues?with_games_count=true&is_active=all&per_page=0');
      return data;
    },
  });

  const { data: sportsData } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const { data } = await api.get('/sports');
      return data;
    },
  });

  const leagues: League[] = leaguesData?.data || [];
  const sports: Sport[] = sportsData?.data || [];

  const syncMutation = useMutation({
    mutationFn: async (leagueId: number) => {
      setSyncingLeague(leagueId);
      const { data } = await api.post(`/sync/games/${leagueId}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
      setSyncingLeague(null);
      alert(`Sinhronizovano: ${data.count} utakmica`);
    },
    onError: (err: any) => {
      setSyncingLeague(null);
      alert('Greška: ' + (err.response?.data?.message || err.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (leagueId: number) => {
      await api.delete(`/leagues/${leagueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
      alert('Liga uspešno obrisana');
    },
    onError: (err: any) => {
      alert('Greška pri brisanju: ' + (err.response?.data?.message || err.message));
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/sync/all');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
      alert(`Sinhronizovano: ${data.games_synced} utakmica iz ${data.leagues_synced} liga`);
    },
    onError: (err: any) => {
      alert('Greška: ' + (err.response?.data?.message || err.message));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-gray-500">Upravljanje API konekcijama</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => syncAllMutation.mutate()}
            disabled={syncAllMutation.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', syncAllMutation.isPending && 'animate-spin')} />
            {syncAllMutation.isPending ? 'Sync...' : 'Sync All'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Dodaj Ligu
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{leagues.length}</div>
          <div className="text-sm text-gray-500">Ukupno liga</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-600">{leagues.filter(l => l.is_active).length}</div>
          <div className="text-sm text-gray-500">Aktivne lige</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-blue-600">
            {leagues.reduce((sum, l) => sum + (l.games_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-500">Ukupno utakmica</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-purple-600">
            {[...new Set(leagues.map(l => l.country_code).filter(Boolean))].length}
          </div>
          <div className="text-sm text-gray-500">Država</div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingLeague) && (
        <LeagueForm
          league={editingLeague}
          sports={sports}
          onClose={() => {
            setShowAddForm(false);
            setEditingLeague(null);
          }}
          onSuccess={() => {
            setShowAddForm(false);
            setEditingLeague(null);
            queryClient.invalidateQueries({ queryKey: ['admin-leagues'] });
          }}
        />
      )}

      {/* Leagues Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">API Konekcije</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Učitavanje...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liga</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sport</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Država</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utakmice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {leagues.map((league) => (
                  <tr key={league.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{league.name}</div>
                      {league.name_en && (
                        <div className="text-xs text-gray-500">{league.name_en}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {league.sport?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {league.country_name ? (
                        <span className="flex items-center gap-1">
                          <span className="text-xs font-medium text-gray-500">{league.country_code}</span>
                          <span className="text-gray-700 dark:text-gray-300">{league.country_name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {league.gender === 'male' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">M</span>
                      ) : league.gender === 'female' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">Ž</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {league.api_source || 'N/A'}
                        </span>
                        {league.api_endpoint && (
                          <a 
                            href={league.api_endpoint} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                            title={league.api_endpoint}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {league.games_count || 0}
                    </td>
                    <td className="px-4 py-3">
                      {league.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" /> Aktivna
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-sm">
                          <XCircle className="h-4 w-4" /> Neaktivna
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingLeague(league)}
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                          title="Izmeni"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => syncMutation.mutate(league.id)}
                          disabled={syncingLeague === league.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Sync"
                        >
                          <RefreshCw className={cn('h-4 w-4', syncingLeague === league.id && 'animate-spin')} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Obrisati ligu "${league.name}" i sve njene utakmice?`)) {
                              deleteMutation.mutate(league.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Obriši"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DScore Info */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">DScore.live API Info</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          Za dodavanje novih liga sa DScore, potreban je ID lige sa njihovog sajta.
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Endpoint format: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">
            https://new-api.dscore.live/leagues/[LEAGUE_ID]/public-schedule
          </code>
        </p>
      </div>
    </div>
  );
}

// League Form Component (Add/Edit)
function LeagueForm({ 
  league,
  sports, 
  onClose, 
  onSuccess 
}: { 
  league?: League | null;
  sports: Sport[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const isEdit = !!league;
  const [formData, setFormData] = useState({
    name: league?.name || '',
    name_en: league?.name_en || '',
    slug: league?.slug || '',
    sport_id: league?.sport_id?.toString() || '',
    api_source: league?.api_source || 'dscore',
    api_league_id: league?.api_league_id || '',
    api_endpoint: league?.api_endpoint || '',
    api_token: league?.api_token || '',
    gender: league?.gender || '',
    country_code: league?.country_code || '',
    country_name: league?.country_name || '',
    is_active: league?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    setFormData({
      ...formData,
      country_code: code,
      country_name: country?.name || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let endpoint = formData.api_endpoint;
      if (formData.api_source === 'dscore' && formData.api_league_id && !endpoint) {
        endpoint = `https://new-api.dscore.live/leagues/${formData.api_league_id}/public-schedule`;
      }

      const payload = {
        ...formData,
        api_endpoint: endpoint,
        api_token: formData.api_token || null,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        gender: formData.gender || null,
        country_code: formData.country_code || null,
        country_name: formData.country_name || null,
      };

      if (isEdit && league) {
        await api.put(`/leagues/${league.id}`, payload);
      } else {
        await api.post('/leagues', payload);
      }

      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Greška pri čuvanju';
      setError(errorMessage);
      
      // If league not found (404), close modal after showing error
      if (err.response?.status === 404) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Izmeni ligu' : 'Dodaj novu ligu'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Naziv lige *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="npr. Superliga Srbije"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Naziv (engleski)
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="input w-full"
                placeholder="npr. Serbian Superleague"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sport *
              </label>
              <select
                required
                value={formData.sport_id}
                onChange={(e) => setFormData({ ...formData, sport_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Izaberi sport</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>{sport.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Država
              </label>
              <select
                value={formData.country_code}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="input w-full"
              >
                <option value="">Izaberi državu</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pol
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input w-full"
              >
                <option value="">Nije specificirano</option>
                <option value="male">Muškarci</option>
                <option value="female">Žene</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Source *
              </label>
              <select
                value={formData.api_source}
                onChange={(e) => setFormData({ ...formData, api_source: e.target.value })}
                className="input w-full"
              >
                <option value="dscore">DScore.live</option>
                <option value="arkus">Arkus Liga</option>
                <option value="custom">Custom API</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API League ID
              </label>
              <input
                type="text"
                value={formData.api_league_id}
                onChange={(e) => setFormData({ ...formData, api_league_id: e.target.value })}
                className="input w-full"
                placeholder="npr. 184"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="input w-full"
                placeholder="auto-generated"
              />
            </div>
          </div>

          {formData.api_source !== 'dscore' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Endpoint URL
              </label>
              <input
                type="text"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                className="input w-full"
                placeholder="https://api.example.com/leagues/5/schedule"
              />
            </div>
          )}

          {/* API Token field - show for custom APIs or when explicitly needed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Token / Bearer Token
            </label>
            <input
              type="password"
              value={formData.api_token}
              onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
              className="input w-full font-mono"
              placeholder="Ostavite prazno ako nije potrebno"
            />
            <p className="text-xs text-gray-500 mt-1">
              Token za autentifikaciju API-ja (ako je potreban)
            </p>
          </div>

          {formData.api_source === 'dscore' && formData.api_league_id && (
            <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Generisani endpoint:</p>
              <code className="text-sm text-blue-600 dark:text-blue-400">
                https://new-api.dscore.live/leagues/{formData.api_league_id}/public-schedule
              </code>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Aktivna liga
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Otkaži
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Čuvanje...' : isEdit ? 'Sačuvaj izmene' : 'Dodaj ligu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
