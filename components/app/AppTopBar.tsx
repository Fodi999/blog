'use client';

/**
 * AppTopBar — compact internal top bar for /[locale]/app/*.
 * Replaces the marketing Header (which `<ChromeGate />` hides here):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ [logo] ChefOS · <Restaurant>     <Wallet>  <Theme>  <Lang>   │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Stays minimal so the workspace below dominates the screen.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Coins } from 'lucide-react';

import { Link } from '@/i18n/routing';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { api } from '@/lib/chefos-api';
import type { MeResponse } from '@/lib/chefos-types';
import { useCopilot } from '@/components/copilot/CopilotProvider';

export function AppTopBar({ locale }: { locale: string }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const { actionsLeft } = useCopilot();

  useEffect(() => {
    let cancelled = false;
    api
      .get<MeResponse>('/api/me')
      .then((d) => {
        if (!cancelled) setMe(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const restaurant = me?.tenant.name?.trim() || 'Workspace';

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur lg:px-6">
      <Link
        href="/app/dashboard"
        locale={locale}
        className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
          <Image
            src="https://i.postimg.cc/W1KV4b43/logo1.webp"
            alt="ChefOS"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">ChefOS</p>
          <p className="truncate text-[11px] text-muted-foreground">{restaurant}</p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {actionsLeft !== null && (
          <span
            className="hidden items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex"
            title="AI actions remaining"
          >
            <Coins className="h-3 w-3" />
            <span className="font-medium tabular-nums">{actionsLeft}</span>
          </span>
        )}
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  );
}
