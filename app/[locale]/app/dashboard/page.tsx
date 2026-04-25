import { setRequestLocale } from 'next-intl/server';
import { DashboardClient } from './_components/DashboardClient';

/**
 * Dashboard — first screen of the cabinet.
 * Server component just resolves locale; the live data fetch
 * runs client-side because the JWT lives in localStorage.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardClient locale={locale} />;
}
