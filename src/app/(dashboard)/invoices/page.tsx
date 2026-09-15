'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  FileText, Download, Eye, Calendar, Building2, 
  CheckCircle, Clock, AlertCircle, Search, Filter,
  TrendingUp, DollarSign, BarChart2
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  subtotal: string;
  discount_percent: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  currency: string;
  status: string;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  order: { order_number: string } | null;
  seller_company: { name: string } | null;
}

export default function InvoicesPage() {
  const { t, locale } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const MONTHS = [
    { value: '', label: t('common.all') },
    { value: '1', label: 'Jan' },
    { value: '2', label: 'Feb' },
    { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' },
    { value: '8', label: 'Aug' },
    { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
  ];

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Clock },
    paid: { label: t('finance.paid'), color: 'bg-green-100 text-green-700', icon: CheckCircle },
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  };

  const { data, isLoading } = useQuery({
    queryKey: ['my-invoices', search, statusFilter, yearFilter, monthFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (monthFilter) params.append('month', monthFilter);
      const { data } = await api.get(`/invoices?${params}`);
      return data;
    },
  });

  const invoices: Invoice[] = data?.data || [];
  const stats = data?.stats || {};
  const monthlySpending = data?.monthly_spending || {};
  const availableYears = data?.available_years || [];

  const handleDownload = async (invoice: Invoice) => {
    try {
      const response = await api.get(`/invoices/${invoice.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(t('errors.generic'));
    }
  };

  const handlePreview = async (invoice: Invoice) => {
    try {
      const response = await api.get(`/invoices/${invoice.id}/preview`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      alert(t('errors.generic'));
    }
  };

  // Get max value for chart
  const monthlyValues = Object.values(monthlySpending).map((m: any) => parseFloat(m.total) || 0);
  const maxMonthly = Math.max(...monthlyValues, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
          <FileText className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoices.title')}</h1>
          <p className="text-gray-500">{t('invoices.preview')}, {t('common.search').toLowerCase()}, {t('invoices.download').toLowerCase()}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_count || 0}</p>
              <p className="text-xs text-gray-500">{t('invoices.title')}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">€{(stats.paid_total || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">{t('finance.paid')} ({stats.paid_count || 0})</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">€{(stats.unpaid_total || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">{t('finance.pending')} ({stats.pending_count || 0})</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">€{(stats.total_spent || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">{t('finance.totalRevenue')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      {Object.keys(monthlySpending).length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-gray-500" />
            Monthly Spending ({new Date().getFullYear()})
          </h3>
          <div className="flex items-end gap-1 h-32">
            {MONTHS.slice(1).map((month, index) => {
              const monthNum = index + 1;
              const monthData = monthlySpending[monthNum];
              const value = monthData ? parseFloat(monthData.total) : 0;
              const height = maxMonthly > 0 ? (value / maxMonthly) * 100 : 0;
              const count = monthData?.count || 0;
              
              return (
                <div key={month.value} className="flex-1 flex flex-col items-center group relative">
                  {value > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      €{value.toFixed(0)} ({count})
                    </div>
                  )}
                  <div className="w-full flex flex-col items-center justify-end h-24">
                    <div 
                      className={cn(
                        'w-full rounded-t transition-all',
                        monthNum <= new Date().getMonth() + 1 ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-dark-700'
                      )}
                      style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{month.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('common.all')}</option>
            <option value="paid">{t('finance.paid')}</option>
            <option value="sent">Sent</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('common.all')}</option>
            {availableYears.map((year: number) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="input"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {isLoading ? (
        <div className="card p-8 text-center text-gray-500">{t('common.loading')}</div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('invoices.noInvoices')}</h3>
          <p className="text-gray-500">{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoices.invoiceNumber')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoices.issueDate')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoices.dueDate')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.amount')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('finance.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {invoices.map((invoice) => {
                const status = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                const StatusIcon = status.icon;
                const hasDiscount = parseFloat(invoice.discount_percent) > 0;
                
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                    <td className="px-4 py-4">
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </span>
                      {invoice.order && (
                        <p className="text-xs text-gray-500">Order: {invoice.order.order_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {invoice.seller_company?.name || 'BetStudio'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        €{parseFloat(invoice.total).toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="ml-2 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          -{invoice.discount_percent}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit', status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handlePreview(invoice)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                          title={t('invoices.preview')}
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDownload(invoice)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                          title={t('invoices.download')}
                        >
                          <Download className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
