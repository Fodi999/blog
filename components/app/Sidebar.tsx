'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import {
  LayoutDashboard,
  Package,
  Heart,
  Settings,
  LogOut,
  User as UserIcon,
  Calendar,
  Coins,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Boxes,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logout, getCurrentUser, type StoredUser } from '@/lib/auth-client';
import { api } from '@/lib/chefos-api';
import type { MeResponse } from '@/lib/chefos-types';
import { cn } from '@/lib/utils';
import { useCopilot } from '@/components/copilot/CopilotProvider';

type NavItem = { href: string; labelKey: string; icon: LucideIcon };

/**
 * Top-level navigation. Kept in lock-step with iOS `MainTabView` and the
 * mobile bottom bar (`MobileAppNav`) so users see the same sections on
 * every device. iOS bundles cook/stock under "Recipes" and Settings
 * inside Profile; on the web they get their own routes for screen
 * real-estate, but the underlying data is the same.
 *
 * NOTE: "Chat / Assistant" is no longer a top-level entry — Copilot is
 * mounted as the right rail of every page (see `<CopilotPanel />`),
 * and the legacy `/app/chat` route stays available as a fullscreen
 * fallback but is reachable from the rail's expand button.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/app/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/app/inventory', labelKey: 'inventory', icon: Package },
  { href: '/app/scene', labelKey: 'scene', icon: Boxes },
  { href: '/app/cook-now', labelKey: 'cookNow', icon: Sparkles },
  { href: '/app/my-dishes', labelKey: 'myDishes', icon: Heart },
  { href: '/app/plan', labelKey: 'plan', icon: Calendar },
  { href: '/app/profile', labelKey: 'profile', icon: UserIcon },
  { href: '/app/settings', labelKey: 'settings', icon: Settings },
  { href: '/pricing', labelKey: 'topUp', icon: Coins },
];

export function Sidebar({ locale, className }: { locale: string; className?: string }) {
  const t = useTranslations('app.nav');
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [stored, setStored] = useState<StoredUser | null>(null);

  useEffect(() => {
    setStored(getCurrentUser());
    let cancelled = false;
    api
      .get<MeResponse>('/api/me')
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        /* sidebar gracefully falls back to stored email */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onLogout() {
    logout();
    router.push('/login');
  }

  const displayName = me?.user.display_name?.trim() || me?.user.email || stored?.email || '—';
  const restaurant = me?.tenant.name || t('workspace');
  const initial = displayName.charAt(0).toUpperCase();
  const { sidebarCollapsed, setSidebarCollapsed } = useCopilot();

  return (
    <aside
      className={cn(
        // Lives inside the fixed-viewport AppShell grid: just fill the cell.
        'flex h-full flex-col border-r border-border/60 bg-background',
        sidebarCollapsed ? 'p-2' : 'p-3',
        className,
      )}
    >
      <Link
        href="/app/profile"
        locale={locale}
        className={cn(
          'flex items-center rounded-xl transition-colors hover:bg-muted',
          sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-3',
        )}
        title={sidebarCollapsed ? `${restaurant} · ${displayName}` : undefined}
      >
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {me?.user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.user.avatar_url}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{restaurant}</p>
            <p className="truncate text-xs text-muted-foreground">{displayName}</p>
          </div>
        )}
      </Link>

      <div className="my-2 h-px bg-border/60" />

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-xl text-sm font-medium transition-colors',
                sidebarCollapsed
                  ? 'justify-center px-2 py-2.5'
                  : 'gap-3 px-3 py-2.5',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        size={sidebarCollapsed ? 'icon' : 'default'}
        className={cn(
          'mt-1 text-muted-foreground hover:text-foreground',
          !sidebarCollapsed && 'justify-start',
        )}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <>
            <PanelLeftClose className="mr-2 h-4 w-4" />
            <span className="text-xs">Collapse</span>
          </>
        )}
      </Button>

      <Button
        variant="ghost"
        size={sidebarCollapsed ? 'icon' : 'default'}
        className={cn(
          'mt-1 text-muted-foreground hover:text-destructive',
          !sidebarCollapsed && 'justify-start',
        )}
        onClick={onLogout}
        title={sidebarCollapsed ? t('logout') : undefined}
        aria-label={t('logout')}
      >
        <LogOut className={cn('h-4 w-4', !sidebarCollapsed && 'mr-2')} />
        {!sidebarCollapsed && t('logout')}
      </Button>
    </aside>
  );
}
