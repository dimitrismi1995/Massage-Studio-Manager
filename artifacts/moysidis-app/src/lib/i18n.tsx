import React, { createContext, useContext, ReactNode } from 'react';

type Language = 'en';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.appointments': 'Appointments',
    'nav.clients': 'Clients',
    'nav.expenses': 'Expenses',
    'nav.finance': 'Finance',
    'nav.reviews': 'Reviews',

    // Dashboard
    'dashboard.today_income': 'Today\'s Income',
    'dashboard.today_appointments': 'Today\'s Appointments',
    'dashboard.month_profit': 'Month Profit',
    'dashboard.total_clients': 'Total Clients',
    'dashboard.recent_appointments': 'Recent Appointments',
    'dashboard.no_appointments': 'No appointments today.',

    // Actions
    'action.complete': 'Complete',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add',
    'action.submit': 'Submit',

    // Appointments
    'appointments.title': 'Appointments',
    'appointments.create': 'New Appointment',
    'appointments.date': 'Date',
    'appointments.time': 'Time',
    'appointments.duration': 'Duration (min)',
    'appointments.service': 'Service',
    'appointments.price': 'Price (EUR)',
    'appointments.notes': 'Notes',
    'appointments.status': 'Status',
    'status.scheduled': 'Scheduled',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.no_show': 'No Show',

    // Clients
    'clients.title': 'Clients',
    'clients.create': 'Add Client',
    'clients.name': 'Name',
    'clients.email': 'Email',
    'clients.phone': 'Phone',
    'clients.age': 'Age',
    'clients.search': 'Search clients...',
    'clients.medical_history': 'Medical History',
    'clients.no_history': 'No medical history available.',
    'clients.history.conditions': 'Conditions',
    'clients.history.allergies': 'Allergies',
    'clients.history.medications': 'Medications',
    'clients.history.pain': 'Areas of Pain',
    'clients.history.pressure': 'Preferred Pressure',
    'clients.history.goals': 'Goals',

    // Intake
    'intake.title': 'Client Intake Form',
    'intake.subtitle': 'Please fill out your details and medical history.',
    'intake.personal': 'Personal Information',
    'intake.first_name': 'First Name',
    'intake.last_name': 'Last Name',
    'intake.medical': 'Medical Information',
    'intake.conditions': 'Medical Conditions',
    'intake.allergies': 'Allergies',
    'intake.immune': 'Immune/Autoimmune Issues',
    'intake.other_health': 'Other Health Issues',
    'intake.medications': 'Medications',
    'intake.pain_areas': 'Areas of Pain/Tension',
    'intake.prev_experience': 'Previous Massage Experience?',
    'intake.yes': 'Yes',
    'intake.no': 'No',
    'intake.pressure': 'Preferred Pressure',
    'intake.pressure.light': 'Light',
    'intake.pressure.medium': 'Medium',
    'intake.pressure.firm': 'Firm',
    'intake.goals': 'Massage Goals',
    'intake.gdpr': 'I accept the privacy policy and consent to the processing of my medical data for the purpose of massage therapy.',
    'intake.thank_you': 'Thank you!',
    'intake.thank_you_msg': 'Your information has been successfully submitted.',
    'intake.back': 'Back to Start',

    // Expenses
    'expenses.title': 'Expenses',
    'expenses.create': 'Add Expense',
    'expenses.category': 'Category',
    'expenses.description': 'Description',
    'expenses.amount': 'Amount (EUR)',

    // Finance
    'finance.title': 'Financial Overview',
    'finance.income_vs_expenses': 'Income vs Expenses',
    'finance.revenue_by_service': 'Revenue by Service',

    // Reviews
    'reviews.title': 'Reviews',
    'reviews.rating': 'Rating',
    'reviews.comment': 'Comment',

    // Booking (client self-service)
    'booking.title': 'Book Your Massage Appointment',
    'booking.subtitle': 'Fill in the table below and we will confirm your booking shortly.',
    'booking.thank_you': 'Booking Received!',
    'booking.thank_you_msg': 'Thank you for booking with Moysiades Massage. We will contact you to confirm your appointment.',
    'booking.back': 'Book Another Appointment',
    'booking.field.first_name': 'First Name',
    'booking.field.last_name': 'Last Name',
    'booking.field.email': 'Email',
    'booking.field.phone': 'Phone',
    'booking.field.service': 'Service',
    'booking.field.date': 'Preferred Date',
    'booking.field.time': 'Preferred Time',
    'booking.field.notes': 'Notes / Requests',
    'booking.submit': 'Book Appointment',
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const language: Language = 'en';

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: () => {}, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
