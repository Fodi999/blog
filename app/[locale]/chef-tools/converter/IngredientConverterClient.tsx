'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Search, X, Flame, Beef, Droplets, Wheat, ArrowRight, ChevronDown, Zap, ExternalLink } from 'lucide-react';
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

type Equivalent = { unit: string; label: string; value: number };
type NutritionData = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
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

// Popular preset queries — fill form on click
const POPULAR_PRESETS: { slug: string; nameEn: string; fromUnit: string; toUnit: string; amount: string }[] = [
  { slug: 'wheat-flour',  nameEn: 'Wheat Flour',   fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
  { slug: 'butter',       nameEn: 'Butter',         fromUnit: 'tbsp', toUnit: 'g',  amount: '1' },
  { slug: 'white-rice',   nameEn: 'White Rice',     fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
  { slug: 'white-sugar',  nameEn: 'White Sugar',    fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
  { slug: 'milk',         nameEn: 'Milk',           fromUnit: 'cup',  toUnit: 'ml', amount: '1' },
  { slug: 'olive-oil',    nameEn: 'Olive Oil',      fromUnit: 'tbsp', toUnit: 'g',  amount: '1' },
  { slug: 'honey',        nameEn: 'Honey',          fromUnit: 'tbsp', toUnit: 'g',  amount: '1' },
  { slug: 'oats',         nameEn: 'Oats',           fromUnit: 'cup',  toUnit: 'g',  amount: '1' },
];

// Quick ingredient shortcut chips
const QUICK_SLUGS = [
  'wheat-flour',
  'butter',
  'white-rice',
  'white-sugar',
  'milk',
  'olive-oil',
  'honey',
  'salt',
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
}: {
  units: { code: string; label: string }[];
  value: string;
  onChange: (code: string) => void;
}) {
  const current = units.find((u) => u.code === value) ?? units[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-12 sm:h-14 px-3 sm:px-4 rounded-2xl border-2 border-border/60 bg-muted/30 font-black text-sm hover:bg-primary/10 hover:border-primary/40 gap-1 min-w-[80px] shrink-0"
        >
          {current?.label}
          <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rounded-2xl max-h-64 overflow-y-auto">
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

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  ingredients: IngredientOption[];
  i18n: I18nIngConverter;
}

export function IngredientConverterClient({ ingredients, i18n }: Props) {
  const locale = useLocale();

  const [ingredient, setIngredient] = useState<IngredientOption | null>(null);
  const [amount, setAmount]         = useState('1');
  const [fromUnit, setFromUnit]     = useState('cup');
  const [toUnit, setToUnit]         = useState('g');
  const [equivalents, setEquivalents] = useState<Equivalent[] | null>(null);
  const [nutrition100g, setNutrition100g] = useState<NutritionData>(null);
  const [loading, startTransition]  = useTransition();
  const [error, setError]           = useState(false);
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
    setAmount(p.amount);
    setFromUnit(p.fromUnit);
    setToUnit(p.toUnit);
    setEquivalents(null);
    setNutrition100g(null);
  };

  const doFetch = useCallback(() => {
    if (!canConvert) {
      setEquivalents(null);
      setNutrition100g(null);
      setError(false);
      return;
    }
    startTransition(async () => {
      try {
        const eqUrl = `/api/analyzer/equivalents?name=${encodeURIComponent(ingredient!.slug)}&value=${numVal}&unit=${encodeURIComponent(fromUnit)}&lang=${locale}`;
        const [eqRes, nRes] = await Promise.all([
          fetch(eqUrl),
          fetch(`/api/analyzer/nutrition?name=${encodeURIComponent(ingredient!.slug)}&amount=100&lang=${locale}`),
        ]);

        if (!eqRes.ok) { setError(true); setEquivalents(null); return; }
        const eqData = await eqRes.json() as { name: string; equivalents: Equivalent[] };
        setEquivalents(eqData.equivalents ?? []);
        setError(false);

        if (nRes.ok) {
          const nData = await nRes.json();
          // AnalyzerNutrition shape: per_100g.{calories, protein_g, fat_g, carbs_g}
          if (nData?.per_100g) {
            setNutrition100g({
              calories: nData.per_100g.calories     ?? 0,
              protein:  nData.per_100g.protein_g    ?? 0,
              fat:      nData.per_100g.fat_g         ?? 0,
              carbs:    nData.per_100g.carbs_g       ?? 0,
            });
          } else {
            setNutrition100g(null);
          }
        }
      } catch {
        setError(true);
        setEquivalents(null);
      }
    });
  }, [canConvert, ingredient, numVal, fromUnit, locale]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doFetch, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [doFetch]);

  // Target result
  const targetEq    = equivalents?.find((e) => e.unit === toUnit);
  const targetValue = targetEq?.value;

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 3 : 2,
    }).format(n);

  // Derive density from equivalents: g_value / ml_value
  const density = (() => {
    if (!equivalents) return null;
    const gEq  = equivalents.find((e) => e.unit === 'g');
    const mlEq = equivalents.find((e) => e.unit === 'ml');
    if (!gEq || !mlEq || mlEq.value === 0) return null;
    return gEq.value / mlEq.value;
  })();

  // Scaled nutrition: calculate grams in target unit, scale per 100g
  const scaledNutrition = (() => {
    if (!nutrition100g) return null;
    // Best: get gram equivalent for target value
    const gEq = equivalents?.find((e) => e.unit === 'g');
    const grams = gEq?.value ?? (toUnit === 'g' ? targetValue : null);
    if (!grams) return null;
    const factor = grams / 100;
    return {
      grams: Math.round(grams * 10) / 10,
      calories: Math.round(nutrition100g.calories * factor),
      protein:  Math.round(nutrition100g.protein  * factor * 10) / 10,
      fat:      Math.round(nutrition100g.fat       * factor * 10) / 10,
      carbs:    Math.round(nutrition100g.carbs     * factor * 10) / 10,
    };
  })();

  const fromLabel = FROM_UNITS.find(u => u.code === fromUnit)?.label ?? fromUnit;
  const toLabel   = TO_UNITS.find(u => u.code === toUnit)?.label   ?? toUnit;

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
                  setEquivalents(null);
                  setNutrition100g(null);
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
            setEquivalents(null);
          }}
          placeholder={i18n.valuePlaceholder}
          className="h-12 sm:h-14 w-24 sm:w-28 shrink-0 rounded-2xl border-2 border-border/60 bg-muted/30 font-black text-lg sm:text-xl focus-visible:border-primary/60 focus-visible:ring-0 px-4 placeholder:font-medium placeholder:text-muted-foreground/50"
        />
        <UnitPicker units={FROM_UNITS} value={fromUnit} onChange={(c) => { setFromUnit(c); setEquivalents(null); }} />
        <IngredientCombobox
          options={ingredients}
          value={ingredient}
          onChange={(opt) => { setIngredient(opt); setEquivalents(null); setNutrition100g(null); }}
          placeholder={i18n.ingredientPlaceholder}
          noResults={i18n.searchNoResults}
        />
      </div>

      {/* Row 2: arrow + to unit + result box */}
      <div className="flex items-center gap-3">
        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
        <UnitPicker units={TO_UNITS} value={toUnit} onChange={setToUnit} />
        <div
          aria-live="polite"
          className={`flex-1 h-12 sm:h-14 px-4 rounded-2xl border-2 flex items-center transition-colors min-w-0 ${
            error
              ? 'border-orange-400/40 bg-orange-500/5'
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
          ) : error ? (
            <span className="text-sm text-orange-500 font-medium">{i18n.noResult}</span>
          ) : targetValue != null ? (
            <span className="font-black text-lg sm:text-2xl text-primary truncate">
              {fmt(targetValue)}{' '}
              <span className="text-sm font-black text-primary/70">{toLabel}</span>
            </span>
          ) : (
            <span className="font-black text-2xl text-muted-foreground/40">—</span>
          )}
        </div>
      </div>

      {/* Results section */}
      {targetValue != null && ingredient && !loading && (
        <div className="space-y-4 pt-1">

          {/* Equation line */}
          <p className="text-sm text-muted-foreground font-medium">
            {amount} {fromLabel}{' '}
            <span className="text-foreground font-black">{ingredient.name}</span>
            {' = '}
            <span className="text-primary font-black">{fmt(targetValue)} {toLabel}</span>
          </p>

          {/* All equivalents chips */}
          {equivalents && equivalents.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                {i18n.allUnits}:
              </span>
              {equivalents.map((eq) => (
                <button
                  key={eq.unit}
                  type="button"
                  onClick={() => setToUnit(eq.unit)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                    eq.unit === toUnit
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:border-primary/40 hover:text-primary text-muted-foreground'
                  }`}
                >
                  {fmt(eq.value)} {eq.label}
                </button>
              ))}
            </div>
          )}

          {/* Nutrition block — scaled to actual grams */}
          {scaledNutrition && (
            <div className="rounded-2xl border-2 border-border/40 bg-muted/20 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                {i18n.nutritionResult} ({scaledNutrition.grams} g {ingredient.name})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{scaledNutrition.calories}</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{i18n.kcal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Beef className="h-4 w-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{scaledNutrition.protein} g</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{i18n.protein}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{scaledNutrition.fat} g</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{i18n.fat}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">{scaledNutrition.carbs} g</p>
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
                {p.amount} {p.fromUnit}{' '}
                <span className="font-black text-foreground/80">{opt.name}</span>
                {' → '}{p.toUnit}
                <ExternalLink className="inline ml-1 h-2.5 w-2.5 opacity-40" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

