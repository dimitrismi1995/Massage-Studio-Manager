import React from 'react';

const COUNTRY_CODES = [
  { code: '+41', flag: '🇨🇭', label: 'CH' },
  { code: '+30', flag: '🇬🇷', label: 'GR' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+43', flag: '🇦🇹', label: 'AT' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
  { code: '+351',flag: '🇵🇹', label: 'PT' },
  { code: '+31', flag: '🇳🇱', label: 'NL' },
  { code: '+32', flag: '🇧🇪', label: 'BE' },
  { code: '+7',  flag: '🇷🇺', label: 'RU' },
  { code: '+86', flag: '🇨🇳', label: 'CN' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
];

const DEFAULT_CODE = '+41';

function parsePhone(value: string): { dialCode: string; number: string } {
  for (const c of COUNTRY_CODES) {
    if (value.startsWith(c.code + ' ')) {
      return { dialCode: c.code, number: value.slice(c.code.length + 1) };
    }
    if (value.startsWith(c.code)) {
      return { dialCode: c.code, number: value.slice(c.code.length) };
    }
  }
  return { dialCode: DEFAULT_CODE, number: value };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function PhoneInput({ value, onChange, placeholder = 'Phone number', inputClassName }: PhoneInputProps) {
  const { dialCode, number } = React.useMemo(() => parsePhone(value || ''), [value]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value} ${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${dialCode} ${e.target.value}`);
  };

  return (
    <div className="flex gap-0 rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <select
        value={dialCode}
        onChange={handleCodeChange}
        className="h-11 bg-muted border-r border-input px-2 text-sm font-medium focus:outline-none shrink-0 cursor-pointer"
        style={{ minWidth: '5.5rem' }}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className={inputClassName ?? 'h-11 flex-1 min-w-0 bg-background px-3 text-sm sm:text-base focus:outline-none'}
      />
    </div>
  );
}
