import React from 'react';

const COUNTRY_CODES = [
  { code: '+41', iso: 'ch' },
  { code: '+30', iso: 'gr' },
  { code: '+49', iso: 'de' },
  { code: '+43', iso: 'at' },
  { code: '+33', iso: 'fr' },
  { code: '+39', iso: 'it' },
  { code: '+44', iso: 'gb' },
  { code: '+1',  iso: 'us' },
  { code: '+34', iso: 'es' },
  { code: '+351',iso: 'pt' },
  { code: '+31', iso: 'nl' },
  { code: '+32', iso: 'be' },
  { code: '+7',  iso: 'ru' },
  { code: '+86', iso: 'cn' },
  { code: '+91', iso: 'in' },
  { code: '+61', iso: 'au' },
];

const DEFAULT_CODE = '+41';

function flagImg(iso: string) {
  return `https://flagcdn.com/w20/${iso}.png`;
}

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
  inputClassName?: string;
}

export function PhoneInput({ value, onChange, placeholder = 'Phone number', inputClassName }: PhoneInputProps) {
  const { dialCode, number } = React.useMemo(() => parsePhone(value || ''), [value]);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = COUNTRY_CODES.find(c => c.code === dialCode) ?? COUNTRY_CODES[0];

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

  return (
    <div className="flex rounded-md border border-input overflow-visible focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Trigger */}
      <div ref={ref} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="h-11 bg-muted border-r border-input px-3 flex items-center gap-1.5 focus:outline-none cursor-pointer hover:bg-muted/80 transition-colors text-sm font-medium whitespace-nowrap"
          aria-label="Select country code"
        >
          <img
            src={flagImg(selected.iso)}
            alt={selected.iso.toUpperCase()}
            className="w-5 h-auto rounded-sm"
          />
          <span>{selected.code}</span>
          <span className="text-muted-foreground text-[10px]">▾</span>
        </button>

        {open && (
          <div className="absolute z-50 left-0 top-full mt-1 w-40 rounded-md border border-border bg-popover shadow-lg overflow-y-auto max-h-64">
            {COUNTRY_CODES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCode(c.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${c.code === dialCode ? 'bg-accent/50 font-medium' : ''}`}
              >
                <img
                  src={flagImg(c.iso)}
                  alt={c.iso.toUpperCase()}
                  className="w-5 h-auto rounded-sm shrink-0"
                />
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Number input */}
      <input
        type="tel"
        value={number}
        onChange={e => onChange(`${dialCode} ${e.target.value}`)}
        placeholder={placeholder}
        className={inputClassName ?? 'h-11 flex-1 min-w-0 bg-background px-3 text-sm focus:outline-none rounded-r-md'}
      />
    </div>
  );
}
