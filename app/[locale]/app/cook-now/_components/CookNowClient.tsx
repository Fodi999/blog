'use client';

/**
 * CookNowClient — interactive UI for `POST /api/cook/suggestions`.
 *
 * Layout:
 *   ┌─ header (title + Refresh)
 *   ├─ inventory insight banner (days_left / at_risk / waste_risk)
 *   ├─ personalization banner (goal / diet / allergies) — when applied
 *   ├─ unlock hints  ("+ rice → 3 more dishes")
 *   ├─ section: Can cook now      (emerald)
 *   ├─ section: Almost ready      (amber)
 *   └─ section: Strategic picks   (violet)
 *
 * Each <DishCard /> can expand inline to show ingredients + steps + nutrition.
 * The first generation is triggered manually by the user (button) so we
 * never burn an AI action on a passive page-load.
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Banknote,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Leaf,
  Loader2,
  Pencil,
  RefreshCw,
  Scale,
  Sparkles,
  Timer,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { ApiError } from '@/lib/chefos-api';
import {
  dishTitle,
  getCookSuggestions,
  totalDishes,
  type CookSuggestionsResponse,
  type DishBucket,
  type SuggestedDish,
  type SuggestedIngredient,
} from '@/lib/cook-suggestions';
import { cn } from '@/lib/utils';
import { EditRecipeSheet } from './EditRecipeSheet';

/**
 * Translate a stable backend enum key (e.g. "stirfry", "easy", "main").
 * Falls back to the raw key when no translation exists, so unknown
 * server-side variants (e.g. a brand new DishType) never break the UI.
 */
function translateEnum(
  t: T,
  namespace: 'dishType' | 'complexity' | 'role' | 'reason' | 'tag' | 'allergen',
  key: string,
): string {
  if (!key) return '';
  const normalized = key.toLowerCase().trim();
  const fullKey = `${namespace}.${normalized}`;
  // `t.has` is the safe way to probe for a key — `t()` throws on missing keys.
  return t.has(fullKey) ? t(fullKey) : key;
}

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string; quota?: boolean }
  | { kind: 'ready'; data: CookSuggestionsResponse };

/**
 * sessionStorage cache — survives tab navigation but clears on browser close.
 * Bumped whenever the response shape changes so stale entries are ignored.
 */
const CACHE_KEY = 'chefos.cookNow.cache.v1';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — fresh enough, avoids spending another AI action.

interface CachedEntry {
  generatedAt: number;
  data: CookSuggestionsResponse;
}

function readCache(): CachedEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (!parsed || typeof parsed.generatedAt !== 'number' || !parsed.data) return null;
    if (Date.now() - parsed.generatedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: CookSuggestionsResponse): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CachedEntry = { generatedAt: Date.now(), data };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota exceeded / private mode — silently ignore, in-memory state still works */
  }
}

function clearCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

const moneyFmt = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
});

function formatCents(cents: number): string {
  return moneyFmt.format(cents / 100);
}

/** Pick the honest "what's on the plate" weight in grams. Prefers the
 *  backend-computed `yield_summary.cooked_total_g` (gross → net → cooked
 *  with trim & cooking losses applied). Falls back to summing `cooked_g`
 *  per ingredient, then to gross_g if neither is present. */
function totalYieldG(dish: SuggestedDish): number {
  const ys = dish.yield_summary;
  if (ys && Number.isFinite(ys.cooked_total_g) && ys.cooked_total_g > 0) {
    return ys.cooked_total_g;
  }
  const cooked = dish.ingredients.reduce(
    (acc, i) => acc + (Number.isFinite(i.cooked_g) && (i.cooked_g ?? 0) > 0 ? (i.cooked_g as number) : 0),
    0,
  );
  if (cooked > 0) return cooked;
  return dish.ingredients.reduce(
    (acc, i) => acc + (Number.isFinite(i.gross_g) && i.gross_g > 0 ? i.gross_g : 0),
    0,
  );
}

/** Gross (raw) weight — what was pulled from inventory. Used for the
 *  "from 343 g gross" subline so the user sees both numbers. */
function totalGrossG(dish: SuggestedDish): number {
  const ys = dish.yield_summary;
  if (ys && Number.isFinite(ys.gross_total_g) && ys.gross_total_g > 0) {
    return ys.gross_total_g;
  }
  return dish.ingredients.reduce(
    (acc, i) => acc + (Number.isFinite(i.gross_g) && i.gross_g > 0 ? i.gross_g : 0),
    0,
  );
}

/** Pretty-print grams as "850 g" for <1 kg, "1.2 kg" otherwise. */
function formatYield(grams: number): string {
  if (!Number.isFinite(grams) || grams <= 0) return '—';
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toFixed(kg >= 10 ? 1 : 2).replace(/\.?0+$/, '')} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function CookNowClient({ locale: _locale }: { locale: string }) {
  const t = useTranslations('app.cookNow');
  const [state, setState] = useState<State>({ kind: 'idle' });

  // Hydrate from sessionStorage on mount so navigating away & back doesn't
  // wipe results (and doesn't burn another AI action).
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setState({ kind: 'ready', data: cached.data });
    }
  }, []);

  const generate = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const data = await getCookSuggestions();
      writeCache(data);
      setState({ kind: 'ready', data });
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setState({ kind: 'error', message: t('errorQuotaBody'), quota: true });
        return;
      }
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : t('errorBody');
      setState({ kind: 'error', message });
      toast.error(message);
    }
  }, [t]);

  const clear = useCallback(() => {
    clearCache();
    setState({ kind: 'idle' });
  }, []);

  const header = (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-black tracking-tight lg:text-3xl">{t('title')}</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {state.kind === 'ready' && (
        <div className="flex gap-2">
          <Button onClick={clear} variant="ghost" size="sm">
            {t('clear')}
          </Button>
          <Button onClick={generate} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('regenerate')}
          </Button>
        </div>
      )}
    </header>
  );

  // ── Idle: empty state with the big "Generate" button ───────────────────
  if (state.kind === 'idle') {
    return (
      <div className="space-y-6">
        {header}
        <Card className="border-dashed">
          <CardContent className="space-y-4 p-8 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{t('idleTitle')}</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">{t('idleBody')}</p>
            </div>
            <Button onClick={generate} size="lg" className="mt-2">
              <Wand2 className="mr-2 h-4 w-4" />
              {t('generate')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('costHint')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (state.kind === 'loading') {
    return (
      <div className="space-y-6">
        {header}
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">{t('loadingTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('loadingBody')}</p>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (state.kind === 'error') {
    return (
      <div className="space-y-6">
        {header}
        <Card className={cn(state.quota ? 'border-amber-500/30' : 'border-destructive/30')}>
          <CardContent className="space-y-3 p-6">
            <p className={cn('text-sm font-semibold', state.quota ? 'text-amber-600' : 'text-destructive')}>
              {state.quota ? t('errorQuotaTitle') : t('errorTitle')}
            </p>
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <div className="flex gap-2">
              <Button onClick={generate} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('retry')}
              </Button>
              {state.quota && (
                <Button asChild size="sm">
                  <a href="/pricing">{t('topUp')}</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Ready ─────────────────────────────────────────────────────────────
  const { data } = state;
  const total = totalDishes(data);

  if (total === 0) {
    return (
      <div className="space-y-6">
        {header}
        <InventoryInsightBanner data={data} t={t} />
        <Card>
          <CardContent className="p-8 text-center">
            <ChefHat className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-bold">{t('emptyResultsTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('emptyResultsBody')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <InventoryInsightBanner data={data} t={t} />

      {data.personalization?.personalized && (
        <PersonalizationBanner info={data.personalization} t={t} />
      )}

      {data.suggestions.unlock_hints.length > 0 && (
        <UnlockHintsBanner hints={data.suggestions.unlock_hints} t={t} />
      )}

      {data.can_cook.length > 0 && (
        <DishSection
          bucket="can_cook"
          title={t('canCookTitle')}
          subtitle={t('canCookSubtitle', { count: data.can_cook.length })}
          dishes={data.can_cook}
          accent="emerald"
          t={t}
        />
      )}
      {data.almost.length > 0 && (
        <DishSection
          bucket="almost"
          title={t('almostTitle')}
          subtitle={t('almostSubtitle', { count: data.almost.length })}
          dishes={data.almost}
          accent="amber"
          t={t}
        />
      )}
      {data.strategic.length > 0 && (
        <DishSection
          bucket="strategic"
          title={t('strategicTitle')}
          subtitle={t('strategicSubtitle', { count: data.strategic.length })}
          dishes={data.strategic}
          accent="violet"
          t={t}
        />
      )}
    </div>
  );
}

// ── Banners ─────────────────────────────────────────────────────────────────

type T = ReturnType<typeof useTranslations>;

function InventoryInsightBanner({ data, t }: { data: CookSuggestionsResponse; t: T }) {
  const { inventory_insight: ii } = data;
  const risk = ii.waste_risk;
  const tone =
    risk >= 60 ? 'border-destructive/40 bg-destructive/5'
      : risk >= 30 ? 'border-amber-500/30 bg-amber-500/5'
      : 'border-emerald-500/30 bg-emerald-500/5';

  return (
    <Card className={cn('border', tone)}>
      <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
        <Stat label={t('insight.totalIngredients')} value={String(ii.total_ingredients)} icon={Leaf} />
        <Stat label={t('insight.daysLeft')} value={String(ii.days_left)} icon={Clock} />
        <Stat
          label={t('insight.atRisk')}
          value={String(ii.at_risk.length)}
          icon={AlertTriangle}
          tone={ii.at_risk.length > 0 ? 'amber' : 'muted'}
        />
        <Stat
          label={t('insight.wasteRisk')}
          value={`${risk}%`}
          icon={Flame}
          tone={risk >= 60 ? 'red' : risk >= 30 ? 'amber' : 'emerald'}
        />
        {ii.at_risk.length > 0 && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs font-medium text-muted-foreground">{t('insight.atRiskList')}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ii.at_risk.map((name) => (
                <Badge key={name} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = 'muted',
}: {
  label: string;
  value: string;
  icon: typeof Leaf;
  tone?: 'muted' | 'emerald' | 'amber' | 'red';
}) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'amber' ? 'text-amber-600 dark:text-amber-400'
      : tone === 'red' ? 'text-destructive'
      : 'text-foreground';
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={cn('text-2xl font-black tabular-nums', toneClass)}>{value}</p>
    </div>
  );
}

function PersonalizationBanner({
  info,
  t,
}: {
  info: NonNullable<CookSuggestionsResponse['personalization']>;
  t: T;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-2 p-4 text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold">{t('personalization.title')}</span>
        {info.goal && info.goal !== 'none' && (
          <Badge variant="secondary">{t('personalization.goal', { goal: info.goal })}</Badge>
        )}
        {info.diet && info.diet !== 'omnivore' && (
          <Badge variant="secondary">{t('personalization.diet', { diet: info.diet })}</Badge>
        )}
        {info.kcal_target > 0 && (
          <Badge variant="outline">{t('personalization.kcal', { kcal: info.kcal_target })}</Badge>
        )}
        {info.excluded_allergens.length > 0 && (
          <Badge variant="outline" className="border-amber-500/40">
            {t('personalization.allergens', { list: info.excluded_allergens.join(', ') })}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function UnlockHintsBanner({ hints, t }: { hints: string[]; t: T }) {
  return (
    <Card className="border-violet-500/30 bg-violet-500/5">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-violet-500" />
          {t('unlock.title')}
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {hints.map((h, i) => (
            <li key={i}>• {h}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Dish section + row ──────────────────────────────────────────────────────

function DishSection({
  title,
  subtitle,
  dishes,
  accent,
  t,
}: {
  bucket: DishBucket;
  title: string;
  subtitle: string;
  dishes: SuggestedDish[];
  accent: 'emerald' | 'amber' | 'violet';
  t: T;
}) {
  const dotClass =
    accent === 'emerald' ? 'bg-emerald-500'
      : accent === 'amber' ? 'bg-amber-500'
      : 'bg-violet-500';
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={cn('h-2.5 w-2.5 rounded-full', dotClass)} />
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {dishes.map((d, i) => (
          <DishRow key={`${d.dish_name}-${i}`} dish={d} accent={accent} t={t} />
        ))}
      </div>
    </section>
  );
}

const DRAFTS_KEY = 'chefos.recipeDrafts.v1';

interface RecipeDraft {
  id: string;
  savedAt: number;
  source: 'cook-now';
  dish: SuggestedDish;
}

function saveDraft(dish: SuggestedDish): RecipeDraft {
  const draft: RecipeDraft = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: Date.now(),
    source: 'cook-now',
    dish,
  };
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(DRAFTS_KEY);
      const list: RecipeDraft[] = raw ? JSON.parse(raw) : [];
      list.unshift(draft);
      // keep only last 20 drafts
      window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(list.slice(0, 20)));
    } catch {
      /* private mode / quota — ignore, toast still fires */
    }
  }
  return draft;
}

function DishRow({
  dish,
  accent,
  t,
}: {
  dish: SuggestedDish;
  accent: 'emerald' | 'amber' | 'violet';
  t: T;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // Local mutable copy — edited ingredients appear in the grid immediately.
  const [editedDish, setEditedDish] = useState<SuggestedDish>(dish);

  const econ = editedDish.insight.economics;
  const usesExpiring = editedDish.insight.uses_expiring;

  const accentBorder =
    accent === 'emerald' ? 'border-l-emerald-500'
      : accent === 'amber' ? 'border-l-amber-500'
      : 'border-l-violet-500';

  const totalTimeMin = editedDish.steps.reduce((acc, s) => acc + (s.time_min ?? 0), 0);

  function onEditSave(updated: SuggestedDish) {
    setEditedDish(updated);
    saveDraft(updated);
  }

  return (
    <>
      <EditRecipeSheet
        dish={editedDish}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={onEditSave}
      />
      <Card className={cn('overflow-hidden border border-l-4 transition-shadow', accentBorder, expanded && 'shadow-md')}>
      {/* ── Strip header (always visible) ───────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold leading-tight sm:text-base">
              {dishTitle(editedDish)}
            </h3>
            {usesExpiring && (
              <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
                <Flame className="mr-1 h-3 w-3" />
                {t('badges.usesExpiring')}
              </Badge>
            )}
            {editedDish.insight.high_protein && (
              <Badge variant="secondary">{t('badges.highProtein')}</Badge>
            )}
            {editedDish.insight.budget_friendly && (
              <Badge variant="secondary">{t('badges.budget')}</Badge>
            )}
            {econ?.confidence === 'strong' && (
              <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                {t('badges.confidenceStrong')}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {translateEnum(t, 'dishType', editedDish.dish_type)} · {translateEnum(t, 'complexity', editedDish.complexity)}
            {editedDish.missing_count > 0 && ` · ${t('missing', { count: editedDish.missing_count })}`}
          </p>
        </div>

        {/* Inline mini stats — hidden on small screens */}
        <div className="hidden items-center gap-4 text-xs text-muted-foreground md:flex">
          <span className="flex items-center gap-1 tabular-nums">
            <Flame className="h-3.5 w-3.5" />
            {editedDish.per_serving_kcal} {t('stats.kcal')}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <Users className="h-3.5 w-3.5" />
            {editedDish.servings}
          </span>
          {totalTimeMin > 0 && (
            <span className="flex items-center gap-1 tabular-nums">
              <Timer className="h-3.5 w-3.5" />
              {totalTimeMin}m
            </span>
          )}
          {econ && (
            <span className="flex items-center gap-1 tabular-nums">
              <Banknote className="h-3.5 w-3.5" />
              {formatCents(econ.cost_cents)}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* ── Expanded body — single vertical column, recipe-card style ─ */}
      {expanded && (
        <CardContent className="flex flex-col gap-6 border-t border-border/60 bg-muted/10 p-6">
          {/* Action toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="default" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>
              <ChevronUp className="mr-2 h-4 w-4" />
              {t('hideRecipe')}
            </Button>
          </div>

          {/* Hero meta strip — recipe-style at-a-glance row */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-background p-4 sm:grid-cols-3 lg:grid-cols-5">
            <HeroMeta
              icon={Users}
              label={t('hero.servings')}
              value={String(editedDish.servings)}
            />
            <HeroMeta
              icon={Timer}
              label={t('hero.totalTime')}
              value={totalTimeMin > 0 ? `${totalTimeMin} ${t('hero.min')}` : '—'}
            />
            <HeroMeta
              icon={Scale}
              label={t('hero.totalYield')}
              value={formatYield(totalYieldG(editedDish))}
              hint={(() => {
                const cooked = totalYieldG(editedDish);
                const gross = totalGrossG(editedDish);
                if (gross > 0 && Math.abs(gross - cooked) > 1) {
                  return t('hero.fromGross', { gross: formatYield(gross) });
                }
                return t('hero.allIngredients');
              })()}
            />
            <HeroMeta
              icon={Flame}
              label={t('hero.kcal')}
              value={`${editedDish.per_serving_kcal}`}
              hint={t('hero.perServing')}
            />
            <HeroMeta
              icon={Banknote}
              label={t('hero.foodCost')}
              value={econ ? formatCents(econ.cost_cents) : '—'}
            />
          </div>

          {/* Missing ingredients call-out */}
          {editedDish.missing_count > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                {t('missing', { count: editedDish.missing_count })}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {editedDish.missing_ingredients.map((m) => (
                  <Badge key={m} variant="outline" className="border-amber-500/40 bg-background text-xs">
                    + {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reasons — why we suggested it (translated enum keys) */}
          {editedDish.insight.reasons.length > 0 && (
            <RecipeSection icon={Sparkles} title={t('whyTitle')}>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {editedDish.insight.reasons.slice(0, 5).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{translateEnum(t, 'reason', r)}</span>
                  </li>
                ))}
              </ul>
            </RecipeSection>
          )}

          {/* Ingredients — visual constructor with 3 grouped buckets */}
          {(() => {
            const real = editedDish.ingredients.filter((ing) => ing.gross_g > 0);
            const ghosts = editedDish.ingredients.length - real.length;

            // 2) Group by status — like a real shopping list:
            //    • inStock     — already in your inventory
            //    • toBuy       — missing, needs a shop run
            //    • optional    — flavor-only roles (spice/garnish/sauce/herb)
            const OPTIONAL_ROLES = new Set([
              'spice', 'garnish', 'herb', 'sauce', 'acid',
            ]);
            const isOptional = (i: SuggestedIngredient) =>
              OPTIONAL_ROLES.has((i.role || '').toLowerCase());

            const inStock = real.filter((i) => i.available && !isOptional(i));
            const toBuy = real.filter((i) => !i.available && !isOptional(i));
            const optional = real.filter(isOptional);

            return (
              <RecipeSection icon={Leaf} title={t('ingredients')}>
                <div className="space-y-5">
                  {real.length === 0 && (
                    <p className="rounded-lg border border-border/60 bg-background px-4 py-3 text-xs text-muted-foreground">
                      {t('noIngredients')}
                    </p>
                  )}

                  {inStock.length > 0 && (
                    <IngredientGroup
                      label={t('groups.inStock')}
                      count={inStock.length}
                      tone="emerald"
                      items={inStock}
                      t={t}
                    />
                  )}

                  {toBuy.length > 0 && (
                    <IngredientGroup
                      label={t('groups.toBuy')}
                      count={toBuy.length}
                      tone="amber"
                      items={toBuy}
                      t={t}
                    />
                  )}

                  {optional.length > 0 && (
                    <IngredientGroup
                      label={t('groups.optional')}
                      count={optional.length}
                      tone="muted"
                      items={optional}
                      t={t}
                    />
                  )}
                </div>

                {ghosts > 0 && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {t('ghostsHidden', { count: ghosts })}
                  </p>
                )}
              </RecipeSection>
            );
          })()}

          {/* Steps */}
          {editedDish.steps.length > 0 && (
            <RecipeSection icon={ChefHat} title={t('steps')}>
              <ol className="space-y-4">
                {editedDish.steps.map((s) => (
                  <li key={s.step} className="flex gap-3 rounded-lg border border-border/60 bg-background p-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {s.step}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm leading-relaxed">{s.text}</p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        {s.time_min ? (
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {s.time_min} {t('hero.min')}
                          </span>
                        ) : null}
                        {s.temp_c ? (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {s.temp_c}°C
                          </span>
                        ) : null}
                        {s.tip ? <span className="italic">💡 {s.tip}</span> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </RecipeSection>
          )}

          {/* Economics */}
          {econ && (
            <RecipeSection icon={Banknote} title={t('econ.title')}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <EconBlock label={t('econ.cost')} value={formatCents(econ.cost_cents)} />
                <EconBlock label={t('econ.suggested')} value={formatCents(econ.suggested_price_cents)} />
                <EconBlock
                  label={t('econ.margin')}
                  value={`${econ.margin_percent.toFixed(1)}%`}
                  tone={
                    econ.margin_percent >= 65 ? 'emerald'
                      : econ.margin_percent >= 50 ? 'amber'
                      : 'red'
                  }
                />
                <EconBlock
                  label={t('econ.wasteSaved')}
                  value={formatCents(econ.waste_saved_cents)}
                  tone={econ.waste_saved_cents > 0 ? 'emerald' : 'muted'}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t('econ.coverage', { percent: econ.price_coverage_percent })}
              </p>
            </RecipeSection>
          )}

          {/* Nutrition per serving */}
          <RecipeSection icon={Flame} title={t('nutritionTitle')}>
            <div className="grid grid-cols-4 gap-2">
              <NutBlock label={t('nutrition.kcal')} value={String(editedDish.per_serving_kcal)} />
              <NutBlock label={t('nutrition.protein')} value={`${editedDish.per_serving_protein_g.toFixed(0)}g`} />
              <NutBlock label={t('nutrition.fat')} value={`${editedDish.per_serving_fat_g.toFixed(0)}g`} />
              <NutBlock label={t('nutrition.carbs')} value={`${editedDish.per_serving_carbs_g.toFixed(0)}g`} />
            </div>
          </RecipeSection>

          {/* Tags / Allergens — translated */}
          {(editedDish.tags.length > 0 || editedDish.allergens.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {editedDish.tags.map((tag) => (
                <Badge key={`tag-${tag}`} variant="secondary" className="text-[11px] capitalize">
                  {translateEnum(t, 'tag', tag)}
                </Badge>
              ))}
              {editedDish.allergens.map((a) => (
                <Badge
                  key={`allergen-${a}`}
                  variant="outline"
                  className="border-amber-500/40 text-[11px] text-amber-700 dark:text-amber-300"
                >
                  ⚠ {translateEnum(t, 'allergen', a)}
                </Badge>
              ))}
            </div>
          )}

          {/* Warnings */}
          {editedDish.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              {editedDish.warnings.map((w, i) => (
                <p key={i}>⚠ {w}</p>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
    </>
  );
}

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof Leaf;
  children: React.ReactNode;
}) {
  return (
    <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h4>
  );
}

function RecipeSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Leaf;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-foreground/80">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h4>
      {children}
    </section>
  );
}

function HeroMeta({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Leaf;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span className="text-base font-bold tabular-nums leading-none">{value}</span>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function formatGrams(g: number): string {
  if (!g || g <= 0) return '—';
  if (g >= 1000) return `${(g / 1000).toFixed(1)} kg`;
  return `${Math.round(g)} g`;
}

/**
 * One status-grouped block of ingredient cards.
 *
 * Tones map to a coloured left bar + count chip:
 *   • emerald — already in stock
 *   • amber   — needs to be bought
 *   • muted   — optional / flavor-only
 */
function IngredientGroup({
  label,
  count,
  tone,
  items,
  t,
}: {
  label: string;
  count: number;
  tone: 'emerald' | 'amber' | 'muted';
  items: SuggestedIngredient[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const bar =
    tone === 'emerald' ? 'bg-emerald-500'
      : tone === 'amber' ? 'bg-amber-500'
      : 'bg-muted-foreground/40';
  const chip =
    tone === 'emerald' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : tone === 'amber' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-muted text-muted-foreground';

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn('h-3 w-1 rounded-full', bar)} />
        <h5 className="text-[12px] font-semibold uppercase tracking-wide text-foreground/80">
          {label}
        </h5>
        <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums', chip)}>
          {count}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((ing) => (
          <IngredientCard key={ing.slug + ing.name} ing={ing} t={t} />
        ))}
      </div>
    </div>
  );
}

/**
 * Single product card — photo + name + grams + status pill.
 *
 * Renders the catalog `image_url` when available; otherwise shows a soft
 * monogram fallback derived from the localized name.
 */
function IngredientCard({
  ing,
  t,
}: {
  ing: SuggestedIngredient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const initial = (ing.name || ing.slug || '?').trim().charAt(0).toUpperCase();
  const status =
    ing.expiring_soon ? 'expiring'
      : !ing.available ? 'missing'
      : 'inStock';
  const statusClass =
    status === 'expiring' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
      : status === 'missing' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  const statusIcon = status === 'expiring' ? '🔥' : status === 'missing' ? '⚠️' : '✅';
  const statusLabel = t(`status.${status}`);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background transition-all hover:border-primary/40 hover:shadow-sm">
      {/* Photo / fallback monogram */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
        {ing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ing.image_url}
            alt={ing.name}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-300 group-hover:scale-105',
              !ing.available && 'opacity-60 grayscale',
            )}
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground/40',
              !ing.available && 'opacity-60',
            )}
          >
            {initial}
          </div>
        )}

        {/* Status pill — top right */}
        <span
          className={cn(
            'absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur',
            statusClass,
          )}
          title={statusLabel}
        >
          <span aria-hidden="true">{statusIcon}</span>
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <p
          className={cn(
            'truncate text-xs font-semibold capitalize leading-tight',
            !ing.available && 'text-muted-foreground',
          )}
          title={ing.name}
        >
          {ing.name}
        </p>
        <p className="text-[11px] font-bold tabular-nums text-foreground/80">
          {formatGrams(ing.gross_g)}
        </p>
        {ing.role && (
          <p className="truncate text-[10px] text-muted-foreground">
            {translateEnum(t, 'role', ing.role)}
          </p>
        )}
      </div>
    </div>
  );
}

function EconBlock({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: string;
  tone?: 'muted' | 'emerald' | 'amber' | 'red';
}) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'amber' ? 'text-amber-600 dark:text-amber-400'
      : tone === 'red' ? 'text-destructive'
      : 'text-foreground';
  return (
    <div className="rounded-lg border border-border/60 p-2.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-sm font-bold tabular-nums', toneClass)}>{value}</p>
    </div>
  );
}

function NutBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2 text-center">
      <div className="text-sm font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
