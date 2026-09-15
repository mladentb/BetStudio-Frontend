'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, CheckCircle, XCircle, Clock, Search, Eye, UserCheck, UserX, 
  Building2, Phone, MapPin, FileText, Globe, Save, X, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  account_type: 'buyer' | 'seller';
  role: string;
  company_name: string | null;
  company_address: string | null;
  city: string;
  zip_code: string | null;
  country: string;
  vat_number: string | null;
  registration_number: string | null;
  duns_number: string | null;
  continent: string | null;
  is_active: boolean;
  is_verified: boolean;
  approved_at: string | null;
  created_at: string;
  company?: {
    id: number;
    discount_percent: number;
  } | null;
}

const CONTINENTS = [
  { id: 'eu', name: 'Evropa', flag: '🇪🇺' },
  { id: 'africa', name: 'Afrika', flag: '🌍' },
  { id: 'asia', name: 'Azija', flag: '🌏' },
  { id: 'north_america', name: 'Severna Amerika', flag: '🌎' },
  { id: 'south_america', name: 'Južna Amerika', flag: '🌎' },
  { id: 'oceania', name: 'Okeanija', flag: '🌊' },
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      if (search) params.append('search', search);
      const { data } = await api.get(`/admin/users?${params}`);
      return data;
    },
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['pending-count'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users/pending-count');
      return data.count;
    },
  });

  const users: User[] = data?.data || [];

  const handleUserUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['pending-count'] });
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upravljanje Korisnicima</h1>
            <p className="text-gray-500">Odobravanje i upravljanje registracijama</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium">
            {pendingCount} zahtev{pendingCount > 1 ? 'a' : ''} na čekanju
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-dark-800 rounded-lg p-1">
          {[
            { key: 'pending', label: 'Na čekanju', icon: Clock },
            { key: 'approved', label: 'Odobreni', icon: CheckCircle },
            { key: 'rejected', label: 'Odbijeni', icon: XCircle },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                filter === tab.key
                  ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pretraži korisnike..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Učitavanje...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nema korisnika</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Korisnik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kompanija</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokacija</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrovan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-white font-medium",
                        user.account_type === 'seller' ? 'bg-purple-600' : 'bg-blue-600'
                      )}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.company_name ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{user.company_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      user.account_type === 'seller' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      {user.account_type === 'seller' ? 'Prodavac' : 'Kupac'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {user.city}, {user.country}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {user.approved_at ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" /> Odobren
                      </span>
                    ) : user.is_active ? (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm">
                        <Clock className="h-4 w-4" /> Na čekanju
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="h-4 w-4" /> Odbijen
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        title="Detalji"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSuccess={handleUserUpdated}
        />
      )}
    </div>
  );
}

function UserDetailModal({ 
  user, 
  onClose, 
  onSuccess
}: { 
  user: User; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    account_type: user.account_type || 'buyer',
    company_name: user.company_name || '',
    company_address: user.company_address || '',
    city: user.city || '',
    zip_code: user.zip_code || '',
    country: user.country || '',
    vat_number: user.vat_number || '',
    registration_number: user.registration_number || '',
    duns_number: user.duns_number || '',
    continent: user.continent || '',
  });

  const isPending = !user.approved_at && user.is_active;

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/admin/users/${user.id}`, form);
      setIsEditing(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Greška pri čuvanju');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.post(`/admin/users/${user.id}/approve`);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Da li ste sigurni da želite da odbijete ovog korisnika?')) return;
    setLoading(true);
    try {
      await api.post(`/admin/users/${user.id}/reject`);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const continent = CONTINENTS.find(c => c.id === user.continent);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalji Korisnika</h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="btn-secondary text-sm"
              >
                Izmeni
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(false)} 
                className="btn-secondary text-sm"
              >
                Otkaži
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* User Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-dark-700">
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0",
            user.account_type === 'seller' ? 'bg-purple-600' : 'bg-blue-600'
          )}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="input text-lg font-semibold w-full mb-1"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
            )}
            <p className="text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                user.account_type === 'seller' 
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              )}>
                {user.account_type === 'seller' ? 'Prodavac' : 'Kupac'}
              </span>
              {user.approved_at ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  Odobren
                </span>
              ) : user.is_active ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                  Na čekanju
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  Odbijen
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            Lični Podaci
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Telefon</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.phone || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Registrovan</label>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Lokacija (Kontinent)</label>
              {isEditing ? (
                <select
                  value={form.continent}
                  onChange={(e) => setForm({...form, continent: e.target.value})}
                  className="input w-full mt-1"
                >
                  <option value="">Izaberi...</option>
                  {CONTINENTS.map(c => (
                    <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                  ))}
                </select>
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">
                  {continent ? `${continent.flag} ${continent.name}` : '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-dark-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            Podaci o Kompaniji
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Naziv Kompanije</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({...form, company_name: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.company_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Adresa</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.company_address}
                  onChange={(e) => setForm({...form, company_address: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.company_address || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Grad</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({...form, city: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.city || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Poštanski Broj</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.zip_code}
                  onChange={(e) => setForm({...form, zip_code: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.zip_code || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Država</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({...form, country: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.country || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">PIB / VAT</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.vat_number}
                  onChange={(e) => setForm({...form, vat_number: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.vat_number || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Matični Broj</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.registration_number}
                  onChange={(e) => setForm({...form, registration_number: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.registration_number || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">DUNS Broj</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.duns_number}
                  onChange={(e) => setForm({...form, duns_number: e.target.value})}
                  className="input w-full mt-1"
                />
              ) : (
                <p className="font-medium text-gray-900 dark:text-white">{user.duns_number || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {user.company?.discount_percent > 0 && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Percent className="h-4 w-4" />
                Trajni popust: {user.company.discount_percent}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Čuvanje...' : 'Sačuvaj Izmene'}
              </button>
            ) : (
              <>
                <button onClick={onClose} className="btn-secondary">Zatvori</button>
                {isPending && (
                  <>
                    <button 
                      onClick={handleReject} 
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Odbij
                    </button>
                    <button 
                      onClick={handleApprove} 
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Odobri
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
