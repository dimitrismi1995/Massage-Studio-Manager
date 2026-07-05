import React from 'react';
import { useCreateClient, useListClients, useCreateAppointment, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useForm, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logoSrc from '@assets/IMG_2593_1782977930405.png';

const SERVICE_PRICES: Record<string, number> = {
  'Swedish': 120,
  'Deep Tissue': 140,
  'Sports': 140,
  'Relaxation': 110,
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceType: string;
  date: string;
  startTime: string;
  notes: string;
};

export default function ClientBooking() {
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createClient = useCreateClient();
  const createAppointment = useCreateAppointment();
  const { refetch: findClients } = useListClients(undefined, { query: { enabled: false, queryKey: getListClientsQueryKey() } });

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      serviceType: '',
      date: '',
      startTime: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const existing = await findClients();
      const match = existing.data?.find(
        (c) => c.email.toLowerCase() === data.email.toLowerCase()
      );

      const clientId = match
        ? match.id
        : (
            await createClient.mutateAsync({
              data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
              },
            })
          ).id;

      await createAppointment.mutateAsync({
        data: {
          clientId,
          date: data.date,
          startTime: data.startTime,
          durationMinutes: 60,
          serviceType: data.serviceType,
          price: SERVICE_PRICES[data.serviceType] ?? 120,
          notes: data.notes || undefined,
        },
      });

      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setError('Something went wrong submitting your booking. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center py-12 px-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">Booking Received!</h2>
          <p className="text-muted-foreground mb-8">Thank you for booking with Moysiades Massage. We will contact you to confirm your appointment.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Book Another Appointment
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex justify-center items-center mb-8">
        <img src={logoSrc} alt="Moysiades Massage" className="h-12 w-auto object-contain" />
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary tracking-tight mb-3">Book Your Massage Appointment</h1>
        <p className="text-lg text-muted-foreground">Fill in the table below and we will confirm your booking shortly.</p>
      </div>

      <Card className="border-t-4 border-t-accent shadow-lg">
        <CardContent className="p-4 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold w-1/3 align-top pt-4">First Name *</TableCell>
                  <TableCell>
                    <input
                      {...register('firstName', { required: true })}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                    {errors.firstName && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Last Name *</TableCell>
                  <TableCell>
                    <input
                      {...register('lastName', { required: true })}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                    {errors.lastName && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Email *</TableCell>
                  <TableCell>
                    <input
                      type="email"
                      {...register('email', { required: true })}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                    {errors.email && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Phone *</TableCell>
                  <TableCell>
                    <input
                      type="tel"
                      {...register('phone', { required: true })}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                    {errors.phone && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Service *</TableCell>
                  <TableCell>
                    <Controller
                      name="serviceType"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a service..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(SERVICE_PRICES).map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.serviceType && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Preferred Date *</TableCell>
                  <TableCell>
                    <input
                      type="date"
                      {...register('date', { required: true })}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                    {errors.date && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Preferred Time *</TableCell>
                  <TableCell>
                    <input
                      type="time"
                      {...register('startTime', { required: true })}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                    {errors.startTime && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Notes / Requests</TableCell>
                  <TableCell>
                    <textarea
                      {...register('notes')}
                      placeholder="Anything we should know?"
                      className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-base"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {error && <p className="text-destructive text-sm mt-4">{error}</p>}

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 mt-8"
              disabled={createClient.isPending || createAppointment.isPending}
            >
              Book Appointment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
