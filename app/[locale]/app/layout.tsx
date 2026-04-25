import { cookies } from 'next/headers';
import { redirect } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

import { AppShell } from '@/components/app/AppShell';

/**
 * Protected zone: /[locale]/app/*
 *
 * Server-side cookie check (chefos_session=1).
 * Real auth (JWT) is enforced by the backend on every API call;
 * this cookie is only a fast UX gate so unauthenticated visitors
 * never see the empty cabinet shell.
 */
export default async function AppLayout({
  children,
  params,
}: LayoutProps<'/[locale]/app'>) {
  const { locale } = (await params) as { locale: string };
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const hasSession = cookieStore.get('chefos_session')?.value === '1';

  if (!hasSession) {
    redirect({ href: '/login', locale });
  }

  return <AppShell locale={locale}>{children}</AppShell>;
}
