import React from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/lib/i18n';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  PieChart,
  Star,
  Menu
} from 'lucide-react';
import { Button } from '../ui/button';
import logoSrc from '@assets/IMG_2593_1782977930405.png';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/appointments', icon: Calendar, labelKey: 'nav.appointments' },
  { href: '/clients', icon: Users, labelKey: 'nav.clients' },
  { href: '/expenses', icon: CreditCard, labelKey: 'nav.expenses' },
  { href: '/finance', icon: PieChart, labelKey: 'nav.finance' },
  { href: '/reviews', icon: Star, labelKey: 'nav.reviews' },
];

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="Moysidis Mobile Massage" className="h-10 w-auto object-contain" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="flex flex-col gap-2 px-4">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <item.icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-card px-2 py-2 md:hidden">
      {navItems.slice(0, 5).map((item) => {
        const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t(item.labelKey).slice(0, 8)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
