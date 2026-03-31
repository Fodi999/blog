'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Loader2, ArrowRight, LayoutGrid, Search } from 'lucide-react';
import { fetchIngredientsList, type IngredientListItem } from '@/lib/tools';

/* ── All known product_type values from backend ─────────────── */
const ALL_CATEGORIES = [
  'fish', 'seafood', 'meat', 'dairy',
  'vegetable', 'fruit', 'grain', 'legume',
  'nut', 'spice', 'other',
] as const;

/* ── Health status logic ────────────────────────────────────── */
type HealthStatus = 'healthy' | 'moderate' | 'caution';

function getHealthStatus(protein: number, fat: number, calories: number): HealthStatus {
  if (fat > 20 || calories > 250) return 'caution';
  if (protein > 15 && fat < 10)   return 'healthy';
  return 'moderate';
}

const healthConfig: Record<HealthStatus, {
  emoji: string;
  cardBg: string;
  badgeBg: string;
  badgeText: string;
}> = {
  healthy:  {
    emoji:     '🟢',
    cardBg:    'bg-green-50/60 dark:bg-green-950/20 border-green-200/70 dark:border-green-800/40',
    badgeBg:   'bg-green-100 dark:bg-green-900/40',
    badgeText: 'text-green-700 dark:text-green-400',
  },
  moderate: {
    emoji:     '🟡',
    cardBg:    'bg-yellow-50/60 dark:bg-yellow-950/20 border-yellow-200/70 dark:border-yellow-800/40',
    badgeBg:   'bg-yellow-100 dark:bg-yellow-900/40',
    badgeText: 'text-yellow-700 dark:text-yellow-500',
  },
  caution:  {
    emoji:     '🔴',
    cardBg:    'bg-red-50/60 dark:bg-red-950/20 border-red-200/70 dark:border-red-800/40',
    badgeBg:   'bg-red-100 dark:bg-red-900/40',
    badgeText: 'text-red-700 dark:text-red-400',
  },
};

/* ── Macro bar tiny component ───────────────────────────────── */
function MacroBar({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const total = protein + fat + carbs || 1;
  const pPct = (protein / total) * 100;
  const fPct = (fat / total) * 100;
  const cPct = (carbs / total) * 100;

  return (
    <div className="flex h-1 gap-0.5 w-full rounded-full overflow-hidden bg-muted/10 my-2">
      <div className="bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ width: `${pPct}%` }} />
      <div className="bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]" style={{ width: `${fPct}%` }} />
      <div className="bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${cPct}%` }} />
    </div>
  );
}

/* ── Types ──────────────────────────────────────────────────── */
type IngredientGridProps = {
  onSelect: (slug: string, name: string, image?: string | null) => void;
  /** Slug of the currently selected ingredient — highlighted in the grid */
  activeSlug?: string;
  /** When true, render compact single-column list instead of full grid cards */
  compact?: boolean;
};

/* ── Component ──────────────────────────────────────────────── */
export function IngredientGrid({ onSelect, activeSlug, compact }: IngredientGridProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  const [items, setItems] = useState<IngredientListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /* Debounce search input to avoid rapid requests */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      let cancelled = false;
      setLoading(true);
      fetchIngredientsList(
        locale,
        48,
        0,
        filter || undefined,
        activeCategory || undefined,
      ).then((data) => {
        if (!cancelled && data) {
          setItems(data.items);
          setTotal(data.total);
        }
      }).finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, filter ? 300 : 0);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [locale, filter, activeCategory]);

  const catLabel = (cat: string) => {
    try { return t(`categories.${cat}` as any); } catch { return cat; }
  };

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shadow-inner">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-foreground italic leading-none text-shimmer pr-6">
              {t('ingredients')}
            </h2>
            {!loading && total > 0 && (
              <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] italic ml-1 mt-1">
                {total} {t('ingredientsTotal')}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/chef-tools/ingredients"
          className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-white transition-all italic flex items-center gap-2 group/link"
        >
          {t('viewAll')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>

      {/* Search + category chips */}
      <div className="space-y-3 mb-8">
        <div className="relative max-w-sm group/search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within/search:text-primary transition-colors" />
          <input
            type="text"
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setActiveCategory(null); }}
            placeholder={t('searchIngredients')}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md text-sm font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>

        {/* Fixed category list — always shows all 11 categories */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveCategory(null); setFilter(''); }}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all italic border ${
              !activeCategory 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                : 'bg-card/40 text-muted-foreground border-border/40 hover:border-primary/20 hover:text-foreground'
            }`}
          >
            {t('categories.all')}
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(activeCategory === cat ? null : cat); setFilter(''); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap italic uppercase tracking-[0.1em] border ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-card/40 text-muted-foreground border-border/40 hover:border-primary/20 hover:text-foreground'
              }`}
            >
              {catLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">{t('noResults')}</p>
      ) : (
        <>
          {compact ? (
            /* ── Compact single-column list ─────────────────────── */
            <div className="space-y-1.5">
              {items.map((item) => {
                const isActive = item.slug === activeSlug;
                return (
                  <button
                    key={item.slug}
                    onClick={() => onSelect(item.slug, item.name, item.image_url)}
                    className={`flex items-center gap-4 w-full px-4 py-3 rounded-[2rem] border transition-all text-left group/item ${
                      isActive
                        ? 'border-primary/40 bg-primary/5 shadow-xl shadow-primary/5'
                        : 'border-border/40 bg-card/20 backdrop-blur-sm hover:border-primary/20 hover:bg-card/40 shadow-sm'
                    }`}
                  >
                    {item.image_url ? (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover/item:scale-110" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted/40 shrink-0 border border-border/10 flex items-center justify-center opacity-40">
                         <Search className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black italic uppercase tracking-tighter transition-colors ${isActive ? 'text-shimmer' : 'text-foreground group-hover:text-primary'}`}>
                        {item.name}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mt-0.5">
                      {item.per_100g.calories} <span className="opacity-60">{t('kcal')}</span>
                      <span className="text-[7px] opacity-20 font-bold ml-1 italic truncate">/ {t('unit100g')}</span>
                    </p>
                    </div>
                    {/* Health status dot in compact mode */}
                    <span className="text-xl filter grayscale group-hover/item:grayscale-0 transition-all opacity-40 group-hover/item:opacity-100" title={t(
                      (getHealthStatus(item.per_100g.protein_g, item.per_100g.fat_g, item.per_100g.calories) === 'healthy'
                        ? 'healthyLabel'
                        : getHealthStatus(item.per_100g.protein_g, item.per_100g.fat_g, item.per_100g.calories) === 'moderate'
                        ? 'moderateLabel'
                        : 'cautionLabel') as any
                    )}>
                      {healthConfig[getHealthStatus(item.per_100g.protein_g, item.per_100g.fat_g, item.per_100g.calories)].emoji}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ── Full grid cards ────────────────────────────────── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => {
              const isActive = item.slug === activeSlug;
              const status = getHealthStatus(
                item.per_100g.protein_g,
                item.per_100g.fat_g,
                item.per_100g.calories,
              );
              const hc = healthConfig[status];
              const statusKey = status === 'healthy' ? 'healthyLabel' : status === 'moderate' ? 'moderateLabel' : 'cautionLabel';
              return (
              <button
                key={item.slug}
                onClick={() => onSelect(item.slug, item.name, item.image_url)}
                className={`group rounded-[2.5rem] border-2 p-6 transition-all duration-700 text-left cursor-pointer relative overflow-hidden flex flex-col ${
                  isActive
                    ? 'border-primary/40 bg-primary/10 shadow-2xl shadow-primary/10 ring-4 ring-primary/5'
                    : 'border-border/20 bg-card/30 backdrop-blur-xl hover:border-primary/30 hover:bg-card/50 shadow-xl shadow-black/5 hover-lift hover-glow'
                }`}
              >
                {/* Header: image + name + calories */}
                <div className="flex items-start gap-4 mb-4">
                  {item.image_url ? (
                    <div className="relative w-14 h-14 rounded-[1.5rem] overflow-hidden shadow-2xl border-2 border-white/10 shrink-0 transition-transform duration-500 group-hover:scale-110">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-[1.5rem] bg-muted/20 border-2 border-border/10 flex items-center justify-center shrink-0 opacity-40">
                       <Search className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[15px] font-black italic uppercase tracking-tighter transition-colors leading-[1.1] ${isActive ? 'text-shimmer' : 'text-foreground group-hover:text-primary'}`}>
                      {item.name}
                    </p>
                    {/* Calories with unit context */}
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mt-1">
                      {item.per_100g.calories} <span className="opacity-60">{t('kcal')}</span>
                      <span className="text-[7px] opacity-20 font-bold ml-1 italic truncate">/ {t('unit100g')}</span>
                    </p>
                  </div>
                </div>

                {/* Macro bar */}
                <MacroBar
                  protein={item.per_100g.protein_g}
                  fat={item.per_100g.fat_g}
                  carbs={item.per_100g.carbs_g}
                />

                {/* Full macro labels instead of P/F/C */}
                <div className="mt-2 space-y-1 opacity-50 transition-opacity group-hover:opacity-100">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="text-blue-500">{t('protein')}</span>
                    <span className="text-foreground">{item.per_100g.protein_g}г</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="text-amber-500">{t('fat')}</span>
                    <span className="text-foreground">{item.per_100g.fat_g}г</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="text-emerald-500">{t('carbs')}</span>
                    <span className="text-foreground">{item.per_100g.carbs_g}г</span>
                  </div>
                </div>

                {/* Health status badge */}
                <div className={`mt-auto pt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] italic ${hc.badgeText}`}>
                   <span className="text-base filter saturate-150 drop-shadow-sm">{hc.emoji}</span>
                   {t(statusKey as any)}
                </div>
              </button>
              );
            })}
          </div>
          )}

          {/* Summary: showing X of Y */}
          {total > items.length && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                {t('showingOf', { shown: items.length, total })}
              </p>
              <Link
                href="/chef-tools/ingredients"
                className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                {t('viewAll')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
