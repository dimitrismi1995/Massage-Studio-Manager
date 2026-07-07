import React from 'react';
import { Sidebar, MobileHeader } from './Sidebar';
import { useLocation } from 'wouter';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  if (location === '/intake' || location === '/book') {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-col md:pl-64">
        <MobileHeader />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-8">
          <div className="mx-auto max-w-6xl w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
