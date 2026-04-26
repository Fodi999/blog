'use client';

/**
 * Live dashboard for /app/dashboard.
 *
 * Layout mirrors the iOS `RecipesView → stockView` (smart insight hero,
 * stock summary row, categories strip, urgent items list) plus a
 * restaurant-grade extension layer (dish count, average margin,
 * 30-day waste, health score) that the iOS app does not surface.
 *
 * Data comes from three endpoints, fetched in parallel:
 *   GET /api/inventory/dashboard   → financial + risk summary
 *   GET /api/inventory/products    → at-risk lots, categories, days-of-food
 *   GET /api/dishes                → dish count + avg margin
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  TrendingUp,
  AlertTriangle,
  Heart,
  Percent,
  RefreshCw,
  ArrowRight,
  Activity,
  Sparkles,
  Clock,
  Banknote,
  Package as PackageIcon,
  Flame,
  Trash2,
  CookingPot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CookDialog } from '@/components/app/CookDialog';
import { api, ApiError } from '@/lib/chefos-api';
import {
  AT_RISK_HEADLINE,
  AT_RISK_SEVERITIES,
  type DishListResponse,
  type InventoryDashboardResponse,
  type InventoryItem,
  type InventoryListResponse,
  type RecipeV2,
} from '@/lib/chefos-types';
import { useChefOSSync } from '@/lib/chefos-store';
import { categoryEmoji, categoryLabel } from '@/lib/category';
import { cn } from '@/lib/utils';

// ── Avatar ──────────────────────────────────────────────────────────────────

/**
 * Shows the real product photo when available, falling back to a category
 * emoji underneath. Emoji is rendered first so users still see something
 * meaningful while the image loads (or if R2 returns a transparent image
 * without firing onError).
 */
function ProductAvatar({
  imageUrl,
  category,
  size = 'sm',
}: {
  imageUrl?: string | null;
  category?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [errored, setErrored] = useState(false);
  const dim =
    size === 'lg'
      ? 'h-12 w-12 text-2xl'
      : size === 'md'
      ? 'h-10 w-10 text-xl'
      : 'h-9 w-9 text-lg';
  const showImage = !!imageUrl && !errored;
  return (
    <span
      className={cn(
        'relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted leading-none',
        dim,
      )}
    >
      <span aria-hidden>{categoryEmoji(category)}</span>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt=""
          className="absolute inset-0 h-full w-full bg-background object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </span>
  );
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready';
      dashboard: InventoryDashboardResponse;
      inventory: InventoryListResponse;
      dishes: DishListResponse;
      recipes: RecipeV2[];
    };

type StatCard = {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
  hint?: string;
};

type CategoryGroup = {
  category: string;
  emoji: string;
  imageUrl: string | null;
  count: number;
  valuePLN: number;
};

function formatCurrencyPLN(locale: string, amount: number): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} zł`;
  }
}

function formatPercent(locale: string, value: number): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value / 100);
  } catch {
    return `${value.toFixed(1)} %`;
  }
}

/** Days from now until ISO timestamp; negative = past. */
function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.floor(ms / 86_400_000);
}

export function DashboardClient({ locale }: { locale: string }) {
  const t = useTranslations('app.dashboard');
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState({ kind: 'loading' });
      setRefreshing(true);
      try {
        const [dashboard, inventory, dishes, recipes] = await Promise.all([
          api.get<InventoryDashboardResponse>('/api/inventory/dashboard'),
          api.get<InventoryListResponse>('/api/inventory/products?per_page=200'),
          api.get<DishListResponse>('/api/dishes?per_page=500&active_only=true'),
          api
            .get<RecipeV2[]>('/api/recipes/v2')
            .catch(() => [] as RecipeV2[]),
        ]);
        setState({ kind: 'ready', dashboard, inventory, dishes, recipes });
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : t('errorBody');
        setState({ kind: 'error', message });
      } finally {
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Cross-page sync: any inventory/dish mutation re-fetches; refetch on tab focus;
  // 30 s polling while the tab is visible.
  useChefOSSync(
    ['inventory', 'inventory-dashboard', 'dishes', 'recipes'],
    () => load(true),
    30_000,
  );

  const [cookTarget, setCookTarget] = useState<RecipeV2 | null>(null);

  // ── derived state ────────────────────────────────────────────────────────
  const view = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const items = state.inventory.items;

    // Items considered "rescuable today" (not yet expired but in 1–3d window).
    const rescueItems = items.filter((i) => AT_RISK_SEVERITIES.has(i.severity));
    const todaySavingsPLN = rescueItems.reduce(
      (sum, i) => sum + (i.remaining_quantity * i.price_per_unit_cents) / 100,
      0,
    );

    const atRisk = items.filter((i) => AT_RISK_HEADLINE.has(i.severity));
    const atRiskCount = atRisk.length;

    // Estimated days-of-food = median(days_until_expiry) over items with expiry.
    const expiries = items
      .map((i) => daysUntil(i.expires_at))
      .filter((d) => Number.isFinite(d) && d >= 0)
      .sort((a, b) => a - b);
    const estimatedDays =
      expiries.length > 0 ? expiries[Math.floor(expiries.length / 2)] : 0;

    // Categories — group, sort by total value desc, take top 6.
    const byCat = new Map<string, CategoryGroup>();
    for (const it of items) {
      const cat = (it.product.category || 'other').toLowerCase();
      const cur = byCat.get(cat) ?? {
        category: cat,
        emoji: categoryEmoji(cat),
        imageUrl: null as string | null,
        count: 0,
        valuePLN: 0,
      };
      cur.count += 1;
      cur.valuePLN += (it.remaining_quantity * it.price_per_unit_cents) / 100;
      // Use the first product photo we encounter for this category.
      if (!cur.imageUrl && it.product.image_url) cur.imageUrl = it.product.image_url;
      byCat.set(cat, cur);
    }
    const categories = [...byCat.values()]
      .sort((a, b) => b.valuePLN - a.valuePLN)
      .slice(0, 6);

    // Dishes
    const dishes = state.dishes;
    const myDishes = dishes.total;
    const dishesWithMargin = dishes.items.filter(
      (d) => typeof d.profit_margin_percent === 'number',
    );
    const avgMargin =
      dishesWithMargin.length > 0
        ? dishesWithMargin.reduce(
            (s, d) => s + (d.profit_margin_percent as number),
            0,
          ) / dishesWithMargin.length
        : null;

    // Sort at-risk: severity → expiry asc.
    const sevWeight: Record<string, number> = { expired: 0, critical: 1, warning: 2 };
    const atRiskTop: InventoryItem[] = [...atRisk]
      .sort((a, b) => {
        const sa = sevWeight[a.severity] ?? 99;
        const sb = sevWeight[b.severity] ?? 99;
        if (sa !== sb) return sa - sb;
        return a.expires_at.localeCompare(b.expires_at);
      })
      .slice(0, 5);

    return {
      todaySavingsPLN,
      atRiskCount,
      atRiskTop,
      myDishes,
      avgMargin,
      hasInventory: state.inventory.total > 0,
      hasDishes: myDishes > 0,
      health: state.dashboard.health_score,
      stockValuePLN: state.dashboard.total_stock_value_cents / 100,
      waste30dPLN: state.dashboard.waste_30d_cents / 100,
      wastePercent: state.dashboard.waste_percentage,
      itemsCount: state.inventory.total,
      estimatedDays,
      urgentCount: atRisk.filter((i) => i.severity !== 'ok').length,
      categories,
    };
  }, [state]);

  // ── render: loading ──────────────────────────────────────────────────────
  if (state.kind === 'loading') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight lg:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </header>
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // ── render: error ────────────────────────────────────────────────────────
  if (state.kind === 'error') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight lg:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </header>
        <Card className="border-destructive/40">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold">{t('errorTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
            <Button onClick={() => load()} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!view) return null;

  // ── insight status line (mirrors iOS `insightStatusLine`) ───────────────
  let insightStatus: string;
  if (!view.hasInventory) {
    insightStatus = t('insightEmpty');
  } else if (view.urgentCount > 0) {
    insightStatus = t('insightUrgent', { count: view.urgentCount });
  } else {
    insightStatus = t('insightGood', { days: view.estimatedDays });
  }

  // ── KPI grid (6 tiles — iOS 4 + restaurant extensions) ──────────────────
  const stats: StatCard[] = [
    {
      icon: Banknote,
      label: t('stockValue'),
      value: formatCurrencyPLN(locale, view.stockValuePLN),
      accent: 'text-emerald-600',
    },
    {
      icon: PackageIcon,
      label: t('itemsInStock'),
      value: String(view.itemsCount),
      accent: 'text-cyan-600',
    },
    {
      icon: AlertTriangle,
      label: t('expiringRisk'),
      value: String(view.atRiskCount),
      accent: view.atRiskCount > 0 ? 'text-amber-600' : 'text-muted-foreground',
      hint: view.atRiskCount > 0 ? t('expiringRiskHint') : t('expiringRiskOk'),
    },
    {
      icon: Flame,
      label: t('todaySavings'),
      value: formatCurrencyPLN(locale, view.todaySavingsPLN),
      accent: 'text-rose-600',
      hint: t('todaySavingsHint'),
    },
    {
      icon: Heart,
      label: t('myDishes'),
      value: String(view.myDishes),
      accent: 'text-fuchsia-600',
    },
    {
      icon: Percent,
      label: t('avgMargin'),
      value: view.avgMargin !== null ? formatPercent(locale, view.avgMargin) : '—',
      accent: 'text-sky-600',
      hint: view.avgMargin === null ? t('marginUnavailable') : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight lg:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex-shrink-0"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </header>

      {/* Smart Insight Hero — mirrors iOS smartInsightBlock */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t('insightTitle')}
              </span>
            </div>
            {view.estimatedDays > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                <Clock className="h-3 w-3" />~{view.estimatedDays}
                {t('daysSuffix')}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('insightStatus')}
              </p>
              <p className="mt-1 text-base font-semibold sm:text-lg">{insightStatus}</p>
              {view.todaySavingsPLN > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <Flame className="h-3 w-3" />
                  {t('insightWaste')} {formatCurrencyPLN(locale, view.todaySavingsPLN)}
                </p>
              )}
            </div>
            <Button asChild size="lg" className="flex-shrink-0">
              <Link href="/app/inventory" locale={locale}>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('rescueProducts')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI grid — 6 tiles */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, accent, hint }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <Icon className={`h-4 w-4 ${accent}`} />
              </div>
              <p className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{value}</p>
              {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Health + Waste 30d strip */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('healthScore')}
              </p>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight">
              {Math.round(view.health)}
              <span className="ml-1 text-base font-semibold text-muted-foreground">/100</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  view.health >= 70
                    ? 'bg-emerald-500'
                    : view.health >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, view.health))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('waste30d')}
              </p>
              <Trash2 className="h-4 w-4 text-rose-600" />
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight">
              {formatCurrencyPLN(locale, view.waste30dPLN)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPercent(locale, view.wastePercent)} {t('ofTurnover')}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Categories strip — mirrors iOS category grouping */}
      {view.categories.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="text-base font-bold">{t('categoriesTitle')}</h2>
              <Link
                href="/app/inventory"
                locale={locale}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t('seeAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto px-4 pb-4">
              <div className="flex gap-2 sm:grid sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
                {view.categories.map((c) => (
                  <Link
                    key={c.category}
                    href="/app/inventory"
                    locale={locale}
                    className="group flex min-w-[160px] flex-shrink-0 items-center gap-3 rounded-xl border border-border/60 bg-background p-3 transition-colors hover:bg-muted sm:min-w-0"
                  >
                    <ProductAvatar
                      imageUrl={c.imageUrl}
                      category={c.category}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {categoryLabel(c.category)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.count} · {formatCurrencyPLN(locale, c.valuePLN)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* At-risk top 5 OR empty state */}
      {!view.hasInventory ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold">{t('emptyTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('emptyBody')}</p>
            <Button asChild className="mt-4">
              <Link href="/app/inventory" locale={locale}>
                {t('openInventory')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : view.atRiskTop.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h2 className="text-lg font-bold">{t('atRiskListTitle')}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('noRiskItems')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="text-base font-bold">{t('atRiskListTitle')}</h2>
              <Link
                href="/app/inventory"
                locale={locale}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t('seeAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-border/60">
              {view.atRiskTop.map((item) => {
                const days = daysUntil(item.expires_at);
                return (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${
                        item.severity === 'expired'
                          ? 'bg-red-500'
                          : item.severity === 'critical'
                          ? 'bg-amber-500'
                          : 'bg-yellow-400'
                      }`}
                    />
                    <ProductAvatar
                      imageUrl={item.product.image_url}
                      category={item.product.category}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.remaining_quantity.toFixed(2)} {item.product.base_unit}
                        {' · '}
                        {item.severity === 'expired'
                          ? t('severity.expired')
                          : days <= 0
                          ? t('expiresToday')
                          : days === 1
                          ? t('expiresTomorrow')
                          : t('expiresInDays', { days })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrencyPLN(
                        locale,
                        (item.remaining_quantity * item.price_per_unit_cents) / 100,
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Saved recipes — quick "cook today" shortcut for the top 4 latest. */}
      {state.kind === 'ready' && state.recipes.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="text-base font-bold">{t('savedRecipesTitle')}</h2>
              <Link
                href="/app/my-dishes"
                locale={locale}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t('seeAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
              {state.recipes.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.image_url}
                          alt={r.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Heart className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-tight">
                        {r.name}
                      </p>
                      {r.cost_per_serving_cents !== null &&
                        r.cost_per_serving_cents !== undefined && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatCurrencyPLN(locale, r.cost_per_serving_cents / 100)}
                          </p>
                        )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setCookTarget(r)}
                    className="w-full"
                  >
                    <CookingPot className="mr-1.5 h-3.5 w-3.5" />
                    {t('cook')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No-dishes nudge */}
      {view.hasInventory && !view.hasDishes && (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold">{t('noDishesTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('noDishesBody')}</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/app/my-dishes" locale={locale}>
                {t('openMyDishes')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <CookDialog recipe={cookTarget} onClose={() => setCookTarget(null)} />
    </div>
  );
}
