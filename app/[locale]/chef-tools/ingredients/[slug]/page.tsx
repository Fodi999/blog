import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Beef,
  Droplets,
  Wheat,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { fetchIngredient, fetchIngredients } from '@/lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChefToolsNav } from '../../ChefToolsNav';

export const revalidate = 86400;

// ─── Top conversions to link from the ingredient cluster ─────────────────────
const TOP_CONVERSIONS = [
  'cup-to-grams',
  'tbsp-to-grams',
  'tsp-to-grams',
  'oz-to-grams',
  'grams-to-oz',
] as const;

type Locale = 'pl' | 'en' | 'ru' | 'uk';

// ─── Locale helpers ───────────────────────────────────────────────────────────
function localizedName(
  item: { name: string; name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string },
  locale: string,
): string {
  if (locale === 'pl' && item.name_pl) return item.name_pl;
  if (locale === 'ru' && item.name_ru) return item.name_ru;
  if (locale === 'uk' && item.name_uk) return item.name_uk;
  return item.name_en ?? item.name;
}

function localizedDescription(
  item: {
    description?: string | null;
    description_pl?: string | null;
    description_ru?: string | null;
    description_uk?: string | null;
  },
  locale: string,
): string | null {
  if (locale === 'pl' && item.description_pl) return item.description_pl;
  if (locale === 'ru' && item.description_ru) return item.description_ru;
  if (locale === 'uk' && item.description_uk) return item.description_uk;
  return item.description ?? null;
}

const CONVERSION_LABELS: Record<string, Record<Locale, string>> = {
  'cup-to-grams':  { en: 'Cup → Grams',   pl: 'Szklanka → Gramy',   ru: 'Стакан → Граммы',  uk: 'Склянка → Грами' },
  'tbsp-to-grams': { en: 'Tbsp → Grams',  pl: 'Łyżka → Gramy',     ru: 'Ст.л. → Граммы',   uk: 'Ст.л. → Грами' },
  'tsp-to-grams':  { en: 'Tsp → Grams',   pl: 'Łyżeczka → Gramy',  ru: 'Ч.л. → Граммы',    uk: 'Ч.л. → Грами' },
  'oz-to-grams':   { en: 'Oz → Grams',    pl: 'Uncja → Gramy',     ru: 'Унция → Граммы',   uk: 'Унція → Грами' },
  'grams-to-oz':   { en: 'Grams → Oz',    pl: 'Gramy → Uncje',     ru: 'Граммы → Унции',   uk: 'Грами → Унції' },
};

function conversionLabel(conv: string, locale: string): string {
  return CONVERSION_LABELS[conv]?.[locale as Locale] ?? CONVERSION_LABELS[conv]?.en ?? conv;
}

// SEO meta title per locale
function buildMetaTitle(name: string, locale: string): string {
  const map: Record<string, string> = {
    en: `${name} — Culinary Profile, Nutrition & Conversions`,
    pl: `${name} — Profil kulinarny, wartości odżywcze i przeliczniki`,
    ru: `${name} — Кулинарный профиль, питательная ценность и конвертация`,
    uk: `${name} — Кулінарний профіль, харчова цінність та конвертація`,
  };
  return map[locale] ?? map.en;
}

function buildMetaDescription(name: string, locale: string, calories: number): string {
  const map: Record<string, string> = {
    en: `${name}: ${calories} kcal per 100g. Culinary uses, kitchen measures (cups, tbsp, tsp), seasons, allergens and quick unit conversions.`,
    pl: `${name}: ${calories} kcal na 100g. Zastosowania kulinarne, miary kuchenne (szklanka, łyżka, łyżeczka), sezony, alergeny i przeliczniki jednostek.`,
    ru: `${name}: ${calories} ккал на 100г. Кулинарное применение, кухонные меры (стакан, ст.л., ч.л.), сезоны, аллергены и конвертация единиц.`,
    uk: `${name}: ${calories} ккал на 100г. Кулінарне застосування, кухонні міри (склянка, ст.л., ч.л.), сезони, алергени та конвертація одиниць.`,
  };
  return map[locale] ?? map.en;
}

// ─── Static params ─────────────────────────────────────────────────────────
export const dynamicParams = true;

export async function generateStaticParams() {
  // Use the lightweight list endpoint — no per-item detail fetches needed here.
  // Full ingredient data is fetched at render time via fetchIngredient(slug).
  try {
    const res = await fetch(
      'https://ministerial-yetta-fodi999-c58d8823.koyeb.app/public/ingredients?limit=200',
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { items: { slug: string }[] };
    const slugs = data.items.map((i) => i.slug).filter(Boolean);
    const locales = ['pl', 'en', 'ru', 'uk'];
    return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
  } catch {
    return [];
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const ingredient = await fetchIngredient(slug);
  if (!ingredient) return {};
  const name = localizedName(ingredient, locale);
  return genMeta({
    title: buildMetaTitle(name, locale),
    description: buildMetaDescription(name, locale, ingredient.calories),
    locale: locale as Locale,
    path: `/chef-tools/ingredients/${slug}`,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function IngredientProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [ingredient, t] = await Promise.all([
    fetchIngredient(slug),
    getTranslations({ locale, namespace: 'chefTools' }),
  ]);

  if (!ingredient) notFound();

  const name = localizedName(ingredient, locale);
  const description = localizedDescription(ingredient, locale);

  const macros = [
    { icon: Flame, label: t('ingredients.calories'), value: ingredient.calories, unit: 'kcal', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Beef, label: t('ingredients.protein'), value: ingredient.protein, unit: 'g', color: 'text-red-500', bg: 'bg-red-500/10' },
    { icon: Droplets, label: t('ingredients.fat'), value: ingredient.fat, unit: 'g', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { icon: Wheat, label: t('ingredients.carbs'), value: ingredient.carbs, unit: 'g', color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

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
      {/* Header */}
      <div className="mb-12 border-t border-primary/20 pt-10">
        {/* Breadcrumb + back */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            <Link href="/chef-tools" className="hover:text-foreground transition-colors">
              Chef Tools
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/chef-tools/ingredients" className="hover:text-foreground transition-colors">
              {t('ingredients.catalog.title')}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{name}</span>
          </div>
          <Link
            href="/chef-tools/ingredients"
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('nutrition.backToCatalog')}
          </Link>
        </div>

        {/* Hero: photo + name + macros */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 mb-10 items-start">

          {/* LEFT — photo */}
          <div className="w-full">
            {ingredient.image_url ? (
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-muted border border-border/40">
                <Image
                  src={ingredient.image_url}
                  alt={name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full aspect-square rounded-3xl bg-primary/10 flex items-center justify-center border border-border/40">
                <Flame className="h-20 w-20 text-primary/30" />
              </div>
            )}
          </div>

          {/* RIGHT — name + macro cards */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase italic leading-tight mb-1">
                {name}<span className="text-primary">.</span>
              </h1>
              {ingredient.seasons && ingredient.seasons.length > 0 && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {t('nutrition.seasons')}: {ingredient.seasons.join(', ')}
                </p>
              )}
              {ingredient.category && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                  {ingredient.category}
                </p>
              )}
            </div>

            {/* Macro cards */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {t('nutrition.per100g')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                {macros.map(({ icon: Icon, label, value, unit, color, bg }) => (
                  <div key={label} className="border border-border/60 rounded-2xl p-3 text-center">
                    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-1.5`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="text-lg font-black text-foreground leading-none mb-0.5">
                      {value ?? '—'}
                      <span className="text-[10px] font-bold text-muted-foreground ml-1">
                        {value != null ? unit : ''}
                      </span>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-muted-foreground leading-relaxed text-sm mb-8 border-l-2 border-primary/30 pl-4">
            {description}
          </p>
        )}

        {/* Kitchen measures */}
        {ingredient.measures && (
          <div className="border border-border/60 rounded-2xl p-5 mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              {t('nutrition.measures')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {ingredient.measures.grams_per_cup != null && (
                <div className="text-center">
                  <div className="text-lg font-black text-foreground">
                    {Math.round(ingredient.measures.grams_per_cup)}
                    <span className="text-xs text-muted-foreground ml-1">g</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('nutrition.cup')}
                  </div>
                </div>
              )}
              {ingredient.measures.grams_per_tbsp != null && (
                <div className="text-center">
                  <div className="text-lg font-black text-foreground">
                    {Math.round(ingredient.measures.grams_per_tbsp)}
                    <span className="text-xs text-muted-foreground ml-1">g</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('nutrition.tbsp')}
                  </div>
                </div>
              )}
              {ingredient.measures.grams_per_tsp != null && (
                <div className="text-center">
                  <div className="text-lg font-black text-foreground">
                    {Math.round(ingredient.measures.grams_per_tsp)}
                    <span className="text-xs text-muted-foreground ml-1">g</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('nutrition.tsp')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Allergens */}
        {ingredient.allergens && ingredient.allergens.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground self-center">
              {t('nutrition.allergens')}:
            </span>
            {ingredient.allergens.map((a) => (
              <span
                key={a}
                className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-500/20 capitalize"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {/* ── SEO CLUSTER LINKS ──────────────────────────────────────────── */}

        {/* Link to nutrition detail page */}
        <div className="rounded-2xl border border-border/60 p-5 mb-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-3">
            {t('nutrition.tableTitle')}
          </h2>
          <Link
            href={`/chef-tools/nutrition/${slug}` as never}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <Flame className="h-4 w-4" />
            {name} — {t('nutrition.seoTitle')}
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Link>
        </div>


      </div>
    </div>
  );
}
