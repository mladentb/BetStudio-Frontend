'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Import all translations
import en from '../../messages/en.json';
import sr from '../../messages/sr.json';
import de from '../../messages/de.json';
import es from '../../messages/es.json';
import hi from '../../messages/hi.json';

export const locales = ['en', 'sr', 'de', 'es', 'hi'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  sr: 'Srpski',
  de: 'Deutsch',
  es: 'Español',
  hi: 'हिन्दी',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  sr: '🇷🇸',
  de: '🇩🇪',
  es: '🇪🇸',
  hi: '🇮🇳',
};

const messages: Record<Locale, any> = { en, sr, de, es, hi };

type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
  locales: typeof locales;
  localeNames: typeof localeNames;
  localeFlags: typeof localeFlags;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to get nested value from object
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setIsLoaded(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem('locale', newLocale);
    setLocaleState(newLocale);
  }, []);

  // Translation function
  const t: TranslationFunction = useCallback((key: string, params?: Record<string, string | number>) => {
    const value = getNestedValue(messages[locale], key);
    
    if (!value) {
      // Fallback to English
      const fallback = getNestedValue(messages.en, key);
      if (!fallback) {
        console.warn(`Translation missing: ${key}`);
        return key;
      }
      return replaceParams(fallback, params);
    }
    
    return replaceParams(value, params);
  }, [locale]);

  // Replace {param} placeholders
  function replaceParams(text: string, params?: Record<string, string | number>): string {
    if (!params) return text;
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      text
    );
  }

  // Don't render until locale is loaded from localStorage
  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ 
      locale, 
      setLocale, 
      t,
      locales, 
      localeNames, 
      localeFlags 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// Shorthand hook for translations
export function useTranslation() {
  const { t, locale } = useLanguage();
  return { t, locale };
}
