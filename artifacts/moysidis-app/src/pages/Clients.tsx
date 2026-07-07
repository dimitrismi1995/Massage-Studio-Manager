import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListClients, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDateFormatter } from '@/lib/utils';
import { Link } from 'wouter';
import { Search, ChevronRight, UserCircle2 } from 'lucide-react';

export default function ClientsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const [search, setSearch] = React.useState('');

  const { data: clients, isLoading } = useListClients(
    search ? { search } : undefined,
    { query: { queryKey: getListClientsQueryKey(search ? { search } : undefined) } }
  );

  const empty = !isLoading && (!clients || clients.length === 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('clients.title')}</h1>

        <div className="relative flex-1 sm:w-64 sm:flex-none">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('clients.search')}
            className="pl-9 bg-card w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      )}

      {/* Empty state */}
      {empty && (
        <Card>
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <UserCircle2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No clients found.</p>
            <p className="text-xs text-muted-foreground/60">Clients are added automatically when you quick-book an appointment.</p>
          </CardContent>
        </Card>
      )}

      {/* Mobile card list — shown on small screens */}
      {!isLoading && !empty && (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {clients?.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {client.firstName} {client.lastName}
                        </span>
                        {client.hasMedicalHistory && (
                          <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">
                            History
                          </span>
                        )}
                      </div>
                      {client.email && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{client.email}</p>
                      )}
                      {client.phone && (
                        <p className="text-xs text-muted-foreground">{client.phone}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop table — hidden on small screens */}
          <Card className="hidden md:block">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('clients.name')}</TableHead>
                    <TableHead>{t('clients.email')}</TableHead>
                    <TableHead>{t('clients.phone')}</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.firstName} {client.lastName}
                        {client.hasMedicalHistory && (
                          <span className="ml-2 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">History</span>
                        )}
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{formatDate(client.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10" asChild>
                          <Link href={`/clients/${client.id}`}>View Profile</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
