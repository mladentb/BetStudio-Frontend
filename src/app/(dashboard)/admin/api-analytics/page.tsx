'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, Activity, Clock, TrendingUp, AlertTriangle, 
  Loader2, RefreshCw, Key, Globe
} from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AnalyticsData {
  overview: {
    total_keys: number;
    active_keys: number;
    requests_today: number;
  };
  daily_stats: {
    date: string;
    total_requests: number;
    successful: number;
    failed: number;
    avg_response_time: number;
  }[];
  top_keys: {
    id: number;
    name: string;
    requests_today: number;
    rate_limit: number;
  }[];
  top_endpoints: {
    endpoint: string;
    count: number;
  }[];
  status_codes: {
    status_code: number;
    count: number;
  }[];
}

export default function ApiAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get(`/admin/api-keys/analytics?days=${days}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const maxRequests = data?.daily_stats.length 
    ? Math.max(...data.daily_stats.map(d => d.total_requests)) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Analytics</h1>
            <p className="text-gray-500">Statistika korišćenja B2B API-ja</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input"
          >
            <option value={7}>Poslednjih 7 dana</option>
            <option value={14}>Poslednjih 14 dana</option>
            <option value={30}>Poslednjih 30 dana</option>
            <option value={90}>Poslednjih 90 dana</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ukupno ključeva</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data?.overview.total_keys || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Aktivnih</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data?.overview.active_keys || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Zahteva danas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(data?.overview.requests_today || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Zahteva ukupno</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(data?.daily_stats.reduce((sum, d) => sum + d.total_requests, 0) || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Dnevni zahtevi
          </h3>
          {data?.daily_stats && data.daily_stats.length > 0 ? (
            <div className="h-64">
              <div className="flex items-end gap-1 h-full">
                {data.daily_stats.map((day, i) => {
                  const height = maxRequests > 0 ? (day.total_requests / maxRequests) * 100 : 0;
                  const successRate = day.total_requests > 0 
                    ? (day.successful / day.total_requests) * 100 
                    : 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full rounded-t relative group cursor-pointer"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      >
                        <div 
                          className="absolute inset-0 bg-green-500 rounded-t"
                          style={{ height: `${successRate}%` }}
                        />
                        <div 
                          className="absolute bottom-0 inset-x-0 bg-red-500 rounded-t"
                          style={{ height: `${100 - successRate}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {new Date(day.date).toLocaleDateString('sr')}<br/>
                          {day.total_requests} zahteva<br/>
                          {day.successful} uspešnih<br/>
                          {day.avg_response_time}ms avg
                        </div>
                      </div>
                      {i % Math.ceil(data.daily_stats.length / 10) === 0 && (
                        <span className="text-xs text-gray-400 transform -rotate-45 origin-left">
                          {new Date(day.date).toLocaleDateString('sr', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nema podataka za prikazivanje
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-gray-500">Uspešni</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-gray-500">Neuspešni</span>
            </div>
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Najpopularniji endpointi
          </h3>
          {data?.top_endpoints && data.top_endpoints.length > 0 ? (
            <div className="space-y-3">
              {data.top_endpoints.map((endpoint, i) => (
                <div key={endpoint.endpoint} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-4">{i + 1}.</span>
                  <code className="flex-1 text-sm font-mono text-purple-600 truncate">
                    {endpoint.endpoint}
                  </code>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {endpoint.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nema podataka</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top API Keys */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Najaktivniji API ključevi
          </h3>
          {data?.top_keys && data.top_keys.length > 0 ? (
            <div className="space-y-3">
              {data.top_keys.map((key, i) => (
                <div key={key.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-4">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{key.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${Math.min((key.requests_today / key.rate_limit) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {((key.requests_today / key.rate_limit) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {key.requests_today.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nema podataka</p>
          )}
        </div>

        {/* Status Codes */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            HTTP Status kodovi
          </h3>
          {data?.status_codes && data.status_codes.length > 0 ? (
            <div className="space-y-3">
              {data.status_codes.map((status) => {
                const total = data.status_codes.reduce((sum, s) => sum + s.count, 0);
                const percentage = total > 0 ? (status.count / total) * 100 : 0;
                const color = status.status_code >= 200 && status.status_code < 300
                  ? 'bg-green-500'
                  : status.status_code >= 400 && status.status_code < 500
                  ? 'bg-yellow-500'
                  : status.status_code >= 500
                  ? 'bg-red-500'
                  : 'bg-gray-500';
                return (
                  <div key={status.status_code} className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${color}`}>
                      {status.status_code}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-700 rounded-full">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {status.count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nema podataka</p>
          )}
        </div>
      </div>
    </div>
  );
}
