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
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === dialCode) ?? COUNTRY_CODES[0];

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCode = (code: string) => {
    onChange(`${code} ${number}`);
    setOpen(false);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${dialCode} ${e.target.value}`);
  };

  return (
    <div className="flex gap-0 rounded-md border border-input overflow-visible focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Flag trigger */}
      <div ref={ref} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="h-11 bg-muted border-r border-input px-3 text-lg flex items-center gap-1 focus:outline-none cursor-pointer hover:bg-muted/80 transition-colors"
          style={{ minWidth: '3.25rem' }}
          aria-label="Select country code"
        >
          <span>{selectedCountry.flag}</span>
          <span className="text-muted-foreground text-[10px] leading-none">▾</span>
        </button>

        {open && (
          <div className="absolute z-50 left-0 top-full mt-1 w-44 rounded-md border border-border bg-popover shadow-lg overflow-y-auto max-h-64">
            {COUNTRY_CODES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCode(c.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${c.code === dialCode ? 'bg-accent/50 font-medium' : ''}`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="text-muted-foreground">{c.code}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Number input */}
      <input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className={inputClassName ?? 'h-11 flex-1 min-w-0 bg-background px-3 text-sm sm:text-base focus:outline-none rounded-r-md'}
      />
    </div>
  );
}
