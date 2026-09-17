import React from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/useAuth';

import Dashboard from '@/pages/Dashboard';
import Appointments from '@/pages/Appointments';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import IntakeForm from '@/pages/IntakeForm';
import ClientBooking from '@/pages/ClientBooking';
import Expenses from '@/pages/Expenses';
import Finance from '@/pages/Finance';
import MedicalHistory from '@/pages/MedicalHistory';
import ReviewPage from '@/pages/ReviewPage';
import LoginPage from '@/pages/LoginPage';
import AdminUsers from '@/pages/AdminUsers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-muted-foreground">The requested page does not exist.</p>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#deedf8]" />;
  if (!isAuthenticated) return <LoginPage />;
  return <>{children}</>;
}

function Router() {
  return (
    <AuthGate>
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/clients" component={Clients} />
          <Route path="/clients/:id" component={ClientDetail} />
          <Route path="/intake" component={IntakeForm} />
          <Route path="/book" component={ClientBooking} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/finance" component={Finance} />
          <Route path="/medical-history" component={MedicalHistory} />
          <Route path="/review" component={ReviewPage} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthGate>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
