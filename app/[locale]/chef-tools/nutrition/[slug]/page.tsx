import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChevronLeft, ChevronRight, Flame, Beef, Droplets, Wheat } from 'lucide-react';
import { fetchIngredient, fetchIngredients } from '@/lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChefToolsNav } from '../../ChefToolsNav';

export const revalidate = 86400;

export async function generateStaticParams() {
  const ingredients = await fetchIngredients();
  if (!ingredients) return [];
  const locales = ['pl', 'en', 'ru', 'uk'];
  return locales.flatMap((locale) =>
    ingredients
      .filter((ing) => ing.slug)
      .map((ing) => ({ locale, slug: ing.slug! }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const ingredient = await fetchIngredient(slug);
  if (!ingredient) return {};
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  const name = localizedName(ingredient, locale);
  return genMeta({
    title: `${name} — ${t('nutrition.title')}`,
    description: ingredient.description ?? `${name}: ${ingredient.calories} kcal, protein ${ingredient.protein ?? '?'}g, fat ${ingredient.fat ?? '?'}g, carbs ${ingredient.carbs ?? '?'}g per 100g.`,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/nutrition/${slug}`,
  });
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

function localizedDescription(
  item: { description?: string | null; description_pl?: string | null; description_ru?: string | null; description_uk?: string | null },
  locale: string,
): string | null {
  if (locale === 'pl' && item.description_pl) return item.description_pl;
  if (locale === 'ru' && item.description_ru) return item.description_ru;
  if (locale === 'uk' && item.description_uk) return item.description_uk;
  return item.description ?? null;
}

export default async function IngredientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<{ from?: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = searchParams ? await searchParams : {};
  const from = sp?.from; // 'catalog' | 'table' | 'analyzer' | undefined

  // Resolve back navigation
  const backHref =
    from === 'table' ? '/chef-tools/nutrition' :
    from === 'analyzer' ? '/chef-tools/ingredient-analyzer' :
    '/chef-tools/ingredients'; // default: catalog

  const [ingredient, t] = await Promise.all([
    fetchIngredient(slug),
    getTranslations({ locale, namespace: 'chefTools' }),
  ]);

  if (!ingredient) notFound();

  const nav = (
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
  );

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
      {nav}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'NutritionInformation',
          name,
          calories: `${ingredient.calories} kcal`,
          proteinContent: ingredient.protein != null ? `${ingredient.protein} g` : undefined,
          fatContent: ingredient.fat != null ? `${ingredient.fat} g` : undefined,
          carbohydrateContent: ingredient.carbs != null ? `${ingredient.carbs} g` : undefined,
          servingSize: '100 g',
        }}
      />

      {/* Breadcrumb + back button */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          <Link href="/chef-tools" className="hover:text-foreground transition-colors">Chef Tools</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={backHref as never} className="hover:text-foreground transition-colors">
            {from === 'table'
              ? t('nutrition.seoTitle')
              : from === 'analyzer'
              ? t('tools.ingredientAnalyzer.title')
              : t('ingredients.catalog.title')}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{name}</span>
        </div>
        <Link
          href={backHref as never}
          className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {from === 'table'
            ? t('nutrition.backToTable')
            : from === 'analyzer'
            ? t('nutrition.backToAnalyzer')
            : t('nutrition.backToCatalog')}
        </Link>
      </div>

      {/* Two-column layout: photo left, data right */}
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

        {/* RIGHT — name + macros cards + nutrition table */}
        <div className="flex flex-col gap-5">

          {/* Name + seasons */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase italic leading-tight mb-1">
              {name}<span className="text-primary">.</span>
            </h1>
            {ingredient.seasons && ingredient.seasons.length > 0 && (
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {t('nutrition.seasons')}: {ingredient.seasons.join(', ')}
              </p>
            )}
          </div>

          {/* Macros cards */}
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
                    <span className="text-[10px] font-bold text-muted-foreground ml-1">{value != null ? unit : ''}</span>
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition table */}
          <div className="rounded-2xl overflow-hidden border border-border/60 shadow-sm">
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">{t('nutrition.tableTitle')} — {name} — {t('nutrition.per100g')}</caption>
              <thead>
                <tr className="bg-primary/10 dark:bg-primary/20">
                  <th
                    colSpan={2}
                    className="px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-primary border-b border-primary/20"
                  >
                    {t('nutrition.tableTitle')} · {t('nutrition.per100g')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr className="bg-background hover:bg-orange-500/5 dark:hover:bg-orange-500/10 transition-colors group">
                  <td className="px-4 py-2.5 font-semibold text-foreground w-1/2 border-r border-border/40 group-hover:border-orange-500/20">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      {t('ingredients.calories')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-orange-500 tabular-nums">
                    {ingredient.calories}
                    <span className="text-xs font-bold text-muted-foreground ml-1.5">kcal</span>
                  </td>
                </tr>
                <tr className="bg-muted/30 dark:bg-muted/20 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors group">
                  <td className="px-4 py-2.5 font-semibold text-foreground border-r border-border/40 group-hover:border-red-500/20">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      {t('ingredients.protein')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-red-500 tabular-nums">
                    {ingredient.protein ?? '—'}
                    {ingredient.protein != null && <span className="text-xs font-bold text-muted-foreground ml-1.5">g</span>}
                  </td>
                </tr>
                <tr className="bg-background hover:bg-yellow-500/5 dark:hover:bg-yellow-500/10 transition-colors group">
                  <td className="px-4 py-2.5 font-semibold text-foreground border-r border-border/40 group-hover:border-yellow-500/20">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                      {t('ingredients.fat')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-yellow-500 tabular-nums">
                    {ingredient.fat ?? '—'}
                    {ingredient.fat != null && <span className="text-xs font-bold text-muted-foreground ml-1.5">g</span>}
                  </td>
                </tr>
                <tr className="bg-muted/30 dark:bg-muted/20 hover:bg-green-500/5 dark:hover:bg-green-500/10 transition-colors group">
                  <td className="px-4 py-2.5 font-semibold text-foreground border-r border-border/40 group-hover:border-green-500/20">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      {t('ingredients.carbs')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-green-500 tabular-nums">
                    {ingredient.carbs ?? '—'}
                    {ingredient.carbs != null && <span className="text-xs font-bold text-muted-foreground ml-1.5">g</span>}
                  </td>
                </tr>
              </tbody>
            </table>
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
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
            {t('nutrition.measures')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {ingredient.measures.grams_per_cup != null && (
              <div className="text-center">
                <div className="text-lg font-black text-foreground">{Math.round(ingredient.measures.grams_per_cup)}<span className="text-xs text-muted-foreground ml-1">g</span></div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('nutrition.cup')}</div>
              </div>
            )}
            {ingredient.measures.grams_per_tbsp != null && (
              <div className="text-center">
                <div className="text-lg font-black text-foreground">{Math.round(ingredient.measures.grams_per_tbsp)}<span className="text-xs text-muted-foreground ml-1">g</span></div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('nutrition.tbsp')}</div>
              </div>
            )}
            {ingredient.measures.grams_per_tsp != null && (
              <div className="text-center">
                <div className="text-lg font-black text-foreground">{Math.round(ingredient.measures.grams_per_tsp)}<span className="text-xs text-muted-foreground ml-1">g</span></div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('nutrition.tsp')}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Allergens */}
      {ingredient.allergens && ingredient.allergens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground self-center">
            {t('nutrition.allergens')}:
          </span>
          {ingredient.allergens.map((a) => (
            <span key={a} className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-500/20 capitalize">
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Internal links: ingredient profile + converter + how-many */}
      <div className="mt-8 space-y-2">
        <Link
          href={`/chef-tools/ingredients/${slug}` as never}
          className="flex items-center justify-between gap-2 p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group"
        >
          <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {locale === 'pl' ? `🍽 Pełny profil składnika: ${name}`
              : locale === 'ru' ? `🍽 Полный профиль: ${name}`
              : locale === 'uk' ? `🍽 Повний профіль: ${name}`
              : `🍽 Full ingredient profile: ${name}`}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </Link>
        {ingredient.measures?.grams_per_cup != null && (
          <Link
            href={`/chef-tools/how-many/how-many-grams-in-a-cup-of-${slug}` as never}
            className="flex items-center justify-between gap-2 p-4 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {locale === 'pl' ? `⚖️ Ile gramów w szklance ${name}?`
                : locale === 'ru' ? `⚖️ Сколько граммов в стакане ${name}?`
                : locale === 'uk' ? `⚖️ Скільки грамів у склянці ${name}?`
                : `⚖️ How many grams in a cup of ${name}?`}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
        )}
        <Link
          href="/chef-tools/converter"
          className="flex items-center justify-between gap-2 p-4 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {locale === 'pl' ? '🔄 Przelicznik jednostek kuchennych'
              : locale === 'ru' ? '🔄 Конвертер кухонных единиц'
              : locale === 'uk' ? '🔄 Конвертер кухонних одиниць'
              : '🔄 Kitchen Unit Converter'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </Link>
      </div>
    </div>
  );
}
