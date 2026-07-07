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
import { format, addDays, parseISO, isToday as isTodayFn, startOfWeek } from 'date-fns';
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
const SESSION_DURATION = 60;

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
    case 'completed': return 'bg-green-100 border-green-400 text-green-900 hover:bg-green-200';
    default: return 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20';
  }
}

function isSlotOccupiedIn(appts: Appt[], slotStart: number): boolean {
  const slotEnd = slotStart + SLOT_MIN;
  return appts.some((a) => {
    const s = timeToMinutes(a.startTime);
    const e = s + Math.max(a.durationMinutes || SESSION_DURATION, SESSION_DURATION);
    return s < slotEnd && e > slotStart;
  });
}

const slotTimes: number[] = [];
for (let t = DAY_START_MIN; t < DAY_END_MIN; t += SLOT_MIN) slotTimes.push(t);

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

  const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: allAppointments, isLoading } = useListAppointments(
    {},
    { query: { queryKey: getListAppointmentsQueryKey() } }
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
  };

  const activeAppts: Appt[] = (allAppointments || []).filter(
    (a: Appt) => a.status === 'scheduled' || a.status === 'completed'
  );

  const apptsByDate = (dateStr: string) =>
    activeAppts.filter((a) => a.date === dateStr);

  const onSubmit = (values: z.infer<typeof quickBookSchema>) => {
    createClient.mutate({ data: { firstName: values.firstName, lastName: values.lastName, email: '', phone: '' } }, {
      onSuccess: (client) => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        createAppt.mutate({
          data: {
            clientId: client.id,
            date: values.date,
            startTime: values.startTime,
            durationMinutes: SESSION_DURATION,
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

  const openSlot = (slotStartMin: number, dateStr?: string) => {
    form.reset({
      firstName: '',
      lastName: '',
      date: dateStr ?? selectedDate,
      startTime: minutesToTime(slotStartMin),
    });
    setIsDialogOpen(true);
  };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight text-primary">{t('appointments.title')}</h1>

      <Card>
        <CardContent className="p-3 sm:p-5 space-y-4">
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => {
                setSelectedDate((prev) => format(addDays(parseISO(prev), -7), 'yyyy-MM-dd'));
              }} aria-label="Previous week">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[160px] sm:min-w-[220px] text-center">
                <div className="font-semibold text-base sm:text-lg text-primary">
                  {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground">Week view</div>
              </div>

              <Button variant="outline" size="icon" onClick={() => {
                setSelectedDate((prev) => format(addDays(parseISO(prev), 7), 'yyyy-MM-dd'));
              }} aria-label="Next week">
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
              <Button variant="outline" onClick={() => setSelectedDate(todayStr)}>
                Today
              </Button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Tap any open time slot to book a client — date and time fill in automatically.
          </p>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading schedule...</div>
          ) : (
            /* ── WEEKLY VIEW (all devices — scrolls horizontally on phones) ── */
            <div className="border rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
              {/* Day header row — sticky, min-width so columns never collapse below 72px */}
              <div className="flex sticky top-0 z-10 bg-card border-b" style={{ minWidth: 52 + 7 * 72 }}>
                <div className="w-13 shrink-0" style={{ width: 52 }} />
                {weekDays.map((day) => {
                  const isToday = isTodayFn(day);
                  const isSelected = format(day, 'yyyy-MM-dd') === selectedDate;
                  return (
                    <div
                      key={day.toISOString()}
                      style={{ minWidth: 72 }}
                      className={`flex-1 text-center py-2 px-1 border-l text-xs font-medium cursor-pointer hover:bg-accent/10 transition-colors ${
                        isToday ? 'text-accent' : 'text-muted-foreground'
                      } ${isSelected ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                    >
                      <div className="font-semibold uppercase tracking-wide">{format(day, 'EEE')}</div>
                      <div className={`text-base font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                        isToday ? 'bg-accent text-white' : ''
                      }`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid body */}
              <div className="flex" style={{ height: slotTimes.length * ROW_HEIGHT, minWidth: 52 + 7 * 72 }}>
                {/* Time labels */}
                <div className="shrink-0 relative" style={{ width: 52 }}>
                  {slotTimes.map((t, i) => (
                    <div
                      key={t}
                      className="absolute left-0 right-0 flex items-start justify-end pr-1 pt-1"
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                    >
                      <span className="text-[9px] text-muted-foreground">{formatTimeLabel(t)}</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayAppts = apptsByDate(dateStr);
                  const isToday = isTodayFn(day);

                  return (
                    <div key={dateStr} className="flex-1 relative border-l" style={{ minWidth: 72 }}>
                      {/* Slot rows */}
                      {slotTimes.map((t, i) => {
                        const occupied = isSlotOccupiedIn(dayAppts, t);
                        return (
                          <div
                            key={t}
                            className={`absolute left-0 right-0 border-b border-border/30 transition-colors ${
                              !occupied ? 'hover:bg-accent/10 cursor-pointer' : ''
                            }`}
                            style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                            onClick={!occupied ? () => openSlot(t, dateStr) : undefined}
                          />
                        );
                      })}

                      {/* Today now-line */}
                      {isToday && nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-[2] pointer-events-none"
                          style={{ top: ((nowMin - DAY_START_MIN) / SLOT_MIN) * ROW_HEIGHT }}
                        >
                          <span className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                        </div>
                      )}

                      {/* Appointment blocks */}
                      {dayAppts.map((appt) => {
                        const s = timeToMinutes(appt.startTime);
                        const dur = Math.max(appt.durationMinutes || SESSION_DURATION, SESSION_DURATION);
                        const top = ((s - DAY_START_MIN) / SLOT_MIN) * ROW_HEIGHT;
                        const height = (dur / SLOT_MIN) * ROW_HEIGHT;
                        return (
                          <button
                            key={appt.id}
                            onClick={() => setSelectedAppt(appt)}
                            className={`absolute left-0.5 right-0.5 rounded-md border text-left overflow-hidden shadow-sm z-[1] px-1 py-0.5 ${statusBlockColor(appt.status)}`}
                            style={{ top, height }}
                          >
                            <div className="text-[9px] font-semibold truncate leading-tight">{appt.clientName}</div>
                            <div className="text-[8px] opacity-70 truncate">{appt.startTime}</div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick-book dialog */}
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
              Fixed 60-minute session at {formatCurrency(SESSION_PRICE)}. Add email, phone and other details with the edit button after booking.
            </p>
            <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">{t('action.cancel')}</Button>
              <Button type="submit" disabled={createClient.isPending || createAppt.isPending} className="w-full sm:w-auto">{t('action.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Appointment details dialog */}
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
                <div>{formatDate(selectedAppt.date)} at {selectedAppt.startTime} ({Math.max(selectedAppt.durationMinutes || SESSION_DURATION, SESSION_DURATION)} min)</div>
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

      {/* Edit client info dialog */}
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
