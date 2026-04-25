'use client';

/**
 * Bottom tab bar for /app/* on mobile.
 * Shows the 4 most-used destinations (the rest live behind ⋯ later).
 */
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { LayoutDashboard, Package, ChefHat, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type Tab = { href: string; labelKey: string; icon: LucideIcon };

const TABS: Tab[] = [
  { href: '/app/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/app/inventory', labelKey: 'inventory', icon: Package },
  { href: '/app/cook', labelKey: 'cook', icon: ChefHat },
  { href: '/app/my-dishes', labelKey: 'myDishes', icon: Heart },
];

export function MobileAppNav({ locale }: { locale: string }) {
  const t = useTranslations('app.nav');
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2 py-1.5">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                locale={locale}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {t(tab.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
