import React from 'react';
import { Link } from 'wouter';
import { useCreateClient, useUpdateClient, useListClients, useCreateMedicalHistory, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import logoSrc from '@assets/IMG_2593_1782977930405.png';

type FormValues = {
  firstName: string;
  lastName: string;
  age: string;
  email: string;
  phone: string;
  allergies: string;
  medicalHistory: string;
  gdprAccepted: boolean;
};

export default function ClientBooking() {
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createMedicalHistory = useCreateMedicalHistory();
  const { refetch: findClients } = useListClients(undefined, { query: { enabled: false, queryKey: getListClientsQueryKey() } });

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      age: '',
      email: '',
      phone: '',
      allergies: '',
      medicalHistory: '',
      gdprAccepted: false,
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
        ? (
            await updateClient.mutateAsync({
              clientId: match.id,
              data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                age: data.age ? Number(data.age) : undefined,
              },
            })
          ).id
        : (
            await createClient.mutateAsync({
              data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                age: data.age ? Number(data.age) : undefined,
              },
            })
          ).id;

      await createMedicalHistory.mutateAsync({
        clientId,
        data: {
          allergies: data.allergies || undefined,
          conditions: data.medicalHistory || undefined,
          gdprAccepted: data.gdprAccepted,
        },
      });

      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setError('Something went wrong submitting your details. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center py-12 px-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">Details Received!</h2>
          <p className="text-muted-foreground mb-8">Thank you for your details. Moysidis Mobile Massage will contact you directly to arrange your appointment.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Submit Another Form
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex justify-center items-center mb-8">
        <Link href="/">
          <img src={logoSrc} alt="Moysidis Massage" className="h-12 w-auto object-contain cursor-pointer" />
        </Link>
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary tracking-tight mb-3">Client Details Form</h1>
        <p className="text-lg text-muted-foreground">Please fill in your details below. Moysidis Mobile Massage will contact you to arrange your appointment.</p>
      </div>

      <Card className="border-t-4 border-t-accent shadow-lg">
        <CardContent className="p-4 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold w-1/3 align-top pt-4">Name *</TableCell>
                  <TableCell>
                    <input
                      {...register('firstName', { required: true })}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                    {errors.firstName && <p className="text-destructive text-xs mt-1">Required</p>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Surname *</TableCell>
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
                  <TableCell className="font-semibold align-top pt-4">Telephone Number *</TableCell>
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
                  <TableCell className="font-semibold align-top pt-4">Age</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min={0}
                      {...register('age')}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Any Allergies</TableCell>
                  <TableCell>
                    <textarea
                      {...register('allergies')}
                      placeholder="e.g. nut oils, latex, fragrances..."
                      className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-base"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Medical History / Health Issues</TableCell>
                  <TableCell>
                    <textarea
                      {...register('medicalHistory')}
                      placeholder="Any conditions, injuries, surgeries, or medications we should know about..."
                      className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-base"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold align-top pt-4">Consent *</TableCell>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <Controller
                        name="gdprAccepted"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        )}
                      />
                      <p className="text-sm text-muted-foreground">
                        I consent to Moysidis Mobile Massage storing my details in accordance with GDPR.
                      </p>
                    </div>
                    {errors.gdprAccepted && <p className="text-destructive text-xs mt-1">Please confirm consent to continue</p>}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {error && <p className="text-destructive text-sm mt-4">{error}</p>}

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 mt-8"
              disabled={createClient.isPending || updateClient.isPending || createMedicalHistory.isPending}
            >
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
