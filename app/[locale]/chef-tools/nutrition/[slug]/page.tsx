import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { ChevronLeft, ChevronRight, Flame, Beef, Droplets, Wheat, ArrowRight } from 'lucide-react';
import { fetchIngredient, fetchIngredients } from '@/lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChefToolsNav } from '../../ChefToolsNav';
import { generateNutritionSEO } from '@/lib/seo-ingredients';

export const revalidate = 86400;

/** Category → related slugs for "Compare with" cross-links on nutrition pages */
const NUTRITION_RELATED: Record<string, { slug: string; nameEn: string; names: Record<string, string> }[]> = {
  vegetables: [
    { slug: 'broccoli',    nameEn: 'Broccoli',    names: { en: 'Broccoli',    ru: '\u0411\u0440\u043e\u043a\u043a\u043e\u043b\u0438', pl: 'Broku\u0142y', uk: '\u0411\u0440\u043e\u043a\u043e\u043b\u0456' } },
    { slug: 'cauliflower', nameEn: 'Cauliflower', names: { en: 'Cauliflower', ru: '\u0426\u0432\u0435\u0442\u043d\u0430\u044f \u043a\u0430\u043f\u0443\u0441\u0442\u0430', pl: 'Kalafior', uk: '\u0426\u0432\u0456\u0442\u043d\u0430 \u043a\u0430\u043f\u0443\u0441\u0442\u0430' } },
    { slug: 'spinach',     nameEn: 'Spinach',     names: { en: 'Spinach',     ru: '\u0428\u043f\u0438\u043d\u0430\u0442', pl: 'Szpinak', uk: '\u0428\u043f\u0438\u043d\u0430\u0442' } },
  ],
  fruits: [
    { slug: 'apple',      nameEn: 'Apple',      names: { en: 'Apple',      ru: '\u042f\u0431\u043b\u043e\u043a\u043e', pl: 'Jab\u0142ko', uk: '\u042f\u0431\u043b\u0443\u043a\u043e' } },
    { slug: 'banana',     nameEn: 'Banana',     names: { en: 'Banana',     ru: '\u0411\u0430\u043d\u0430\u043d', pl: 'Banan', uk: '\u0411\u0430\u043d\u0430\u043d' } },
    { slug: 'orange',     nameEn: 'Orange',     names: { en: 'Orange',     ru: '\u0410\u043f\u0435\u043b\u044c\u0441\u0438\u043d', pl: 'Pomara\u0144cza', uk: '\u0410\u043f\u0435\u043b\u044c\u0441\u0438\u043d' } },
  ],
  meat: [
    { slug: 'beef',           nameEn: 'Beef',    names: { en: 'Beef',    ru: '\u0413\u043e\u0432\u044f\u0434\u0438\u043d\u0430', pl: 'Wo\u0142owina', uk: '\u042f\u043b\u043e\u0432\u0438\u0447\u0438\u043d\u0430' } },
    { slug: 'chicken-breast', nameEn: 'Chicken', names: { en: 'Chicken', ru: '\u041a\u0443\u0440\u0438\u0446\u0430', pl: 'Kurczak', uk: '\u041a\u0443\u0440\u043a\u0430' } },
    { slug: 'pork',           nameEn: 'Pork',    names: { en: 'Pork',    ru: '\u0421\u0432\u0438\u043d\u0438\u043d\u0430', pl: 'Wieprzowina', uk: '\u0421\u0432\u0438\u043d\u0438\u043d\u0430' } },
  ],
  fish: [
    { slug: 'salmon',   nameEn: 'Salmon',   names: { en: 'Salmon',   ru: '\u041b\u043e\u0441\u043e\u0441\u044c', pl: '\u0141oso\u015b', uk: '\u041b\u043e\u0441\u043e\u0441\u044c' } },
    { slug: 'tuna',     nameEn: 'Tuna',     names: { en: 'Tuna',     ru: '\u0422\u0443\u043d\u0435\u0446', pl: 'Tu\u0144czyk', uk: '\u0422\u0443\u043d\u0435\u0446\u044c' } },
    { slug: 'cod',      nameEn: 'Cod',      names: { en: 'Cod',      ru: '\u0422\u0440\u0435\u0441\u043a\u0430', pl: 'Dorsz', uk: '\u0422\u0440\u0456\u0441\u043a\u0430' } },
  ],
  dairy: [
    { slug: 'milk',   nameEn: 'Milk',   names: { en: 'Milk',   ru: '\u041c\u043e\u043b\u043e\u043a\u043e', pl: 'Mleko', uk: '\u041c\u043e\u043b\u043e\u043a\u043e' } },
    { slug: 'butter', nameEn: 'Butter', names: { en: 'Butter', ru: '\u041c\u0430\u0441\u043b\u043e', pl: 'Mas\u0142o', uk: '\u041c\u0430\u0441\u043b\u043e' } },
    { slug: 'cheese', nameEn: 'Cheese', names: { en: 'Cheese', ru: '\u0421\u044b\u0440', pl: 'Ser', uk: '\u0421\u0438\u0440' } },
  ],
  grains: [
    { slug: 'rice',        nameEn: 'Rice',       names: { en: 'Rice',       ru: '\u0420\u0438\u0441', pl: 'Ry\u017c', uk: '\u0420\u0438\u0441' } },
    { slug: 'oats',        nameEn: 'Oats',       names: { en: 'Oats',       ru: '\u041e\u0432\u0451\u0441', pl: 'Owies', uk: '\u041e\u0432\u0435\u0441' } },
    { slug: 'wheat-flour', nameEn: 'Wheat Flour',names: { en: 'Wheat Flour',ru: '\u041c\u0443\u043a\u0430', pl: 'M\u0105ka', uk: '\u0411\u043e\u0440\u043e\u0448\u043d\u043e' } },
  ],
  nuts: [
    { slug: 'almonds', nameEn: 'Almonds', names: { en: 'Almonds', ru: '\u041c\u0438\u043d\u0434\u0430\u043b\u044c', pl: 'Migda\u0142y', uk: '\u041c\u0438\u0433\u0434\u0430\u043b\u044c' } },
    { slug: 'walnuts', nameEn: 'Walnuts', names: { en: 'Walnuts', ru: '\u0413\u0440\u0435\u0446\u043a\u0438\u0439 \u043e\u0440\u0435\u0445', pl: 'Orzechy w\u0142oskie', uk: '\u0413\u0440\u0435\u0446\u044c\u043a\u0438\u0439 \u0433\u043e\u0440\u0456\u0445' } },
    { slug: 'cashews', nameEn: 'Cashews', names: { en: 'Cashews', ru: '\u041a\u0435\u0448\u044c\u044e', pl: 'Nerkowce', uk: '\u041a\u0435\u0448\u044c\u044e' } },
  ],
};

function getNutritionRelated(category: string | undefined | null, currentSlug: string) {
  if (!category) return [];
  const key = category.toLowerCase();
  const list = NUTRITION_RELATED[key] ?? [];
  return list.filter((r) => r.slug !== currentSlug).slice(0, 3);
}

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
  const seo = generateNutritionSEO(ingredient, locale);
  return genMeta({
    title: seo.title,
    description: seo.description,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/nutrition/${slug}`,
    image: ingredient.og_image ?? ingredient.image_url ?? undefined,
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
            lab: { title: t('tools.lab.title') },
            recipeAnalyzer: { title: t('tools.recipeAnalyzer.title') },
            flavorPairing: { title: t('tools.flavorPairing.title') },
            nutrition: { title: t('nutrition.title') },
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

      {/* Ingredient profile link + Quick Conversions + Compare With */}
      <div className="mt-8 space-y-4">
        {/* Full ingredient profile */}
        <Link
          href={`/chef-tools/ingredients/${slug}` as never}
          className="flex items-center justify-between gap-2 p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group"
        >
          <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {locale === 'pl' ? `${name} — pe\u0142ny profil sk\u0142adnika`
              : locale === 'ru' ? `${name} — \u043f\u043e\u043b\u043d\u044b\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c`
              : locale === 'uk' ? `${name} — \u043f\u043e\u0432\u043d\u0438\u0439 \u043f\u0440\u043e\u0444\u0456\u043b\u044c`
              : `${name} — full ingredient profile`}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </Link>

        {/* Quick conversions pill bar */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            {locale === 'pl' ? 'Szybkie przeliczenia'
              : locale === 'ru' ? '\u0411\u044b\u0441\u0442\u0440\u044b\u0435 \u043a\u043e\u043d\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u0438'
              : locale === 'uk' ? '\u0428\u0432\u0438\u0434\u043a\u0456 \u043a\u043e\u043d\u0432\u0435\u0440\u0442\u0430\u0446\u0456\u0457'
              : 'Quick conversions'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/chef-tools/how-many/how-many-grams-in-a-cup-of-${slug}` as never} className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              {locale === 'pl' ? `ile gramów w szklance ${name}` : locale === 'ru' ? `${name}: стакан в граммы` : locale === 'uk' ? `${name}: склянка в грами` : `${name}: how many grams in a cup`}
            </Link>
            <Link href="/chef-tools/converter/cup-to-grams" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              {locale === 'pl' ? 'przelicz szklanki na gramy' : locale === 'ru' ? 'конвертер: стаканы в граммы' : locale === 'uk' ? 'конвертер: склянки в грами' : 'convert cups to grams'}
            </Link>
            <Link href="/chef-tools/converter/tablespoon-to-grams" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              {locale === 'pl' ? '1 łyżka na gramy' : locale === 'ru' ? '1 ст.л. в граммы' : locale === 'uk' ? '1 ст.л. в грами' : '1 tablespoon to grams'}
            </Link>
            <Link href="/chef-tools/converter/teaspoon-to-grams" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              {locale === 'pl' ? '\u0142y\u017ceczka na gramy' : locale === 'ru' ? '\u0447\u0430\u0439\u043d\u0430\u044f \u043b\u043e\u0436\u043a\u0430 \u0432 \u0433\u0440\u0430\u043c\u043c\u044b' : locale === 'uk' ? '\u0447\u0430\u0439\u043d\u0430 \u043b\u043e\u0436\u043a\u0430 \u0432 \u0433\u0440\u0430\u043c\u0438' : 'teaspoon to grams'}
            </Link>
            <Link href="/chef-tools/converter/grams-to-oz" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              {locale === 'pl' ? 'gramy na uncje' : locale === 'ru' ? '\u0433\u0440\u0430\u043c\u043c\u044b \u0432 \u0443\u043d\u0446\u0438\u0438' : locale === 'uk' ? '\u0433\u0440\u0430\u043c\u0438 \u0432 \u0443\u043d\u0446\u0456\u0457' : 'grams to ounces (oz)'}
            </Link>
          </div>
        </div>

        {/* Compare with similar ingredients */}
        {(() => {
          const related = getNutritionRelated(ingredient.category, slug);
          if (related.length === 0) return null;
          return (
            <div className="border border-border/60 rounded-2xl p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-3">
                {locale === 'pl' ? 'Por\u00f3wnaj z podobnymi'
                  : locale === 'ru' ? '\u0421\u0440\u0430\u0432\u043d\u0438 \u0441 \u043f\u043e\u0445\u043e\u0436\u0438\u043c\u0438'
                  : locale === 'uk' ? '\u041f\u043e\u0440\u0456\u0432\u043d\u044f\u0439 \u0437 \u043f\u043e\u0434\u0456\u0431\u043d\u0438\u043c\u0438'
                  : 'Compare with similar'}
              </h2>
              <div className="space-y-2">
                {related.map((r) => {
                  const rName = r.names[locale] ?? r.nameEn;
                  const anchors = [
                    locale === 'pl' ? `${rName} — kalorie na 100g` : locale === 'ru' ? `${rName} — калории на 100г` : locale === 'uk' ? `${rName} — калорії на 100г` : `${rName} — calories per 100g`,
                    locale === 'pl' ? `${rName} wartości odżywcze` : locale === 'ru' ? `${rName} пищевая ценность` : locale === 'uk' ? `${rName} харчова цінність` : `${rName} nutrition facts`,
                    locale === 'pl' ? `${rName} vs ${name} — kalorie` : locale === 'ru' ? `${rName} vs ${name} — калории` : locale === 'uk' ? `${rName} vs ${name} — калорії` : `${rName} vs ${name} calories`,
                  ];
                  const anchorText = anchors[related.indexOf(r) % anchors.length];
                  return (
                    <Link
                      key={r.slug}
                      href={`/chef-tools/nutrition/${r.slug}` as never}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {anchorText}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Back to nutrition list */}
        <Link
          href="/chef-tools/nutrition"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          {locale === 'pl' ? 'Wszystkie dane od\u017cywcze'
            : locale === 'ru' ? '\u0412\u0441\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u043e \u043f\u0438\u0442\u0430\u043d\u0438\u0438'
            : locale === 'uk' ? '\u0423\u0441\u0456 \u0434\u0430\u043d\u0456 \u043f\u0440\u043e \u0445\u0430\u0440\u0447\u0443\u0432\u0430\u043d\u043d\u044f'
            : 'All nutrition data'}
        </Link>
      </div>
    </div>
  );
}
