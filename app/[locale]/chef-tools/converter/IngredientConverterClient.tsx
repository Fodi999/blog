'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { Search, X, Flame, Beef, Droplets, Wheat, ArrowRight, Zap, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  microtrust: string;
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
  { code: 'cup', label: 'cup' },
  { code: 'tbsp', label: 'tbsp' },
  { code: 'tsp', label: 'tsp' },
  { code: 'g', label: 'g' },
  { code: 'kg', label: 'kg' },
  { code: 'oz', label: 'oz' },
  { code: 'ml', label: 'ml' },
  { code: 'l', label: 'l' },
];

const TO_UNITS = [
  { code: 'g', label: 'g' },
  { code: 'oz', label: 'oz' },
  { code: 'kg', label: 'kg' },
  { code: 'lb', label: 'lb' },
  { code: 'ml', label: 'ml' },
  { code: 'cup', label: 'cup' },
  { code: 'tbsp', label: 'tbsp' },
  { code: 'tsp', label: 'tsp' },
];

// ─── Fraction formatter for local conversions ────────────────────────────────
const FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'],
  [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
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
  if (n < 10) return n.toFixed(2).replace(/\.?0+$/, '');
  if (n < 50) return n.toFixed(1).replace(/\.?0+$/, '');
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
  const fromVol = from in VOL_TO_ML;
  const toMass = to in MASS_TO_G;
  const toVol = to in VOL_TO_ML;
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
  cup: { en: 'cup', ru: 'стакан', pl: 'szklanka', uk: 'склянка' },
  tbsp: { en: 'tbsp', ru: 'ст.л.', pl: 'łyżka', uk: 'ст.л.' },
  tsp: { en: 'tsp', ru: 'ч.л.', pl: 'łyżeczka', uk: 'ч.л.' },
  g: { en: 'g', ru: 'г', pl: 'g', uk: 'г' },
  kg: { en: 'kg', ru: 'кг', pl: 'kg', uk: 'кг' },
  oz: { en: 'oz', ru: 'унц.', pl: 'uncja', uk: 'унц.' },
  lb: { en: 'lb', ru: 'фунт', pl: 'funt', uk: 'фунт' },
  ml: { en: 'ml', ru: 'мл', pl: 'ml', uk: 'мл' },
  l: { en: 'l', ru: 'л', pl: 'l', uk: 'л' },
};

function unitLabel(code: string, locale: string): string {
  return UNIT_LABELS[code]?.[locale] ?? UNIT_LABELS[code]?.en ?? code;
}

// Popular preset queries — fill form on click
const POPULAR_PRESETS: { slug: string; nameEn: string; fromUnit: string; toUnit: string; amount: string }[] = [
  { slug: 'wheat-flour', nameEn: 'Wheat Flour', fromUnit: 'cup', toUnit: 'g', amount: '1' },
  { slug: 'butter', nameEn: 'Butter', fromUnit: 'tbsp', toUnit: 'g', amount: '1' },
  { slug: 'sugar', nameEn: 'Sugar', fromUnit: 'cup', toUnit: 'g', amount: '1' },
  { slug: 'rice', nameEn: 'Rice', fromUnit: 'cup', toUnit: 'g', amount: '1' },
  { slug: 'olive-oil', nameEn: 'Olive Oil', fromUnit: 'tbsp', toUnit: 'g', amount: '1' },
  { slug: 'honey', nameEn: 'Honey', fromUnit: 'tbsp', toUnit: 'g', amount: '1' },
];

// Quick ingredient shortcut chips
const QUICK_SLUGS = [
  'wheat-flour',
  'butter',
  'sugar',
  'rice',
  'olive-oil',
  'honey',
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
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={open ? query : (value?.name ?? query)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 sm:pl-10 pr-8 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-border/60 bg-muted/30 font-medium text-sm focus-visible:border-primary/60 focus-visible:ring-0 w-full"
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
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-xl border-0 bg-primary/10 text-primary font-black text-xs px-3 min-w-[70px] shrink-0 focus:ring-0 hover:bg-primary/20 transition-colors uppercase">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-2 border-border/60 shadow-xl">
        {units.map((u) => (
          <SelectItem key={u.code} value={u.code} className="font-black text-sm cursor-pointer">
            {unitLabel(u.code, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  const [amount, setAmount] = useState('1');
  const [fromUnit, setFromUnit] = useState('cup');
  const [toUnit, setToUnit] = useState('g');
  const [convertResult, setConvertResult] = useState<ConvertResult>(null);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const [noDensity, setNoDensity] = useState(false);
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
                protein: Math.round(baseNutrition.protein_per_100g * resultGrams / 100 * 10) / 10,
                fat: Math.round(baseNutrition.fat_per_100g * resultGrams / 100 * 10) / 10,
                carbs: Math.round(baseNutrition.carbs_per_100g * resultGrams / 100 * 10) / 10,
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
              protein: Math.round(baseNutrition.protein_per_100g * resultGrams / 100 * 10) / 10,
              fat: Math.round(baseNutrition.fat_per_100g * resultGrams / 100 * 10) / 10,
              carbs: Math.round(baseNutrition.carbs_per_100g * resultGrams / 100 * 10) / 10,
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
      .catch(() => { });
  }, [ingredient, locale]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 3 : 2,
    }).format(n);

  const targetValue = convertResult?.result ?? null;
  const nutrition = convertResult?.nutrition_for_result ?? null;
  const density = convertResult?.density_g_per_ml ?? null;
  const fromLabel = unitLabel(fromUnit, locale);
  const toLabel = unitLabel(toUnit, locale);

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
    <Card className="border-2 border-border/60 rounded-3xl shadow-sm hover:shadow-lg transition-shadow">
      <CardContent className="p-4 sm:p-6 md:p-10 space-y-5 sm:space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
            {i18n.title}<span className="text-primary">.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1.5 sm:mt-2 leading-relaxed max-w-xl">
            {locale === 'ru' 
              ? '1 стакан муки в граммах? 2 ст.л. масла в унциях? Выберите ингредиент и единицы — конвертер учитывает реальную плотность продукта.'
              : i18n.description}
          </p>
        </div>

        {/* Quick ingredient chips */}
        <div className="space-y-2 sm:space-y-3">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground/60">
            {locale === 'ru' ? 'Быстрый выбор' : i18n.quickIngredients}
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-full border-2 transition-all font-bold ${ingredient?.slug === slug
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                      : 'bg-muted/30 border-border/40 hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-foreground/80'
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
          <div className="flex items-start gap-3 sm:gap-4 bg-muted/20 border border-border/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-lg sm:rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40">
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
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-foreground truncate">
                {ingredient.name}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 mb-1.5 sm:mb-2">
                {ingredient.nameEn}
              </p>
              {description ? (
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3 border-l-2 border-primary/30 pl-2 italic">
                  {description}
                </p>
              ) : (
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              )}
            </div>
          </div>
        )}

        {/* Row 1: ingredient combobox — full width */}
        <div className="space-y-2">
          <IngredientCombobox
            options={ingredients}
            value={ingredient}
            onChange={(opt) => { setIngredient(opt); setDescription(null); setBaseNutrition(null); setConvertResult(null); }}
            placeholder={locale === 'ru' ? 'напр.: мука, сахар, рис, масло...' : i18n.ingredientPlaceholder}
            noResults={i18n.searchNoResults}
          />
        </div>

        {/* Row 2: amount + from-unit → arrow → to-unit → result */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
          {/* Input + from unit */}
          <div className="relative flex-1">
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
              className="h-12 sm:h-14 w-full rounded-xl sm:rounded-2xl border-2 border-border/60 bg-muted/30 font-black text-lg sm:text-xl focus-visible:border-primary/60 focus-visible:ring-0 pl-4 pr-20 sm:pr-16 placeholder:font-medium placeholder:text-muted-foreground/30"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <UnitPicker units={FROM_UNITS} value={fromUnit} onChange={(c) => { setFromUnit(c); setConvertResult(null); }} locale={locale} />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center shrink-0 py-0.5 sm:py-0">
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/40 rotate-90 sm:rotate-0" />
          </div>

          {/* Result + to unit */}
          <div className="relative flex-1">
            <div
              aria-live="polite"
              className={`h-12 sm:h-14 w-full px-4 pr-20 sm:pr-16 rounded-xl sm:rounded-2xl border-2 flex items-center transition-colors min-w-0 ${error
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : !ingredient ? (
                <span className="text-[9px] sm:text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tight leading-tight">
                  {locale === 'ru' ? 'Выберите ингредиент' : i18n.noIngredient}
                </span>
              ) : noDensity ? (
                <span className="text-[9px] sm:text-[10px] text-yellow-600 font-bold leading-tight line-clamp-2">
                  {locale === 'ru' ? '⚠ Нет плотности' : '⚠ No density'}
                </span>
              ) : error ? (
                <span className="text-[10px] sm:text-xs text-orange-500 font-medium line-clamp-2">{i18n.noResult}</span>
              ) : targetValue != null ? (
                <span className="font-black text-lg sm:text-xl text-primary truncate">
                  {fmtFraction(convertResult!.result_fraction, toUnit)}
                </span>
              ) : (
                <span className="font-black text-lg sm:text-xl text-muted-foreground/20">—</span>
              )}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <UnitPicker units={TO_UNITS} value={toUnit} onChange={(c) => { setToUnit(c); setConvertResult(null); }} locale={locale} />
            </div>
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
              const volUnits = ['ml', 'l', 'cup', 'tbsp', 'tsp'].filter((u) => u in allEquivalents);
              const renderBtn = (unit: string) => (
                <Badge
                  key={unit}
                  variant={unit === toUnit ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px] font-black px-2.5 py-1 h-auto rounded-full transition-all hover:scale-105"
                  onClick={() => { setToUnit(unit); setConvertResult(null); }}
                >
                  {fmtUnit(allEquivalents[unit], unit)} {unitLabel(unit, locale)}
                </Badge>
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

            {/* Nutrition block */}
            {nutrition && (
              <Card className="border-2 border-border/40">
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                    {i18n.nutritionResult}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-black text-foreground">{Math.round(nutrition.calories)}</p>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium">{i18n.kcal}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Beef className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-black text-foreground">{nutrition.protein} g</p>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium">{i18n.protein}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-black text-foreground">{nutrition.fat} g</p>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium">{i18n.fat}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Wheat className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm font-black text-foreground">{nutrition.carbs} g</p>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium">{i18n.carbs}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Density badge */}
            {density != null && (
              <p className="text-[10px] text-muted-foreground/60 font-medium">
                {i18n.density} <span className="text-foreground font-black">{ingredient.name}</span>:
                {' ≈ '}<span className="text-foreground font-black">{fmt(density)} g/ml</span>
              </p>
            )}

            {/* Micro-trust line */}
            <Separator className="mt-1" />
            <p className="text-[10px] text-muted-foreground/50 font-medium text-center pt-1">
              🔬 {i18n.microtrust}
            </p>
          </div>
        )}

        {/* Popular queries presets */}
        <div className="space-y-3 sm:space-y-4">
          <Separator />
          <div className="flex items-center gap-2 pt-1">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-muted-foreground/70">
              {locale === 'ru' ? 'Популярные конвертации' : i18n.popularQueries}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {POPULAR_PRESETS.map((p) => {
              const opt = findBySlug(p.slug);
              if (!opt) return null;
              return (
                <button
                  key={`${p.slug}-${p.fromUnit}`}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="text-left text-[11px] sm:text-xs font-bold rounded-xl sm:rounded-2xl border-2 border-border/40 bg-background hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.02] shadow-sm transition-all px-3 py-2.5 sm:px-4 sm:py-3 leading-snug group"
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">{p.amount} {unitLabel(p.fromUnit, locale)} </span>
                  <span className="font-black text-foreground group-hover:text-primary transition-colors">{opt.name}</span>
                  <span className="text-muted-foreground group-hover:text-primary transition-colors"> → {unitLabel(p.toUnit, locale)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
