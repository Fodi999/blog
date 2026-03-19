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

/* ── Macro bar tiny component ───────────────────────────────── */
function MacroBar({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const total = protein + fat + carbs || 1;
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted/50">
      <div className="bg-blue-500" style={{ width: `${(protein / total) * 100}%` }} />
      <div className="bg-amber-500" style={{ width: `${(fat / total) * 100}%` }} />
      <div className="bg-emerald-500" style={{ width: `${(carbs / total) * 100}%` }} />
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
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground italic leading-none">
              {t('ingredients')}
            </h2>
            {!loading && total > 0 && (
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                {total} {t('ingredientsTotal')}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/chef-tools/ingredients"
          className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
        >
          {t('viewAll')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Search + category chips */}
      <div className="space-y-3 mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setActiveCategory(null); }}
            placeholder={t('searchIngredients')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/60 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Fixed category list — always shows all 11 categories */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setActiveCategory(null); setFilter(''); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              !activeCategory ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('categories.all')}
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(activeCategory === cat ? null : cat); setFilter(''); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
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
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all text-left ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/40 bg-background hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.per_100g.calories} {t('kcal')}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      P{item.per_100g.protein_g} F{item.per_100g.fat_g} C{item.per_100g.carbs_g}
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
              return (
              <button
                key={item.slug}
                onClick={() => onSelect(item.slug, item.name, item.image_url)}
                className={`group rounded-2xl border p-4 transition-all duration-300 text-left cursor-pointer ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/20'
                    : 'border-border/60 bg-background hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.per_100g.calories} {t('kcal')}
                      <span className="ml-1.5 opacity-60">{catLabel(item.product_type)}</span>
                    </p>
                  </div>
                </div>

                <MacroBar
                  protein={item.per_100g.protein_g}
                  fat={item.per_100g.fat_g}
                  carbs={item.per_100g.carbs_g}
                />

                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground font-medium">
                  <span className="text-blue-500">P {item.per_100g.protein_g}</span>
                  <span className="text-amber-500">F {item.per_100g.fat_g}</span>
                  <span className="text-emerald-500">C {item.per_100g.carbs_g}</span>
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
