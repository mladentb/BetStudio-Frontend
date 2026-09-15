'use client';

import { useState, useEffect } from 'react';
import { 
  Key, Plus, Copy, Check, Trash2, RefreshCw, Eye, EyeOff, Loader2, 
  Settings, BarChart3, Webhook, ChevronRight, Shield, AlertTriangle,
  Calendar, Clock, Globe, Activity
} from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import ApiKeyDetailModal from './ApiKeyDetailModal';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  key_masked: string;
  rate_limit: number;
  requests_today: number;
  usage_percentage: number;
  permissions: string[];
  logs_count: number;
  webhooks_count: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  company?: { id: number; name: string } | null;
}

interface Permission {
  [key: string]: string;
}

const RATE_LIMIT_PLANS = [
  { value: 100, label: 'Free', price: '$0/mesec', description: '100 zahteva/dan' },
  { value: 1000, label: 'Starter', price: '$49/mesec', description: '1,000 zahteva/dan' },
  { value: 10000, label: 'Pro', price: '$199/mesec', description: '10,000 zahteva/dan' },
  { value: 100000, label: 'Enterprise', price: 'Kontakt', description: '100,000 zahteva/dan' },
];

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission>({});
  const [webhookEvents, setWebhookEvents] = useState<Permission>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<ApiKey | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());

  // Create form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const { data } = await api.get('/admin/api-keys');
      setKeys(data.data || []);
      setAvailablePermissions(data.meta?.available_permissions || {});
      setWebhookEvents(data.meta?.webhook_events || {});
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    
    setCreating(true);
    try {
      const { data } = await api.post('/admin/api-keys', {
        name: newKeyName,
        rate_limit: newKeyRateLimit,
        permissions: newKeyPermissions.length > 0 ? newKeyPermissions : undefined,
        expires_at: newKeyExpiry || undefined,
      });
      setNewlyCreatedKey(data.key);
      fetchKeys();
      setNewKeyName('');
      setNewKeyPermissions([]);
      setNewKeyExpiry('');
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Greška pri kreiranju API ključa');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/admin/api-keys/${id}`, { is_active: !isActive });
      setKeys(keys.map(k => k.id === id ? { ...k, is_active: !isActive } : k));
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj API ključ? Ova akcija je nepovratna.')) return;
    
    try {
      await api.delete(`/admin/api-keys/${id}`);
      setKeys(keys.filter(k => k.id !== id));
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleResetCounter = async (id: number) => {
    try {
      await api.post(`/admin/api-keys/${id}/reset`);
      setKeys(keys.map(k => k.id === id ? { ...k, requests_today: 0 } : k));
    } catch (error) {
      console.error('Failed to reset counter:', error);
    }
  };

  const handleRegenerateKey = async (id: number) => {
    if (!confirm('Da li ste sigurni? Stari ključ će prestati da radi odmah.')) return;
    
    try {
      const { data } = await api.post(`/admin/api-keys/${id}/regenerate`);
      alert(`Novi ključ: ${data.key}\n\nSačuvajte ga jer ga nećete moći ponovo videti!`);
      fetchKeys();
    } catch (error) {
      console.error('Failed to regenerate key:', error);
    }
  };

  const copyKey = (id: number, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id: number) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const togglePermission = (permission: string) => {
    setNewKeyPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Key className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Ključevi</h1>
            <p className="text-gray-500">{keys.length} ključ{keys.length !== 1 ? 'eva' : ''} • B2B Data API</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/api-docs"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <Globe className="h-4 w-4" />
            API Docs
          </a>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novi API Ključ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{keys.length}</p>
              <p className="text-sm text-gray-500">Ukupno ključeva</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {keys.filter(k => k.is_active).length}
              </p>
              <p className="text-sm text-gray-500">Aktivnih</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {keys.reduce((sum, k) => sum + k.requests_today, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Zahteva danas</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Webhook className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {keys.reduce((sum, k) => sum + k.webhooks_count, 0)}
              </p>
              <p className="text-sm text-gray-500">Webhook-ova</p>
            </div>
          </div>
        </div>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-700 dark:text-green-400">
                API ključ uspešno kreiran!
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                Sačuvajte ovaj ključ jer ga nećete moći ponovo videti:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 p-3 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-lg font-mono text-sm break-all">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newlyCreatedKey);
                    alert('Kopirano!');
                  }}
                  className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-green-600 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naziv</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ključ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan / Limit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Korišćenje</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dozvole</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{key.name}</p>
                      {key.company && (
                        <p className="text-xs text-gray-500">{key.company.name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {key.last_used_at ? formatDate(key.last_used_at) : 'Nikad korišćen'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded">
                        {visibleKeys.has(key.id) ? key.key : key.key_masked}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                        title={visibleKeys.has(key.id) ? 'Sakrij' : 'Prikaži'}
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => copyKey(key.id, key.key)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                        title="Kopiraj"
                      >
                        {copiedId === key.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {RATE_LIMIT_PLANS.find(p => p.value === key.rate_limit)?.label || 'Custom'}
                      </span>
                      <p className="text-xs text-gray-500">{key.rate_limit.toLocaleString()}/dan</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {key.requests_today.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({key.usage_percentage}%)
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${
                            key.usage_percentage >= 90 ? 'bg-red-500' :
                            key.usage_percentage >= 70 ? 'bg-yellow-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.min(key.usage_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.length === 0 ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          Sve dozvole
                        </span>
                      ) : key.permissions.includes('*') ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          Sve dozvole
                        </span>
                      ) : (
                        key.permissions.slice(0, 2).map(p => (
                          <span key={p} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400 rounded">
                            {p.split(':')[0]}
                          </span>
                        ))
                      )}
                      {key.permissions.length > 2 && !key.permissions.includes('*') && (
                        <span className="text-xs text-gray-500">+{key.permissions.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleActive(key.id, key.is_active)}
                      className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                        key.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                      }`}
                    >
                      {key.is_active ? 'Aktivan' : 'Neaktivan'}
                    </button>
                    {key.expires_at && new Date(key.expires_at) < new Date() && (
                      <span className="ml-2 text-xs text-red-500">Istekao</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setShowDetailModal(key)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        title="Detalji"
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleResetCounter(key.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        title="Reset brojača"
                      >
                        <RefreshCw className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleRegenerateKey(key.id)}
                        className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                        title="Regeneriši ključ"
                      >
                        <Key className="h-4 w-4 text-yellow-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Obriši"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {keys.length === 0 && (
          <div className="text-center py-12">
            <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nema API ključeva</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Kreiraj prvi API ključ
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Novi API Ključ
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Kreirajte novi API ključ za B2B integraciju
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Naziv *
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="input w-full"
                  placeholder="npr. Production API, Partner XYZ"
                />
              </div>

              {/* Rate Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plan (Rate Limit)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RATE_LIMIT_PLANS.map((plan) => (
                    <button
                      key={plan.value}
                      onClick={() => setNewKeyRateLimit(plan.value)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        newKeyRateLimit === plan.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{plan.label}</p>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                      <p className="text-xs text-purple-600 mt-1">{plan.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dozvole
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Ostavite prazno za sve dozvole
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-dark-600 rounded-lg p-3">
                  {Object.entries(availablePermissions).map(([key, description]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(key)}
                        onChange={() => togglePermission(key)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <code className="text-purple-600">{key}</code>
                        <span className="text-gray-500 ml-2">- {description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Datum isteka (opciono)
                </label>
                <input
                  type="date"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="input w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ostavite prazno za ključ bez isteka
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName('');
                  setNewKeyPermissions([]);
                  setNewKeyExpiry('');
                }}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700"
              >
                Otkaži
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Kreiraj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <ApiKeyDetailModal 
          apiKey={showDetailModal} 
          onClose={() => setShowDetailModal(null)}
          onUpdate={fetchKeys}
          availablePermissions={availablePermissions}
          webhookEvents={webhookEvents}
        />
      )}
    </div>
  );
}
