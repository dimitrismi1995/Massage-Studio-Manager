import React from 'react';
import { Sidebar, MobileNav } from './Sidebar';
import { useLocation } from 'wouter';
import logoSrc from '@assets/IMG_2593_1782977930405.png';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // Standalone mode for intake and client self-booking forms
  if (location === '/intake' || location === '/book') {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex flex-col md:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
          <img src={logoSrc} alt="Moysidis Logo" className="h-8 w-auto object-contain" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
