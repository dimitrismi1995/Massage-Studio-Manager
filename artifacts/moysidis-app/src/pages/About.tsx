import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-primary">About Me</h1>

      <Card className="border-t-4 border-t-accent shadow-lg">
        <CardContent className="p-6 sm:p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Panagiotis Moysidis</p>
          <p className="italic text-accent mt-1 mb-4">"Wellness Comes To You"</p>
          <div className="flex flex-col sm:flex-row sm:justify-center sm:gap-8 gap-2 text-sm text-muted-foreground">
            <a href="tel:+41783118433" className="hover:text-accent">+41 78 311 84 33</a>
            <a href="mailto:info@moysidismassage.ch" className="hover:text-accent">info@moysidismassage.ch</a>
            <a href="https://www.moysidismassage.ch" target="_blank" rel="noreferrer" className="hover:text-accent">www.moysidismassage.ch</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
