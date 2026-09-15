'use client';

import { useState, useEffect } from 'react';
import { 
  X, Key, Shield, Webhook, BarChart3, Clock, Plus, Trash2, 
  RefreshCw, Play, Check, AlertTriangle, Loader2, ExternalLink
} from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ApiKeyDetailModalProps {
  apiKey: any;
  onClose: () => void;
  onUpdate: () => void;
  availablePermissions: { [key: string]: string };
  webhookEvents: { [key: string]: string };
}

export default function ApiKeyDetailModal({ 
  apiKey, 
  onClose, 
  onUpdate,
  availablePermissions,
  webhookEvents
}: ApiKeyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'webhooks' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Edit state
  const [editName, setEditName] = useState(apiKey.name);
  const [editRateLimit, setEditRateLimit] = useState(apiKey.rate_limit);
  const [editPermissions, setEditPermissions] = useState<string[]>(apiKey.permissions || []);
  const [saving, setSaving] = useState(false);

  // Webhook create state
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);

  useEffect(() => {
    fetchDetails();
  }, [apiKey.id]);

  const fetchDetails = async () => {
    try {
      const { data } = await api.get(`/admin/api-keys/${apiKey.id}`);
      setDetails(data.data);
      setWebhooks(data.data.webhooks || []);
      setLogs(data.data.recent_logs || []);
    } catch (error) {
      console.error('Failed to fetch details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/api-keys/${apiKey.id}`, {
        name: editName,
        rate_limit: editRateLimit,
        permissions: editPermissions.length > 0 ? editPermissions : [],
      });
      onUpdate();
      alert('Uspešno sačuvano!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Greška pri čuvanju');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: string) => {
    setEditPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookName || !newWebhookUrl || newWebhookEvents.length === 0) {
      alert('Popunite sva polja');
      return;
    }

    setCreatingWebhook(true);
    try {
      const { data } = await api.post(`/admin/api-keys/${apiKey.id}/webhooks`, {
        name: newWebhookName,
        url: newWebhookUrl,
        events: newWebhookEvents,
      });
      setNewWebhookSecret(data.secret);
      setWebhooks([...webhooks, data.webhook]);
      setNewWebhookName('');
      setNewWebhookUrl('');
      setNewWebhookEvents([]);
    } catch (error) {
      console.error('Failed to create webhook:', error);
      alert('Greška pri kreiranju webhook-a');
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleTestWebhook = async (webhookId: number) => {
    try {
      const { data } = await api.post(`/admin/webhooks/${webhookId}/test`);
      if (data.success) {
        alert('Webhook test uspešan!');
      } else {
        alert(`Webhook test neuspešan: ${data.message}`);
      }
      fetchDetails();
    } catch (error: any) {
      alert(`Greška: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteWebhook = async (webhookId: number) => {
    if (!confirm('Da li ste sigurni?')) return;
    try {
      await api.delete(`/admin/webhooks/${webhookId}`);
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const toggleWebhookEvent = (event: string) => {
    setNewWebhookEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{apiKey.name}</h2>
              <p className="text-sm text-gray-500">API Key Settings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-dark-700 px-6">
          <div className="flex gap-4">
            {[
              { id: 'overview', label: 'Pregled', icon: BarChart3 },
              { id: 'permissions', label: 'Dozvole', icon: Shield },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'logs', label: 'Logovi', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Naziv
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rate Limit (zahteva/dan)
                      </label>
                      <select
                        value={editRateLimit}
                        onChange={(e) => setEditRateLimit(Number(e.target.value))}
                        className="input w-full"
                      >
                        <option value={100}>Free - 100/dan</option>
                        <option value={1000}>Starter - 1,000/dan</option>
                        <option value={10000}>Pro - 10,000/dan</option>
                        <option value={100000}>Enterprise - 100,000/dan</option>
                      </select>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  {details?.usage_stats && details.usage_stats.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Korišćenje (poslednjih 30 dana)
                      </h3>
                      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-purple-600">
                              {details.usage_stats.reduce((sum: number, s: any) => sum + s.requests_count, 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Ukupno zahteva</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {details.usage_stats.reduce((sum: number, s: any) => sum + s.successful_requests, 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Uspešnih</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">
                              {details.usage_stats.reduce((sum: number, s: any) => sum + s.failed_requests, 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Neuspešnih</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Sačuvaj izmene
                  </button>
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === 'permissions' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Izaberite dozvole za ovaj API ključ. Prazno = sve dozvole.
                  </p>
                  <div className="space-y-2">
                    {Object.entries(availablePermissions).map(([key, description]) => (
                      <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-dark-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700">
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(key)}
                          onChange={() => togglePermission(key)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <code className="text-purple-600 font-medium">{key}</code>
                          <p className="text-sm text-gray-500">{description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Sačuvaj dozvole
                  </button>
                </div>
              )}

              {/* Webhooks Tab */}
              {activeTab === 'webhooks' && (
                <div className="space-y-4">
                  {/* New Webhook Secret Alert */}
                  {newWebhookSecret && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="font-medium text-green-700 dark:text-green-400 mb-2">
                        Webhook kreiran! Sačuvajte secret:
                      </p>
                      <code className="block p-2 bg-green-100 dark:bg-green-900/40 rounded text-sm break-all">
                        {newWebhookSecret}
                      </code>
                      <button 
                        onClick={() => setNewWebhookSecret(null)}
                        className="mt-2 text-sm text-green-600 hover:underline"
                      >
                        Zatvori
                      </button>
                    </div>
                  )}

                  {/* Create Webhook Form */}
                  {showWebhookForm ? (
                    <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium">Novi Webhook</h4>
                      <input
                        type="text"
                        placeholder="Naziv (npr. Live Score Updates)"
                        value={newWebhookName}
                        onChange={(e) => setNewWebhookName(e.target.value)}
                        className="input w-full"
                      />
                      <input
                        type="url"
                        placeholder="URL (https://your-server.com/webhook)"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        className="input w-full"
                      />
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Eventi:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(webhookEvents).map(([event, description]) => (
                            <button
                              key={event}
                              onClick={() => toggleWebhookEvent(event)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                newWebhookEvents.includes(event)
                                  ? 'bg-purple-100 border-purple-500 text-purple-700'
                                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              {event}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowWebhookForm(false)}
                          className="flex-1 py-2 border border-gray-300 rounded-lg"
                        >
                          Otkaži
                        </button>
                        <button
                          onClick={handleCreateWebhook}
                          disabled={creatingWebhook}
                          className="flex-1 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
                        >
                          {creatingWebhook ? 'Kreiranje...' : 'Kreiraj'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowWebhookForm(true)}
                      className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Dodaj Webhook
                    </button>
                  )}

                  {/* Webhooks List */}
                  {webhooks.length > 0 ? (
                    <div className="space-y-3">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="border border-gray-200 dark:border-dark-600 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{webhook.name}</h4>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  webhook.is_active 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {webhook.is_active ? 'Aktivan' : 'Neaktivan'}
                                </span>
                                {webhook.failure_count > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    {webhook.failure_count} grešaka
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 break-all">{webhook.url}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(webhook.events || []).map((event: string) => (
                                  <span key={event} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-dark-700 rounded">
                                    {event}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleTestWebhook(webhook.id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                                title="Test"
                              >
                                <Play className="h-4 w-4 text-green-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteWebhook(webhook.id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="Obriši"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Nema webhook-ova. Dodajte prvi za primanje notifikacija.
                    </p>
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div>
                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.map((log: any) => (
                        <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.status_code >= 200 && log.status_code < 300 
                              ? 'bg-green-100 text-green-700'
                              : log.status_code >= 400 
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.status_code}
                          </span>
                          <span className="font-mono text-gray-600 dark:text-gray-400">{log.method}</span>
                          <span className="flex-1 font-mono text-gray-900 dark:text-white truncate">{log.endpoint}</span>
                          <span className="text-gray-500">{log.response_time_ms}ms</span>
                          <span className="text-gray-400 text-xs">{formatDate(log.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Nema logova. API pozivi će se prikazati ovde.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
