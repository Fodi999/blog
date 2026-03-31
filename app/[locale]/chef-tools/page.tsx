import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { SousChefClient } from './dashboard/SousChefClient';
import { DashboardClient } from './dashboard/DashboardClient';
import { ChefToolsTabs } from './dashboard/ChefToolsTabs';
import { ChefPageLayout } from './dashboard/ChefPageLayout';

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

      {/* Header fades in centered, then reveals the tools below */}
      <ChefPageLayout title={t('title')} description={t('description')}>
        {/* Tabbed: Sous-Chef (primary) + Recipe Builder (secondary) */}
        <ChefToolsTabs
          sousChef={<SousChefClient />}
          recipeBuilder={<DashboardClient />}
        />
      </ChefPageLayout>

      <div className="h-16 md:h-24" />
    </div>
  );
}
