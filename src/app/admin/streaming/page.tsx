'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Radio, Search, Copy, Check, User, Calendar, 
  Tv, Filter, ExternalLink
} from 'lucide-react';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import api from '@/lib/api';

interface Destination {
  id: number;
  user: { name: string; email: string; company: string | null };
  game: {
    home_team: string;
    away_team: string;
    datetime: string;
    status: string;
    league: string;
    sport_slug: string;
  };
  stream_type: string;
  stream_url: string;
  stream_key: string;
  updated_at: string;
}

export default function StreamingPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [onlyWithUrl, setOnlyWithUrl] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-streaming', search, typeFilter, statusFilter, onlyWithUrl, showPast],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('stream_type', typeFilter);
      if (statusFilter) params.append('game_status', statusFilter);
      if (onlyWithUrl) params.append('only_with_url', '1');
      if (!showPast) params.append('only_future', '1');
      const { data } = await api.get(`/admin/streaming?${params}`);
      return data;
    },
  });

  const destinations: Destination[] = data?.data || [];
  const stats = data?.stats || { total: 0, rtmp: 0, srt: 0 };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = (dest: Destination) => {
    const text = `Meč: ${dest.game.home_team} vs ${dest.game.away_team}
Datum: ${formatDate(dest.game.datetime)} ${formatTime(dest.game.datetime)}
Liga: ${dest.game.league}
Korisnik: ${dest.user.name} (${dest.user.email})
Tip: ${dest.stream_type.toUpperCase()}
URL: ${dest.stream_url}
Ključ: ${dest.stream_key || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(dest.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
          <Radio className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Streaming Destinacije</h1>
          <p className="text-gray-500">Pregled svih unetih video destinacija korisnika</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Tv className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-500">Ukupno</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.with_url || 0}</p>
            <p className="text-sm text-gray-500">Sa URL-om</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 font-bold text-sm">RTMP</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rtmp}</p>
            <p className="text-sm text-gray-500">RTMP</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 font-bold text-sm">SRT</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.srt}</p>
            <p className="text-sm text-gray-500">SRT</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pretraži po korisniku ili meču..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input">
            <option value="">Svi tipovi</option>
            <option value="rtmp">RTMP</option>
            <option value="srt">SRT</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="">Svi statusi meča</option>
            <option value="scheduled">Zakazan</option>
            <option value="live">LIVE</option>
            <option value="finished">Završen</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              checked={onlyWithUrl}
              onChange={(e) => setOnlyWithUrl(e.target.checked)}
              className="rounded text-green-600"
            />
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">Samo sa URL-om</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="rounded text-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-400 font-medium">Prikaži prošle</span>
          </label>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">Učitavanje...</div>
      ) : destinations.length === 0 ? (
        <div className="card p-12 text-center">
          <Radio className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nema destinacija</h3>
          <p className="text-gray-500">Korisnici još nisu uneli streaming destinacije</p>
        </div>
      ) : (
        <div className="space-y-4">
          {destinations.map((dest) => {
            const SportIcon = getSportIcon(dest.game.sport_slug);
            const colors = getSportColors(dest.game.sport_slug);
            const isLive = dest.game.status === 'live';
            const isCopied = copiedId === dest.id;

            return (
              <div key={dest.id} className={cn('card p-4', isLive && 'ring-2 ring-green-500')}>
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Game & User Info */}
                  <div className="flex gap-4 flex-1">
                    <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
                      <SportIcon className={cn('h-6 w-6', colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-bold uppercase',
                          dest.stream_type === 'rtmp' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-green-100 text-green-700'
                        )}>
                          {dest.stream_type}
                        </span>
                        {isLive && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white animate-pulse">
                            LIVE
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{dest.game.league}</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {dest.game.home_team} vs {dest.game.away_team}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(dest.game.datetime)} {formatTime(dest.game.datetime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {dest.user.name} ({dest.user.email})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Copy Button */}
                  <button
                    onClick={() => copyAll(dest)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                      isCopied 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-300'
                    )}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {isCopied ? 'Kopirano!' : 'Kopiraj sve'}
                  </button>
                </div>

                {/* Stream Details */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-16">URL:</span>
                    <code className="flex-1 bg-gray-100 dark:bg-dark-800 px-3 py-1.5 rounded text-sm font-mono truncate">
                      {dest.stream_url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(dest.stream_url, dest.id * 1000)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                    >
                      <Copy className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  {dest.stream_key && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-16">Ključ:</span>
                      <code className="flex-1 bg-gray-100 dark:bg-dark-800 px-3 py-1.5 rounded text-sm font-mono truncate">
                        {dest.stream_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(dest.stream_key, dest.id * 1000 + 1)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
