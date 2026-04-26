import { setRequestLocale } from 'next-intl/server';
import { SettingsClient } from './_components/SettingsClient';

/**
 * Settings — global app preferences (UI language, …).
 * Server component just resolves locale; the client mutates
 * `/api/profile/language` and triggers a hard locale switch.
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsClient locale={locale} />;
}
