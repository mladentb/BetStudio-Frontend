'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Home, 
  Trophy, 
  Calendar, 
  Clock, 
  Zap, 
  Settings,
  ChevronRight,
  Database,
  Users,
  Building2,
  DollarSign,
  Tag,
  Tv,
  ShoppingCart,
  FileText,
  BarChart3,
  Radio,
  Key,
  Activity,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const isAdmin = user?.role === 'admin';
  const isCompanyOwner = user?.is_company_owner;

  const navigation = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.sports'), href: '/sports', icon: Trophy },
    { name: t('nav.today'), href: '/today', icon: Calendar },
    { name: t('nav.upcoming'), href: '/upcoming', icon: Clock },
    { name: t('nav.live'), href: '/live', icon: Zap },
    { name: t('nav.myGames'), href: '/my-games', icon: Tv },
    { name: t('nav.cart'), href: '/cart', icon: ShoppingCart },
    { name: t('nav.invoices'), href: '/invoices', icon: FileText },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'API Connections', href: '/admin', icon: Database },
    { name: t('admin.users'), href: '/admin/users', icon: Users },
    { name: t('admin.companies'), href: '/admin/companies', icon: Building2 },
    { name: t('admin.pricing'), href: '/admin/pricing', icon: Tag },
    { name: t('admin.finance'), href: '/admin/finance', icon: DollarSign },
    { name: t('admin.analytics'), href: '/admin/analytics', icon: BarChart3 },
    { name: t('admin.destinations'), href: '/admin/streaming', icon: Radio },
    { name: t('admin.apiKeys'), href: '/admin/api-keys', icon: Key },
    { name: t('admin.apiStats'), href: '/admin/api-analytics', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-dark-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('common.appName')}</h1>
            <p className="text-xs text-gray-400">{t('common.tagline')}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:bg-dark-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Company Owner Section */}
      {isAuthenticated && isCompanyOwner && (
        <div className="p-4 border-t border-dark-700">
          <p className="text-xs text-gray-500 uppercase mb-2 px-4">{t('nav.team')}</p>
          <Link
            href="/team"
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              pathname === '/team'
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-dark-800 hover:text-white'
            )}
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">{t('nav.team')}</span>
          </Link>
        </div>
      )}

      {/* Admin Section */}
      {isAuthenticated && isAdmin && (
        <div className="p-4 border-t border-dark-700">
          <p className="text-xs text-gray-500 uppercase mb-2 px-4">{t('admin.title')}</p>
          <div className="space-y-1">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    isActive
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="p-4 border-t border-dark-700">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
            pathname === '/settings'
              ? 'bg-primary-600 text-white' 
              : 'text-gray-400 hover:bg-dark-800 hover:text-white'
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">{t('nav.settings')}</span>
        </Link>
      </div>
    </aside>
  );
}
