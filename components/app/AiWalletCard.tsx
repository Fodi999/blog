'use client';

/**
 * AI Wallet card — dashboard widget that shows the user's action balance.
 *
 * Layout (per UX spec):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ AI WALLET                       Available • 127           │
 *   │                                                            │
 *   │ Purchased total: 200    Used: 73                          │
 *   │ [████████████──────]  127 / 200                           │
 *   │                                                            │
 *   │ +20 bonus credits     [ Top up ]   History                │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Data is fetched lazily in the parent (DashboardClient) and passed
 * down as `view`. If `view` is null the card renders a skeleton.
 */
import { useTranslations } from 'next-intl';
import { Wallet, Coins, History, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { WalletView } from '@/lib/usage';

interface Props {
  view: WalletView | null;
  locale: string;
  /** Optional: where the "History" link points. Default `/app/settings/wallet-history`. */
  historyHref?: string;
}

export function AiWalletCard({ view, locale, historyHref = '/app/settings/wallet-history' }: Props) {
  const t = useTranslations('app.wallet');

  if (!view) {
    return (
      <Card className="border-border/60">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { availableNow, purchasedTotal, usedTotal, bonusActions, remainingPercent, isEmpty, isLow } = view;
  const realPurchased = Math.max(0, purchasedTotal - bonusActions);

  // Bar accent colour follows balance state (mirrors health-score block).
  const barColor = isEmpty
    ? 'bg-red-500'
    : isLow
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const badgeColor = isEmpty
    ? 'bg-red-500/10 text-red-700 dark:text-red-400'
    : isLow
    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="space-y-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('title')}
            </span>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
              badgeColor,
            )}
          >
            <Sparkles className="h-3 w-3" />
            {t('availableBadge', { count: availableNow })}
          </span>
        </div>

        {/* Big number */}
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black tracking-tight sm:text-4xl">
            {availableNow.toLocaleString(locale)}
          </p>
          <p className="text-sm font-medium text-muted-foreground">{t('actionsAvailable')}</p>
        </div>

        {/* Breakdown — 4 lines mirroring backend ledger */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-border/40 bg-muted/30 p-3 text-xs font-semibold">
          <span className="text-muted-foreground">{t('realPurchased')}</span>
          <span className="text-right tabular-nums text-foreground">
            {realPurchased.toLocaleString(locale)}
          </span>
          <span className="text-muted-foreground">{t('bonus')}</span>
          <span className="text-right tabular-nums text-amber-700 dark:text-amber-400">
            +{bonusActions.toLocaleString(locale)}
          </span>
          <span className="border-t border-border/40 pt-1.5 text-muted-foreground">
            {t('grantedTotal')}
          </span>
          <span className="border-t border-border/40 pt-1.5 text-right tabular-nums text-foreground">
            {purchasedTotal.toLocaleString(locale)}
          </span>
          <span className="text-muted-foreground">{t('used')}</span>
          <span className="text-right tabular-nums text-foreground">
            −{usedTotal.toLocaleString(locale)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
          <p className="text-right text-[11px] font-semibold text-muted-foreground tabular-nums">
            {availableNow.toLocaleString(locale)} / {purchasedTotal.toLocaleString(locale)}
          </p>
        </div>

        {/* Footer: actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <Button asChild size="sm" variant="ghost">
            <Link href={historyHref} locale={locale}>
              <History className="mr-1.5 h-3.5 w-3.5" />
              {t('history')}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/pricing" locale={locale}>
              <Coins className="mr-1.5 h-3.5 w-3.5" />
              {t('topUp')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
