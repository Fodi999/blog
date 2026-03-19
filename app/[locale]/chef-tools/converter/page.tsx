import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { ChevronLeft } from 'lucide-react';
import { type UnitGroups } from './ConverterClient';
import { QuickExamplesClient } from './QuickExamplesClient';
import { type IngredientOption, type I18nIngConverter } from './IngredientConverterClient';
import { KitchenConverterTabs } from './KitchenConverterTabs';
import { getUnits } from './action';
import { JsonLd } from '@/components/JsonLd';
import { fetchIngredients } from '@/lib/api';
import { ChefToolsNav } from '../ChefToolsNav';

export const revalidate = 300;

export function generateStaticParams() {
  return [{ locale: 'pl' }, { locale: 'en' }, { locale: 'ru' }, { locale: 'uk' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('tools.converter.title'),
    description: t('tools.converter.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools/converter',
  });
}

export default async function ConverterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  // Load localized unit groups from API + ingredient list in parallel
  const [apiUnits, allIngredients] = await Promise.all([
    getUnits(locale),
    fetchIngredients(),
  ]);
  const groups: UnitGroups | undefined = apiUnits ?? undefined;

  // Build ingredient list for the smart converter
  const nameKey = `name_${locale}` as 'name_en' | 'name_pl' | 'name_ru' | 'name_uk';
  const ingredientOptions: IngredientOption[] = (allIngredients ?? []).map((item) => ({
    slug:   item.slug ?? item.name,
    name:   item[nameKey] ?? item.name_en ?? item.name,
    nameEn: item.name_en ?? item.name,
    image:  item.image_url ?? null,
  }));

  const ingI18n: I18nIngConverter = {
    title:                 t('tools.ingredientConverter.title'),
    description:           t('tools.ingredientConverter.description'),
    ingredientPlaceholder: t('tools.ingredientConverter.ingredientPlaceholder'),
    valuePlaceholder:      t('tools.ingredientConverter.valuePlaceholder'),
    selectUnit:            t('tools.ingredientConverter.selectUnit'),
    noIngredient:          t('tools.ingredientConverter.noIngredient'),
    noResult:              t('tools.ingredientConverter.noResult'),
    result:                t('tools.ingredientConverter.result'),
    allUnits:              t('tools.ingredientConverter.allUnits'),
    kcal:                  t('tools.ingredientConverter.kcal'),
    protein:               t('tools.ingredientConverter.protein'),
    fat:                   t('tools.ingredientConverter.fat'),
    carbs:                 t('tools.ingredientConverter.carbs'),
    per:                   t('tools.ingredientConverter.per'),
    searchNoResults:       t('tools.ingredientConverter.searchNoResults'),
    quickIngredients:      t('tools.ingredientConverter.quickIngredients'),
    popularQueries:        t('tools.ingredientConverter.popularQueries'),
    density:               t('tools.ingredientConverter.density'),
    nutritionResult:       t('tools.ingredientConverter.nutritionResult'),
    contains:              t('tools.ingredientConverter.contains'),
    microtrust:            t('tools.ingredientConverter.microtrust'),
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-24">
      <ChefToolsNav 
        locale={locale} 
        translations={{
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
            ingredientsCatalog: { title: t('ingredients.catalog.title') },
          }
        }} 
      />
      {/* Header — same style as /blog and tools home */}
      <div className="mb-8 sm:mb-12 border-t border-primary/20 pt-6 sm:pt-10">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground leading-tight sm:leading-[0.9] mb-2 sm:mb-4">
          {t('tools.converter.title')}<span className="text-primary">.</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium mb-6 sm:mb-12">
          {t('tools.converter.description')}
        </p>
      </div>

      <KitchenConverterTabs
        groups={groups}
        ingredients={ingredientOptions}
        i18n={ingI18n}
        labels={{
          tabIngredients: t('tools.converter.tabIngredients'),
          tabMass:        t('tools.converter.tabMass'),
          tabVolume:      t('tools.converter.tabVolume'),
        }}
      />

      {/* FAQ JsonLd */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (t.raw('tools.converter.faq.items') as Array<{ q: string; a: string }>).map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }} />

      {/* How-to */}
      <section className="mt-8 sm:mt-20">
        <h2 className="text-lg sm:text-2xl font-black tracking-tight uppercase italic mb-4 sm:mb-5">
          {t('tools.converter.howToUse.title')}<span className="text-primary">.</span>
        </h2>
        <ol className="space-y-2.5 sm:space-y-3">
          {(t.raw('tools.converter.howToUse.steps') as string[]).map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 sm:gap-4">
              <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground font-black text-[10px] sm:text-sm flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-xs sm:text-base font-medium text-foreground pt-0.5 sm:pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* For whom */}
      <section className="mt-8 sm:mt-14 border-2 border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8">
        <h2 className="text-lg sm:text-2xl font-black tracking-tight uppercase italic mb-3 sm:mb-5">
          {t('tools.converter.forWhom.title')}<span className="text-primary">.</span>
        </h2>
        <ul className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-5">
          {(t.raw('tools.converter.forWhom.items') as string[]).map((item) => (
            <li
              key={item}
              className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary font-bold text-[10px] sm:text-sm uppercase tracking-wide"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs sm:text-base text-muted-foreground font-medium leading-relaxed">
          {t('tools.converter.forWhom.text')}
        </p>
      </section>

      <QuickExamplesClient
        title={t('tools.converter.quickExamples.title')}
        items={t.raw('tools.converter.quickExamples.items') as Array<{ label: string; value: string; from: string; to: string }>}
      />

      {/* SEO text */}
      <section className="mt-8 sm:mt-16 border-t border-border/40 pt-6 sm:pt-12">
        <h2 className="text-lg sm:text-2xl font-black tracking-tight uppercase italic mb-4 sm:mb-5">
          {t('tools.converter.seoText.title')}<span className="text-primary">.</span>
        </h2>
        <div className="space-y-2.5 sm:space-y-4 text-xs sm:text-base text-muted-foreground font-medium leading-relaxed">
          <p>{t('tools.converter.seoText.p1')}</p>
          <p>{t('tools.converter.seoText.p2')}</p>
          <p>{t('tools.converter.seoText.p3')}</p>
          <p>{t('tools.converter.seoText.p4')}</p>
        </div>
      </section>

      {/* FAQ visible */}
      <section className="mt-8 sm:mt-14 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-black tracking-tight uppercase italic mb-4 sm:mb-5">
          {t('tools.converter.faq.title')}<span className="text-primary">.</span>
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {(t.raw('tools.converter.faq.items') as Array<{ q: string; a: string }>).map(({ q, a }) => (
            <details
              key={q}
              className="group border-2 border-border/60 rounded-xl sm:rounded-2xl overflow-hidden"
            >
              <summary className="flex items-start justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 cursor-pointer font-black text-[11px] sm:text-sm uppercase tracking-wide select-none hover:bg-muted/40 transition-colors">
                <span className="leading-snug">{q}</span>
                <span className="flex-shrink-0 text-primary text-lg sm:text-xl leading-none group-open:rotate-45 transition-transform mt-0.5">+</span>
              </summary>
              <p className="px-3 sm:px-6 pb-3 sm:pb-5 pt-1.5 sm:pt-2 text-muted-foreground font-medium leading-relaxed text-[11px] sm:text-sm border-t border-border/40">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing SEO text */}
      <section className="mt-8 sm:mt-14 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-black tracking-tight uppercase italic mb-3 sm:mb-4">
          {t('tools.converter.closingText.title')}<span className="text-primary">.</span>
        </h2>
        <p className="text-xs sm:text-base text-muted-foreground font-medium leading-relaxed">
          {t('tools.converter.closingText.text')}
        </p>
      </section>
    </div>
  );
}
