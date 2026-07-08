import React from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  useListClients,
  useGetMedicalHistory,
  useUpdateMedicalHistory,
  getListClientsQueryKey,
  getGetMedicalHistoryQueryKey,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { HeartPulse, Pencil, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

type ClientRow = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  hasMedicalHistory?: boolean;
};

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

  React.useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

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
      <div className="flex items-center gap-2 mb-0.5">
        <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{label}</dt>
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
        <div className="space-y-1.5">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[64px]"
              autoFocus
            />
          ) : (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-6 px-2 text-xs">
              <Check className="h-3 w-3 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="h-6 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <dd className="mt-0.5 break-words text-sm">{value || <span className="text-muted-foreground italic">—</span>}</dd>
      )}
    </div>
  );
}

function ClientHistoryCard({ client }: { client: ClientRow }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useGetMedicalHistory(client.id, {
    query: { enabled: !!client.hasMedicalHistory, retry: false, queryKey: getGetMedicalHistoryQueryKey(client.id) }
  });
  const updateMedicalHistory = useUpdateMedicalHistory();

  const saveField = async (field: string, val: string) => {
    if (!history) return;
    await updateMedicalHistory.mutateAsync({
      clientId: client.id,
      historyId: history.id,
      data: { [field]: val || undefined },
    });
    await queryClient.invalidateQueries({ queryKey: getGetMedicalHistoryQueryKey(client.id) });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            <Link href={`/clients/${client.id}`} className="hover:text-accent transition-colors">
              {client.firstName} {client.lastName}
            </Link>
          </CardTitle>
          {history?.gdprAccepted && (
            <Badge variant="outline" className="text-[10px] shrink-0 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
              GDPR ✓
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {[client.email, client.phone].filter(Boolean).join(' • ')}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {!client.hasMedicalHistory ? (
          <p className="text-sm text-muted-foreground italic">{t('medical_history.none')}</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : history ? (
          <dl className="space-y-3 text-sm">
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
              label={t('medical_history.immune')}
              value={history.immuneIssues}
              onSave={(v) => saveField('immuneIssues', v)}
            />
            <EditableField
              label={t('medical_history.other_health')}
              value={history.otherHealthIssues}
              onSave={(v) => saveField('otherHealthIssues', v)}
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
              label={t('medical_history.goals')}
              value={history.massageGoals}
              onSave={(v) => saveField('massageGoals', v)}
            />
            <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
              <div>
                <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('clients.history.pressure')}</dt>
                <dd className="mt-0.5 capitalize">{history.preferredPressure || '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-primary text-xs uppercase tracking-wide">Previous Experience</dt>
                <dd className="mt-0.5">{history.previousMassageExperience ? 'Yes' : 'No'}</dd>
              </div>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground italic">{t('clients.no_history')}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MedicalHistoryPage() {
  const { t } = useLanguage();
  const { data: clients, isLoading } = useListClients(undefined, { query: { queryKey: getListClientsQueryKey() } });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('medical_history.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('medical_history.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : !clients || clients.length === 0 ? (
        <div className="p-12 text-center border rounded-lg bg-card">
          <HeartPulse className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No clients yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientHistoryCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
