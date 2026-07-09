import React from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/lib/i18n';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wallet,
  TrendingUp,
  HeartPulse,
  Menu,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import logoSrc from '@assets/logo_transparent.png';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/appointments', icon: CalendarDays, labelKey: 'nav.appointments' },
  { href: '/clients', icon: Users, labelKey: 'nav.clients' },
  { href: '/expenses', icon: Wallet, labelKey: 'nav.expenses' },
  { href: '/finance', icon: TrendingUp, labelKey: 'nav.finance' },
  { href: '/medical-history', icon: HeartPulse, labelKey: 'nav.medical_history' },
];

const WHITE_FILTER = { filter: 'brightness(0) invert(1)' } as const;

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-36 items-center justify-center border-b border-sidebar-border px-3">
        <img src={logoSrc} alt="Moysidis Mobile Massage" className="h-32 w-auto object-contain" style={WHITE_FILTER} />
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

    </aside>
  );
}

export function MobileHeader() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
      <img src={logoSrc} alt="Moysidis Mobile Massage" className="h-13 w-auto object-contain" style={WHITE_FILTER} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu" className="text-foreground">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <div className="flex h-20 items-center border-b border-sidebar-border px-5">
            <img src={logoSrc} alt="Moysidis Mobile Massage" className="h-9 w-auto object-contain" style={WHITE_FILTER} />
          </div>

          <nav className="flex flex-col gap-1 px-3 pt-2">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                  <span>{t(item.labelKey)}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
