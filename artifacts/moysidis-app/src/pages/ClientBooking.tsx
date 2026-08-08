import React from 'react';
import { useCreateClient, useUpdateClient, useListClients, useCreateMedicalHistory, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { User, Calendar, Phone, Mail, HeartPulse, Save, ChevronRight, MessageCircle } from 'lucide-react';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Link } from 'wouter';
import logoSrc from '@assets/IMG_2593_1782977930405.png';

type YesNo = 'yes' | 'no';

type FormValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  hasAllergies: YesNo;
  allergies: string;
  hasMedicalConditions: YesNo;
  medicalHistory: string;
  hasInjuries: YesNo;
  injuries: string;
  hasMedication: YesNo;
  medication: string;
  otherNotes: string;
  gdprAccepted: boolean;
};

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-b-0">
      <div className="mt-1.5 text-accent shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        {children}
      </div>
    </div>
  );
}

function DateOfBirthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const currentYear = new Date().getFullYear();
  const maxDate = `${currentYear}-12-31`;
  const minDate = `${currentYear - 110}-01-01`;

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      max={maxDate}
      min={minDate}
      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    />
  );
}

function YesNoToggle({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="inline-flex rounded-md border border-input overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => onChange('no')}
        className={`px-4 py-1.5 text-sm font-medium transition-colors ${value === 'no' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
      >
        No
      </button>
      <button
        type="button"
        onClick={() => onChange('yes')}
        className={`px-4 py-1.5 text-sm font-medium transition-colors ${value === 'yes' ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
      >
        Yes
      </button>
    </div>
  );
}

function MedicalQuestionRow({
  question,
  value,
  onChange,
  expanded,
  onToggleExpand,
  children,
}: {
  question: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-3 border-b border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-sm font-medium">{question}</span>
        <div className="flex items-center gap-2 shrink-0">
          <YesNoToggle value={value} onChange={onChange} />
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label="Toggle details"
            className="text-muted-foreground hover:text-foreground transition-transform shrink-0"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function ClientBooking() {
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
  const [otherExpanded, setOtherExpanded] = React.useState(false);
  const [matchedClientId, setMatchedClientId] = React.useState<number | null>(null);

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createMedicalHistory = useCreateMedicalHistory();
  const { data: allClients } = useListClients();
  const { refetch: findClients } = useListClients(undefined, { query: { enabled: false, queryKey: getListClientsQueryKey() } });

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      hasAllergies: 'no',
      allergies: '',
      hasMedicalConditions: 'no',
      medicalHistory: '',
      hasInjuries: 'no',
      injuries: '',
      hasMedication: 'no',
      medication: '',
      otherNotes: '',
      gdprAccepted: false,
    },
  });

  const phoneValue = watch('phone');

  // Auto-fill personal info when phone matches an existing client
  React.useEffect(() => {
    if (!allClients) return;
    const digits = phoneValue.replace(/\D/g, '');
    if (digits.length < 6) {
      setMatchedClientId(null);
      return;
    }
    const match = allClients.find((c) => {
      const stored = (c.phone ?? '').replace(/\D/g, '');
      return stored.length >= 6 && (stored.endsWith(digits) || digits.endsWith(stored));
    });
    if (match) {
      setMatchedClientId(match.id);
      setValue('firstName', match.firstName, { shouldDirty: false });
      setValue('lastName', match.lastName, { shouldDirty: false });
      setValue('email', match.email ?? '', { shouldDirty: false });
      setValue('dateOfBirth', match.dateOfBirth ?? '', { shouldDirty: false });
    } else {
      setMatchedClientId(null);
    }
  }, [phoneValue, allClients]);

  const hasAllergies = watch('hasAllergies');
  const hasMedicalConditions = watch('hasMedicalConditions');
  const hasInjuries = watch('hasInjuries');
  const hasMedication = watch('hasMedication');

  const toggleRow = (row: string) => setExpandedRow((prev) => (prev === row ? null : row));

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const existing = await findClients();
      const norm = (s: string) => s.trim().toLowerCase();
      const match = existing.data?.find(
        (c) =>
          c.email.toLowerCase() === data.email.toLowerCase() ||
          (norm(c.firstName) === norm(data.firstName) && norm(c.lastName) === norm(data.lastName))
      );

      const clientPayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone.replace(/^\+\d+\s*/, '').trim(),
        dateOfBirth: data.dateOfBirth || undefined,
      };

      const clientId = match
        ? (await updateClient.mutateAsync({ clientId: match.id, data: clientPayload })).id
        : (await createClient.mutateAsync({ data: clientPayload })).id;

      await createMedicalHistory.mutateAsync({
        clientId,
        data: {
          allergies: data.hasAllergies === 'yes' ? (data.allergies || undefined) : undefined,
          conditions: data.hasMedicalConditions === 'yes' ? (data.medicalHistory || undefined) : undefined,
          painAreas: data.hasInjuries === 'yes' ? (data.injuries || undefined) : undefined,
          medications: data.hasMedication === 'yes' ? (data.medication || undefined) : undefined,
          otherHealthIssues: data.otherNotes || undefined,
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
          <h2 className="text-3xl font-bold text-primary mb-2">Information Saved!</h2>
          <p className="text-muted-foreground mb-8">Thank you. Your health information has been recorded and saved to your client file.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Submit Another Form
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex justify-center items-center mb-6">
        <Link to="/" aria-label="Go to homepage">
          <img src={logoSrc} alt="Moysidis Massage" className="h-14 w-auto object-contain cursor-pointer"
               draggable={false} onContextMenu={e => e.preventDefault()} />
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Client Details Form</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary mb-2">
              <User className="h-5 w-5" />
              Personal Information
            </h2>

            <FieldRow icon={Phone} label="Phone">
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Phone number"
                  />
                )}
              />
            </FieldRow>

            {matchedClientId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Existing client recognised — details auto-filled
              </div>
            )}

            <FieldRow icon={User} label="Full Name">
              <div className="grid grid-cols-2 gap-2">
                <input
                  {...register('firstName')}
                  placeholder="First name"
                  readOnly={!!matchedClientId}
                  className={`w-full min-w-0 h-11 rounded-md border border-input px-2 sm:px-3 text-sm sm:text-base box-border ${matchedClientId ? 'bg-muted text-muted-foreground cursor-default' : 'bg-background'}`}
                />
                <input
                  {...register('lastName')}
                  placeholder="Last name"
                  readOnly={!!matchedClientId}
                  className={`w-full min-w-0 h-11 rounded-md border border-input px-2 sm:px-3 text-sm sm:text-base box-border ${matchedClientId ? 'bg-muted text-muted-foreground cursor-default' : 'bg-background'}`}
                />
              </div>
            </FieldRow>

            <FieldRow icon={Calendar} label="Date of Birth">
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <div className={matchedClientId ? 'pointer-events-none opacity-60' : ''}>
                    <DateOfBirthPicker value={field.value} onChange={field.onChange} />
                  </div>
                )}
              />
            </FieldRow>

            <FieldRow icon={Mail} label="Email">
              <input
                type="email"
                {...register('email')}
                placeholder="Enter your email address"
                readOnly={!!matchedClientId}
                className={`w-full min-w-0 h-11 rounded-md border border-input px-3 text-sm sm:text-base box-border ${matchedClientId ? 'bg-muted text-muted-foreground cursor-default' : 'bg-background'}`}
              />
            </FieldRow>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-accent shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary mb-2">
              <HeartPulse className="h-5 w-5" />
              Medical Information
            </h2>

            <Controller
              name="hasAllergies"
              control={control}
              render={({ field }) => (
                <MedicalQuestionRow
                  question="Do you have any allergies?"
                  value={field.value}
                  onChange={(v) => { field.onChange(v); if (v === 'yes') setExpandedRow('allergies'); }}
                  expanded={expandedRow === 'allergies'}
                  onToggleExpand={() => toggleRow('allergies')}
                >
                  <textarea
                    {...register('allergies')}
                    placeholder="e.g. nut oils, latex, fragrances..."
                    className="w-full min-w-0 min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base box-border"
                  />
                </MedicalQuestionRow>
              )}
            />

            <Controller
              name="hasMedicalConditions"
              control={control}
              render={({ field }) => (
                <MedicalQuestionRow
                  question="Do you have any medical conditions I should know about?"
                  value={field.value}
                  onChange={(v) => { field.onChange(v); if (v === 'yes') setExpandedRow('conditions'); }}
                  expanded={expandedRow === 'conditions'}
                  onToggleExpand={() => toggleRow('conditions')}
                >
                  <textarea
                    {...register('medicalHistory')}
                    placeholder="Any conditions we should know about..."
                    className="w-full min-w-0 min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base box-border"
                  />
                </MedicalQuestionRow>
              )}
            />

            <Controller
              name="hasInjuries"
              control={control}
              render={({ field }) => (
                <MedicalQuestionRow
                  question="Have you had any musculoskeletal injuries, surgeries or chronic pain?"
                  value={field.value}
                  onChange={(v) => { field.onChange(v); if (v === 'yes') setExpandedRow('injuries'); }}
                  expanded={expandedRow === 'injuries'}
                  onToggleExpand={() => toggleRow('injuries')}
                >
                  <textarea
                    {...register('injuries')}
                    placeholder="Any injuries, surgeries, or chronic pain..."
                    className="w-full min-w-0 min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base box-border"
                  />
                </MedicalQuestionRow>
              )}
            />

            <Controller
              name="hasMedication"
              control={control}
              render={({ field }) => (
                <MedicalQuestionRow
                  question="Are you currently taking any medication?"
                  value={field.value}
                  onChange={(v) => { field.onChange(v); if (v === 'yes') setExpandedRow('medication'); }}
                  expanded={expandedRow === 'medication'}
                  onToggleExpand={() => toggleRow('medication')}
                >
                  <textarea
                    {...register('medication')}
                    placeholder="List any medications you are taking..."
                    className="w-full min-w-0 min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base box-border"
                  />
                </MedicalQuestionRow>
              )}
            />

            <div className="py-3 border-b border-border/60">
              <button
                type="button"
                onClick={() => setOtherExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="text-sm font-medium">Is there anything else you would like me to know before your massage?</span>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground shrink-0 transition-transform"
                  style={{ transform: otherExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
              </button>
              {otherExpanded && (
                <textarea
                  {...register('otherNotes')}
                  placeholder="Anything else you'd like us to know..."
                  className="w-full min-w-0 min-h-[70px] mt-3 rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base box-border"
                />
              )}
            </div>

            <div className="py-3">
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
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                  I consent to Moysidis Mobile Massage storing my details in accordance with GDPR.
                </p>
              </div>
              {errors.gdprAccepted && <p className="text-destructive text-xs mt-1">Please confirm consent to continue</p>}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-lg font-semibold gap-2"
          disabled={createClient.isPending || updateClient.isPending || createMedicalHistory.isPending}
        >
          <Save className="h-5 w-5" />
          Save Health History
        </Button>
      </form>
    </div>
  );
}
