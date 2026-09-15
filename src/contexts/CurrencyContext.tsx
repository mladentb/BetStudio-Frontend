'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

interface CurrencyRates {
  EUR: number;
  USD: number;
  SOL: number;
}

interface CurrencyContextType {
  currency: string;
  rates: CurrencyRates;
  setCurrency: (currency: string) => Promise<void>;
  convert: (amountEur: number) => number;
  format: (amountEur: number) => string;
  symbol: string;
  isLoading: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  SOL: '◎',
};

const defaultRates: CurrencyRates = { EUR: 1, USD: 1.08, SOL: 0.0067 };

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [currency, setCurrencyState] = useState<string>('EUR');
  const [rates, setRates] = useState<CurrencyRates>(defaultRates);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with user preference
  useEffect(() => {
    if (user?.preferred_currency) {
      setCurrencyState(user.preferred_currency);
    }
  }, [user?.preferred_currency]);

  // Fetch rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data } = await api.get('/currencies');
        const ratesObj: CurrencyRates = { ...defaultRates };
        data.currencies?.forEach((c: any) => {
          if (c.code in ratesObj) {
            ratesObj[c.code as keyof CurrencyRates] = c.rate;
          }
        });
        setRates(ratesObj);
      } catch (err) {
        console.error('Failed to fetch rates:', err);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setCurrency = async (newCurrency: string) => {
    if (newCurrency === currency) return;
    setIsLoading(true);
    setCurrencyState(newCurrency);
    try {
      await api.put('/user/currency', { currency: newCurrency });
      await refreshUser();
    } catch (err) {
      console.error('Failed to update currency:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const convert = (amountEur: number): number => {
    if (!amountEur || isNaN(amountEur)) return 0;
    const rate = rates[currency as keyof CurrencyRates] || 1;
    return amountEur * rate;
  };

  const format = (amountEur: number): string => {
    if (!amountEur || isNaN(amountEur)) return `${CURRENCY_SYMBOLS[currency]}0.00`;
    const converted = convert(amountEur);
    const decimals = currency === 'SOL' ? 4 : 2;
    return `${CURRENCY_SYMBOLS[currency]}${converted.toFixed(decimals)}`;
  };

  const symbol = CURRENCY_SYMBOLS[currency] || '€';

  return (
    <CurrencyContext.Provider value={{ currency, rates, setCurrency, convert, format, symbol, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Return default values if used outside provider
    return {
      currency: 'EUR',
      rates: defaultRates,
      setCurrency: async () => {},
      convert: (amount: number) => amount,
      format: (amount: number) => `€${amount?.toFixed(2) || '0.00'}`,
      symbol: '€',
      isLoading: false,
    };
  }
  return context;
}
