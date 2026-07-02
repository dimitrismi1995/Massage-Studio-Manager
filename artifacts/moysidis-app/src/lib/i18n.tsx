import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'de';

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
    'appointments.price': 'Price (CHF)',
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
    'clients.dob': 'Date of Birth',
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
    'expenses.amount': 'Amount (CHF)',
    
    // Finance
    'finance.title': 'Financial Overview',
    'finance.income_vs_expenses': 'Income vs Expenses',
    'finance.revenue_by_service': 'Revenue by Service',
    
    // Reviews
    'reviews.title': 'Reviews',
    'reviews.rating': 'Rating',
    'reviews.comment': 'Comment',
  },
  de: {
    // Nav
    'nav.dashboard': 'Übersicht',
    'nav.appointments': 'Termine',
    'nav.clients': 'Kunden',
    'nav.expenses': 'Ausgaben',
    'nav.finance': 'Finanzen',
    'nav.reviews': 'Bewertungen',
    
    // Dashboard
    'dashboard.today_income': 'Einnahmen heute',
    'dashboard.today_appointments': 'Termine heute',
    'dashboard.month_profit': 'Gewinn (Monat)',
    'dashboard.total_clients': 'Kunden gesamt',
    'dashboard.recent_appointments': 'Aktuelle Termine',
    'dashboard.no_appointments': 'Keine Termine heute.',
    
    // Actions
    'action.complete': 'Abschliessen',
    'action.cancel': 'Stornieren',
    'action.save': 'Speichern',
    'action.delete': 'Löschen',
    'action.edit': 'Bearbeiten',
    'action.add': 'Hinzufügen',
    'action.submit': 'Absenden',
    
    // Appointments
    'appointments.title': 'Termine',
    'appointments.create': 'Neuer Termin',
    'appointments.date': 'Datum',
    'appointments.time': 'Zeit',
    'appointments.duration': 'Dauer (Min)',
    'appointments.service': 'Dienstleistung',
    'appointments.price': 'Preis (CHF)',
    'appointments.notes': 'Notizen',
    'appointments.status': 'Status',
    'status.scheduled': 'Geplant',
    'status.completed': 'Abgeschlossen',
    'status.cancelled': 'Storniert',
    'status.no_show': 'Nicht erschienen',
    
    // Clients
    'clients.title': 'Kunden',
    'clients.create': 'Kunde hinzufügen',
    'clients.name': 'Name',
    'clients.email': 'E-Mail',
    'clients.phone': 'Telefon',
    'clients.dob': 'Geburtsdatum',
    'clients.search': 'Kunden suchen...',
    'clients.medical_history': 'Krankengeschichte',
    'clients.no_history': 'Keine Krankengeschichte vorhanden.',
    'clients.history.conditions': 'Erkrankungen',
    'clients.history.allergies': 'Allergien',
    'clients.history.medications': 'Medikamente',
    'clients.history.pain': 'Schmerzbereiche',
    'clients.history.pressure': 'Bevorzugter Druck',
    'clients.history.goals': 'Ziele',
    
    // Intake
    'intake.title': 'Kundenaufnahmeformular',
    'intake.subtitle': 'Bitte füllen Sie Ihre Daten und Ihre Krankengeschichte aus.',
    'intake.personal': 'Persönliche Daten',
    'intake.first_name': 'Vorname',
    'intake.last_name': 'Nachname',
    'intake.medical': 'Medizinische Informationen',
    'intake.conditions': 'Erkrankungen',
    'intake.allergies': 'Allergien',
    'intake.immune': 'Immun-/Autoimmunerkrankungen',
    'intake.other_health': 'Weitere Gesundheitsprobleme',
    'intake.medications': 'Medikamente',
    'intake.pain_areas': 'Schmerz-/Verspannungsbereiche',
    'intake.prev_experience': 'Bisherige Massage-Erfahrung?',
    'intake.yes': 'Ja',
    'intake.no': 'Nein',
    'intake.pressure': 'Bevorzugter Druck',
    'intake.pressure.light': 'Leicht',
    'intake.pressure.medium': 'Mittel',
    'intake.pressure.firm': 'Fest',
    'intake.goals': 'Ziele der Massage',
    'intake.gdpr': 'Ich akzeptiere die Datenschutzbestimmungen und stimme der Verarbeitung meiner medizinischen Daten zum Zwecke der Massagetherapie zu.',
    'intake.thank_you': 'Vielen Dank!',
    'intake.thank_you_msg': 'Ihre Informationen wurden erfolgreich übermittelt.',
    'intake.back': 'Zurück zum Start',
    
    // Expenses
    'expenses.title': 'Ausgaben',
    'expenses.create': 'Ausgabe hinzufügen',
    'expenses.category': 'Kategorie',
    'expenses.description': 'Beschreibung',
    'expenses.amount': 'Betrag (CHF)',
    
    // Finance
    'finance.title': 'Finanzübersicht',
    'finance.income_vs_expenses': 'Einnahmen vs Ausgaben',
    'finance.revenue_by_service': 'Umsatz nach Dienstleistung',
    
    // Reviews
    'reviews.title': 'Bewertungen',
    'reviews.rating': 'Bewertung',
    'reviews.comment': 'Kommentar',
  }
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
