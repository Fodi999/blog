import { setRequestLocale } from 'next-intl/server';
import { ProfileClient } from './_components/ProfileClient';

/**
 * /app/profile — thin server wrapper.
 * Live data is fetched client-side because the JWT lives in localStorage.
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileClient locale={locale} />;
}
