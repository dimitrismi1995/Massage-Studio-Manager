import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useListAppointments, getListAppointmentsQueryKey, useCompleteAppointment, useCancelAppointment, useMarkAppointmentNoShow, useCreateAppointment, useDeleteAppointment, useCreateClient, useUpdateClient, useGetClient, getGetClientQueryKey, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, useDateFormatter, getStatusColor, SESSION_PRICE } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { format, addDays, parseISO, isToday as isTodayFn } from 'date-fns';
import * as z from 'zod';

const quickBookSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
});

type Appt = {
  id: number;
  date: string;
  startTime: string;
  durationMinutes?: number;
  serviceType: string;
  status: string;
  price: number;
  clientName?: string | null;
  clientId?: number;
};

const DAY_START_MIN = 7 * 60;
const DAY_END_MIN = 21 * 60;
const SLOT_MIN = 30;
const ROW_HEIGHT = 56;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatTimeLabel(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function statusBlockColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 border-green-300 text-green-900 hover:bg-green-200';
    default: return 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20';
  }
}

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const { formatDate } = useDateFormatter();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedAppt, setSelectedAppt] = React.useState<Appt | null>(null);
  const [editClientId, setEditClientId] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const { data: dayAppointments, isLoading: dayLoading } = useListAppointments(
    { date: selectedDate },
    { query: { queryKey: getListAppointmentsQueryKey({ date: selectedDate }) } }
  );
  const { data: editingClient } = useGetClient(editClientId ?? 0, {
    query: { enabled: !!editClientId, queryKey: getGetClientQueryKey(editClientId ?? 0) }
  });
  const completeAppt = useCompleteAppointment();
  const cancelAppt = useCancelAppointment();
  const noShowAppt = useMarkAppointmentNoShow();
  const createAppt = useCreateAppointment();
  const deleteAppt = useDeleteAppointment();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const form = useForm<z.infer<typeof quickBookSchema>>({
    resolver: zodResolver(quickBookSchema),
  });

  const invalidateAppointments = () => {
    queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey({ date: selectedDate }) });
  };

  const onSubmit = (values: z.infer<typeof quickBookSchema>) => {
    createClient.mutate({ data: { firstName: values.firstName, lastName: values.lastName, email: '', phone: '' } }, {
      onSuccess: (client) => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        createAppt.mutate({
          data: {
            clientId: client.id,
            date: values.date,
            startTime: values.startTime,
            durationMinutes: 60,
            serviceType: 'Massage',
            price: SESSION_PRICE,
          }
        }, {
          onSuccess: () => {
            invalidateAppointments();
            setIsDialogOpen(false);
            form.reset();
          }
        });
      }
    });
  };

  const handleEditClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editClientId) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      age: formData.get('age') ? Number(formData.get('age')) : undefined,
    };
    updateClient.mutate({ clientId: editClientId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        invalidateAppointments();
        setEditClientId(null);
        setSelectedAppt(null);
      }
    });
  };

  const handleComplete = (id: number) => {
    completeAppt.mutate({ appointmentId: id }, { onSuccess: () => { invalidateAppointments(); setSelectedAppt(null); } });
  };

  const handleCancel = (id: number) => {
    cancelAppt.mutate({ appointmentId: id }, { onSuccess: () => { invalidateAppointments(); setSelectedAppt(null); } });
  };

  const handleNoShow = (id: number) => {
    noShowAppt.mutate({ appointmentId: id }, { onSuccess: () => { invalidateAppointments(); setSelectedAppt(null); } });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this appointment?')) {
      deleteAppt.mutate({ appointmentId: id }, { onSuccess: () => { invalidateAppointments(); setSelectedAppt(null); } });
    }
  };

  const shiftDate = (delta: number) => {
    setSelectedDate((prev) => format(addDays(parseISO(prev), delta), 'yyyy-MM-dd'));
  };

  const openSlot = (slotStartMin: number) => {
    form.reset({
      firstName: '',
      lastName: '',
      date: selectedDate,
      startTime: minutesToTime(slotStartMin),
    });
    setIsDialogOpen(true);
  };

  const activeAppointments: Appt[] = (dayAppointments || []).filter(
    (a: Appt) => a.status === 'scheduled' || a.status === 'completed'
  );

  const isSlotOccupied = (slotStart: number) => {
    const slotEnd = slotStart + SLOT_MIN;
    return activeAppointments.some((a) => {
      const s = timeToMinutes(a.startTime);
      const e = s + (a.durationMinutes || 60);
      return s < slotEnd && e > slotStart;
    });
  };

  const slotTimes: number[] = [];
  for (let t = DAY_START_MIN; t < DAY_END_MIN; t += SLOT_MIN) slotTimes.push(t);

  const selectedDateObj = parseISO(selectedDate);
  const isToday = isTodayFn(selectedDateObj);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{t('appointments.title')}</h1>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => shiftDate(-1)} aria-label="Previous day">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[150px] sm:min-w-[200px] text-center">
                <div className="font-semibold text-base sm:text-lg text-primary">
                  {format(selectedDateObj, 'EEEE, MMM d')}
                </div>
                {isToday && <div className="text-xs text-accent font-medium">Today</div>}
              </div>
              <Button variant="outline" size="icon" onClick={() => shiftDate(1)} aria-label="Next day">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="date"
                className="flex-1 sm:flex-none sm:w-auto bg-card"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              >
                Today
              </Button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Tap any open time slot to book a client who called or messaged you — the slot fills in the date and time automatically.
          </p>

          <div className="relative border rounded-lg overflow-y-auto overflow-x-hidden" style={{ maxHeight: '65vh' }}>
            {dayLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading schedule...</div>
            ) : (
              <div className="relative" style={{ height: slotTimes.length * ROW_HEIGHT }}>
                {slotTimes.map((t, i) => {
                  const occupied = isSlotOccupied(t);
                  return (
                    <div
                      key={t}
                      className={`absolute left-0 right-0 border-b border-border/50 flex items-center transition-colors ${
                        occupied ? '' : 'hover:bg-accent/10 cursor-pointer group'
                      }`}
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                      onClick={occupied ? undefined : () => openSlot(t)}
                    >
                      <span className="w-14 sm:w-16 shrink-0 text-[10px] sm:text-xs text-muted-foreground pl-1 sm:pl-2">
                        {formatTimeLabel(t)}
                      </span>
                      {!occupied && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground/0 group-hover:text-accent transition-colors ml-1">
                          + Book
                        </span>
                      )}
                    </div>
                  );
                })}

                {activeAppointments.map((appt) => {
                  const s = timeToMinutes(appt.startTime);
                  const top = ((s - DAY_START_MIN) / SLOT_MIN) * ROW_HEIGHT;
                  const height = Math.max(((appt.durationMinutes || 60) / SLOT_MIN) * ROW_HEIGHT, 32);
                  return (
                    <button
                      key={appt.id}
                      onClick={() => setSelectedAppt(appt)}
                      className={`absolute left-14 sm:left-16 right-1 sm:right-2 rounded-md border px-2 py-1 text-left overflow-hidden shadow-sm z-[1] ${statusBlockColor(appt.status)}`}
                      style={{ top, height }}
                    >
                      <div className="text-xs sm:text-sm font-semibold truncate">{appt.clientName}</div>
                      <div className="text-[10px] sm:text-xs opacity-80 truncate">
                        {appt.startTime} · {appt.serviceType} ({appt.durationMinutes}m)
                      </div>
                    </button>
                  );
                })}

                {isToday && nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-[2] pointer-events-none"
                    style={{ top: ((nowMin - DAY_START_MIN) / SLOT_MIN) * ROW_HEIGHT }}
                  >
                    <span className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('appointments.create')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('intake.first_name')}</Label>
                <Input autoFocus {...form.register('firstName')} />
                {form.formState.errors.firstName && <p className="text-destructive text-xs">{form.formState.errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('intake.last_name')}</Label>
                <Input {...form.register('lastName')} />
                {form.formState.errors.lastName && <p className="text-destructive text-xs">{form.formState.errors.lastName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('appointments.date')}</Label>
                <Input type="date" {...form.register('date')} />
              </div>
              <div className="space-y-2">
                <Label>{t('appointments.time')}</Label>
                <Input type="time" {...form.register('startTime')} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Fixed 60-minute session at {formatCurrency(SESSION_PRICE)}. You can add their email, phone and other details afterwards with the edit button.
            </p>
            <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">{t('action.cancel')}</Button>
              <Button type="submit" disabled={createClient.isPending || createAppt.isPending} className="w-full sm:w-auto">{t('action.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppt && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-lg">{selectedAppt.clientName}</span>
                <Badge variant="outline" className={getStatusColor(selectedAppt.status)}>
                  {t(`status.${selectedAppt.status}`)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>{formatDate(selectedAppt.date)} at {selectedAppt.startTime} ({selectedAppt.durationMinutes} min)</div>
                <div>{selectedAppt.serviceType}</div>
                <div className="font-medium text-foreground">{formatCurrency(selectedAppt.price)}</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedAppt.clientId && (
                  <Button size="sm" variant="outline" onClick={() => setEditClientId(selectedAppt.clientId!)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Client Info
                  </Button>
                )}
                {selectedAppt.status === 'scheduled' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleComplete(selectedAppt.id)}>{t('action.complete')}</Button>
                    <Button size="sm" variant="ghost" className="text-orange-600 hover:text-orange-700" onClick={() => handleNoShow(selectedAppt.id)}>No-Show</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(selectedAppt.id)}>{t('action.cancel')}</Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(selectedAppt.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editClientId} onOpenChange={(open) => !open && setEditClientId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Client Info</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={handleEditClient} className="space-y-4 pt-4" key={editingClient.id}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('intake.first_name')}</Label>
                  <Input name="firstName" defaultValue={editingClient.firstName} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('intake.last_name')}</Label>
                  <Input name="lastName" defaultValue={editingClient.lastName} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('clients.email')}</Label>
                <Input type="email" name="email" defaultValue={editingClient.email} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('clients.phone')}</Label>
                  <Input type="tel" name="phone" defaultValue={editingClient.phone} />
                </div>
                <div className="space-y-2">
                  <Label>{t('clients.age')}</Label>
                  <Input type="number" name="age" min={0} max={120} defaultValue={editingClient.age ?? ''} />
                </div>
              </div>
              <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setEditClientId(null)} className="w-full sm:w-auto">{t('action.cancel')}</Button>
                <Button type="submit" disabled={updateClient.isPending} className="w-full sm:w-auto">{t('action.save')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
