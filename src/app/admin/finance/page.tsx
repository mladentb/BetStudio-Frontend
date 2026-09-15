'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, XCircle, 
  FileText, Search, Filter, Eye, Receipt, CreditCard, Download
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface Order {
  id: number;
  order_number: string;
  user: { id: number; name: string; email: string; company_name: string };
  status: string;
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  invoice: { id: number; invoice_number: string } | null;
  items: any[];
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700',
  unpaid: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminFinancePage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const { t } = useLanguage();

  const PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: t('finance.pending'),
    unpaid: t('finance.pending'),
    paid: t('finance.paid'),
    refunded: t('finance.refunded'),
    cancelled: t('finance.cancelled'),
  };

  // Statistics
  const { data: stats } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/orders/statistics');
      return data.data;
    },
  });

  // Orders list
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', filter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('payment_status', filter);
      if (search) params.append('search', search);
      const { data } = await api.get(`/admin/orders?${params}`);
      return data;
    },
  });

  const orders: Order[] = ordersData?.data || [];

  const handleDownloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const response = await api.get(`/admin/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faktura-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('Greška pri preuzimanju fakture');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('finance.title')}</h1>
          <p className="text-gray-500">{t('finance.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title={t('finance.totalRevenue')} 
          value={`€${Number(stats?.total_revenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard 
          title={t('finance.paidRevenue')} 
          value={`€${Number(stats?.paid_revenue || 0).toLocaleString()}`}
          subtitle={`${stats?.paid_orders || 0} ${t('finance.orders')}`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard 
          title={t('finance.pendingRevenue')} 
          value={`€${Number(stats?.unpaid_revenue || 0).toLocaleString()}`}
          subtitle={`${stats?.pending_orders || 0} ${t('finance.orders')}`}
          icon={Clock}
          color="yellow"
        />
        <StatCard 
          title={t('finance.averageOrder')} 
          value={`€${Number(stats?.average_order_value || 0).toLocaleString()}`}
          icon={Receipt}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-dark-800 rounded-lg p-1">
          {[
            { key: 'all', label: t('common.all') },
            { key: 'pending', label: t('finance.pending') },
            { key: 'paid', label: t('finance.paid') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                filter === tab.key
                  ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('common.noResults')}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.orderNumber')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.customer')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.amount')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.invoice')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.date')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('finance.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                  <td className="px-4 py-3 font-mono text-sm">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{order.user.name}</div>
                    <div className="text-sm text-gray-500">{order.user.company_name || order.user.email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">€{Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', PAYMENT_STATUS_COLORS[order.payment_status])}>
                      {PAYMENT_STATUS_LABELS[order.payment_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.invoice ? (
                      <button
                        onClick={() => handleDownloadInvoice(order.invoice!.id, order.invoice!.invoice_number)}
                        className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 hover:underline"
                        title="Preuzmi PDF"
                      >
                        <FileText className="h-4 w-4" /> 
                        {order.invoice.invoice_number}
                        <Download className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        title="Detalji"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
          }}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdate, onDownloadInvoice }: { 
  order: Order; 
  onClose: () => void; 
  onUpdate: () => void;
  onDownloadInvoice: (id: number, number: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method || '');
  const [discountPercent, setDiscountPercent] = useState(order.discount_percent || 0);
  const [selectedCompany, setSelectedCompany] = useState('');

  // Fetch only seller companies (admin companies for invoicing)
  const { data: companies } = useQuery({
    queryKey: ['seller-companies'],
    queryFn: async () => {
      const { data } = await api.get('/admin/companies?type=seller');
      return data.data;
    },
  });

  // Auto-select default company when loaded
  useEffect(() => {
    if (companies && companies.length > 0 && !selectedCompany) {
      const defaultCompany = companies.find((c: any) => c.is_default);
      if (defaultCompany) {
        setSelectedCompany(defaultCompany.id.toString());
      } else {
        setSelectedCompany(companies[0].id.toString());
      }
    }
  }, [companies, selectedCompany]);

  const handleUpdatePayment = async () => {
    setLoading(true);
    try {
      await api.put(`/admin/orders/${order.id}/payment`, {
        payment_status: paymentStatus,
        payment_method: paymentMethod,
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedCompany) return alert('Izaberite kompaniju za fakturisanje');
    setLoading(true);
    try {
      await api.post(`/admin/orders/${order.id}/invoice`, {
        seller_company_id: selectedCompany,
        discount_percent: discountPercent,
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Porudžbina {order.order_number}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">✕</button>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Kupac</h3>
            <p className="text-gray-600 dark:text-gray-400">{order.user.name}</p>
            <p className="text-gray-500 text-sm">{order.user.email}</p>
            {order.user.company_name && <p className="text-gray-500 text-sm">{order.user.company_name}</p>}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Iznos</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">€{Number(order.total).toFixed(2)}</p>
            <p className="text-sm text-gray-500">Osnovica: €{Number(order.subtotal).toFixed(2)} + PDV: €{Number(order.tax).toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Status Update */}
        <div className="border-t pt-6 mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Status Plaćanja</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="input w-full"
              >
                <option value="pending">Čeka uplatu</option>
                <option value="paid">Plaćeno</option>
                <option value="refunded">Refundirano</option>
                <option value="cancelled">Otkazano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Način plaćanja</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input w-full"
              >
                <option value="">-</option>
                <option value="bank_transfer">Bankarski transfer</option>
                <option value="card">Kartica</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleUpdatePayment}
            disabled={loading}
            className="btn-primary mt-4"
          >
            {loading ? 'Čuvanje...' : 'Sačuvaj status'}
          </button>
        </div>

        {/* Invoice Generation */}
        {!order.invoice && (
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Generiši Fakturu</h3>
            <p className="text-sm text-gray-500 mb-4">
              Faktura za: <span className="font-medium text-gray-900 dark:text-white">{order.user.name}</span>
              {order.user.company_name && <span> ({order.user.company_name})</span>}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Moja Kompanija (prodavac) *</label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="input w-full"
                  >
                    {companies?.length === 0 && <option value="">Nema kompanija</option>}
                    {companies?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.is_default ? ' ⭐ (Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Popust (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="input w-full"
                    placeholder="0"
                  />
                </div>
              </div>
              {discountPercent > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
                  <p className="text-green-700 dark:text-green-400">
                    Popust od {discountPercent}% će biti primenjen na fakturu.
                    <br/>
                    <span className="font-medium">
                      Novi iznos: €{(Number(order.subtotal) * (1 - discountPercent/100) * 1.2).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
              <button
                onClick={handleGenerateInvoice}
                disabled={loading || !selectedCompany}
                className="btn-primary flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generiši Fakturu
              </button>
            </div>
          </div>
        )}

        {/* Invoice Info */}
        {order.invoice && (
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Faktura</h3>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-mono text-lg">{order.invoice.invoice_number}</p>
                <p className="text-sm text-gray-600">Generisana faktura</p>
              </div>
              <button
                onClick={() => onDownloadInvoice(order.invoice!.id, order.invoice!.invoice_number)}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Preuzmi PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
