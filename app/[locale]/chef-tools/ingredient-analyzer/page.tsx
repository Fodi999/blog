import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChevronLeft } from 'lucide-react';
import { fetchIngredientSearch, fetchFishSeasonTable } from '@/lib/api';
// @ts-ignore
import { IngredientAnalyzerClient, type I18n, type SeasonMap } from './IngredientAnalyzerClient';
import { ChefToolsNav } from '../ChefToolsNav';

export const revalidate = 300; // pre-fetched list is stable

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
    title: t('tools.ingredientAnalyzer.title'),
    description: t('tools.ingredientAnalyzer.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools/ingredient-analyzer',
  });
}

export default async function IngredientAnalyzerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  // Pre-fetch full ingredient list + fish season map in parallel
  const [searchData, fishTable] = await Promise.all([
    fetchIngredientSearch('', 'en'),
    fetchFishSeasonTable('en', 'PL'),
  ]);
  const allIngredients = searchData?.items ?? [];

  const seasonMap: SeasonMap = {};
  if (fishTable) {
    for (const fish of fishTable.fish) {
      seasonMap[fish.slug] = fish.status;
    }
  }

  const i18n: I18n = {
    searchPlaceholder: t('ingredientAnalyzer.searchPlaceholder'),
    searchLabel:       t('ingredientAnalyzer.searchLabel'),
    noResults:         t('ingredientAnalyzer.noResults'),
    portionLabel:      t('ingredientAnalyzer.portionLabel'),
    per100g:           t('ingredientAnalyzer.per100g'),
    forAmount:         t('ingredientAnalyzer.forAmount'),
    macros:            t('ingredientAnalyzer.macros'),
    vitamins:          t('ingredientAnalyzer.vitamins'),
    nutritionScore:    t('ingredientAnalyzer.nutritionScore'),
    compareWith:       t('ingredientAnalyzer.compareWith'),
    compareSelect:     t('ingredientAnalyzer.compareSelect'),
    compareTitle:      t('ingredientAnalyzer.compareTitle'),
    winner:            t('ingredientAnalyzer.winner'),
    tie:               t('ingredientAnalyzer.tie'),
    calories:          t('ingredientAnalyzer.calories'),
    protein:           t('ingredientAnalyzer.protein'),
    fat:               t('ingredientAnalyzer.fat'),
    carbs:             t('ingredientAnalyzer.carbs'),
    fiber:             t('ingredientAnalyzer.fiber'),
    sugar:             t('ingredientAnalyzer.sugar'),
    b12:               t('ingredientAnalyzer.b12'),
    vitD:              t('ingredientAnalyzer.vitD'),
    iron:              t('ingredientAnalyzer.iron'),
    magnesium:         t('ingredientAnalyzer.magnesium'),
    kcal:              t('ingredientAnalyzer.kcal'),
    sushiGrade:        t('ingredientAnalyzer.sushiGrade'),
    wild:              t('ingredientAnalyzer.wild'),
    farmed:            t('ingredientAnalyzer.farmed'),
    typicalPortion:    t('ingredientAnalyzer.typicalPortion'),
    inSeasonNow:       t('ingredientAnalyzer.inSeasonNow'),
    peakSeason:        t('ingredientAnalyzer.peakSeason'),
    unitG:             t('ingredientAnalyzer.unitG'),
    unitOz:            t('ingredientAnalyzer.unitOz'),
    unitPortion:       t('ingredientAnalyzer.unitPortion'),
    unitCup:           t('ingredientAnalyzer.unitCup'),
    noVitamins:        t('ingredientAnalyzer.noVitamins'),
    // Table view
    tabTable:                t('ingredientAnalyzer.tabTable'),
    tabAnalyzer:             t('ingredientAnalyzer.tabAnalyzer'),
    tableSearchPlaceholder:  t('ingredientAnalyzer.tableSearchPlaceholder'),
    tableName:               t('ingredientAnalyzer.tableName'),
    allCategories:           t('ingredientAnalyzer.allCategories'),
    categories: {
      vegetables: t('nutrition.categories.vegetables'),
      spices:     t('nutrition.categories.spices'),
      fish:       t('nutrition.categories.fish'),
      fruits:     t('nutrition.categories.fruits'),
      meat:       t('nutrition.categories.meat'),
      dairy:      t('nutrition.categories.dairy'),
      grains:     t('nutrition.categories.grains'),
      sauces:     t('nutrition.categories.sauces'),
      nuts:       t('nutrition.categories.nuts'),
      sweets:     t('nutrition.categories.sweets'),
      drinks:     t('nutrition.categories.drinks'),
      legumes:    t('nutrition.categories.legumes'),
      preserved:  t('nutrition.categories.preserved'),
      oils:       t('nutrition.categories.oils'),
      other:      t('nutrition.categories.other'),
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
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
      <div className="mb-12 border-t border-primary/20 pt-10 text-center md:text-left">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: t('tools.ingredientAnalyzer.title'),
            description: t('tools.ingredientAnalyzer.description'),
            url: `https://dima-fomin.pl/${locale}/chef-tools/ingredient-analyzer`,
            applicationCategory: 'HealthApplication',
          }}
        />

        <Link
          href="/chef-tools"
          className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('back')}
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic leading-tight mb-3">
            {t('tools.ingredientAnalyzer.title')}<span className="text-primary">.</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium max-w-xl">
            {t('tools.ingredientAnalyzer.description')}
          </p>
        </div>
      </div>

      <IngredientAnalyzerClient
        allIngredients={allIngredients}
        i18n={i18n}
        locale={locale}
        seasonMap={seasonMap}
      />

      {/* SEO footer */}
      <div className="mt-16 pt-8 border-t border-border/30 space-y-3">
        <p className="text-xs text-muted-foreground font-medium max-w-2xl">
          {t('ingredientAnalyzer.seoFooter', { count: allIngredients.length })}
        </p>
        <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
          {t('ingredientAnalyzer.updatedLive', { count: allIngredients.length })}
        </p>
      </div>
    </div>
  );
}
