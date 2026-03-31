'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Leaf, ArrowRight, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeForPairing, type FlavorProfile, type PairingSuggestion } from '@/lib/tools';
import type { DishIngredient } from './ChefBotPanel';

/* ── Flavor dimension bar ───────────────────────────────────── */

const DIMS: Array<{ key: keyof FlavorProfile; color: string }> = [
  { key: 'umami',     color: 'bg-purple-500' },
  { key: 'aroma',     color: 'bg-amber-500' },
  { key: 'sweetness', color: 'bg-pink-500' },
  { key: 'acidity',   color: 'bg-yellow-500' },
  { key: 'fat',       color: 'bg-orange-500' },
  { key: 'bitterness',color: 'bg-green-600' },
];

function FlavorBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min((value / 10) * 100, 100);
  return (
    <div className="flex items-center gap-3 group/bar">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 w-16 shrink-0 text-right transition-colors group-hover/bar:text-foreground">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden relative shadow-inner">
        <div className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-lg", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-black tabular-nums text-foreground w-6 text-right opacity-60">{value}</span>
    </div>
  );
}

/* ── Suggestion card — clickable with "Add to dish" ─────────── */

function SuggestionCard({
  item, locale, onSelect, onAddToDish, isInDish,
}: {
  item: PairingSuggestion;
  locale: string;
  onSelect: (slug: string, name: string) => void;
  onAddToDish?: (ing: DishIngredient) => void;
  isInDish: boolean;
}) {
  const t = useTranslations('chefTools.dashboard');

  const localName =
    locale === 'ru' ? item.name_ru :
    locale === 'pl' ? item.name_pl :
    locale === 'uk' ? item.name_uk :
    item.name_en;
  const displayName = localName ?? item.name;

  return (
    <div className={cn(
      "group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-500 hover-lift w-full",
      isInDish
        ? "border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/5 scale-[1.02]"
        : "border-border/40 bg-card/60 backdrop-blur-md hover:border-primary/40 hover:bg-primary/5 shadow-sm"
    )}>
      {/* Clickable area — navigates to ingredient */}
      <button
        onClick={() => onSelect(item.slug, displayName)}
        className="flex items-start gap-3 flex-1 min-w-0 text-left"
      >
        {item.image_url ? (
          <img src={item.image_url} alt={displayName}
            className="w-10 h-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {displayName}
          </p>
          {/* Translated fills pills */}
          {item.fills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.fills.map((f) => (
                <span key={f} className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wide">
                  + {(() => { try { return t(`flavor.${f}` as any); } catch { return f; } })()}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Score + Add button */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-xs font-black text-primary tabular-nums">{item.score}</span>
        {onAddToDish && (
          <button
            onClick={() => onAddToDish({
              slug: item.slug,
              name: displayName,
              image_url: item.image_url,
              grams: 50,
            })}
            disabled={isInDish}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-500 shadow-sm",
              isInDish
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default border border-emerald-500/20"
                : "bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/20 active:scale-95"
            )}
          >
            {isInDish ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {isInDish ? t('addedToDish') : t('addToDish')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

type PairingBlockProps = {
  slug: string;
  cookingState?: string;
  onSelectIngredient: (slug: string, name: string) => void;
  /** NEW: add ingredient to current dish composition */
  onAddToDish?: (ing: DishIngredient) => void;
  /** NEW: set of slugs already in the dish */
  dishSlugs?: Set<string>;
};

export function PairingBlock({ slug, cookingState, onSelectIngredient, onAddToDish, dishSlugs }: PairingBlockProps) {
  const locale = useLocale();
  const t = useTranslations('chefTools.dashboard');

  const [flavor, setFlavor] = useState<FlavorProfile | null>(null);
  const [suggestions, setSuggestions] = useState<PairingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFlavor(null);
    setSuggestions([]);

    analyzeForPairing(slug, locale, 100, cookingState).then((data) => {
      if (cancelled || !data) return;
      setFlavor(data.flavor);
      setSuggestions(data.suggestions ?? []);
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug, locale, cookingState]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Flavor profile */}
      {flavor && (
        <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('flavorProfile')}
            </p>
            <span className="text-[10px] font-black text-primary">
              {t('balance')}: {flavor.balance_score}
            </span>
          </div>
          {DIMS.map(({ key, color }) => (
            <FlavorBar
              key={key}
              label={t(`flavor.${key}`)}
              value={flavor[key] as number}
              color={color}
            />
          ))}
          {flavor.strong.length > 0 && (
            <p className="text-[10px] text-muted-foreground pt-1">
              <span className="font-bold text-foreground">{t('strong')}:</span>{' '}
              {flavor.strong.map((s) => {
                try { return t(`flavor.${s}` as any); } catch { return s; }
              }).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Pairing suggestions — all clickable with "Add" */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.slice(0, 6).map((s) => (
            <SuggestionCard
              key={s.slug}
              item={s}
              locale={locale}
              onSelect={onSelectIngredient}
              onAddToDish={onAddToDish}
              isInDish={dishSlugs?.has(s.slug) ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
