'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Trophy,
  Calendar, CreditCard, Globe, Target, Award, FileText, Clock, CheckCircle,
  AlertCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { getSportIcon, getSportColors } from '@/lib/sportIcons';
import api from '@/lib/api';

const PERIODS = [
  { value: '7days', label: 'Poslednjih 7 Dana' },
  { value: '30days', label: 'Poslednjih 30 Dana' },
  { value: '3months', label: 'Poslednja 3 Meseca' },
  { value: '6months', label: 'Poslednjih 6 Meseci' },
  { value: '1year', label: 'Poslednja Godina' },
  { value: 'all', label: 'Sve Vreme' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const { data } = await api.get(`/admin/analytics?period=${period}`);
      return data.data;
    },
  });

  const overview = data?.overview || {};
  const revenueByMonth = data?.revenue_by_month || [];
  const ordersByStatus = data?.orders_by_status || [];
  const revenueBySport = data?.revenue_by_sport || [];
  const revenueByLeague = data?.revenue_by_league || [];
  const revenueByPayment = data?.revenue_by_payment_method || [];
  const revenueByDayType = data?.revenue_by_day_type || [];
  const topGames = data?.top_games || [];
  const recentOrders = data?.recent_orders || [];

  const tabs = [
    { id: 'overview', label: 'Pregled', icon: BarChart3 },
    { id: 'orders', label: 'Porudžbine', icon: ShoppingCart },
    { id: 'sports', label: 'Po Sportu', icon: Trophy },
    { id: 'payments', label: 'Plaćanja', icon: CreditCard },
    { id: 'top', label: 'Top Mečevi', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reporting</h1>
            <p className="text-gray-500">Dubinska poslovna analiza i trendovi</p>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Main Stats - 2 rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Ukupan Prihod" 
          value={`€${(overview.total_revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard 
          title="Plaćeno" 
          value={`€${(overview.paid_revenue || 0).toLocaleString()}`}
          subtitle={`${overview.paid_orders || 0} porudžbina`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard 
          title="Čeka Uplatu" 
          value={`€${(overview.unpaid_revenue || 0).toLocaleString()}`}
          subtitle={`${overview.unpaid_orders || 0} porudžbina`}
          icon={Clock}
          color="amber"
        />
        <StatCard 
          title="Stopa Naplate" 
          value={`${overview.payment_rate || 0}%`}
          subtitle="plaćeno od ukupno"
          icon={Target}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Porudžbine" 
          value={overview.total_orders || 0}
          icon={ShoppingCart}
          color="indigo"
        />
        <StatCard 
          title="Fakture" 
          value={overview.total_invoices || 0}
          subtitle={`${overview.pending_invoices || 0} na čekanju`}
          icon={FileText}
          color="cyan"
        />
        <StatCard 
          title="Korisnici" 
          value={overview.total_users || 0}
          subtitle={`${overview.new_users || 0} novih`}
          icon={Users}
          color="pink"
        />
        <StatCard 
          title="Avg Order" 
          value={`€${(overview.avg_order_value || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="teal"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-dark-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-gray-500">Učitavanje analitike...</div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Month Chart */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Prihod po Mesecu</h3>
                <div className="h-64">
                  <RevenueBarChart data={revenueByMonth} />
                </div>
              </div>

              {/* Revenue by Day Type */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Radni Dani vs Vikend</h3>
                <div className="space-y-6">
                  {revenueByDayType.map((item: any) => {
                    const total = revenueByDayType.reduce((s: number, i: any) => s + (i.revenue || 0), 0);
                    const percent = total > 0 ? (item.revenue / total) * 100 : 0;
                    const paidPercent = item.revenue > 0 ? (item.paid / item.revenue) * 100 : 0;
                    return (
                      <div key={item.type}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                          <span className="font-bold">€{(item.revenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className={cn('h-full rounded-full', item.type === 'weekend' ? 'bg-purple-500' : 'bg-blue-500')}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-sm">
                          <span className="text-gray-500">{percent.toFixed(1)}% od ukupno</span>
                          <span className="text-green-600">€{(item.paid || 0).toLocaleString()} plaćeno ({paidPercent.toFixed(0)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="card p-6 lg:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Poslednje Porudžbine</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase">
                        <th className="pb-3">Broj</th>
                        <th className="pb-3">Korisnik</th>
                        <th className="pb-3">Iznos</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Faktura</th>
                        <th className="pb-3">Datum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                      {recentOrders.map((order: any) => (
                        <tr key={order.id}>
                          <td className="py-3 font-mono text-sm">{order.order_number}</td>
                          <td className="py-3">{order.user}</td>
                          <td className="py-3 font-semibold">€{parseFloat(order.total).toLocaleString()}</td>
                          <td className="py-3">
                            <StatusBadge status={order.payment_status} />
                          </td>
                          <td className="py-3">
                            {order.invoice ? (
                              <span className="text-green-600 text-sm">{order.invoice}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 text-sm text-gray-500">{order.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders by Status */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Status Porudžbina</h3>
                <div className="space-y-4">
                  {ordersByStatus.map((item: any) => {
                    const total = ordersByStatus.reduce((s: number, i: any) => s + (i.count || 0), 0);
                    const percent = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.payment_status} className="flex items-center gap-4">
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: item.color + '20' }}
                        >
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.label}</span>
                            <span className="text-gray-500">{item.count} porudžbina</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ width: `${percent}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="font-bold">€{parseFloat(item.revenue || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{percent.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="space-y-4">
                <div className="card p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Naplaćeno</p>
                      <p className="text-3xl font-bold mt-1">€{(overview.paid_revenue || 0).toLocaleString()}</p>
                      <p className="text-green-200 text-sm mt-1">{overview.paid_orders || 0} porudžbina</p>
                    </div>
                    <CheckCircle className="h-12 w-12 text-green-200" />
                  </div>
                </div>
                <div className="card p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100">Čeka Naplatu</p>
                      <p className="text-3xl font-bold mt-1">€{(overview.unpaid_revenue || 0).toLocaleString()}</p>
                      <p className="text-amber-200 text-sm mt-1">{overview.unpaid_orders || 0} porudžbina</p>
                    </div>
                    <Clock className="h-12 w-12 text-amber-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sports Tab */}
          {activeTab === 'sports' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Sport */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Prihod po Sportu</h3>
                <div className="space-y-4">
                  {revenueBySport.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nema podataka</p>
                  ) : revenueBySport.map((item: any) => {
                    const total = revenueBySport.reduce((s: number, i: any) => s + parseFloat(i.revenue || 0), 0);
                    const percent = total > 0 ? (parseFloat(item.revenue) / total) * 100 : 0;
                    const SportIcon = getSportIcon(item.slug);
                    const colors = getSportColors(item.slug);
                    return (
                      <div key={item.sport} className="flex items-center gap-4">
                        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colors.bg)}>
                          <SportIcon className={cn('h-5 w-5', colors.text)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{item.sport}</span>
                            <span className="text-gray-500">{item.sales} prodaja</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', colors.bg.replace('bg-', 'bg-'))} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="font-bold text-gray-900 dark:text-white">€{parseFloat(item.revenue).toLocaleString()}</p>
                          <p className="text-xs text-green-600">€{parseFloat(item.paid_revenue || 0).toLocaleString()} plaćeno</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Leagues */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top 10 Liga</h3>
                <div className="space-y-3">
                  {revenueByLeague.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nema podataka</p>
                  ) : revenueByLeague.map((item: any, index: number) => (
                    <div key={item.league} className="flex items-center gap-3">
                      <span className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400'
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.league}</p>
                        <p className="text-xs text-gray-500">{item.sport} • {item.sales} prodaja</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">€{parseFloat(item.revenue).toLocaleString()}</span>
                        <p className="text-xs text-green-600">€{parseFloat(item.paid_revenue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Načini Plaćanja</h3>
                <div className="space-y-4">
                  {revenueByPayment.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nema podataka</p>
                  ) : revenueByPayment.map((item: any) => {
                    const total = revenueByPayment.reduce((s: number, i: any) => s + parseFloat(i.revenue || 0), 0);
                    const percent = total > 0 ? (parseFloat(item.revenue) / total) * 100 : 0;
                    const paidPercent = item.orders > 0 ? (item.paid_orders / item.orders) * 100 : 0;
                    const colors: Record<string, string> = {
                      bank_transfer: '#3b82f6',
                      card: '#8b5cf6',
                      crypto: '#f59e0b',
                      paypal: '#6366f1',
                    };
                    const color = colors[item.payment_method] || '#6b7280';
                    return (
                      <div key={item.payment_method}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4" style={{ color }} />
                            {item.label}
                          </span>
                          <span className="font-bold">€{parseFloat(item.revenue).toLocaleString()}</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
                        </div>
                        <div className="flex justify-between mt-1 text-sm">
                          <span className="text-gray-500">{item.orders} porudžbina ({percent.toFixed(1)}%)</span>
                          <span className="text-green-600">{item.paid_orders} plaćeno ({paidPercent.toFixed(0)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Fakture</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{overview.total_invoices || 0}</p>
                    <p className="text-sm text-blue-600">Ukupno</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{overview.paid_invoices || 0}</p>
                    <p className="text-sm text-green-600">Plaćene</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg text-center col-span-2">
                    <Clock className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-700">{overview.pending_invoices || 0}</p>
                    <p className="text-sm text-amber-600">Na Čekanju</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Games Tab */}
          {activeTab === 'top' && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top 10 Najprodavanijih Mečeva</h3>
              {topGames.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nema podataka za prikaz</p>
              ) : (
                <div className="space-y-3">
                  {topGames.map((game: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                      <span className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold',
                        index === 0 ? 'bg-amber-400 text-white' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-200 text-gray-600 dark:bg-dark-600 dark:text-gray-400'
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{game.game}</p>
                        <p className="text-sm text-gray-500">{game.league}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">€{parseFloat(game.revenue).toLocaleString()}</p>
                        <p className="text-xs text-green-600">€{parseFloat(game.paid_revenue || 0).toLocaleString()} plaćeno</p>
                        <p className="text-xs text-gray-500">{game.sales} prodaja</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600',
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    paid: { label: 'Plaćeno', color: 'bg-green-100 text-green-700' },
    unpaid: { label: 'Neplaćeno', color: 'bg-amber-100 text-amber-700' },
    refunded: { label: 'Refund', color: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Otkazano', color: 'bg-red-100 text-red-700' },
  };
  const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', c.color)}>{c.label}</span>;
}

function RevenueBarChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400">Nema podataka</div>;
  }

  const maxValue = Math.max(...data.map(d => parseFloat(d.total_revenue) || 0));

  return (
    <div className="flex items-end justify-between h-full gap-1 pb-6">
      {data.map((item, index) => {
        const total = parseFloat(item.total_revenue) || 0;
        const paid = parseFloat(item.paid_revenue) || 0;
        const height = maxValue > 0 ? (total / maxValue) * 100 : 0;
        const paidHeight = maxValue > 0 ? (paid / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex-1 flex flex-col items-center group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              €{total.toLocaleString()} (€{paid.toLocaleString()} plaćeno)
            </div>
            <div className="w-full flex flex-col items-center justify-end h-44 relative">
              {/* Unpaid part */}
              <div 
                className="w-full bg-amber-400 rounded-t-sm absolute bottom-0"
                style={{ height: `${height}%`, minHeight: total > 0 ? '4px' : '0' }}
              />
              {/* Paid part overlay */}
              <div 
                className="w-full bg-green-500 rounded-t-sm absolute bottom-0"
                style={{ height: `${paidHeight}%`, minHeight: paid > 0 ? '4px' : '0' }}
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{item.month?.slice(-2)}</span>
          </div>
        );
      })}
    </div>
  );
}
