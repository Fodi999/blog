import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { DashboardClient } from './dashboard/DashboardClient';

export const revalidate = 300; // ISR: 5 min

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools',
  });
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function ChefToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Schema.org */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: t('title'),
          description: t('description'),
          url: `https://dima-fomin.pl/${locale}/chef-tools`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Dima Fomin',
            url: 'https://dima-fomin.pl',
          },
        }}
      />

      {/* Header */}
      <div className="mb-8 sm:mb-12 md:mb-16 border-t border-primary/20 pt-8 sm:pt-12">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 text-foreground tracking-tighter uppercase italic text-balance break-words">
          {t('title')}<span className="text-primary">.</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium tracking-tight text-balance break-words">
          {t('description')}
        </p>
      </div>

      {/* Dashboard */}
      <DashboardClient />

      <div className="h-16 md:h-24" />
    </div>
  );
}
