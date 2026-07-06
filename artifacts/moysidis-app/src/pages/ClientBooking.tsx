import React from 'react';
import { Link } from 'wouter';
import { useCreateClient, useUpdateClient, useListClients, useCreateMedicalHistory, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { User, Calendar, Phone, Mail, HeartPulse, Save, ChevronRight, MessageCircle } from 'lucide-react';
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

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function daysInMonth(month: string, year: string): number {
  if (!month) return 31;
  const m = parseInt(month, 10);
  const y = year ? parseInt(year, 10) : 2000;
  return new Date(y, m, 0).getDate();
}

function DateOfBirthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [year, month, day] = value ? value.split('-') : ['', '', ''];

  const maxDay = daysInMonth(month, year);
  const dayOptions = Array.from({ length: maxDay }, (_, i) => String(i + 1).padStart(2, '0'));
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 110 }, (_, i) => String(currentYear - i));

  const update = (next: { year?: string; month?: string; day?: string }) => {
    const y = next.year ?? year;
    const m = next.month ?? month;
    let d = next.day ?? day;
    if (m && d && parseInt(d, 10) > daysInMonth(m, y)) {
      d = String(daysInMonth(m, y)).padStart(2, '0');
    }
    if (y && m && d) {
      onChange(`${y}-${m}-${d}`);
    } else {
      onChange('');
    }
  };

  const selectClass =
    'h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm sm:text-base appearance-none';

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        aria-label="Month"
        value={month}
        onChange={(e) => update({ month: e.target.value })}
        className={selectClass}
      >
        <option value="">Month</option>
        {MONTH_OPTIONS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Day"
        value={day}
        onChange={(e) => update({ day: e.target.value })}
        className={selectClass}
      >
        <option value="">Day</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {parseInt(d, 10)}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={year}
        onChange={(e) => update({ year: e.target.value })}
        className={selectClass}
      >
        <option value="">Year</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
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

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createMedicalHistory = useCreateMedicalHistory();
  const { refetch: findClients } = useListClients(undefined, { query: { enabled: false, queryKey: getListClientsQueryKey() } });

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
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

  const hasAllergies = watch('hasAllergies');
  const hasMedicalConditions = watch('hasMedicalConditions');
  const hasInjuries = watch('hasInjuries');
  const hasMedication = watch('hasMedication');

  const toggleRow = (row: string) => setExpandedRow((prev) => (prev === row ? null : row));

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const existing = await findClients();
      const match = existing.data?.find(
        (c) => c.email.toLowerCase() === data.email.toLowerCase()
      );

      const clientPayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
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
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex justify-center items-center mb-6">
        <Link href="/">
          <img src={logoSrc} alt="Moysidis Massage" className="h-14 w-auto object-contain cursor-pointer" />
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

            <FieldRow icon={User} label="Full Name *">
              <div className="flex gap-2">
                <input
                  {...register('firstName', { required: true })}
                  placeholder="First name"
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                />
                <input
                  {...register('lastName', { required: true })}
                  placeholder="Last name"
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
                />
              </div>
              {(errors.firstName || errors.lastName) && <p className="text-destructive text-xs mt-1">Full name is required</p>}
            </FieldRow>

            <FieldRow icon={Calendar} label="Date of Birth">
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <DateOfBirthPicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FieldRow>

            <FieldRow icon={Phone} label="Phone *">
              <input
                type="tel"
                {...register('phone', { required: true })}
                placeholder="Enter your phone number"
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
              />
              {errors.phone && <p className="text-destructive text-xs mt-1">Required</p>}
            </FieldRow>

            <FieldRow icon={Mail} label="Email *">
              <input
                type="email"
                {...register('email', { required: true })}
                placeholder="Enter your email address"
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-base"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">Required</p>}
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
                    className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-base"
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
                    className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-base"
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
                    className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-base"
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
                    className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-base"
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
                  className="w-full min-h-[70px] mt-3 rounded-md border border-input bg-background px-3 py-2 text-base"
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
