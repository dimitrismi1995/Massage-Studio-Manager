import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useGetDashboardStats, useListAppointments, useCompleteAppointment, useCancelAppointment, getListAppointmentsQueryKey, getGetDashboardStatsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, useDateFormatter, getStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayAppointments, isLoading: apptsLoading } = useListAppointments({ date: today }, { query: { queryKey: getListAppointmentsQueryKey({ date: today }) } });
  
  const completeAppointment = useCompleteAppointment();
  const cancelAppointment = useCancelAppointment();

  const handleComplete = (id: number) => {
    completeAppointment.mutate({ appointmentId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      }
    });
  };

  const handleCancel = (id: number) => {
    cancelAppointment.mutate({ appointmentId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('nav.dashboard')}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-sidebar to-primary text-primary-foreground border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">{t('dashboard.today_income')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : formatCurrency(stats?.todayIncome || 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.today_appointments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.todayAppointments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pendingAppointments || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.month_profit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{statsLoading ? '...' : formatCurrency(stats?.monthProfit || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.total_clients')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalClients || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary">{t('dashboard.recent_appointments')}</h2>
        <Card>
          <div className="divide-y">
            {apptsLoading && <div className="p-8 text-center text-muted-foreground">Loading...</div>}
            
            {!apptsLoading && todayAppointments?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">{t('dashboard.no_appointments')}</div>
            )}
            
            {!apptsLoading && todayAppointments?.map((appt) => (
              <div key={appt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{appt.clientName}</span>
                    <Badge variant="outline" className={getStatusColor(appt.status)}>
                      {t(`status.${appt.status}`)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appt.startTime} • {appt.serviceType} • {appt.durationMinutes} min
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-medium mr-4">{formatCurrency(appt.price)}</span>
                  {appt.status === 'scheduled' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleComplete(appt.id)} className="flex-1 sm:flex-none">
                        {t('action.complete')}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive flex-1 sm:flex-none" onClick={() => handleCancel(appt.id)}>
                        {t('action.cancel')}
                      </Button>
                    </>
                  )}
                  <Link href={`/clients/${appt.clientId}`} className="text-accent text-sm hover:underline ml-2">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
