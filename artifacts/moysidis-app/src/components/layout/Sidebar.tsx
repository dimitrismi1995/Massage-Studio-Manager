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
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import logoSrc from '@assets/logo_new_transparent.png';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/appointments', icon: CalendarDays, labelKey: 'nav.appointments' },
  { href: '/clients', icon: Users, labelKey: 'nav.clients' },
  { href: '/expenses', icon: Wallet, labelKey: 'nav.expenses' },
  { href: '/finance', icon: TrendingUp, labelKey: 'nav.finance' },
  { href: '/medical-history', icon: HeartPulse, labelKey: 'nav.medical_history' },
];

const WHITE_LOGO = { filter: 'brightness(0) invert(1)' } as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { t } = useLanguage();
  return (
    <>
      {navItems.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== '/' && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-40 shrink-0 items-center justify-center border-b border-sidebar-border px-3">
        <img
          src={logoSrc}
          alt="Moysidis Mobile Massage"
          className="w-full max-w-[220px] h-auto object-contain"
          style={WHITE_LOGO}
        />
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        <nav className="flex flex-col gap-0.5 px-3">
          <NavLinks />
        </nav>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between bg-sidebar px-4 md:hidden">
      <img
        src={logoSrc}
        alt="Moysidis Mobile Massage"
        className="h-10 w-auto object-contain"
        style={WHITE_LOGO}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border"
        >
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
            <img
              src={logoSrc}
              alt="Moysidis Mobile Massage"
              className="h-12 w-auto object-contain"
              style={WHITE_LOGO}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-col gap-0.5 px-3 pt-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
