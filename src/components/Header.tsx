'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Bell, User, LogOut, Settings, ChevronDown, 
  Building2, FileText, ShoppingCart, Key, CreditCard, Tv, Check, Wallet, Ticket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { WalletConnectButton } from '@/components/solana';
import { LanguageSelector } from '@/components/LanguageSelector';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { currency, setCurrency, isLoading: currencyLoading } = useCurrency();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const CURRENCIES = [
    { code: 'EUR', symbol: '€', name: t('currency.eur'), color: 'bg-blue-500' },
    { code: 'USD', symbol: '$', name: t('currency.usd'), color: 'bg-green-500' },
    { code: 'SOL', symbol: '◎', name: t('currency.sol'), color: 'bg-purple-500' },
  ];

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setShowCurrencyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleCurrencyChange = async (code: string) => {
    await setCurrency(code);
    setShowCurrencyMenu(false);
  };

  const menuItems = [
    { label: t('nav.profile'), href: '/profile', icon: User },
    { label: t('nav.myGames'), href: '/my-games', icon: Tv },
    { label: t('nft.title'), href: '/my-nfts', icon: Ticket },
    { label: t('wallet.title'), href: '/wallet', icon: Wallet },
    { label: t('companies.title'), href: '/company', icon: Building2 },
    { label: t('profile.changePassword'), href: '/change-password', icon: Key },
    { divider: true },
    { label: t('cart.title'), href: '/purchases', icon: ShoppingCart },
    { label: t('nav.invoices'), href: '/invoices', icon: FileText },
    { label: t('cart.paymentMethod'), href: '/payment-methods', icon: CreditCard },
    { divider: true },
    { label: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder={t('common.search') + '...'} className="input pl-10" />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-6">
          {/* Solana Wallet Connect */}
          <WalletConnectButton showBalance={true} />

          {/* Currency Selector */}
          <div className="relative" ref={currencyRef}>
            <button 
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              disabled={currencyLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all",
                showCurrencyMenu 
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
                  : "border-gray-200 dark:border-dark-600 hover:border-gray-300",
                currencyLoading && "opacity-50"
              )}
            >
              <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold", currentCurrency.color)}>
                {currentCurrency.symbol}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{currentCurrency.code}</span>
              <ChevronDown className={cn("h-3 w-3 text-gray-400 transition-transform", showCurrencyMenu && "rotate-180")} />
            </button>

            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-1 z-50">
                <div className="px-3 py-2 text-xs text-gray-500 uppercase font-medium border-b border-gray-100 dark:border-dark-700">
                  Currency
                </div>
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencyChange(curr.code)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors",
                      currency === curr.code 
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
                    )}
                  >
                    <span className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-sm font-bold", curr.color)}>
                      {curr.symbol}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{curr.code}</div>
                      <div className="text-xs text-gray-500">{curr.name}</div>
                    </div>
                    {currency === curr.code && <Check className="h-4 w-4 text-primary-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Cart */}
          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
            <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 text-white rounded-full text-xs flex items-center justify-center font-medium">{count}</span>
            )}
          </Link>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white font-medium", user?.account_type === 'seller' ? 'bg-purple-600' : 'bg-primary-600')}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('dashboard.welcome')}, {user?.name?.split(' ')[0]}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {user?.role === 'admin' && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium">ADMIN</span>}
                  {user?.account_type === 'seller' ? 'Seller' : 'Buyer'}
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-gray-400 hidden sm:block transition-transform", showMenu && "rotate-180")} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                  <div className="font-medium text-gray-900 dark:text-white">{user?.name}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                  {user?.company_name && (
                    <div className="text-xs text-primary-600 mt-1 flex items-center gap-1"><Building2 className="h-3 w-3" />{user.company_name}</div>
                  )}
                </div>
                <div className="py-2">
                  {menuItems.map((item, index) => {
                    if (item.divider) return <div key={index} className="my-2 border-t border-gray-100 dark:border-dark-700" />;
                    return (
                      <Link key={item.href} href={item.href!} className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors" onClick={() => setShowMenu(false)}>
                        {item.icon && <item.icon className="h-4 w-4 text-gray-400" />}{item.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t border-gray-100 dark:border-dark-700 pt-2">
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut className="h-4 w-4" />{t('nav.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
