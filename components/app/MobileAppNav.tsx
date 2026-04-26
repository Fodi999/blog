'use client';

/**
 * Bottom tab bar for /app/* on mobile.
 *
 * Mirrors iOS `MainTabView` (Recipes / Plan / Chat / Profile) as closely
 * as the web split allows: Dashboard + Inventory replace iOS Recipes,
 * My Dishes is the saved-recipes shelf, Chat is the assistant, and
 * Profile holds the account (Settings is a sub-page on /app/profile).
 */
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type Tab = { href: string; labelKey: string; icon: LucideIcon };

// Mobile bar holds the 5 daily-use sections. Profile/Settings live in the
// sidebar avatar (desktop) and on /app/profile via Dashboard links (mobile).
const TABS: Tab[] = [
  { href: '/app/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/app/inventory', labelKey: 'inventory', icon: Package },
  { href: '/app/plan', labelKey: 'plan', icon: Calendar },
  { href: '/app/my-dishes', labelKey: 'myDishes', icon: Heart },
  { href: '/app/chat', labelKey: 'chat', icon: MessageCircle },
];

export function MobileAppNav({ locale }: { locale: string }) {
  const t = useTranslations('app.nav');
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1.5">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                locale={locale}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{t(tab.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
