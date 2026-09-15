'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Tv, Settings, Link2, Copy, Check, X, Play, Clock, CheckCircle,
  Radio, Wifi
} from 'lucide-react';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import api from '@/lib/api';

interface PurchasedGame {
  id: number;
  game: any;
  price_paid: string;
  stream_type: string;
  stream_url: string | null;
  stream_key: string | null;
  srt_url: string | null;
  srt_passphrase: string | null;
  stats_token: string;
  stats_url: string;
  order: any;
}

export default function MyGamesPage() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'finished'>('upcoming');
  const [selectedGame, setSelectedGame] = useState<PurchasedGame | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-games', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?filter=${filter}` : '';
      const { data } = await api.get(`/my-games${params}`);
      return data.data;
    },
  });

  const games: PurchasedGame[] = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <Tv className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('myGames.title')}</h1>
          <p className="text-gray-500">{t('myGames.subtitle')}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 dark:bg-dark-800 rounded-lg p-1 w-fit">
        {[
          { key: 'upcoming', label: t('myGames.upcoming'), icon: Clock },
          { key: 'live', label: t('games.live'), icon: Play },
          { key: 'finished', label: t('myGames.finished'), icon: CheckCircle },
          { key: 'all', label: t('common.all'), icon: Tv },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              filter === tab.key
                ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Games List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className="card p-6 animate-pulse h-48" />)}
        </div>
      ) : games.length === 0 ? (
        <div className="card p-12 text-center">
          <Tv className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('myGames.noGames')}</h3>
          <p className="text-gray-500">{t('myGames.noGamesDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((item) => {
            const game = item.game;
            const sportSlug = game?.league?.sport?.slug || 'rukomet';
            const SportIcon = getSportIcon(sportSlug);
            const colors = getSportColors(sportSlug);
            const isUpcoming = new Date(game?.game_datetime) > new Date();
            const isLive = game?.status === 'live';

            return (
              <div key={item.id} className={cn('card p-5', isLive && 'ring-2 ring-green-500')}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', colors.bg)}>
                      <SportIcon className={cn('h-6 w-6', colors.text)} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{game?.league?.sport?.name} • {game?.league?.name}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{game?.home_team}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{game?.away_team}</p>
                    </div>
                  </div>
                  {isLive && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse">
                      {t('games.live').toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  {formatDate(game?.game_datetime)} {formatTime(game?.game_datetime)}
                </div>

                {/* Stream Status */}
                <div className="flex items-center gap-2 mb-4">
                  {item.stream_url || item.srt_url ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <Wifi className="h-3 w-3" /> {t('myGames.streamConfigured')}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                      <Radio className="h-3 w-3" /> {t('myGames.notConfigured')}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isUpcoming && (
                    <button
                      onClick={() => setSelectedGame(item)}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {t('myGames.streamSettings')}
                    </button>
                  )}
                  <button
                    onClick={() => navigator.clipboard.writeText(item.stats_url)}
                    className="btn-secondary flex items-center gap-2"
                    title={t('myGames.copyLink')}
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stream Settings Modal */}
      {selectedGame && (
        <StreamSettingsModal
          purchasedGame={selectedGame}
          onClose={() => setSelectedGame(null)}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['my-games'] });
            setSelectedGame(null);
          }}
        />
      )}
    </div>
  );
}

function StreamSettingsModal({ 
  purchasedGame, 
  onClose, 
  onSave 
}: { 
  purchasedGame: PurchasedGame; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({
    stream_type: purchasedGame.stream_type || 'rtmp',
    stream_url: purchasedGame.stream_url || '',
    stream_key: purchasedGame.stream_key || '',
    srt_url: purchasedGame.srt_url || '',
    srt_passphrase: purchasedGame.srt_passphrase || '',
  });

  // Fetch with credentials visible
  const { data: fullData } = useQuery({
    queryKey: ['my-games', purchasedGame.id],
    queryFn: async () => {
      const { data } = await api.get(`/my-games/${purchasedGame.id}`);
      return data.data;
    },
  });

  // Update form when full data loads
  useState(() => {
    if (fullData) {
      setForm({
        stream_type: fullData.stream_type || 'rtmp',
        stream_url: fullData.stream_url || '',
        stream_key: fullData.stream_key || '',
        srt_url: fullData.srt_url || '',
        srt_passphrase: fullData.srt_passphrase || '',
      });
    }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/my-games/${purchasedGame.id}/stream`, form);
      onSave();
    } catch (err: any) {
      alert(err.response?.data?.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const game = purchasedGame.game;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('streaming.title')}</h2>
            <p className="text-sm text-gray-500">{game?.home_team} vs {game?.away_team}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Link */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            {t('myGames.statsLink')}:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={purchasedGame.stats_url}
              className="input flex-1 text-sm font-mono"
            />
            <button
              onClick={() => copyToClipboard(purchasedGame.stats_url, 'stats')}
              className="btn-secondary flex items-center gap-2"
            >
              {copied === 'stats' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Stream Type Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('streaming.type')}
          </label>
          <div className="flex bg-gray-100 dark:bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setForm({ ...form, stream_type: 'rtmp' })}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
                form.stream_type === 'rtmp'
                  ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {t('streaming.rtmp')}
            </button>
            <button
              onClick={() => setForm({ ...form, stream_type: 'srt' })}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
                form.stream_type === 'srt'
                  ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {t('streaming.srt')}
            </button>
          </div>
        </div>

        {/* RTMP Settings */}
        {form.stream_type === 'rtmp' && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('streaming.serverUrl')}
                  </label>
                  <input
                    type="text"
                    value={form.stream_url}
                    onChange={(e) => setForm({ ...form, stream_url: e.target.value })}
                    placeholder="rtmp://your-server.com/live"
                    className="input w-full font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('streaming.streamKey')}
                  </label>
                  <input
                    type="text"
                    value={form.stream_key}
                    onChange={(e) => setForm({ ...form, stream_key: e.target.value })}
                    placeholder="your-stream-key"
                    className="input w-full font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SRT Settings */}
        {form.stream_type === 'srt' && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('streaming.srtUrl')}
                  </label>
                  <input
                    type="text"
                    value={form.srt_url}
                    onChange={(e) => setForm({ ...form, srt_url: e.target.value })}
                    placeholder="srt://your-server.com:port?streamid=..."
                    className="input w-full font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('streaming.passphrase')}
                  </label>
                  <input
                    type="text"
                    value={form.srt_passphrase}
                    onChange={(e) => setForm({ ...form, srt_passphrase: e.target.value })}
                    placeholder="encryption-passphrase"
                    className="input w-full font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Example */}
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">💡 {t('streaming.obsExample')}:</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
            {form.stream_type === 'rtmp' 
              ? 'Settings → Stream → Service: Custom → Server: rtmp://... → Stream Key: ...'
              : 'Settings → Stream → Service: Custom → Server: srt://...?mode=caller'
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
