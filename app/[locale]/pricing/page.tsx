import { notFound, redirect } from 'next/navigation';
import { isLocale, localPath } from '@/lib/i18n';

/* Prices are announced at release; until then the old address leads to the download page,
   which says when Monge can be downloaded. Temporary (307): the page comes back with prices. */
export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(localPath(locale, '/download'));
}
