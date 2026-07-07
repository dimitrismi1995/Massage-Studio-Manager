import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListClients, getListClientsQueryKey, useCreateClient } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useDateFormatter } from '@/lib/utils';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Search, ChevronRight, UserCircle2 } from 'lucide-react';

export default function ClientsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: clients, isLoading } = useListClients(
    search ? { search } : undefined,
    { query: { queryKey: getListClientsQueryKey(search ? { search } : undefined) } }
  );
  const createClient = useCreateClient();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      age: formData.get('age') ? Number(formData.get('age')) : undefined,
    };
    createClient.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setIsDialogOpen(false);
      }
    });
  };

  const empty = !isLoading && (!clients || clients.length === 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('clients.title')}</h1>

        <div className="flex items-center gap-3 w-full sm:w-auto">
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0">{t('clients.create')}</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>{t('clients.create')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('intake.first_name')}</Label>
                    <Input name="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('intake.last_name')}</Label>
                    <Input name="lastName" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('clients.email')}</Label>
                  <Input type="email" name="email" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('clients.phone')}</Label>
                    <Input type="tel" name="phone" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('clients.age')}</Label>
                    <Input type="number" name="age" min={0} max={120} />
                  </div>
                </div>
                <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">{t('action.cancel')}</Button>
                  <Button type="submit" disabled={createClient.isPending} className="w-full sm:w-auto">{t('action.save')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
