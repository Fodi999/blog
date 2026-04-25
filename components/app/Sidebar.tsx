'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import {
  LayoutDashboard,
  Package,
  ChefHat,
  Heart,
  BookOpen,
  MessageCircle,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logout, getCurrentUser, type StoredUser } from '@/lib/auth-client';
import { api } from '@/lib/chefos-api';
import type { MeResponse } from '@/lib/chefos-types';
import { cn } from '@/lib/utils';

type NavItem = { href: string; labelKey: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: '/app/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/app/inventory', labelKey: 'inventory', icon: Package },
  { href: '/app/cook', labelKey: 'cook', icon: ChefHat },
  { href: '/app/my-dishes', labelKey: 'myDishes', icon: Heart },
  { href: '/app/menu', labelKey: 'menu', icon: BookOpen },
  { href: '/app/chat', labelKey: 'chat', icon: MessageCircle },
  { href: '/app/profile', labelKey: 'profile', icon: UserIcon },
  { href: '/app/settings', labelKey: 'settings', icon: Settings },
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

  return (
    <aside
      className={cn(
        'sticky top-6 flex h-[calc(100vh-3rem)] w-60 flex-shrink-0 flex-col rounded-2xl border border-border/60 bg-background p-3 shadow-sm',
        className,
      )}
    >
      <Link
        href="/app/profile"
        locale={locale}
        className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{restaurant}</p>
          <p className="truncate text-xs text-muted-foreground">{displayName}</p>
        </div>
      </Link>

      <div className="my-2 h-px bg-border/60" />

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        className="mt-2 justify-start text-muted-foreground hover:text-destructive"
        onClick={onLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {t('logout')}
      </Button>
    </aside>
  );
}
