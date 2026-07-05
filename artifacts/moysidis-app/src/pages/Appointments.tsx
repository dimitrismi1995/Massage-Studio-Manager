import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListAppointments, getListAppointmentsQueryKey, useCompleteAppointment, useCancelAppointment, useCreateAppointment, useDeleteAppointment, useUpdateAppointment, useListClients, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, useDateFormatter, getStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import * as z from 'zod';

const appointmentSchema = z.object({
  clientId: z.coerce.number().min(1, 'Client is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  durationMinutes: z.coerce.number().min(15).max(180),
  serviceType: z.string().min(1, 'Service is required'),
  price: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: appointments, isLoading } = useListAppointments(
    dateFilter ? { date: dateFilter } : undefined,
    { query: { queryKey: getListAppointmentsQueryKey(dateFilter ? { date: dateFilter } : undefined) } }
  );
  const { data: clients } = useListClients(undefined, { query: { queryKey: getListClientsQueryKey() } });
  const completeAppt = useCompleteAppointment();
  const cancelAppt = useCancelAppointment();
  const createAppt = useCreateAppointment();
  const deleteAppt = useDeleteAppointment();
  const updateAppt = useUpdateAppointment();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      durationMinutes: 60,
      price: 120,
    }
  });

  const onSubmit = (values: z.infer<typeof appointmentSchema>) => {
    createAppt.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        setIsDialogOpen(false);
        form.reset();
      }
    });
  };

  const handleComplete = (id: number) => {
    completeAppt.mutate({ appointmentId: id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() })
    });
  };

  const handleCancel = (id: number) => {
    cancelAppt.mutate({ appointmentId: id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this appointment?')) {
      deleteAppt.mutate({ appointmentId: id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('appointments.title')}</h1>
        
        <div className="flex items-center gap-4">
          <Input 
            type="date" 
            className="w-auto bg-card" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Button onClick={() => setDateFilter('')} variant="outline" className="hidden sm:inline-flex">Clear</Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>{t('appointments.create')}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('appointments.create')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Controller
                      name="clientId"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : undefined}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients?.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.clientId && <p className="text-destructive text-xs">Required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('appointments.service')}</Label>
                    <Controller
                      name="serviceType"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Swedish">Swedish</SelectItem>
                            <SelectItem value="Deep Tissue">Deep Tissue</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Relaxation">Relaxation</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('appointments.date')}</Label>
                    <Input type="date" {...form.register('date')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('appointments.time')}</Label>
                    <Input type="time" {...form.register('startTime')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('appointments.duration')}</Label>
                    <Input type="number" {...form.register('durationMinutes')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('appointments.price')}</Label>
                    <Input type="number" {...form.register('price')} />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('action.cancel')}</Button>
                  <Button type="submit" disabled={createAppt.isPending}>{t('action.save')}</Button>
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
              <TableHead>{t('appointments.date')}</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>{t('appointments.service')}</TableHead>
              <TableHead>{t('appointments.status')}</TableHead>
              <TableHead className="text-right">{t('appointments.price')}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center p-8">Loading...</TableCell></TableRow>
            ) : appointments?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center p-8">No appointments found.</TableCell></TableRow>
            ) : (
              appointments?.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell className="font-medium">
                    {formatDate(appt.date)}
                    <div className="text-xs text-muted-foreground">{appt.startTime} ({appt.durationMinutes}m)</div>
                  </TableCell>
                  <TableCell>{appt.clientName}</TableCell>
                  <TableCell>{appt.serviceType}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(appt.status)}>
                      {t(`status.${appt.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(appt.price)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {appt.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleComplete(appt.id)}>{t('action.complete')}</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(appt.id)}>{t('action.cancel')}</Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive px-2" onClick={() => handleDelete(appt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
