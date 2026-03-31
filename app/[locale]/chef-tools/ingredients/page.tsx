import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { fetchIngredients } from '@/lib/api';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { IngredientsClient } from './IngredientsClient';
import { ChefToolsNav } from '../ChefToolsNav';
import { resolveCategory } from './ingredient-utils';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  return genMeta({
    title: t('ingredients.catalog.metaTitle'),
    description: t('ingredients.catalog.metaDescription'),
    locale,
    path: '/chef-tools/ingredients',
  });
}

export async function generateStaticParams() {
  return [{ locale: 'pl' }, { locale: 'en' }, { locale: 'ru' }, { locale: 'uk' }];
}

function localizedName(
  item: { name: string; name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string },
  locale: string,
): string {
  if (locale === 'pl' && item.name_pl) return item.name_pl;
  if (locale === 'ru' && item.name_ru) return item.name_ru;
  if (locale === 'uk' && item.name_uk) return item.name_uk;
  return item.name_en ?? item.name;
}

export default async function IngredientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [ingredients, t] = await Promise.all([
    fetchIngredients(),
    getTranslations({ locale, namespace: 'chefTools' }),
  ]);

  if (!ingredients) notFound();

  const i18n = {
    title: t('ingredients.catalog.title'),
    description: t('ingredients.catalog.description'),
    searchPlaceholder: t('ingredients.catalog.searchPlaceholder'),
    allCategories: t('ingredients.catalog.allCategories'),
    viewProduct: t('ingredients.catalog.viewProduct'),
    noResults: t('ingredients.catalog.noResults'),
    totalCount: t('ingredients.catalog.totalCount'),
    perPage: t('ingredients.catalog.perPage'),
    resetFilters: t('ingredients.catalog.resetFilters'),
    calories: t('ingredients.calories'),
    protein: t('ingredients.protein'),
    fat: t('ingredients.fat'),
    carbs: t('ingredients.carbs'),
    unit100g: t('dashboard.unit100g'),
    categoryLabels: {
      vegetables: t('nutrition.categories.vegetables'),
      spices: t('nutrition.categories.spices'),
      fish: t('nutrition.categories.fish'),
      fruits: t('nutrition.categories.fruits'),
      meat: t('nutrition.categories.meat'),
      dairy: t('nutrition.categories.dairy'),
      grains: t('nutrition.categories.grains'),
      sauces: t('nutrition.categories.sauces'),
      nuts: t('nutrition.categories.nuts'),
      sweets: t('nutrition.categories.sweets'),
      drinks: t('nutrition.categories.drinks'),
      legumes: t('nutrition.categories.legumes'),
      preserved: t('nutrition.categories.preserved'),
      oils: t('nutrition.categories.oils'),
      other: t('nutrition.categories.other'),
    },
  };

  const items = ingredients.map((ing) => ({
    slug: ing.slug ?? ing.name.toLowerCase().replace(/\s+/g, '-'),
    name: localizedName(ing, locale),
    nameEn: ing.name_en ?? ing.name,
    image: ing.image_url ?? null,
    category: resolveCategory(ing.slug ?? '', ing.category),
    calories: ing.calories,
    protein: ing.protein,
    fat: ing.fat,
    carbs: ing.carbs,
  }));

  const catalogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: i18n.title,
    description: i18n.description,
    url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients`,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 10).map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${item.slug}`,
    })),
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden pt-12 pb-24">
      {/* ── Background Mesh ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[120px] animate-pulse-slow dark:opacity-100 opacity-30" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse-slow delay-1000 dark:opacity-100 opacity-20" />
      </div>

      <JsonLd data={catalogJsonLd} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ChefToolsNav 
          locale={locale} 
          translations={{
            back: t('back'),
            tabs: { tools: t('tabs.tools'), tables: t('tabs.tables'), products: t('tabs.products') },
            tools: {
              converter: { title: t('tools.converter.title') },
              fishSeason: { title: t('tools.fishSeason.title') },
              ingredientAnalyzer: { title: t('tools.ingredientAnalyzer.title') },
              ingredientsCatalog: { title: i18n.title },
              lab: { title: t('tools.lab.title') },
              recipeAnalyzer: { title: t('tools.recipeAnalyzer.title') },
              flavorPairing: { title: t('tools.flavorPairing.title') },
              nutrition: { title: t('nutrition.title') },
            }
          }} 
        />

        <div className="mt-12 border-t border-border/50 dark:border-white/5 pt-12 mb-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-8 italic">
            <Link href="/chef-tools" className="hover:text-primary transition-colors">Chef Tools</Link>
            <ChevronRight className="h-3 w-3 opacity-30" />
            <span className="text-foreground">{i18n.title}</span>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none mb-6">
              {i18n.title}<span className="text-primary italic">.</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl border-l-4 border-primary/20 pl-6 py-1 italic">
              {i18n.description}
            </p>
          </div>

          <IngredientsClient items={items} i18n={i18n} locale={locale} />
        </div>
      </div>
    </div>
  );
}
