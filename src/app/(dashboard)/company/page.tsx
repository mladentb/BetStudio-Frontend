'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Save, MapPin, FileText } from 'lucide-react';
import api from '@/lib/api';

export default function CompanyPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    company_address: user?.company_address || '',
    city: user?.city || '',
    zip_code: user?.zip_code || '',
    country: user?.country || '',
    vat_number: user?.vat_number || '',
    registration_number: user?.registration_number || '',
    duns_number: user?.duns_number || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/auth/profile', formData);
      updateUser(data.user);
      setSuccess('Podaci o firmi uspešno ažurirani!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri ažuriranju');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Podaci o firmi</h1>
          <p className="text-gray-500">Upravljajte podacima vaše kompanije</p>
        </div>
      </div>

      <div className="card p-6">
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Building2 className="inline h-4 w-4 mr-1" />
              Naziv firme
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="input w-full"
              placeholder="Naziv vaše kompanije"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              Adresa
            </label>
            <input
              type="text"
              value={formData.company_address}
              onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
              className="input w-full"
              placeholder="Ulica i broj"
            />
          </div>

          {/* City & ZIP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grad
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Poštanski broj
              </label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Država
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="input w-full"
            />
          </div>

          {/* Tax Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Poreski podaci
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PIB (VAT)
                </label>
                <input
                  type="text"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  className="input w-full"
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Matični broj
                </label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="input w-full"
                  placeholder="12345678"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                D-U-N-S broj
              </label>
              <input
                type="text"
                value={formData.duns_number}
                onChange={(e) => setFormData({ ...formData, duns_number: e.target.value })}
                className="input w-full"
                placeholder="123456789"
              />
              <p className="text-xs text-gray-500 mt-1">Opciono - Dun & Bradstreet broj</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Čuvanje...' : 'Sačuvaj izmene'}
          </button>
        </form>
      </div>
    </div>
  );
}
