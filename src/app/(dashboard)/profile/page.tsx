'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    country: user?.country || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/auth/profile', formData);
      updateUser(data.user);
      setSuccess('Profil uspešno ažuriran!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri ažuriranju');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
          <User className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moj Profil</h1>
          <p className="text-gray-500">Upravljajte vašim ličnim podacima</p>
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
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Mail className="inline h-4 w-4 mr-1" />
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input w-full bg-gray-50 dark:bg-dark-700 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email se ne može promeniti</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="inline h-4 w-4 mr-1" />
              Ime i prezime
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Phone className="inline h-4 w-4 mr-1" />
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input w-full"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <MapPin className="inline h-4 w-4 mr-1" />
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
                Država
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Informacije o nalogu</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tip naloga:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {user?.account_type === 'seller' ? 'Prodavac' : 'Kupac'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Uloga:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {user?.role === 'admin' ? 'Administrator' : 'Korisnik'}
                </span>
              </div>
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
