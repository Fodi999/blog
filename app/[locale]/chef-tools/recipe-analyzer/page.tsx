import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChefToolsNav } from '../ChefToolsNav';
import { RecipeAnalyzerClient } from './RecipeAnalyzerClient';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ra = await getTranslations({ locale, namespace: 'chefTools.tools.recipeAnalyzer' });
  return genMeta({
    title: ra('title') + ' | Chef Tools',
    description: ra('description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools/recipe-analyzer',
  });
}

export default async function RecipeAnalyzerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  const ra = await getTranslations({ locale, namespace: 'chefTools.tools.recipeAnalyzer' });

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
      lab: { title: t('tools.lab.title') },
      recipeAnalyzer: { title: t('tools.recipeAnalyzer.title') },
      flavorPairing: { title: t('tools.flavorPairing.title') },
      nutrition: { title: t('nutrition.title') },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: ra('title'),
          description: ra('description'),
          url: `https://dima-fomin.pl/${locale}/chef-tools/recipe-analyzer`,
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />

      <ChefToolsNav locale={locale} translations={navTranslations} />

      {/* Header */}
      <div className="mb-10 md:mb-14">
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-foreground tracking-tighter uppercase italic">
          {ra('title')}<span className="text-primary">.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium tracking-tight">
          {ra('description')}
        </p>
      </div>

      <RecipeAnalyzerClient />

      {/* SEO text */}
      <section className="mt-20 mb-16 border-t border-border/40 pt-12 max-w-3xl">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4 italic">
          {ra('seoTitle')}
        </h2>
        <div className="prose prose-sm dark:prose-invert text-muted-foreground space-y-3">
          <p>{ra('seoP1')}</p>
          <p>{ra('seoP2')}</p>
          <p>{ra('seoP3')}</p>
          <p>{ra('seoP4')}</p>
          <p>{ra('seoP5')}</p>
        </div>
      </section>
    </div>
  );
}
