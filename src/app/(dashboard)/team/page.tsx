'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Mail, User, X, Shield, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  is_company_owner: boolean;
  created_at: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data } = await api.get('/auth/team');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/auth/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const members: TeamMember[] = data?.data || [];

  if (!user?.is_company_owner) {
    return (
      <div className="card p-12 text-center">
        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Pristup odbijen</h3>
        <p className="text-gray-500">Samo vlasnik kompanije može upravljati timom</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moj Tim</h1>
            <p className="text-gray-500">{user?.company_name || 'Moja kompanija'}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Dodaj člana
        </button>
      </div>

      {/* Team Members */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-20" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nema članova tima</h3>
          <p className="text-gray-500 mb-4">Dodajte članove vašeg tima</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Dodaj prvog člana</button>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center text-white font-medium",
                  member.is_company_owner ? "bg-yellow-500" : "bg-blue-500"
                )}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{member.name}</h3>
                    {member.is_company_owner && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        <Crown className="h-3 w-3" /> Vlasnik
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {member.email}
                  </p>
                </div>
              </div>
              
              {!member.is_company_owner && (
                <button
                  onClick={() => { if(confirm(`Ukloniti ${member.name} iz tima?`)) deleteMutation.mutate(member.id); }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Ukloni iz tima"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showForm && (
        <AddMemberModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['team-members'] }); }}
        />
      )}
    </div>
  );
}

function AddMemberModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/team', {
        name: form.name,
        email: form.email,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).flat().join(', ') || 'Greška');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dodaj člana tima</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="h-4 w-4 inline mr-1" /> Ime i prezime *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="input w-full"
              placeholder="Petar Petrović"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Mail className="h-4 w-4 inline mr-1" /> Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="input w-full"
              placeholder="petar@kompanija.com"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            Novi član će dobiti privremenu lozinku koju treba da promeni pri prvom logovanju.
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Otkaži</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Dodavanje...' : 'Dodaj člana'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
