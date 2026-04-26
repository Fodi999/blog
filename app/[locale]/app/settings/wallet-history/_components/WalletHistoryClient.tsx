'use client';

/**
 * Wallet history — full ledger of credits & debits.
 *
 * Each row uses a stable `source` string the i18n layer translates
 * (welcome_bonus, weekly_bonus, iap, promo for credits;
 * generate_plan, create_recipe, scan_receipt, optimize_day, ai_chat for debits).
 *
 * Rows are grouped by calendar day for readability.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/chefos-api';
import {
  buildWalletView,
  getUsageHistory,
  getUsageToday,
  type WalletTransaction,
  type WalletView,
} from '@/lib/usage';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; transactions: WalletTransaction[]; view: WalletView | null };

interface DayGroup {
  date: string; // ISO yyyy-mm-dd
  rows: WalletTransaction[];
}

function groupByDay(rows: WalletTransaction[]): DayGroup[] {
  const map = new Map<string, WalletTransaction[]>();
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const arr = map.get(day) ?? [];
    arr.push(r);
    map.set(day, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, rs]) => ({ date, rows: rs }));
}

interface Props {
  locale: string;
}

export function WalletHistoryClient({ locale }: Props) {
  const t = useTranslations('app.walletHistory');
  const tw = useTranslations('app.wallet');

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState({ kind: 'loading' });
      setRefreshing(true);
      try {
        const [history, today] = await Promise.all([
          getUsageHistory(200),
          getUsageToday().catch(() => null),
        ]);
        const view = today ? buildWalletView(today) : null;
        setState({ kind: 'ready', transactions: history.transactions, view });
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
    void load();
  }, [load]);

  const groups = useMemo(
    () => (state.kind === 'ready' ? groupByDay(state.transactions) : []),
    [state],
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    [locale],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }),
    [locale],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
              <Link href="/app/dashboard" locale={locale}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                {t('back')}
              </Link>
            </Button>
          </div>
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
          <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
          {t('refresh')}
        </Button>
      </header>

      {/* Summary header from /usage/today */}
      {state.kind === 'ready' && state.view && (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="flex flex-wrap items-end justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {tw('title')}
                </p>
                <p className="text-2xl font-black tracking-tight">
                  {state.view.availableNow.toLocaleString(locale)}{' '}
                  <span className="text-sm font-medium text-muted-foreground">
                    {tw('actionsAvailable')}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold">
              <span className="text-muted-foreground">
                {tw('grantedTotal')}:{' '}
                <span className="text-foreground tabular-nums">
                  {state.view.purchasedTotal.toLocaleString(locale)}
                </span>
              </span>
              <span className="text-muted-foreground">
                {tw('used')}:{' '}
                <span className="text-foreground tabular-nums">
                  {state.view.usedTotal.toLocaleString(locale)}
                </span>
              </span>
              <span className="text-amber-700 dark:text-amber-400">
                {tw('bonus')}:{' '}
                <span className="tabular-nums">
                  +{state.view.bonusActions.toLocaleString(locale)}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body */}
      {state.kind === 'loading' && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {state.kind === 'error' && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-semibold text-destructive">{t('errorTitle')}</p>
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <Button variant="outline" size="sm" onClick={() => load()}>
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {state.kind === 'ready' && state.transactions.length === 0 && (
        <Card className="border-dashed border-border/60 bg-muted/20">
          <CardContent className="space-y-2 p-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-semibold">{t('emptyTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('emptyBody')}</p>
            <div className="pt-3">
              <Button asChild size="sm">
                <Link href="/pricing" locale={locale}>
                  {tw('topUp')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state.kind === 'ready' && groups.length > 0 && (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.date}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {dateFormatter.format(new Date(`${g.date}T00:00:00Z`))}
              </h2>
              <Card className="border-border/60">
                <CardContent className="divide-y divide-border/40 p-0">
                  {g.rows.map((tx) => (
                    <Row
                      key={tx.id}
                      tx={tx}
                      time={timeFormatter.format(new Date(tx.created_at))}
                      locale={locale}
                    />
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Row ────────────────────────────────────────────────────────────────────

function Row({ tx, time, locale }: { tx: WalletTransaction; time: string; locale: string }) {
  const t = useTranslations('app.walletHistory.sources');
  const tFree = useTranslations('app.walletHistory');

  const isCredit = tx.kind === 'credit';
  // Free-tier debits don't move the wallet — show them muted with cost = 0.
  const isFreeDebit = !isCredit && tx.paid_from === 'free';

  // Localize source. Falls back to raw key if missing.
  let label: string;
  try {
    label = t(tx.source);
  } catch {
    label = tx.source;
  }

  const Icon = isCredit ? ArrowDownCircle : ArrowUpCircle;
  const accent = isCredit
    ? 'text-emerald-600 dark:text-emerald-400'
    : isFreeDebit
    ? 'text-muted-foreground'
    : 'text-rose-600 dark:text-rose-400';

  const sign = isCredit ? '+' : isFreeDebit ? '' : '−';
  const amount = isFreeDebit ? tFree('freeBadge') : `${sign}${tx.actions.toLocaleString(locale)}`;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0', accent)} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="text-[11px] text-muted-foreground">{time}</p>
        </div>
      </div>
      <span className={cn('text-sm font-bold tabular-nums', accent)}>{amount}</span>
    </div>
  );
}
