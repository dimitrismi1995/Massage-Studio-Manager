import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListClients, useGetMedicalHistory, getListClientsQueryKey, getGetMedicalHistoryQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { HeartPulse } from 'lucide-react';

type ClientRow = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  hasMedicalHistory?: boolean;
};

function ClientHistoryCard({ client }: { client: ClientRow }) {
  const { t } = useLanguage();
  const { data: history, isLoading } = useGetMedicalHistory(client.id, {
    query: { enabled: !!client.hasMedicalHistory, retry: false, queryKey: getGetMedicalHistoryQueryKey(client.id) }
  });

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
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('clients.history.conditions')}</dt>
              <dd className="mt-0.5 break-words">{history.conditions || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('clients.history.allergies')}</dt>
              <dd className="mt-0.5 break-words">{history.allergies || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('medical_history.immune')}</dt>
              <dd className="mt-0.5 break-words">{history.immuneIssues || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('medical_history.other_health')}</dt>
              <dd className="mt-0.5 break-words">{history.otherHealthIssues || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('clients.history.medications')}</dt>
              <dd className="mt-0.5 break-words">{history.medications || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('clients.history.pain')}</dt>
              <dd className="mt-0.5 break-words">{history.painAreas || '-'}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('clients.history.pressure')}</dt>
                <dd className="mt-0.5 capitalize">{history.preferredPressure || '-'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-primary text-xs uppercase tracking-wide">Previous Experience</dt>
                <dd className="mt-0.5">{history.previousMassageExperience ? 'Yes' : 'No'}</dd>
              </div>
            </div>
            <div>
              <dt className="font-semibold text-primary text-xs uppercase tracking-wide">{t('medical_history.goals')}</dt>
              <dd className="mt-0.5 break-words">{history.massageGoals || '-'}</dd>
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
