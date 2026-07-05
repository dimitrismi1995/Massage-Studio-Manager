import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { useCreateMedicalHistory, useCreateClient } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import logoSrc from '@assets/IMG_2593_1782977930405.png';

export default function IntakeForm() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = React.useState(false);
  const createClient = useCreateClient();
  const createHistory = useCreateMedicalHistory();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: '',
      conditions: '',
      allergies: '',
      immuneIssues: '',
      otherHealthIssues: '',
      medications: '',
      painAreas: '',
      previousMassageExperience: false,
      preferredPressure: '',
      massageGoals: '',
      gdprAccepted: false
    }
  });

  const gdprAccepted = watch('gdprAccepted');

  const onSubmit = async (data: any) => {
    try {
      // 1. Create client first
      const client = await createClient.mutateAsync({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          age: data.age ? Number(data.age) : undefined,
        }
      });

      // 2. Submit medical history
      await createHistory.mutateAsync({
        clientId: client.id,
        data: {
          conditions: data.conditions,
          allergies: data.allergies,
          immuneIssues: data.immuneIssues,
          otherHealthIssues: data.otherHealthIssues,
          medications: data.medications,
          painAreas: data.painAreas,
          previousMassageExperience: data.previousMassageExperience,
          preferredPressure: data.preferredPressure,
          massageGoals: data.massageGoals,
          gdprAccepted: data.gdprAccepted,
        }
      });

      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert('Error submitting form');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center py-12 px-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">{t('intake.thank_you')}</h2>
          <p className="text-muted-foreground mb-8">{t('intake.thank_you_msg')}</p>
          <Button onClick={() => { setSubmitted(false); window.location.reload(); }} variant="outline">
            {t('intake.back')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex justify-center items-center mb-8">
        <img src={logoSrc} alt="Moysidis Logo" className="h-12 w-auto object-contain" />
      </div>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary tracking-tight mb-3">{t('intake.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('intake.subtitle')}</p>
      </div>

      <Card className="border-t-4 border-t-accent shadow-lg">
        <CardContent className="p-8 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            
            {/* Personal Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">{t('intake.personal')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base">{t('intake.first_name')} *</Label>
                  <Input {...register('firstName', { required: true })} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">{t('intake.last_name')} *</Label>
                  <Input {...register('lastName', { required: true })} className="h-12 text-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base">{t('clients.email')} *</Label>
                  <Input type="email" {...register('email', { required: true })} className="h-12 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">{t('clients.phone')} *</Label>
                  <Input type="tel" {...register('phone', { required: true })} className="h-12 text-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base">{t('clients.age')}</Label>
                  <Input type="number" min={0} max={120} {...register('age')} className="h-12 text-lg" />
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">{t('intake.medical')}</h3>
              
              <div className="space-y-4">
                <Label className="text-base">{t('intake.conditions')}</Label>
                <Textarea {...register('conditions')} placeholder="e.g. High blood pressure, diabetes..." className="min-h-[100px] text-lg p-3" />
              </div>

              <div className="space-y-4">
                <Label className="text-base">{t('intake.allergies')}</Label>
                <Textarea {...register('allergies')} placeholder="e.g. Nuts, specific oils..." className="min-h-[100px] text-lg p-3" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-base">{t('intake.medications')}</Label>
                  <Textarea {...register('medications')} className="min-h-[100px] text-lg p-3" />
                </div>
                <div className="space-y-4">
                  <Label className="text-base">{t('intake.pain_areas')}</Label>
                  <Textarea {...register('painAreas')} placeholder="e.g. Lower back, neck..." className="min-h-[100px] text-lg p-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <Label className="text-base block">{t('intake.prev_experience')}</Label>
                  <div className="flex items-center space-x-6 h-12">
                    <label className="flex items-center space-x-3 text-lg cursor-pointer">
                      <input type="radio" value="true" {...register('previousMassageExperience')} className="w-5 h-5 text-accent" />
                      <span>{t('intake.yes')}</span>
                    </label>
                    <label className="flex items-center space-x-3 text-lg cursor-pointer">
                      <input type="radio" value="false" {...register('previousMassageExperience')} className="w-5 h-5 text-accent" defaultChecked />
                      <span>{t('intake.no')}</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base block">{t('intake.pressure')}</Label>
                  <Controller
                    name="preferredPressure"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 text-lg">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light" className="text-lg py-3">{t('intake.pressure.light')}</SelectItem>
                          <SelectItem value="medium" className="text-lg py-3">{t('intake.pressure.medium')}</SelectItem>
                          <SelectItem value="firm" className="text-lg py-3">{t('intake.pressure.firm')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* GDPR & Submit */}
            <div className="pt-8 border-t space-y-8">
              <div className="flex items-start space-x-4 bg-muted/30 p-6 rounded-lg border border-border">
                <Controller
                  name="gdprAccepted"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Checkbox 
                      id="gdpr" 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                      className="w-6 h-6 mt-1 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                    />
                  )}
                />
                <label htmlFor="gdpr" className="text-base text-muted-foreground leading-relaxed cursor-pointer">
                  {t('intake.gdpr')}
                </label>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-16 text-xl font-semibold bg-accent hover:bg-accent/90"
                disabled={!gdprAccepted || createClient.isPending || createHistory.isPending}
              >
                {t('action.submit')}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
