'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  Activity,
  FileText,
  Zap,
  Trophy,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  games: {
    today: number;
    this_week: number;
    by_sport: { name: string; count: number; slug: string }[];
    live_now: number;
  };
  invoices: {
    today: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
  revenue: {
    expected: number;
    collected: number;
    pending: number;
    this_month: number;
    last_month: number;
    growth_percent: number;
  };
  api: {
    total_requests_today: number;
    total_requests_week: number;
    active_api_keys: number;
    avg_response_time_ms: number;
  };
  users: {
    online_now: number;
    total: number;
    recent_activity: {
      id: number;
      name: string;
      email: string;
      last_active_at: string;
      is_online: boolean;
    }[];
  };
}

export default function AdminDashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats', refreshKey],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard/stats');
      return data;
    },
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const revenueGrowth = stats?.revenue.growth_percent || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500">Overview of your platform</p>
          </div>
        </div>
        <button onClick={handleRefresh} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Games Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-orange-500" />
          Games Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Live Now</p>
                <p className="text-3xl font-bold mt-1">{stats?.games.live_now || 0}</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Games</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats?.games.today || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">This Week</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats?.games.this_week || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-gray-500 text-sm mb-3">Games by Sport</p>
            <div className="space-y-2">
              {stats?.games.by_sport?.slice(0, 3).map((sport) => (
                <div key={sport.slug} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{sport.name}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{sport.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Revenue
          </h2>
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-sm text-green-600 dark:text-green-400">Collected</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  €{(stats?.revenue.collected || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                  €{(stats?.revenue.pending || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-600 dark:text-blue-400">This Month</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  €{(stats?.revenue.this_month || 0).toLocaleString()}
                </p>
              </div>

              <div className={cn(
                "p-4 rounded-xl",
                revenueGrowth >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"
              )}>
                <p className={cn("text-sm", revenueGrowth >= 0 ? "text-emerald-600" : "text-red-600")}>Growth</p>
                <div className="flex items-center gap-2 mt-1">
                  {revenueGrowth >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  )}
                  <p className={cn("text-2xl font-bold", revenueGrowth >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Collection Progress</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {stats?.revenue.expected ? Math.round((stats.revenue.collected / stats.revenue.expected) * 100) : 0}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats?.revenue.expected ? Math.min((stats.revenue.collected / stats.revenue.expected) * 100, 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>€{(stats?.revenue.collected || 0).toLocaleString()} collected</span>
                <span>€{(stats?.revenue.expected || 0).toLocaleString()} expected</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Invoices
          </h2>
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200 dark:border-dark-600 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.invoices.today || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Today</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-dark-600 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.invoices.this_week || 0}</p>
                <p className="text-sm text-gray-500 mt-1">This Week</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-dark-600 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.invoices.this_month || 0}</p>
                <p className="text-sm text-gray-500 mt-1">This Month</p>
              </div>
              <div className="text-center p-4 border border-gray-200 dark:border-dark-600 rounded-xl">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.invoices.this_year || 0}</p>
                <p className="text-sm text-gray-500 mt-1">This Year</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Stats & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            API Statistics
          </h2>
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">Requests Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {(stats?.api.total_requests_today || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {(stats?.api.total_requests_week || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">Active API Keys</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.api.active_api_keys || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.api.avg_response_time_ms || 0}ms
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Users Activity
            <span className="ml-auto text-sm font-normal text-gray-500">
              {stats?.users.online_now || 0} online / {stats?.users.total || 0} total
            </span>
          </h2>
          <div className="card p-6 max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {stats?.users.recent_activity?.length ? (
                stats.users.recent_activity.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="relative">
                      <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.is_online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        user.is_online 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-gray-100 text-gray-600 dark:bg-dark-600 dark:text-gray-400"
                      )}>
                        {user.is_online ? 'Online' : 'Offline'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.last_active_at ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true }) : 'Never'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
