'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { Search, X, Flame, Beef, Droplets, Wheat, ArrowRight, ChevronDown, Zap, ExternalLink, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IngredientOption = {
  slug: string;
  name: string;       // localized
  nameEn: string;
  image: string | null;
};

export type I18nIngConverter = {
  title: string;
  description: string;
  ingredientPlaceholder: string;
  valuePlaceholder: string;
  selectUnit: string;
  noIngredient: string;
  noResult: string;
  result: string;
  allUnits: string;
  kcal: string;
  protein: string;
  fat: string;
  carbs: string;
  per: string;
  searchNoResults: string;
  quickIngredients: string;
  popularQueries: string;
  density: string;
  nutritionResult: string;
  contains: string;
};

type ConvertResult = {
  result: number;
  result_fraction: string;
  from_label: string;
  to_label: string;
  to_label_short: string;
  density_g_per_ml: number | null;
  equivalents: Record<string, number>;
  nutrition_for_result: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  } | null;
} | null;

// ─── Kitchen units list ───────────────────────────────────────────────────────

const FROM_UNITS = [
  { code: 'cup',  label: 'cup' },
  { code: 'tbsp', label: 'tbsp' },
  { code: 'tsp',  label: 'tsp' },
  { code: 'g',    label: 'g' },
  { code: 'kg',   label: 'kg' },
  { code: 'oz',   label: 'oz' },
  { code: 'ml',   label: 'ml' },
  { code: 'l',    label: 'l' },
];

const TO_UNITS = [
  { code: 'g',    label: 'g' },
  { code: 'oz',   label: 'oz' },
  { code: 'kg',   label: 'kg' },
  { code: 'lb',   label: 'lb' },
  { code: 'ml',   label: 'ml' },
  { code: 'cup',  label: 'cup' },
  { code: 'tbsp', label: 'tbsp' },
  { code: 'tsp',  label: 'tsp' },
];

// ─── Fraction formatter for local conversions ────────────────────────────────
const FRACTIONS: [number, string][] = [
  [1/8,  '⅛'], [1/4, '¼'], [1/3, '⅓'], [1/2, '½'],
  [2/3, '⅔'], [3/4, '¾'], [7/8, '⅞'],
];

function toFraction(n: number): string {
  if (n === 0) return '0';
  const whole = Math.floor(n);
  const dec = n - whole;
  if (dec < 0.01) return String(whole);
  // Find closest fraction
  let best: string | null = null;
  let bestDiff = 0.04; // tolerance
  for (const [val, sym] of FRACTIONS) {
    const diff = Math.abs(dec - val);
    if (diff < bestDiff) { bestDiff = diff; best = sym; }
  }
  if (best) return whole > 0 ? `${whole} ${best}` : best;
  // Fallback: use smart rounding
  return n < 1 ? n.toFixed(3).replace(/\.?0+$/, '') : smartRound(n);
}

// Units where fractions make sense (cups, spoons) vs weight/strict-volume units
const FRACTION_UNITS = new Set(['cup', 'tbsp', 'tsp']);

// Smart decimal rounding: <10 → 2dp, <50 → 1dp, ≥50 → integer
function smartRound(n: number): string {
  if (n < 10)  return n.toFixed(2).replace(/\.?0+$/, '');
  if (n < 50)  return n.toFixed(1).replace(/\.?0+$/, '');
  return String(Math.round(n));
}

// Format result_fraction from API: if it's a plain number string apply smartRound,
// otherwise keep as-is (e.g. "1 ½", "⅔")
function fmtFraction(s: string, unit: string): string {
  const n = parseFloat(s);
  if (isNaN(n) || s !== String(n)) return s; // contains fraction symbol — keep as-is
  if (FRACTION_UNITS.has(unit)) return toFraction(n);
  return n < 1 ? n.toFixed(3).replace(/\.?0+$/, '') : smartRound(n);
}

// Format a value: use fractions for cup/tbsp/tsp, smart decimal for everything else
function fmtUnit(n: number, unit: string): string {
  if (FRACTION_UNITS.has(unit)) return toFraction(n);
  if (n < 1) return n.toFixed(3).replace(/\.?0+$/, '');
  return smartRound(n);
}
const MASS_TO_G: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.3495, lb: 453.592,
};
const VOL_TO_ML: Record<string, number> = {
  ml: 1, l: 1000, cup: 236.588, tbsp: 14.7868, tsp: 4.92892,
};

function localConvert(val: number, from: string, to: string): number | null {
  if (MASS_TO_G[from] !== undefined && MASS_TO_G[to] !== undefined) {
    return (val * MASS_TO_G[from]) / MASS_TO_G[to];
  }
  if (VOL_TO_ML[from] !== undefined && VOL_TO_ML[to] !== undefined) {
    return (val * VOL_TO_ML[from]) / VOL_TO_ML[to];
  }
  return null; // cross-type (mass↔volume) — needs density, use API
}

function needsDensity(from: string, to: string): boolean {
  const fromMass = from in MASS_TO_G;
  const fromVol  = from in VOL_TO_ML;
  const toMass   = to   in MASS_TO_G;
  const toVol    = to   in VOL_TO_ML;
  return (fromMass && toVol) || (fromVol && toMass);
}

// Build full equivalents table: all mass units + volume units (if density known)
// resultGrams — result already in grams; densityGPerMl — optional for volume
function buildAllEquivalents(
  resultGrams: number,
  densityGPerMl: number | null,
  excludeCode: string,          // hide the "to" unit — it's already the main result
): Record<string, number> {
  const eq: Record<string, number> = {};
  // All mass units
  for (const [code, factor] of Object.entries(MASS_TO_G)) {
    if (code === excludeCode) continue;
    eq[code] = resultGrams / factor;
  }
  // All volume units — only if density is known
  if (densityGPerMl && densityGPerMl > 0) {
    const resultMl = resultGrams / densityGPerMl;
    for (const [code, factor] of Object.entries(VOL_TO_ML)) {
      if (code === excludeCode) continue;
      eq[code] = resultMl / factor;
    }
  }
  return eq;
}

// ─── Unit label translations ──────────────────────────────────────────────────
const UNIT_LABELS: Record<string, Record<string, string>> = {
  cup:  { en: 'cup',  ru: 'стакан', pl: 'szklanka', uk: 'склянка' },
  tbsp: { en: 'tbsp', ru: 'ст.л.',  pl: 'łyżka',    uk: 'ст.л.'  },
  tsp:  { en: 'tsp',  ru: 'ч.л.',   pl: 'łyżeczka', uk: 'ч.л.'   },
  g:    { en: 'g',    ru: 'г',      pl: 'g',         uk: 'г'      },
  kg:   { en: 'kg',   ru: 'кг',     pl: 'kg',        uk: 'кг'     },
  oz:   { en: 'oz',   ru: 'унц.',   pl: 'uncja',     uk: 'унц.'   },
  lb:   { en: 'lb',   ru: 'фунт',   pl: 'funt',      uk: 'фунт'   },
  ml:   { en: 'ml',   ru: 'мл',     pl: 'ml',        uk: 'мл'     },
  l:    { en: 'l',    ru: 'л',      pl: 'l',         uk: 'л'      },
};

function unitLabel(code: string, locale: string): string {
  return UNIT_LABELS[code]?.[locale] ?? UNIT_LABELS[code]?.en ?? code;
}

// Popular preset queries — fill form on click
const POPULAR_PRESETS: { slug: string; nameEn: string; fromUnit: string; toUnit: string; amount: string }[] = [
  { slug: 'wheat-flour',     nameEn: 'Wheat Flour',  fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
  { slug: 'butter',          nameEn: 'Butter',        fromUnit: 'tbsp', toUnit: 'g',  amount: '1' },
  { slug: 'sugar',           nameEn: 'Sugar',         fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
  { slug: 'rice',            nameEn: 'Rice',          fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
  { slug: 'pasteurized-milk',nameEn: 'Milk',          fromUnit: 'cup',  toUnit: 'ml', amount: '1' },
  { slug: 'olive-oil',       nameEn: 'Olive Oil',     fromUnit: 'tbsp', toUnit: 'g',  amount: '1' },
  { slug: 'honey',           nameEn: 'Honey',         fromUnit: 'tbsp', toUnit: 'g',  amount: '1' },
  { slug: 'oats',            nameEn: 'Oats',          fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
];

// Quick ingredient shortcut chips
const QUICK_SLUGS = [
  'wheat-flour',
  'butter',
  'sugar',
  'rice',
  'pasteurized-milk',
  'olive-oil',
  'honey',
  'oats',
];

// ─── Ingredient combobox ──────────────────────────────────────────────────────

function IngredientCombobox({
  options,
  value,
  onChange,
  placeholder,
  noResults,
}: {
  options: IngredientOption[];
  value: IngredientOption | null;
  onChange: (opt: IngredientOption | null) => void;
  placeholder: string;
  noResults: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.length < 1
    ? options.slice(0, 30)
    : options.filter((o) => {
        const q = query.toLowerCase();
        return (
          o.name.toLowerCase().includes(q) ||
          o.nameEn.toLowerCase().includes(q) ||
          o.slug.includes(q)
        );
      }).slice(0, 20);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (opt: IngredientOption) => {
    onChange(opt);
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={open ? query : (value?.name ?? query)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-8 h-12 sm:h-14 rounded-2xl border-2 border-border/60 bg-muted/30 font-medium text-sm focus-visible:border-primary/60 focus-visible:ring-0"
        />
        {(value || query) && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-background border-2 border-border/60 rounded-2xl shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{noResults}</p>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(opt); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary/5 hover:text-primary transition-colors"
              >
                {opt.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opt.image} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-muted shrink-0" />
                )}
                <span className="font-bold text-sm truncate">{opt.name}</span>
                {opt.nameEn !== opt.name && (
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{opt.nameEn}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Unit select ──────────────────────────────────────────────────────────────

function UnitPicker({
  units,
  value,
  onChange,
  locale,
}: {
  units: { code: string; label: string }[];
  value: string;
  onChange: (code: string) => void;
  locale: string;
}) {
  const current = units.find((u) => u.code === value) ?? units[0];
  const loc = unitLabel(current?.code ?? '', locale);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-12 sm:h-14 px-3 sm:px-4 rounded-2xl border-2 border-border/60 bg-muted/30 font-black text-sm hover:bg-primary/10 hover:border-primary/40 gap-1 min-w-[90px] shrink-0"
        >
          <span className="truncate">{loc}</span>
          <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rounded-2xl max-h-64 overflow-y-auto min-w-[160px]">
        {units.map((u) => {
          const lbl = unitLabel(u.code, locale);
          return (
            <DropdownMenuItem
              key={u.code}
              onSelect={() => onChange(u.code)}
              className={`font-black cursor-pointer gap-2 ${u.code === value ? 'text-primary' : ''}`}
            >
              <span className="flex-1">{lbl}</span>
              {lbl !== u.code && (
                <span className="text-[10px] text-muted-foreground/60 font-medium">{u.code}</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  ingredients: IngredientOption[];
  i18n: I18nIngConverter;
}

export function IngredientConverterClient({ ingredients, i18n }: Props) {
  const locale = useLocale();

  const [ingredient, setIngredient] = useState<IngredientOption | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  // Nutrition per 100g — fetched once when ingredient is selected, used for local calc
  const [baseNutrition, setBaseNutrition] = useState<{
    calories_per_100g: number;
    protein_per_100g: number;
    fat_per_100g: number;
    carbs_per_100g: number;
  } | null>(null);
  const [amount, setAmount]         = useState('1');
  const [fromUnit, setFromUnit]     = useState('cup');
  const [toUnit, setToUnit]         = useState('g');
  const [convertResult, setConvertResult] = useState<ConvertResult>(null);
  const [loading, startTransition]  = useTransition();
  const [error, setError]           = useState(false);
  const [noDensity, setNoDensity]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const numVal = parseFloat(amount.replace(',', '.'));
  const canConvert = ingredient !== null && !isNaN(numVal) && numVal > 0;

  // Helper to find an ingredient option by slug
  const findBySlug = (slug: string) =>
    ingredients.find((o) => o.slug === slug) ?? null;

  // Apply a preset
  const applyPreset = (p: typeof POPULAR_PRESETS[0]) => {
    const opt = findBySlug(p.slug);
    if (!opt) return;
    setIngredient(opt);
    setDescription(null);
    setBaseNutrition(null);
    setAmount(p.amount);
    setFromUnit(p.fromUnit);
    setToUnit(p.toUnit);
    setConvertResult(null);
  };

  const doFetch = useCallback(() => {
    if (!canConvert) {
      setConvertResult(null);
      setError(false);
      setNoDensity(false);
      return;
    }

    // Always call API first — it returns nutrition, density, equivalents
    // Local conversion is only a fallback when API fails (e.g. no density data)
    startTransition(async () => {
      try {
        const url = `/api/ingredient-convert?ingredient=${encodeURIComponent(ingredient!.slug)}&value=${numVal}&from=${encodeURIComponent(fromUnit)}&to=${encodeURIComponent(toUnit)}&lang=${locale}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          // API failed — try local conversion as fallback
          const local = localConvert(numVal, fromUnit, toUnit);
          if (local !== null) {
            const resultGrams = MASS_TO_G[toUnit]
              ? local * MASS_TO_G[toUnit]
              : (MASS_TO_G[fromUnit] ? numVal * MASS_TO_G[fromUnit] : null);

            const nutrition_for_result = (baseNutrition && resultGrams !== null)
              ? {
                  calories: Math.round(baseNutrition.calories_per_100g * resultGrams / 100 * 10) / 10,
                  protein:  Math.round(baseNutrition.protein_per_100g  * resultGrams / 100 * 10) / 10,
                  fat:      Math.round(baseNutrition.fat_per_100g      * resultGrams / 100 * 10) / 10,
                  carbs:    Math.round(baseNutrition.carbs_per_100g    * resultGrams / 100 * 10) / 10,
                }
              : null;

            setConvertResult({
              result: local,
              result_fraction: fmtUnit(local, toUnit),
              from_label: fromUnit,
              to_label: toUnit,
              to_label_short: toUnit,
              density_g_per_ml: null,
              equivalents: {},
              nutrition_for_result,
            });
            setNoDensity(false);
            setError(false);
          } else {
            setConvertResult(null);
            setNoDensity(data?.noDensity === true);
            setError(!data?.noDensity);
          }
          return;
        }

        setConvertResult(data);
        setError(false);
        setNoDensity(false);
      } catch {
        // Network error — try local as last resort
        const local = localConvert(numVal, fromUnit, toUnit);
        if (local !== null) {
          const resultGrams = MASS_TO_G[toUnit]
            ? local * MASS_TO_G[toUnit]
            : (MASS_TO_G[fromUnit] ? numVal * MASS_TO_G[fromUnit] : null);
          const nutrition_for_result = (baseNutrition && resultGrams !== null)
            ? {
                calories: Math.round(baseNutrition.calories_per_100g * resultGrams / 100 * 10) / 10,
                protein:  Math.round(baseNutrition.protein_per_100g  * resultGrams / 100 * 10) / 10,
                fat:      Math.round(baseNutrition.fat_per_100g      * resultGrams / 100 * 10) / 10,
                carbs:    Math.round(baseNutrition.carbs_per_100g    * resultGrams / 100 * 10) / 10,
              }
            : null;
          setConvertResult({
            result: local,
            result_fraction: fmtUnit(local, toUnit),
            from_label: fromUnit,
            to_label: toUnit,
            to_label_short: toUnit,
            density_g_per_ml: null,
            equivalents: {},
            nutrition_for_result,
          });
          setError(false);
        } else {
          setError(true);
          setNoDensity(false);
          setConvertResult(null);
        }
      }
    });
  }, [canConvert, ingredient, numVal, fromUnit, toUnit, locale]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doFetch, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [doFetch]);

  // Fetch description + base nutrition when ingredient is selected
  useEffect(() => {
    if (!ingredient) { setDescription(null); setBaseNutrition(null); return; }
    fetch(`/api/ingredients/${ingredient.slug}?lang=${locale}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setDescription(data.description || null);
          setBaseNutrition(data.nutrition || null);
        }
      })
      .catch(() => {});
  }, [ingredient, locale]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 3 : 2,
    }).format(n);

  const targetValue = convertResult?.result ?? null;
  const nutrition   = convertResult?.nutrition_for_result ?? null;
  const density     = convertResult?.density_g_per_ml ?? null;
  const fromLabel   = unitLabel(fromUnit, locale);
  const toLabel     = unitLabel(toUnit, locale);

  // Full equivalents: result in grams → all mass units + volume units (if density known)
  const allEquivalents: Record<string, number> | null = (() => {
    if (!convertResult || targetValue == null) return null;
    // Find result in grams
    let resultGrams: number | null = null;
    if (toUnit in MASS_TO_G) {
      resultGrams = targetValue * MASS_TO_G[toUnit];
    } else if (density && toUnit in VOL_TO_ML) {
      const resultMl = targetValue * VOL_TO_ML[toUnit];
      resultGrams = resultMl * density;
    }
    if (resultGrams == null || resultGrams <= 0) return null;
    return buildAllEquivalents(resultGrams, density, toUnit);
  })();

  return (
    <div className="border-2 border-border/60 rounded-3xl p-5 sm:p-8 bg-background space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-black uppercase tracking-widest text-foreground italic">
          {i18n.title}<span className="text-primary">.</span>
        </h2>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          {i18n.description}
        </p>
      </div>

      {/* Quick ingredient chips */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
          {i18n.quickIngredients}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SLUGS.map((slug) => {
            const opt = findBySlug(slug);
            if (!opt) return null;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => {
                  setIngredient(opt);
                  setDescription(null);
                  setConvertResult(null);
                }}
                className={`text-[11px] font-black px-3 py-1.5 rounded-full border transition-all ${
                  ingredient?.slug === slug
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 hover:border-primary/40 hover:text-primary text-muted-foreground hover:bg-primary/5'
                }`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Preview: photo + description */}
      {ingredient && (
        <div className="flex items-start gap-4 bg-muted/20 border border-border/40 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40">
            {ingredient.image ? (
              <Image
                src={ingredient.image}
                alt={ingredient.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate">
              {ingredient.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 mb-2">
              {ingredient.nameEn}
            </p>
            {description ? (
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 border-l-2 border-primary/30 pl-2 italic">
                {description}
              </p>
            ) : (
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            )}
          </div>
        </div>
      )}

      {/* Row 1: amount + from unit + ingredient */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw !== '' && !/^[\d]*[.,]?[\d]*$/.test(raw)) return;
            setAmount(raw);
            setConvertResult(null);
          }}
          placeholder={i18n.valuePlaceholder}
          className="h-12 sm:h-14 w-24 sm:w-28 shrink-0 rounded-2xl border-2 border-border/60 bg-muted/30 font-black text-lg sm:text-xl focus-visible:border-primary/60 focus-visible:ring-0 px-4 placeholder:font-medium placeholder:text-muted-foreground/50"
        />
        <UnitPicker units={FROM_UNITS} value={fromUnit} onChange={(c) => { setFromUnit(c); setConvertResult(null); }} locale={locale} />
        <IngredientCombobox
          options={ingredients}
          value={ingredient}
          onChange={(opt) => { setIngredient(opt); setDescription(null); setBaseNutrition(null); setConvertResult(null); }}
          placeholder={i18n.ingredientPlaceholder}
          noResults={i18n.searchNoResults}
        />
      </div>

      {/* Row 2: arrow + to unit + result box */}
      <div className="flex items-center gap-3">
        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
        <UnitPicker units={TO_UNITS} value={toUnit} onChange={(c) => { setToUnit(c); setConvertResult(null); }} locale={locale} />
        <div
          aria-live="polite"
          className={`flex-1 h-12 sm:h-14 px-4 rounded-2xl border-2 flex items-center transition-colors min-w-0 ${
            error
              ? 'border-orange-400/40 bg-orange-500/5'
              : noDensity
              ? 'border-yellow-400/40 bg-yellow-500/5'
              : loading
              ? 'border-border/60 bg-muted/20'
              : targetValue != null
              ? 'border-primary/40 bg-primary/5'
              : 'border-border/40 bg-muted/10'
          }`}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : !ingredient ? (
            <span className="text-sm text-muted-foreground/50 font-medium">{i18n.noIngredient}</span>
          ) : noDensity ? (
            <span className="text-[11px] text-yellow-600 font-bold leading-tight">
              {locale === 'ru' ? '⚠ Нет плотности — используйте г, кг, унц.' :
               locale === 'pl' ? '⚠ Brak gęstości — użyj g, kg, oz' :
               locale === 'uk' ? '⚠ Немає густини — використайте г, кг' :
               '⚠ No density — use g, kg, oz'}
            </span>
          ) : error ? (
            <span className="text-sm text-orange-500 font-medium">{i18n.noResult}</span>
          ) : targetValue != null ? (
            <span className="font-black text-lg sm:text-2xl text-primary truncate">
              {fmtFraction(convertResult!.result_fraction, toUnit)}{' '}
              <span className="text-sm font-black text-primary/70">{toLabel}</span>
            </span>
          ) : (
            <span className="font-black text-2xl text-muted-foreground/40">—</span>
          )}
        </div>
      </div>

      {/* Results section */}
      {targetValue != null && ingredient && !loading && convertResult && (
        <div className="space-y-4 pt-1">

          {/* Equation line */}
          <p className="text-sm text-muted-foreground font-medium">
            {amount} {fromLabel}{' '}
            <span className="text-foreground font-black">{ingredient.name}</span>
            {' = '}
            <span className="text-primary font-black">{fmtFraction(convertResult.result_fraction, toUnit)} {toLabel}</span>
          </p>

          {/* All equivalents — mass group + volume group */}
          {allEquivalents && Object.keys(allEquivalents).length > 0 && (() => {
            const massUnits = ['g', 'kg', 'oz', 'lb'].filter((u) => u in allEquivalents);
            const volUnits  = ['ml', 'l', 'cup', 'tbsp', 'tsp'].filter((u) => u in allEquivalents);
            const renderBtn = (unit: string) => (
              <button
                key={unit}
                type="button"
                onClick={() => { setToUnit(unit); setConvertResult(null); }}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                  unit === toUnit
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 hover:border-primary/40 hover:text-primary text-muted-foreground'
                }`}
              >
                {fmtUnit(allEquivalents[unit], unit)} {unitLabel(unit, locale)}
              </button>
            );
            return (
              <div className="space-y-2">
                {massUnits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 w-full sm:w-auto">
                      ⚖ {i18n.allUnits}:
                    </span>
                    {massUnits.map(renderBtn)}
                  </div>
                )}
                {volUnits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 w-full sm:w-auto">
                      🥄 {i18n.allUnits}:
                    </span>
                    {volUnits.map(renderBtn)}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Nutrition block — from API, already scaled to the result */}
          {nutrition && (
            <div className="rounded-2xl border-2 border-border/40 bg-muted/20 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                {i18n.nutritionResult}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{Math.round(nutrition.calories)}</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{i18n.kcal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Beef className="h-4 w-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{nutrition.protein} g</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{i18n.protein}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{nutrition.fat} g</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{i18n.fat}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{nutrition.carbs} g</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{i18n.carbs}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Density badge */}
          {density != null && (
            <p className="text-[10px] text-muted-foreground/60 font-medium">
              {i18n.density} <span className="text-foreground font-black">{ingredient.name}</span>:
              {' ≈ '}<span className="text-foreground font-black">{fmt(density)} g/ml</span>
            </p>
          )}
        </div>
      )}

      {/* Popular queries presets */}
      <div className="pt-3 border-t border-border/30 space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-primary" />
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
            {i18n.popularQueries}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POPULAR_PRESETS.map((p) => {
            const opt = findBySlug(p.slug);
            if (!opt) return null;
            return (
              <button
                key={`${p.slug}-${p.fromUnit}`}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left text-[10px] font-bold text-muted-foreground border border-border/50 rounded-xl px-3 py-2 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all leading-snug"
              >
                {p.amount} {unitLabel(p.fromUnit, locale)}{' '}
                <span className="font-black text-foreground/80">{opt.name}</span>
                {' → '}{unitLabel(p.toUnit, locale)}
                <ExternalLink className="inline ml-1 h-2.5 w-2.5 opacity-40" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
