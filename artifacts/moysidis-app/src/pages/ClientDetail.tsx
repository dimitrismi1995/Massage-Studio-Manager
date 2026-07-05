import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useLanguage } from '@/lib/i18n';
import { useGetClient, useListAppointments, useGetMedicalHistory, useDeleteClient, useUpdateMedicalHistory, getGetClientQueryKey, getGetMedicalHistoryQueryKey, getListAppointmentsQueryKey, useUpdateClient } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDateFormatter, getStatusColor, formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || '0', 10);
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: client, isLoading: clientLoading } = useGetClient(clientId, { query: { enabled: !!clientId, queryKey: getGetClientQueryKey(clientId) } });
  const { data: history, isLoading: historyLoading } = useGetMedicalHistory(clientId, { query: { enabled: !!clientId, retry: false, queryKey: getGetMedicalHistoryQueryKey(clientId) } });
  const { data: appointments, isLoading: apptsLoading } = useListAppointments({ clientId }, { query: { enabled: !!clientId, queryKey: getListAppointmentsQueryKey({ clientId }) } });

  const deleteClient = useDeleteClient();
  const updateClient = useUpdateClient();
  const updateMedicalHistory = useUpdateMedicalHistory();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient.mutate({ clientId }, {
        onSuccess: () => {
          setLocation('/clients');
        }
      });
    }
  };

  const handleToggleGDPR = () => {
    if (history) {
      updateMedicalHistory.mutate({ clientId, historyId: history.id, data: { conditions: history.conditions ?? undefined } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMedicalHistoryQueryKey(clientId) })
      });
    }
  };

  if (clientLoading) return <div className="p-8 text-center">Loading client...</div>;
  if (!client) return <div className="p-8 text-center text-destructive">Client not found</div>;

  const noShowCount = appointments?.filter((a) => a.status === 'no_show').length ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              {client.firstName} {client.lastName}
            </h1>
            {noShowCount > 0 && (
              <Badge variant="outline" className={getStatusColor('no_show')}>
                {noShowCount} No-Show{noShowCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {client.email} • {client.phone}{client.age ? ` • Age ${client.age}` : ''} • Registered {formatDate(client.createdAt)}
          </p>
        </div>
        <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={deleteClient.isPending}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Client
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('clients.medical_history')}</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p>Loading...</p>
            ) : history ? (
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-primary">{t('clients.history.conditions')}</dt>
                  <dd className="mt-1">{history.conditions || '-'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-primary">{t('clients.history.allergies')}</dt>
                  <dd className="mt-1">{history.allergies || '-'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-primary">{t('clients.history.medications')}</dt>
                  <dd className="mt-1">{history.medications || '-'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-primary">{t('clients.history.pain')}</dt>
                  <dd className="mt-1">{history.painAreas || '-'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="font-semibold text-primary">{t('clients.history.pressure')}</dt>
                    <dd className="mt-1 capitalize">{history.preferredPressure || '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-primary">GDPR Accepted</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      {history.gdprAccepted ? 'Yes' : 'No'}
                    </dd>
                  </div>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground italic">{t('clients.no_history')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment History</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apptsLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center p-4">Loading...</TableCell></TableRow>
                ) : appointments?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center p-4 text-muted-foreground">No appointments</TableCell></TableRow>
                ) : (
                  appointments?.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell className="pl-6 font-medium">
                        {formatDate(appt.date)} <span className="text-muted-foreground font-normal text-xs ml-1">{appt.startTime}</span>
                      </TableCell>
                      <TableCell>{appt.serviceType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(appt.status)}>
                          {t(`status.${appt.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
