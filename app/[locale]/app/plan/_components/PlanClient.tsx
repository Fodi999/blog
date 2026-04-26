'use client';

/**
 * Plan / Meal Plan page — feature-mirror of iOS `PlanView`.
 *
 * Supports three modes (Day / Week / Month) with the same data model:
 * a `Map<isoDate, MealPlanDay>` is hydrated from `/api/meal-plan?from&to`
 * for the visible range. Day & Week share the current week strip;
 * Month shows a 6×7 calendar grid with meal-fill dots.
 *
 * Endpoints (graceful — 404/501 means backend rolling out):
 *   GET    /api/meal-plan?from=YYYY-MM-DD&to=YYYY-MM-DD  → MealPlanRangeResponse
 *   PUT    /api/meal-plan/:date                          → MealPlanDay (upsert)
 *   DELETE /api/meal-plan/:date/:slot                    → 204
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  CookingPot,
  Calendar as CalendarIcon,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
} from 'lucide-react';

import { api, ApiError } from '@/lib/chefos-api';
import { removeRecipeFromPlan } from '@/lib/chefos-mutations';
import { useChefOSSync } from '@/lib/chefos-store';
import {
  MEAL_SLOTS,
  type MealPlanDay,
  type MealPlanRangeResponse,
  type MealSlot,
} from '@/lib/chefos-types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';

// ── Helpers ─────────────────────────────────────────────────────────────────

type PlanMode = 'day' | 'week' | 'month';

function isoOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date): Date {
  // ISO Monday-start week.
  const x = startOfDay(d);
  const dow = x.getDay();
  const diff = (dow + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}
function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function buildWeek(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
/** 6×7 = 42 cells starting at the Monday on/before the 1st of the month. */
function buildMonthGrid(visibleMonth: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(visibleMonth));
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

// Targets — match iOS `PlanViewModel`.
const TARGET_KCAL = 2200;
const TARGET_PROTEIN = 140;
const TARGET_BUDGET = 25;

// ── State ───────────────────────────────────────────────────────────────────

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; days: Map<string, MealPlanDay> };

// ── Component ───────────────────────────────────────────────────────────────

export function PlanClient({ locale }: { locale: string }) {
  const t = useTranslations('app.plan');
  const [today] = useState(() => startOfDay(new Date()));
  const [mode, setMode] = useState<PlanMode>('day');
  const [selectedIso, setSelectedIso] = useState<string>(isoOf(today));
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(today));
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const week = useMemo(() => buildWeek(startOfWeek(today)), [today]);

  // Range we query depends on mode so Month can preview neighbouring weeks.
  const range = useMemo(() => {
    if (mode === 'month') {
      const grid = buildMonthGrid(visibleMonth);
      return { from: isoOf(grid[0]), to: isoOf(grid[grid.length - 1]) };
    }
    return { from: isoOf(week[0]), to: isoOf(week[week.length - 1]) };
  }, [mode, visibleMonth, week]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState({ kind: 'loading' });
      setRefreshing(true);
      try {
        const params = new URLSearchParams({ from: range.from, to: range.to });
        const res = await api.get<MealPlanRangeResponse>(
          `/api/meal-plan?${params}`,
        );
        const map = new Map<string, MealPlanDay>();
        for (const d of res.days ?? []) map.set(d.date, d);
        setState({ kind: 'ready', days: map });
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
          setState({ kind: 'ready', days: new Map() });
        } else {
          setState({
            kind: 'error',
            message: e instanceof Error ? e.message : t('errorBody'),
          });
        }
      } finally {
        setRefreshing(false);
      }
    },
    [range, t],
  );

  useEffect(() => {
    load();
  }, [load]);

  useChefOSSync('plan', () => load(true), 30_000);

  // ── Day-mode derived ────────────────────────────────────────────────────
  const dayMeals = useMemo<Record<MealSlot, MealPlanDay['meals'][number] | null>>(() => {
    const empty: Record<MealSlot, MealPlanDay['meals'][number] | null> = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snack: null,
    };
    if (state.kind !== 'ready') return empty;
    const day = state.days.get(selectedIso);
    if (!day) return empty;
    for (const m of day.meals) empty[m.slot] = m;
    return empty;
  }, [state, selectedIso]);

  const filledCount = useMemo(
    () => Object.values(dayMeals).filter((m) => m?.recipe).length,
    [dayMeals],
  );

  const totals = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    let cost = 0;
    for (const m of Object.values(dayMeals)) {
      if (!m?.recipe) continue;
      kcal += m.recipe.calories ?? 0;
      protein += m.recipe.protein ?? 0;
      cost += m.recipe.estimated_cost ?? 0;
    }
    return { kcal, protein, cost };
  }, [dayMeals]);

  async function onRemove(slot: MealSlot) {
    try {
      await removeRecipeFromPlan(selectedIso, slot);
      toast.success(t('toastRemoved'));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('errorBody'));
    }
  }

  // ── Header ─────────────────────────────────────────────────────────────
  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black tracking-tight lg:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => load(true)}
        disabled={refreshing}
      >
        <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
        {t('refresh')}
      </Button>
    </header>
  );

  // ── Mode segmented (mirrors iOS PlanHeader) ────────────────────────────
  const modeControl = (
    <div className="inline-flex w-full rounded-xl border border-border/60 bg-muted/40 p-1 sm:w-auto">
      {(
        [
          { id: 'day' as const, label: t('mode.day'), Icon: CalendarDays },
          { id: 'week' as const, label: t('mode.week'), Icon: CalendarRange },
          { id: 'month' as const, label: t('mode.month'), Icon: LayoutGrid },
        ]
      ).map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );

  if (state.kind === 'loading') {
    return (
      <div className="space-y-6">
        {header}
        {modeControl}
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="space-y-6">
        {header}
        {modeControl}
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-base font-semibold">{t('errorTitle')}</h2>
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <Button onClick={() => load()}>{t('retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = state.days;
  const isWeekEmpty = days.size === 0;

  // ── Day strip (Day & Week modes) ───────────────────────────────────────
  const dayStrip = (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
      {week.map((d) => {
        const iso = isoOf(d);
        const active = iso === selectedIso;
        const isToday = iso === isoOf(today);
        const day = days.get(iso);
        const filled = day?.meals.filter((m) => m.recipe).length ?? 0;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => setSelectedIso(iso)}
            className={cn(
              'flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/60 bg-background hover:bg-muted',
            )}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
              {d.toLocaleDateString(locale, { weekday: 'short' })}
            </span>
            <span className="text-xl font-black tabular-nums leading-tight">
              {d.getDate()}
            </span>
            <span className="mt-1 flex h-1.5 items-center gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    i < filled
                      ? active
                        ? 'bg-primary-foreground'
                        : 'bg-primary'
                      : active
                        ? 'bg-primary-foreground/30'
                        : 'bg-border',
                  )}
                />
              ))}
            </span>
            {isToday && !active && (
              <span className="mt-1 text-[9px] font-bold uppercase tracking-wide text-primary">
                {t('today')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const emptyBanner = (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {t('emptyTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('emptyBody')}</p>
        </div>
        <Button asChild>
          <Link href="/app/my-dishes" locale={locale}>
            <CookingPot className="mr-2 h-4 w-4" />
            {t('emptyCta')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  // ── DAY MODE ──────────────────────────────────────────────────────────
  if (mode === 'day') {
    return (
      <div className="space-y-6">
        {header}
        {modeControl}
        {isWeekEmpty && emptyBanner}
        {dayStrip}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label={t('summary.meals')}
            value={`${filledCount}/4`}
            progress={filledCount / 4}
          />
          <Stat
            label={t('summary.kcal')}
            value={totals.kcal ? `${totals.kcal}` : '—'}
            progress={totals.kcal / TARGET_KCAL}
          />
          <Stat
            label={t('summary.protein')}
            value={totals.protein ? `${totals.protein} g` : '—'}
            progress={totals.protein / TARGET_PROTEIN}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {MEAL_SLOTS.map((slot) => {
            const meal = dayMeals[slot];
            return (
              <Card key={slot} className="overflow-hidden">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t(`slots.${slot}`)}
                    </span>
                    {meal?.recipe && (
                      <button
                        type="button"
                        onClick={() => onRemove(slot)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t('remove')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {meal?.recipe ? (
                    <div className="space-y-1">
                      <p className="text-base font-semibold leading-tight">
                        {meal.recipe.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {meal.recipe.calories
                          ? `${meal.recipe.calories} kcal · `
                          : ''}
                        {meal.recipe.protein
                          ? `${meal.recipe.protein} g · `
                          : ''}
                        {meal.recipe.estimated_cost
                          ? meal.recipe.estimated_cost.toFixed(2)
                          : '—'}
                      </p>
                    </div>
                  ) : (
                    <Link
                      href="/app/my-dishes"
                      locale={locale}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <CookingPot className="h-4 w-4" />
                      {t('addFromMyDishes')}
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── WEEK MODE ─────────────────────────────────────────────────────────
  if (mode === 'week') {
    let weekKcal = 0;
    let weekFilled = 0;
    let weekDaysCompleted = 0;
    for (const d of week) {
      const day = days.get(isoOf(d));
      if (!day) continue;
      const f = day.meals.filter((m) => m.recipe);
      weekFilled += f.length;
      weekKcal += f.reduce((s, m) => s + (m.recipe?.calories ?? 0), 0);
      if (f.length === 4) weekDaysCompleted += 1;
    }
    return (
      <div className="space-y-6">
        {header}
        {modeControl}
        {isWeekEmpty && emptyBanner}
        {dayStrip}
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t('summary.completedDays')} value={`${weekDaysCompleted}/7`} />
          <Stat label={t('summary.filledMeals')} value={`${weekFilled}/28`} />
          <Stat label={t('summary.kcalWeek')} value={weekKcal ? `${weekKcal}` : '—'} />
        </div>
        <div className="space-y-2">
          {week.map((d) => {
            const iso = isoOf(d);
            const day = days.get(iso);
            const isToday = iso === isoOf(today);
            return (
              <Card
                key={iso}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  isToday && 'border-primary/40',
                )}
                onClick={() => {
                  setSelectedIso(iso);
                  setMode('day');
                }}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="flex w-12 flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      {d.toLocaleDateString(locale, { weekday: 'short' })}
                    </span>
                    <span className="text-xl font-black tabular-nums">
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                    {MEAL_SLOTS.map((slot) => {
                      const m = day?.meals.find((x) => x.slot === slot);
                      return (
                        <div
                          key={slot}
                          className={cn(
                            'min-w-0 rounded-md border px-2 py-1.5',
                            m?.recipe
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-dashed border-border/60 bg-muted/30',
                          )}
                        >
                          <p className="truncate text-[10px] font-bold uppercase text-muted-foreground">
                            {t(`slots.${slot}`)}
                          </p>
                          <p
                            className={cn(
                              'truncate text-xs',
                              m?.recipe
                                ? 'font-semibold text-foreground'
                                : 'text-muted-foreground/60',
                            )}
                          >
                            {m?.recipe?.title ?? '—'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── MONTH MODE ────────────────────────────────────────────────────────
  const monthGrid = buildMonthGrid(visibleMonth);
  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfWeek(today), i);
    return d.toLocaleDateString(locale, { weekday: 'narrow' });
  });
  const monthTitle = visibleMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const daysInMonth = monthGrid.filter(
    (d) => d.getMonth() === visibleMonth.getMonth(),
  );
  const filledMonthDays = daysInMonth.filter((d) => {
    const day = days.get(isoOf(d));
    return day?.meals.some((m) => m.recipe);
  }).length;

  return (
    <div className="space-y-6">
      {header}
      {modeControl}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('prevMonth')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-bold capitalize">{monthTitle}</h2>
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('nextMonth')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdayHeaders.map((w, i) => (
              <span
                key={i}
                className="py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
              >
                {w}
              </span>
            ))}
            {monthGrid.map((d) => {
              const iso = isoOf(d);
              const inMonth = d.getMonth() === visibleMonth.getMonth();
              const isToday = iso === isoOf(today);
              const isSelected = iso === selectedIso;
              const day = days.get(iso);
              const filled = day?.meals.filter((m) => m.recipe).length ?? 0;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setSelectedIso(iso);
                    setMode('day');
                  }}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-xs transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isToday
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-transparent hover:bg-muted',
                    !inMonth && 'opacity-30',
                  )}
                >
                  <span className="font-semibold tabular-nums leading-none">
                    {d.getDate()}
                  </span>
                  <span className="mt-1 flex h-1 items-center gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1 w-1 rounded-full',
                          i < filled
                            ? isSelected
                              ? 'bg-primary-foreground'
                              : 'bg-primary'
                            : 'bg-transparent',
                        )}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label={t('summary.monthFilledDays')}
          value={`${filledMonthDays}/${daysInMonth.length}`}
          progress={filledMonthDays / Math.max(daysInMonth.length, 1)}
        />
        <Stat
          label={t('summary.budget')}
          value={`${TARGET_BUDGET}/${t('day')}`}
        />
      </div>
    </div>
  );
}

// ── tiny presentational ─────────────────────────────────────────────────────

function Stat({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress?: number;
}) {
  const pct =
    typeof progress === 'number'
      ? Math.max(0, Math.min(1, progress)) * 100
      : null;
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-black tabular-nums">{value}</p>
      {pct !== null && (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
