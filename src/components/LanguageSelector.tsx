'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLanguage, Locale } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const { locale, setLocale, locales, localeNames, localeFlags, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors border border-gray-200 dark:border-dark-600"
      >
        <span className="text-lg">{localeFlags[locale]}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
          {locale.toUpperCase()}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-dark-700">
            Language
          </div>
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc as Locale);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors",
                locale === loc && "bg-primary-50 dark:bg-primary-900/20"
              )}
            >
              <span className="text-lg">{localeFlags[loc as Locale]}</span>
              <span className={cn(
                "flex-1 text-left text-sm",
                locale === loc 
                  ? "font-medium text-primary-600 dark:text-primary-400" 
                  : "text-gray-700 dark:text-gray-300"
              )}>
                {localeNames[loc as Locale]}
              </span>
              {locale === loc && (
                <Check className="h-4 w-4 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
