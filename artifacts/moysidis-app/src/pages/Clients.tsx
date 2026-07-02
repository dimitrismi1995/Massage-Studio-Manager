import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListClients, getListClientsQueryKey, useCreateClient } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useDateFormatter } from '@/lib/utils';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

export default function ClientsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: clients, isLoading } = useListClients(search ? { search } : undefined, { query: { queryKey: getListClientsQueryKey(search ? { search } : undefined) } });
  const createClient = useCreateClient();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      dateOfBirth: (formData.get('dateOfBirth') as string) || undefined,
    };
    
    createClient.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('clients.title')}</h1>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('clients.create')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('clients.phone')}</Label>
                    <Input type="tel" name="phone" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('clients.dob')}</Label>
                    <Input type="date" name="dateOfBirth" />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('action.cancel')}</Button>
                  <Button type="submit" disabled={createClient.isPending}>{t('action.save')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
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
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center p-8">Loading...</TableCell></TableRow>
            ) : clients?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center p-8">No clients found.</TableCell></TableRow>
            ) : (
              clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.firstName} {client.lastName}
                    {client.hasMedicalHistory && <span className="ml-2 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">History</span>}
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
