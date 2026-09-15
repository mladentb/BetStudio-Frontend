'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, User, Building2, MapPin, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const LOCATIONS = [
  { value: 'eu', label: 'Europe' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'asia', label: 'Asia' },
  { value: 'other', label: 'Other' },
];

const COUNTRIES = [
  'Srbija', 'Hrvatska', 'Bosna i Hercegovina', 'Crna Gora', 'Slovenija',
  'Severna Makedonija', 'USA', 'UK', 'Germany', 'France', 'Italy', 'Spain',
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Account type
    account_type: 'buyer',
    
    // Personal
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    
    // Company
    company_name: '',
    company_address: '',
    city: '',
    zip_code: '',
    country: '',
    vat_number: '',
    registration_number: '',
    duns_number: '',
    
    // Location
    location: 'eu',
    
    // Terms
    terms_accepted: false,
  });

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', formData);
      
      // Save token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      router.push('/');
    } catch (err: any) {
      const message = err.response?.data?.message || 
                     Object.values(err.response?.data?.errors || {}).flat().join(', ') ||
                     'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Create Your Account</h1>
              <p className="text-primary-100">Join BetStudio platform and start streaming</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-dark-800 rounded-b-2xl shadow-xl p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <User className="h-4 w-4" />
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateForm('account_type', 'buyer')}
                  className={cn(
                    'p-4 rounded-xl border-2 text-center transition-all',
                    formData.account_type === 'buyer'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                  )}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">Buyer</div>
                  <div className="text-sm text-gray-500">Purchase streaming rights</div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm('account_type', 'seller')}
                  className={cn(
                    'p-4 rounded-xl border-2 text-center transition-all',
                    formData.account_type === 'seller'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                  )}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">Seller</div>
                  <div className="text-sm text-gray-500">Sell streaming rights</div>
                </button>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <User className="h-4 w-4" />
                Personal Information
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="input w-full"
                    placeholder="Ime i Prezime"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="input w-full"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className="input w-full"
                  placeholder="+381..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => updateForm('password', e.target.value)}
                      className="input w-full pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password_confirmation}
                    onChange={(e) => updateForm('password_confirmation', e.target.value)}
                    className="input w-full"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Building2 className="h-4 w-4" />
                Company Information
              </label>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => updateForm('company_name', e.target.value)}
                    className="input w-full"
                    placeholder="Naziv kompanije (opciono)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.company_address}
                    onChange={(e) => updateForm('company_address', e.target.value)}
                    className="input w-full"
                    placeholder="Ulica i broj (opciono)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => updateForm('city', e.target.value)}
                      className="input w-full"
                      placeholder="Beograd, London, New York..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => updateForm('zip_code', e.target.value)}
                      className="input w-full"
                      placeholder="11000 (opciono)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => updateForm('country', e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">VAT Number</label>
                    <input
                      type="text"
                      value={formData.vat_number}
                      onChange={(e) => updateForm('vat_number', e.target.value)}
                      className="input w-full"
                      placeholder="PIB broj (opciono)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={formData.registration_number}
                      onChange={(e) => updateForm('registration_number', e.target.value)}
                      className="input w-full"
                      placeholder="Matični broj (opciono)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">D-U-N-S Number</label>
                    <input
                      type="text"
                      value={formData.duns_number}
                      onChange={(e) => updateForm('duns_number', e.target.value)}
                      className="input w-full"
                      placeholder="D-U-N-S (opciono)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Your Location <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  className="input w-full"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                required
                checked={formData.terms_accepted}
                onChange={(e) => updateForm('terms_accepted', e.target.checked)}
                className="mt-1 rounded"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                <span className="text-red-500">*</span> I accept the{' '}
                <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {/* Required fields note */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <strong>Obavezna polja:</strong> Ime, Email, Telefon, Grad, Država i Prihvatanje uslova
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg"
            >
              {loading ? 'Creating account...' : 'Submit Registration'}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:underline font-medium">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
