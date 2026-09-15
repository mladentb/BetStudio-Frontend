'use client';

import { useState } from 'react';
import { DollarSign, Euro, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro', icon: Euro, color: 'text-blue-600 bg-blue-100' },
  { code: 'USD', symbol: '$', name: 'US Dollar', icon: DollarSign, color: 'text-green-600 bg-green-100' },
  { code: 'SOL', symbol: '◎', name: 'Solana', icon: () => <span className="text-lg font-bold">◎</span>, color: 'text-purple-600 bg-purple-100' },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencySelector({ value, onChange, showLabel = true, size = 'md' }: CurrencySelectorProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (currency: string) => {
    if (currency === value) return;
    setLoading(true);
    try {
      await api.put('/user/currency', { currency });
      onChange(currency);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Valuta za fakturisanje
        </label>
      )}
      <div className="flex gap-2">
        {CURRENCIES.map((currency) => {
          const Icon = currency.icon;
          const isSelected = value === currency.code;
          
          return (
            <button
              key={currency.code}
              onClick={() => handleChange(currency.code)}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 rounded-lg border transition-all',
                sizeClasses[size],
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
                  : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500',
                loading && 'opacity-50 cursor-wait'
              )}
            >
              <div className={cn('h-6 w-6 rounded flex items-center justify-center', currency.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{currency.code}</span>
              {isSelected && <Check className="h-4 w-4 text-primary-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for header/cart
export function CurrencyBadge({ currency, rate }: { currency: string; rate?: number }) {
  const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  
  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', curr.color)}>
      <span>{curr.symbol}</span>
      <span>{curr.code}</span>
      {rate && rate !== 1 && (
        <span className="text-gray-500 ml-1">({rate.toFixed(currency === 'SOL' ? 4 : 2)})</span>
      )}
    </div>
  );
}

export function formatCurrency(amount: number, currency: string): string {
  const curr = CURRENCIES.find(c => c.code === currency);
  const symbol = curr?.symbol || currency;
  const decimals = currency === 'SOL' ? 4 : 2;
  return `${symbol}${amount.toFixed(decimals)}`;
}

export { CURRENCIES };
