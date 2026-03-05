'use client';

import { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { convertUnits, type ConvertResult } from './action';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type UnitItem = { code: string; label: string };

export type UnitGroups = {
  mass: UnitItem[];
  volume: UnitItem[];
  kitchen: UnitItem[];
};

export type QuickFill = { value: string; from: string; to: string };

const FALLBACK: UnitGroups = {
  mass: [
    { code: 'g', label: 'g' },
    { code: 'kg', label: 'kg' },
    { code: 'oz', label: 'oz' },
    { code: 'lb', label: 'lb' },
    { code: 'mg', label: 'mg' },
  ],
  volume: [
    { code: 'ml', label: 'ml' },
    { code: 'l', label: 'l' },
    { code: 'fl_oz', label: 'fl oz' },
  ],
  kitchen: [
    { code: 'tsp', label: 'tsp' },
    { code: 'tbsp', label: 'tbsp' },
    { code: 'cup', label: 'cup' },
  ],
};

const GROUP_LABELS: Record<string, Record<string, string>> = {
  en: { mass: 'Weight', volume: 'Volume & Kitchen' },
  pl: { mass: 'Waga', volume: 'Objętość i Kuchnia' },
  ru: { mass: 'Масса', volume: 'Объём и Кухня' },
  uk: { mass: 'Маса', volume: "Об'єм і Кухня" },
};

const UNSUPPORTED_MSG: Record<string, string> = {
  en: 'Unsupported pair',
  pl: 'Para nieobsługiwana',
  ru: 'Пара не поддерживается',
  uk: 'Пара не підтримується',
};

// ── Local conversion factors (base: grams for mass, ml for volume) ────────────
const LOCAL_MASS: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  oz: 28.3495,
  lb: 453.592,
};

const LOCAL_VOLUME: Record<string, number> = {
  ml: 1,
  l: 1000,
  fl_oz: 29.5735,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
};

function localConvert(num: number, from: string, to: string): number | null {
  if (LOCAL_MASS[from] !== undefined && LOCAL_MASS[to] !== undefined) {
    return (num * LOCAL_MASS[from]) / LOCAL_MASS[to];
  }
  if (LOCAL_VOLUME[from] !== undefined && LOCAL_VOLUME[to] !== undefined) {
    return (num * LOCAL_VOLUME[from]) / LOCAL_VOLUME[to];
  }
  return null; // cross-category — needs API
}

const MAX_INPUT = 1_000_000;

// ── Reusable unit picker built on shadcn DropdownMenu ─────────────────────────
function UnitSelect({
  units,
  value,
  onChange,
}: {
  units: UnitItem[];
  value: string;
  onChange: (code: string) => void;
}) {
  const current = units.find((u) => u.code === value) ?? units[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-12 sm:h-14 px-3 sm:px-4 rounded-2xl border-2 border-border/60 bg-muted/30 font-black text-sm hover:bg-primary/10 hover:border-primary/40 gap-1 sm:gap-2 min-w-[76px] sm:min-w-[90px] shrink-0"
        >
          {current?.label}
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rounded-2xl">
        {units.map((u) => (
          <DropdownMenuItem
            key={u.code}
            onSelect={() => onChange(u.code)}
            className={`font-black cursor-pointer ${u.code === value ? 'text-primary' : ''}`}
          >
            {u.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Unit group (weight or volume+kitchen) ─────────────────────────────────────
function UnitGroup({
  groupLabel,
  units,
  unsupportedMsg,
  placeholder,
  quickFill,
  onQuickFillConsumed,
}: {
  groupLabel: string;
  units: UnitItem[];
  unsupportedMsg: string;
  placeholder: string;
  quickFill: QuickFill | null;
  onQuickFillConsumed: () => void;
}) {
  const locale = useLocale();
  const [value, setValue] = useState('');
  const [fromCode, setFromCode] = useState(units[0]?.code ?? 'g');
  const [toCode, setToCode] = useState(units[1]?.code ?? 'kg');
  const [res, setRes] = useState<ConvertResult | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply quick-fill when parent sends a preset
  useEffect(() => {
    if (!quickFill) return;
    const unitCodes = units.map((u) => u.code);
    if (unitCodes.includes(quickFill.from) && unitCodes.includes(quickFill.to)) {
      setValue(quickFill.value);
      setFromCode(quickFill.from);
      setToCode(quickFill.to);
      setRes(null);
      setUnsupported(false);
      onQuickFillConsumed();
    }
  }, [quickFill, units, onQuickFillConsumed]);

  // Smart formatting: more decimals for small numbers
  const formatNum = (n: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 4 : 2,
    }).format(n);

  const handleConvert = useCallback((val: string, from: string, to: string) => {
    // Support comma as decimal separator (Polish/Ukrainian keyboards)
    const num = parseFloat(val.replace(',', '.'));
    if (isNaN(num) || val === '') {
      setRes(null);
      setUnsupported(false);
      return;
    }

    // Same unit: instant, no calculation needed
    if (from === to) {
      setUnsupported(false);
      setRes({ result: num, fromLabel: from, toLabel: to });
      return;
    }

    // Try local conversion first — instant, no API call
    const local = localConvert(num, from, to);
    if (local !== null) {
      setUnsupported(false);
      setRes({ result: local, fromLabel: from, toLabel: to });
      return;
    }

    // Fall back to API for cross-category or exotic pairs
    setUnsupported(false);
    startTransition(async () => {
      const data = await convertUnits(num, from, to, locale);
      if (data === null) {
        setUnsupported(true);
        setRes(null);
      } else {
        setRes(data);
      }
    });
  }, [locale]);

  // Debounced auto-convert (only hits API for cross-category pairs)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleConvert(value, fromCode, toCode);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fromCode, toCode, handleConvert]);

  // Safe swap using temp variable
  const swap = useCallback(() => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
    setRes(null);
    setUnsupported(false);
  }, [fromCode, toCode]);

  return (
    <div className="border-2 border-border/60 rounded-3xl p-5 sm:p-8 bg-background">
      <h2 className="text-base sm:text-lg font-black uppercase tracking-widest text-foreground italic mb-5">
        {groupLabel}
      </h2>

      {/* Mobile: stacked layout. Desktop: single row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">

        {/* Row 1 on mobile: input + from unit */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              inputMode="decimal"
              value={value}
              placeholder={placeholder}
              aria-label="Convert value"
              onChange={(e) => {
                const raw = e.target.value;
                // Allow only digits, dot, comma, minus
                if (raw !== '' && !/^-?[\d]*[.,]?[\d]*$/.test(raw)) return;
                // Limit decimal places to 6
                const normalized = raw.replace(',', '.');
                const dotIdx = normalized.indexOf('.');
                if (dotIdx !== -1 && normalized.length - dotIdx - 1 > 6) return;
                // Limit max value
                const num = parseFloat(normalized);
                if (!isNaN(num) && Math.abs(num) > MAX_INPUT) return;
                setValue(raw);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConvert(value, fromCode, toCode);
              }}
              className="h-12 sm:h-14 rounded-2xl border-2 border-border/60 bg-muted/30 font-black text-lg sm:text-xl focus-visible:border-primary/60 focus-visible:ring-0 px-4 placeholder:font-medium placeholder:text-muted-foreground/50"
            />
          </div>
          <UnitSelect
            units={units}
            value={fromCode}
            onChange={(code) => { setFromCode(code); setRes(null); setUnsupported(false); }}
          />
        </div>

        {/* Row 2 on mobile: swap + to unit + result */}
        <div className="flex gap-3 items-center">
          {/* Swap */}
          <Button
            variant="outline"
            size="icon"
            onClick={swap}
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary/60 shrink-0 transition-all"
            aria-label="Swap units"
          >
            <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </Button>

          {/* To unit dropdown */}
          <UnitSelect
            units={units}
            value={toCode}
            onChange={(code) => { setToCode(code); setRes(null); setUnsupported(false); }}
          />

          {/* Result box */}
          <div
            aria-live="polite"
            className={`flex-1 h-12 sm:h-14 px-4 rounded-2xl border-2 flex items-center gap-2 transition-colors min-w-0 ${
              unsupported
                ? 'border-orange-400/40 bg-orange-500/5'
                : isPending
                ? 'border-border/60 bg-muted/20'
                : 'border-primary/40 bg-primary/5'
            }`}
          >
            {isPending ? (
              <svg className="animate-spin h-4 w-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : unsupported ? (
              <span className="text-xs sm:text-sm font-medium text-orange-500 truncate">{unsupportedMsg}</span>
            ) : res !== null ? (
              <span className="font-black text-base sm:text-xl text-primary truncate">
                {formatNum(res.result)}{' '}
                <span className="text-xs sm:text-sm font-black text-primary/70">{res.toLabel}</span>
              </span>
            ) : (
              <span className="font-black text-xl text-muted-foreground/40">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Equation line */}
      {res !== null && !unsupported && value !== '' && (
        <p className="mt-3 text-xs sm:text-sm text-muted-foreground font-medium">
          {value.replace(',', '.')}{' '}
          <span className="text-foreground font-black">{res.fromLabel}</span>
          {' = '}
          {formatNum(res.result)}{' '}
          <span className="text-foreground font-black">{res.toLabel}</span>
        </p>
      )}
    </div>
  );
}

interface Props {
  groups?: UnitGroups;
  initialQuickFill?: QuickFill | null;
  onQuickFillReady?: (fn: (qf: QuickFill) => void) => void;
}

export default function ConverterClient({ groups }: Props) {
  const locale = useLocale();
  const t = useTranslations('chefTools');
  const g = groups ?? FALLBACK;
  const labels = GROUP_LABELS[locale] ?? GROUP_LABELS.en;
  const unsupportedMsg = UNSUPPORTED_MSG[locale] ?? UNSUPPORTED_MSG.en;
  const placeholder = t('tools.converter.placeholder');
  const [quickFill, setQuickFill] = useState<QuickFill | null>(null);

  const displayGroups = [
    { key: 'mass', label: labels.mass, units: g.mass },
    { key: 'volume', label: labels.volume, units: [...g.volume, ...g.kitchen] },
  ];

  // Expose fill function via a stable ref so sibling QuickExamples can call it
  const fillRef = useRef(setQuickFill);
  fillRef.current = setQuickFill;

  // Attach to window so QuickExamplesClient can call it without prop drilling
  useEffect(() => {
    (window as Window & { __converterFill?: (qf: QuickFill) => void }).__converterFill = (qf) => fillRef.current(qf);
    return () => { delete (window as Window & { __converterFill?: (qf: QuickFill) => void }).__converterFill; };
  }, []);

  return (
    <div className="space-y-6">
      {displayGroups.map((grp) => (
        <UnitGroup
          key={grp.key}
          groupLabel={grp.label}
          units={grp.units}
          unsupportedMsg={unsupportedMsg}
          placeholder={placeholder}
          quickFill={quickFill}
          onQuickFillConsumed={() => setQuickFill(null)}
        />
      ))}
    </div>
  );
}
