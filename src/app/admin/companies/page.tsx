'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Edit2, Trash2, Upload, X, Image as ImageIcon, Search, Users, Globe, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  country: string;
  vat_number: string | null;
  registration_number: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account: string | null;
  swift_bic: string | null;
  logo_url: string | null;
  continents: string[] | null;
  is_active: boolean;
  is_default: boolean;
  owner_id: number | null;
  discount_percent?: number;
  users_count?: number;
  users?: User[];
}

const CONTINENTS = [
  { id: 'eu', name: 'Evropa', flag: '🇪🇺' },
  { id: 'africa', name: 'Afrika', flag: '🌍' },
  { id: 'asia', name: 'Azija', flag: '🌏' },
  { id: 'north_america', name: 'Severna Amerika', flag: '🌎' },
  { id: 'south_america', name: 'Južna Amerika', flag: '🌎' },
  { id: 'oceania', name: 'Okeanija', flag: '🌏' },
];

type TabType = 'my' | 'all';

export default function AdminCompaniesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const { data } = await api.get('/admin/companies');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/companies/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-companies'] }),
  });

  const allCompanies: Company[] = data?.data || [];
  const myCompanies = allCompanies.filter(c => c.owner_id === user?.id);
  const otherCompanies = allCompanies.filter(c => c.owner_id !== user?.id);
  
  const filteredOtherCompanies = otherCompanies.filter(c => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.legal_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.country?.toLowerCase().includes(query)
    );
  });

  const displayedCompanies = activeTab === 'my' ? myCompanies : filteredOtherCompanies;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kompanije</h1>
            <p className="text-gray-500">Upravljanje kompanijama za fakturisanje</p>
          </div>
        </div>
        <button onClick={() => { setEditingCompany(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Dodaj Kompaniju
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-dark-700">
        <button
          onClick={() => setActiveTab('my')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors",
            activeTab === 'my' ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <Building2 className="h-4 w-4" />
          Moje Kompanije
          <span className={cn("ml-1 px-2 py-0.5 rounded-full text-xs", activeTab === 'my' ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600")}>{myCompanies.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors",
            activeTab === 'all' ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <Globe className="h-4 w-4" />
          Sve Kompanije
          <span className={cn("ml-1 px-2 py-0.5 rounded-full text-xs", activeTab === 'all' ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600")}>{otherCompanies.length}</span>
        </button>
      </div>

      {activeTab === 'all' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Pretraži po nazivu, email, gradu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10 w-full" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map(i => <div key={i} className="card p-6 animate-pulse h-48" />)}</div>
      ) : displayedCompanies.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          {activeTab === 'my' ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nemate svojih kompanija</h3>
              <p className="text-gray-500 mb-4">Dodajte svoju prvu kompaniju za fakturisanje</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">Dodaj Kompaniju</button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{searchQuery ? 'Nema rezultata pretrage' : 'Nema drugih registrovanih kompanija'}</h3>
              {searchQuery && <button onClick={() => setSearchQuery('')} className="text-primary-600 hover:underline">Očisti pretragu</button>}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isOwner={activeTab === 'my'}
              onEdit={() => { setEditingCompany(company); setShowForm(true); }}
              onView={() => setViewingCompany(company)}
              onDelete={() => { if (confirm('Obrisati kompaniju?')) deleteMutation.mutate(company.id); }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <CompanyForm
          company={editingCompany}
          onClose={() => { setShowForm(false); setEditingCompany(null); }}
          onSuccess={() => { setShowForm(false); setEditingCompany(null); queryClient.invalidateQueries({ queryKey: ['admin-companies'] }); }}
        />
      )}

      {viewingCompany && (
        <CompanyDetailModal
          company={viewingCompany}
          onClose={() => setViewingCompany(null)}
          onEdit={() => { setEditingCompany(viewingCompany); setShowForm(true); setViewingCompany(null); }}
        />
      )}
    </div>
  );
}

function CompanyCard({ company, isOwner, onEdit, onView, onDelete }: { company: Company; isOwner: boolean; onEdit: () => void; onView: () => void; onDelete: () => void }) {
  return (
    <div className={cn("card p-6 cursor-pointer hover:shadow-lg transition-shadow", company.is_default && "ring-2 ring-primary-500")} onClick={!isOwner ? onView : undefined}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          {company.logo_url ? (
            <img src={`${API_BASE}${company.logo_url}`} alt={company.name} className="h-14 w-14 object-contain rounded-lg border" />
          ) : (
            <div className="h-14 w-14 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center"><Building2 className="h-6 w-6 text-gray-400" /></div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{company.name}</h3>
              {company.is_default && <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">Default</span>}
            </div>
            {company.legal_name && <p className="text-sm text-gray-500">{company.legal_name}</p>}
          </div>
        </div>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {!isOwner && (
            <button onClick={onView} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg" title="Pogledaj detalje">
              <Users className="h-4 w-4 text-gray-500" />
            </button>
          )}
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg" title="Izmeni">
            <Edit2 className="h-4 w-4 text-gray-500" />
          </button>
          {isOwner && (
            <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg" title="Obriši">
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-1 text-sm">
        {company.email && <p className="text-gray-600 dark:text-gray-400">{company.email}</p>}
        <p className="text-gray-600 dark:text-gray-400">{[company.address, company.city, company.country].filter(Boolean).join(', ')}</p>
        {company.vat_number && <p className="text-gray-500">PIB: {company.vat_number}</p>}
      </div>

      {!isOwner && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{company.users_count || 0} korisnika</span></div>
          {company.discount_percent !== undefined && company.discount_percent > 0 && <div className="text-green-600">{company.discount_percent}% popust</div>}
        </div>
      )}

      {company.continents && Array.isArray(company.continents) && company.continents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 flex flex-wrap gap-2">
          {company.continents.map(c => { const cont = CONTINENTS.find(x => x.id === c); return cont ? <span key={c} className="px-2 py-1 bg-gray-100 dark:bg-dark-700 rounded text-xs">{cont.flag} {cont.name}</span> : null; })}
        </div>
      )}
    </div>
  );
}

function CompanyDetailModal({ company, onClose, onEdit }: { company: Company; onClose: () => void; onEdit: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['company-users', company.id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/companies/${company.id}/users`);
      return data;
    },
  });

  const users: User[] = data?.data || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img src={`${API_BASE}${company.logo_url}`} alt={company.name} className="h-16 w-16 object-contain rounded-lg border" />
            ) : (
              <div className="h-16 w-16 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center"><Building2 className="h-8 w-8 text-gray-400" /></div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{company.name}</h2>
              {company.legal_name && <p className="text-gray-500">{company.legal_name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="btn-secondary flex items-center gap-2"><Edit2 className="h-4 w-4" /> Izmeni</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Kontakt Podaci</h3>
            {company.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-gray-400" /><span>{company.email}</span></div>}
            {company.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-gray-400" /><span>{company.phone}</span></div>}
            {company.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-gray-400" /><span>{company.address}, {company.city} {company.zip_code}, {company.country}</span></div>}
            {company.website && <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-gray-400" /><a href={company.website} target="_blank" className="text-primary-600 hover:underline">{company.website}</a></div>}
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Pravni Podaci</h3>
            {company.vat_number && <div className="text-sm"><span className="text-gray-500">PIB:</span> {company.vat_number}</div>}
            {company.registration_number && <div className="text-sm"><span className="text-gray-500">Matični broj:</span> {company.registration_number}</div>}
            {company.discount_percent !== undefined && company.discount_percent > 0 && (
              <div className="text-sm"><span className="text-gray-500">Popust:</span> <span className="text-green-600 font-medium">{company.discount_percent}%</span></div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" /> Korisnici ({users.length})
          </h3>
          
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-dark-700 rounded-lg animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nema registrovanih korisnika</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                        {user.role === 'admin' && <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded">ADMIN</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{user.email}</span>
                        {user.phone && <span>• {user.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs", user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {user.is_active ? 'Aktivan' : 'Neaktivan'}
                    </span>
                    <span className={cn("px-2 py-1 rounded text-xs", user.is_verified ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700")}>
                      {user.is_verified ? 'Verifikovan' : 'Čeka'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyForm({ company, onClose, onSuccess }: { company: Company | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!company;
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo_url ? `${API_BASE}${company.logo_url}` : null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    name: company?.name || '',
    legal_name: company?.legal_name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
    city: company?.city || '',
    zip_code: company?.zip_code || '',
    country: company?.country || 'Serbia',
    vat_number: company?.vat_number || '',
    registration_number: company?.registration_number || '',
    website: company?.website || '',
    bank_name: company?.bank_name || '',
    bank_account: company?.bank_account || '',
    swift_bic: company?.swift_bic || '',
    continents: company?.continents || [],
    is_active: company?.is_active ?? true,
    is_default: company?.is_default ?? false,
    discount_percent: company?.discount_percent || 0,
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await api.post(`/admin/companies/${company.id}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogoPreview(`${API_BASE}${data.logo_url}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri uploadu');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!company) return;
    try { await api.delete(`/admin/companies/${company.id}/logo`); setLogoPreview(null); } catch (err) { console.error(err); }
  };

  const toggleContinent = (id: string) => {
    setForm(f => ({ ...f, continents: f.continents.includes(id) ? f.continents.filter(c => c !== id) : [...f.continents, id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) { await api.put(`/admin/companies/${company.id}`, form); }
      else { await api.post('/admin/companies', form); }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{isEdit ? 'Izmeni Kompaniju' : 'Nova Kompanija'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"><X className="h-5 w-5" /></button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit && (
            <div>
              <label className="block text-sm font-medium mb-2">Logo Kompanije</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Logo" className="h-20 w-20 object-contain border rounded-lg" />
                    <button type="button" onClick={handleLogoDelete} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"><ImageIcon className="h-8 w-8 text-gray-300" /></div>
                )}
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo} className="btn-secondary flex items-center gap-2">
                    <Upload className="h-4 w-4" />{uploadingLogo ? 'Učitavanje...' : 'Upload Logo'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG do 2MB</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Naziv Kompanije *</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input w-full" /></div>
            <div><label className="block text-sm font-medium mb-1">Pravni Naziv</label><input type="text" value={form.legal_name} onChange={e => setForm({...form, legal_name: e.target.value})} className="input w-full" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input w-full" /></div>
            <div><label className="block text-sm font-medium mb-1">Telefon</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input w-full" /></div>
          </div>

          <div><label className="block text-sm font-medium mb-1">Adresa</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input w-full" /></div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Grad</label><input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input w-full" /></div>
            <div><label className="block text-sm font-medium mb-1">Poštanski Broj</label><input type="text" value={form.zip_code} onChange={e => setForm({...form, zip_code: e.target.value})} className="input w-full" /></div>
            <div><label className="block text-sm font-medium mb-1">Država *</label><input type="text" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="input w-full" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">VAT Broj</label><input type="text" value={form.vat_number} onChange={e => setForm({...form, vat_number: e.target.value})} className="input w-full" /></div>
            <div><label className="block text-sm font-medium mb-1">Matični Broj</label><input type="text" value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})} className="input w-full" /></div>
          </div>

          <div><label className="block text-sm font-medium mb-1">Website</label><input type="text" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="input w-full" /></div>

          <div className="border-t pt-4 mt-4 bg-green-50 dark:bg-green-900/20 -mx-6 px-6 py-4">
            <h3 className="font-medium mb-3 text-green-800 dark:text-green-400">💰 Trajni Popust</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Procenat Popusta (%)</label>
                <input type="number" min="0" max="100" step="0.5" value={form.discount_percent} onChange={e => setForm({...form, discount_percent: parseFloat(e.target.value) || 0})} className="input w-full" />
              </div>
              <div className="text-sm text-gray-500 flex-1">
                <p>Ovaj popust će automatski biti primenjen na sve kupovine ove kompanije.</p>
                {form.discount_percent > 0 && <p className="text-green-600 font-medium mt-1">Trenutni popust: {form.discount_percent}%</p>}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Bankarski Podaci</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Naziv Banke</label><input type="text" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} className="input w-full" /></div>
              <div><label className="block text-sm font-medium mb-1">Broj Računa</label><input type="text" value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})} className="input w-full" /></div>
              <div><label className="block text-sm font-medium mb-1">SWIFT/BIC</label><input type="text" value={form.swift_bic} onChange={e => setForm({...form, swift_bic: e.target.value})} className="input w-full" /></div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Kontinenti koje Pokriva</h3>
            <div className="grid grid-cols-3 gap-3">
              {CONTINENTS.map(c => (
                <label key={c.id} className={cn("flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors", form.continents.includes(c.id) ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200 dark:border-dark-600 hover:border-gray-300")}>
                  <input type="checkbox" checked={form.continents.includes(c.id)} onChange={() => toggleContinent(c.id)} className="rounded" />
                  <span>{c.flag}</span><span className="text-sm">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded" /><span className="text-sm">Aktivna Kompanija</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} className="rounded" /><span className="text-sm">Default Kompanija</span></label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Otkaži</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Čuvanje...' : 'Sačuvaj'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
