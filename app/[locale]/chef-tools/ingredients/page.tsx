import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { fetchIngredients } from '@/lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Metadata } from 'next';
import { ChevronRight, Search, Package } from 'lucide-react';
import { IngredientsClient } from './IngredientsClient';
import { ChefToolsNav } from '../ChefToolsNav';
import { resolveCategory } from './ingredient-utils';

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  return genMeta({
    title: t('ingredients.catalog.metaTitle'),
    description: t('ingredients.catalog.metaDescription'),
    locale,
    path: '/chef-tools/ingredients',
  });
}

export async function generateStaticParams() {
  return [
    { locale: 'pl' },
    { locale: 'en' },
    { locale: 'ru' },
    { locale: 'uk' },
  ];
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

  // Normalize items for the client component
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
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
            nutrition: { title: t('nutrition.title') },
          }
        }} 
      />
      {/* Search & Header */}
      <div className="mb-12 border-t border-primary/20 pt-10">
        {/* ...existing header code... */}
      </div>

      <IngredientsClient items={items} i18n={i18n} locale={locale} />
    </div>
  );
}
