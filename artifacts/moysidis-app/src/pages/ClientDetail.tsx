import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useLanguage } from '@/lib/i18n';
import { useGetClient, useListAppointments, useGetMedicalHistory, useDeleteClient, useUpdateMedicalHistory, getGetClientQueryKey, getGetMedicalHistoryQueryKey, getListAppointmentsQueryKey, useUpdateClient } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDateFormatter, getStatusColor } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Pencil, Check, X } from 'lucide-react';

function EditableField({
  label,
  value,
  onSave,
  multiline = true,
}: {
  label: string;
  value: string | null | undefined;
  onSave: (val: string) => Promise<void>;
  multiline?: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? '');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <dt className="font-semibold text-primary text-sm">{label}</dt>
        {!editing && (
          <button
            onClick={() => { setDraft(value ?? ''); setEditing(true); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Edit ${label}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
              autoFocus
            />
          ) : (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 px-3 text-xs">
              <Check className="h-3 w-3 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="h-7 px-3 text-xs">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <dd className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">—</span>}</dd>
      )}
    </div>
  );
}

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

  const saveField = async (field: string, val: string) => {
    if (!history) return;
    await updateMedicalHistory.mutateAsync({
      clientId,
      historyId: history.id,
      data: { [field]: val || undefined },
    });
    await queryClient.invalidateQueries({ queryKey: getGetMedicalHistoryQueryKey(clientId) });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient.mutate({ clientId }, {
        onSuccess: () => setLocation('/clients'),
      });
    }
  };

  if (clientLoading) return <div className="p-8 text-center">Loading client...</div>;
  if (!client) return <div className="p-8 text-center text-destructive">Client not found</div>;

  const noShowCount = appointments?.filter((a) => a.status === 'no_show').length ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
              {client.firstName} {client.lastName}
            </h1>
            {noShowCount > 0 && (
              <Badge variant="outline" className={getStatusColor('no_show')}>
                {noShowCount} No-Show{noShowCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {client.email} • {client.phone}{client.age ? ` • Age ${client.age}` : ''} • Registered {formatDate(client.createdAt)}
          </p>
        </div>
        <Button variant="outline" className="text-destructive hover:bg-destructive/10 w-full sm:w-auto" onClick={handleDelete} disabled={deleteClient.isPending}>
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
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : history ? (
              <dl className="space-y-5">
                <EditableField
                  label={t('clients.history.conditions')}
                  value={history.conditions}
                  onSave={(v) => saveField('conditions', v)}
                />
                <EditableField
                  label={t('clients.history.allergies')}
                  value={history.allergies}
                  onSave={(v) => saveField('allergies', v)}
                />
                <EditableField
                  label={t('clients.history.medications')}
                  value={history.medications}
                  onSave={(v) => saveField('medications', v)}
                />
                <EditableField
                  label={t('clients.history.pain')}
                  value={history.painAreas}
                  onSave={(v) => saveField('painAreas', v)}
                />
                <EditableField
                  label="Other notes"
                  value={history.otherHealthIssues}
                  onSave={(v) => saveField('otherHealthIssues', v)}
                />
                <div className="flex items-center gap-6 pt-1 text-sm">
                  <div>
                    <span className="font-semibold text-primary">{t('clients.history.pressure')}: </span>
                    <span className="capitalize">{history.preferredPressure || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">GDPR: </span>
                    <span>{history.gdprAccepted ? 'Accepted' : 'Not accepted'}</span>
                  </div>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground italic text-sm">{t('clients.no_history')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment History</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[420px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apptsLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center p-4">Loading…</TableCell></TableRow>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
