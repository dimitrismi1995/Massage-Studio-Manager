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

type HistoryDraft = {
  conditions: string;
  allergies: string;
  immuneIssues: string;
  otherHealthIssues: string;
  medications: string;
  painAreas: string;
  massageGoals: string;
};

function ClientHistoryCard({ client }: { client: ClientRow }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useGetMedicalHistory(client.id, {
    query: { enabled: !!client.hasMedicalHistory, retry: false, queryKey: getGetMedicalHistoryQueryKey(client.id) }
  });
  const updateMedicalHistory = useUpdateMedicalHistory();

  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<HistoryDraft>({
    conditions: '', allergies: '', immuneIssues: '', otherHealthIssues: '',
    medications: '', painAreas: '', massageGoals: '',
  });

  const startEdit = () => {
    if (!history) return;
    setDraft({
      conditions:       history.conditions       ?? '',
      allergies:        history.allergies        ?? '',
      immuneIssues:     history.immuneIssues     ?? '',
      otherHealthIssues:history.otherHealthIssues?? '',
      medications:      history.medications      ?? '',
      painAreas:        history.painAreas        ?? '',
      massageGoals:     history.massageGoals     ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!history) return;
    setSaving(true);
    await updateMedicalHistory.mutateAsync({
      clientId: client.id,
      historyId: history.id,
      data: {
        conditions:        draft.conditions        || undefined,
        allergies:         draft.allergies         || undefined,
        immuneIssues:      draft.immuneIssues      || undefined,
        otherHealthIssues: draft.otherHealthIssues || undefined,
        medications:       draft.medications       || undefined,
        painAreas:         draft.painAreas         || undefined,
        massageGoals:      draft.massageGoals      || undefined,
      },
    });
    await queryClient.invalidateQueries({ queryKey: getGetMedicalHistoryQueryKey(client.id) });
    setSaving(false);
    setEditing(false);
  };

  const field = (key: keyof HistoryDraft) => (
    <textarea
      value={draft[key]}
      onChange={(e) => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[56px] resize-none"
    />
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            <Link href={`/clients/${client.id}`} className="hover:text-accent transition-colors">
              {client.firstName} {client.lastName}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {history?.gdprAccepted && (
              <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                GDPR ✓
              </Badge>
            )}
            {history && !editing && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={startEdit}>
                <Pencil className="h-3 w-3" /> Edit
              </Button>
            )}
            {editing && (
              <>
                <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleSave} disabled={saving}>
                  <Check className="h-3 w-3" /> {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="h-3 w-3" /> Cancel
                </Button>
              </>
            )}
          </div>
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
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">{t('clients.history.conditions')}</dt>
              {editing ? field('conditions') : <dd className="break-words">{history.conditions || <span className="text-muted-foreground italic">—</span>}</dd>}
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">{t('clients.history.allergies')}</dt>
              {editing ? field('allergies') : <dd className="break-words">{history.allergies || <span className="text-muted-foreground italic">—</span>}</dd>}
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">{t('medical_history.immune')}</dt>
              {editing ? field('immuneIssues') : <dd className="break-words">{history.immuneIssues || <span className="text-muted-foreground italic">—</span>}</dd>}
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">{t('medical_history.other_health')}</dt>
              {editing ? field('otherHealthIssues') : <dd className="break-words">{history.otherHealthIssues || <span className="text-muted-foreground italic">—</span>}</dd>}
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">{t('clients.history.medications')}</dt>
              {editing ? field('medications') : <dd className="break-words">{history.medications || <span className="text-muted-foreground italic">—</span>}</dd>}
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">{t('clients.history.pain')}</dt>
              {editing ? field('painAreas') : <dd className="break-words">{history.painAreas || <span className="text-muted-foreground italic">—</span>}</dd>}
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide mb-0.5">{t('medical_history.goals')}</dt>
              {editing ? field('massageGoals') : <dd className="break-words">{history.massageGoals || <span className="text-muted-foreground italic">—</span>}</dd>}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
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
