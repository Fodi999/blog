import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChefToolsNav } from '../ChefToolsNav';
import { FlavorPairingClient } from './FlavorPairingClient';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools.tools.flavorPairing' });
  return genMeta({
    title: t('title') + ' | Chef Tools',
    description: t('description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools/flavor-pairing',
  });
}

export default async function FlavorPairingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  const fp = await getTranslations({ locale, namespace: 'chefTools.tools.flavorPairing' });

  const navTranslations = {
    back: t('back'),
    tabs: {
      tools: t('tabs.tools'),
      tables: t('tabs.tables'),
      products: t('tabs.products'),
    },
    tools: {
      converter: { title: t('tools.converter.title') },
      fishSeason: { title: t('tools.fishSeason.title') },
      ingredientAnalyzer: { title: t('tools.ingredientAnalyzer.title') },
      ingredientsCatalog: { title: t('tools.ingredientsCatalog.title') },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: fp('title'),
          description: fp('description'),
          url: `https://dima-fomin.pl/${locale}/chef-tools/flavor-pairing`,
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />

      <ChefToolsNav locale={locale} translations={navTranslations} />

      {/* Header */}
      <div className="mb-10 md:mb-14">
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-foreground tracking-tighter uppercase italic">
          {fp('title')}<span className="text-primary">.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium tracking-tight">
          {fp('description')}
        </p>
      </div>

      <FlavorPairingClient />

      {/* SEO text */}
      <section className="mt-20 mb-16 border-t border-border/40 pt-12 max-w-3xl">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4 italic">
          {fp('seoTitle')}
        </h2>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground space-y-3">
          <p>{fp('seoP1')}</p>
          <ul>
            <li><strong>{fp('seoFlavor')}</strong></li>
            <li><strong>{fp('seoNutrition')}</strong></li>
            <li><strong>{fp('seoCulinary')}</strong></li>
          </ul>
          <p>{fp('seoP2')}</p>
          <p>{fp('seoP3')}</p>
          <p>{fp('seoP4')}</p>
        </div>
      </section>
    </div>
  );
}
