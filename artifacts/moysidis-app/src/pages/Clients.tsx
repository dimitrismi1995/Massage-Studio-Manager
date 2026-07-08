import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListClients, useUpdateClient, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useDateFormatter } from '@/lib/utils';
import { Link } from 'wouter';
import { Search, ChevronRight, UserCircle2, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';

type Client = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  address?: string | null;
  floor?: string | null;
  plz?: string | null;
  notes?: string | null;
};

type EditFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  floor: string;
  plz: string;
  notes: string;
};

function EditClientDialog({ client, onClose }: { client: Client; onClose: () => void }) {
  const updateClient = useUpdateClient();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<EditFormValues>({
    defaultValues: {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      dateOfBirth: client.dateOfBirth || '',
      address: client.address || '',
      floor: client.floor || '',
      plz: client.plz || '',
      notes: client.notes || '',
    },
  });

  const onSubmit = async (data: EditFormValues) => {
    await updateClient.mutateAsync({
      clientId: client.id,
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth || undefined,
        address: data.address || undefined,
        floor: data.floor || undefined,
        plz: data.plz || undefined,
        notes: data.notes || undefined,
      },
    });
    await queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
    onClose();
  };

  const fieldClass = 'w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name</label>
              <input {...register('firstName')} className={fieldClass} placeholder="First name" />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input {...register('lastName')} className={fieldClass} placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" {...register('email')} className={fieldClass} placeholder="email@example.com" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" {...register('phone')} className={fieldClass} placeholder="+41..." />
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" {...register('dateOfBirth')} className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Address</label>
              <input {...register('address')} className={fieldClass} placeholder="Street & number" />
            </div>
            <div>
              <label className={labelClass}>Floor</label>
              <input {...register('floor')} className={fieldClass} placeholder="e.g. 2nd" />
            </div>
          </div>
          <div>
            <label className={labelClass}>PLZ / Postcode</label>
            <input {...register('plz')} className={fieldClass} placeholder="e.g. 8001" />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              {...register('notes')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[70px]"
              placeholder="Any private notes about this client..."
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const [search, setSearch] = React.useState('');
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);

  const { data: clients, isLoading } = useListClients(
    search ? { search } : undefined,
    { query: { queryKey: getListClientsQueryKey(search ? { search } : undefined) } }
  );

  const empty = !isLoading && (!clients || clients.length === 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {editingClient && (
        <EditClientDialog client={editingClient} onClose={() => setEditingClient(null)} />
      )}

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

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      )}

      {empty && (
        <Card>
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <UserCircle2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No clients found.</p>
            <p className="text-xs text-muted-foreground/60">Clients are added automatically when you quick-book an appointment.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !empty && (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <Link href={`/clients/${client.id}`} className="flex-1 min-w-0">
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
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); setEditingClient(client); }}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Edit client"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <Link href={`/clients/${client.id}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setEditingClient(client)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10" asChild>
                            <Link href={`/clients/${client.id}`}>View Profile</Link>
                          </Button>
                        </div>
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
