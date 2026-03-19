import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { fetchIngredient as apiFetchIngredient, fetchIngredientsMeta, fetchIngredientStates } from '@/lib/api';
import type { ApiIngredient } from '@/lib/api';
import { ChefToolsNav } from '../../ChefToolsNav';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ChevronRight, Package, Leaf, Flame, Droplets, FlaskConical, Apple, Scale, Heart, CalendarDays, ShieldAlert, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import CategoryPage, { CATEGORY_MAP } from './category-page';
import IngredientStateClient from './IngredientStateClient';
import { JsonLd } from '@/components/JsonLd';

export const revalidate = 86400;

/* ─── helpers ───────────────────────────────────────────────────────────── */

function isCategory(slug: string): boolean {
  return slug in CATEGORY_MAP;
}

function t4(locale: string, en: string, ru: string, pl: string, uk: string): string {
  if (locale === 'ru') return ru;
  if (locale === 'pl') return pl;
  if (locale === 'uk') return uk;
  return en;
}

function localName(item: ApiIngredient, locale: string): string {
  if (locale === 'pl' && item.name_pl) return item.name_pl;
  if (locale === 'ru' && item.name_ru) return item.name_ru;
  if (locale === 'uk' && item.name_uk) return item.name_uk;
  return item.name_en ?? item.name;
}

function localDesc(item: ApiIngredient, locale: string): string | null {
  if (locale === 'ru' && item.description_ru) return item.description_ru;
  if (locale === 'pl' && item.description_pl) return item.description_pl;
  if (locale === 'uk' && item.description_uk) return item.description_uk;
  return item.description ?? null;
}

function pairingName(p: { name_en: string; name_ru?: string; name_pl?: string; name_uk?: string }, locale: string): string {
  if (locale === 'ru' && p.name_ru) return p.name_ru;
  if (locale === 'pl' && p.name_pl) return p.name_pl;
  if (locale === 'uk' && p.name_uk) return p.name_uk;
  return p.name_en;
}

/** Format a number: round to 1 decimal, strip trailing .0 */
function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  const r = Math.round(v * 10) / 10;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

/* ─── metadata ──────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (isCategory(slug)) {
    const cat = CATEGORY_MAP[slug];
    const name = cat.names[locale] ?? cat.nameEn;
    const description = cat.descriptions[locale] ?? cat.descriptions.en;
    return genMeta({ title: name, description, locale: locale as 'pl' | 'en' | 'uk' | 'ru', path: `/chef-tools/ingredients/${slug}` });
  }

  const item = await apiFetchIngredient(slug);
  if (!item) return {};

  const name = localName(item, locale);
  const desc = localDesc(item, locale);

  // Use AI-generated SEO data if available
  const seoTitle = item.seo_title
    ? item.seo_title
    : `${name} — Nutrition Facts, Calories, Protein`;
  const seoDesc = item.seo_description
    ? item.seo_description
    : desc ?? `${name} — nutrition facts and kitchen conversions`;

  const meta = genMeta({
    title: seoTitle,
    description: seoDesc,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/ingredients/${slug}`,
    image: item.og_image ?? undefined,
  });

  // Override OpenGraph with dedicated OG fields if available
  if (item.og_title || item.og_description) {
    meta.openGraph = {
      ...meta.openGraph,
      ...(item.og_title && { title: item.og_title }),
      ...(item.og_description && { description: item.og_description }),
    };
    meta.twitter = {
      ...meta.twitter,
      ...(item.og_title && { title: item.og_title }),
      ...(item.og_description && { description: item.og_description }),
    };
  }

  return meta;
}

/* ─── Reusable section card ─────────────────────────────────────────────── */

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden mb-4 sm:mb-6">
      <div className="bg-muted/30 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 flex items-center gap-2">
        {icon}
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** Stat cell for grid layouts */
function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="p-2.5 sm:p-4 text-center">
      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">{label}</p>
      <p className="text-lg sm:text-2xl font-black text-foreground">{value}</p>
      {unit && <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold">{unit}</p>}
    </div>
  );
}

/** Mini stat row for minerals / vitamins */
function MiniRow({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between py-2 px-3 sm:px-4 even:bg-muted/20">
      <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">{label}</span>
      <span className="text-xs sm:text-sm font-black text-foreground">{fmt(value)} <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">{unit}</span></span>
    </div>
  );
}

/* ─── page component ────────────────────────────────────────────────────── */

export default async function IngredientSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  /* ── category page ── */
  if (isCategory(slug)) {
    return <CategoryPage params={Promise.resolve({ locale, category: slug })} />;
  }

  /* ── individual ingredient page ── */
  const [item, statesResp] = await Promise.all([
    apiFetchIngredient(slug),
    fetchIngredientStates(slug).catch(() => null),
  ]);
  if (!item) notFound();

  const statesList = statesResp?.states ?? [];
  const initialState = 'raw';

  const t = await getTranslations({ locale, namespace: 'chefTools' });
  const name = localName(item, locale);
  const description = localDesc(item, locale);

  const seoH1 = item.seo_h1 || null;

  const macros = item.macros_full;
  const vitamins = item.vitamins;
  const minerals = item.minerals;
  const dietFlags = item.diet_flags;
  const culinary = item.culinary;
  const foodProps = item.food_properties;
  const pairings = item.pairings;
  const measures = item.measures;

  /* Enrich pairings with real images from ingredient meta */
  if (pairings && pairings.length > 0) {
    const slugsNeedingImages = pairings
      .filter((p) => !p.image_url)
      .map((p) => p.slug);
    if (slugsNeedingImages.length > 0) {
      const meta = await fetchIngredientsMeta(slugsNeedingImages);
      for (const p of pairings) {
        if (!p.image_url && meta[p.slug]?.image_url) {
          p.image_url = meta[p.slug].image_url!;
        }
      }
    }
  }

  /* Diet flag labels */
  const flagLabels: Record<string, string> = {
    vegan: t4(locale, 'Vegan', 'Веган', 'Wegański', 'Веган'),
    vegetarian: t4(locale, 'Vegetarian', 'Вегетарианский', 'Wegetariański', 'Вегетаріанський'),
    gluten_free: t4(locale, 'Gluten-free', 'Без глютена', 'Bezglutenowy', 'Без глютену'),
    keto: 'Keto',
    paleo: 'Paleo',
    mediterranean: t4(locale, 'Mediterranean', 'Средиземноморская', 'Śródziemnomorski', 'Середземноморська'),
    low_carb: 'Low-carb',
  };

  /* ── Build Product + NutritionInformation JSON-LD ── */
  const calories = macros?.calories_kcal ?? item.calories;
  const proteinG = macros?.protein_g ?? item.protein;
  const fatG     = macros?.fat_g ?? item.fat;
  const carbsG   = macros?.carbs_g ?? item.carbs;
  const fiberG   = macros?.fiber_g;
  const sugarG   = macros?.sugar_g;
  const sodiumMg = minerals?.sodium;
  const cholesterolMg = null; // not available in API

  const nutritionLd: Record<string, unknown> = {
    '@type': 'NutritionInformation',
    servingSize: '100g',
    ...(calories != null && { calories: `${fmt(calories)} kcal` }),
    ...(proteinG != null && { proteinContent: `${fmt(proteinG)} g` }),
    ...(fatG != null && { fatContent: `${fmt(fatG)} g` }),
    ...(carbsG != null && { carbohydrateContent: `${fmt(carbsG)} g` }),
    ...(fiberG != null && { fiberContent: `${fmt(fiberG)} g` }),
    ...(sugarG != null && { sugarContent: `${fmt(sugarG)} g` }),
    ...(sodiumMg != null && { sodiumContent: `${fmt(sodiumMg)} mg` }),
  };

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    ...(item.image_url && { image: item.image_url }),
    ...(description && { description }),
    ...(item.category && { category: item.category }),
    brand: { '@type': 'Brand', name: 'Chef Tools by Dima Fomin' },
    additionalProperty: [
      ...(calories != null ? [{ '@type': 'PropertyValue', name: 'Calories', value: `${fmt(calories)} kcal per 100g` }] : []),
      ...(proteinG != null ? [{ '@type': 'PropertyValue', name: 'Protein', value: `${fmt(proteinG)} g per 100g` }] : []),
    ],
    nutrition: nutritionLd,
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-16">
      <JsonLd data={productLd} />
      <ChefToolsNav
        locale={locale}
        translations={{
          back: t('back'),
          tabs: { tools: t('tabs.tools'), tables: t('tabs.tables'), products: t('tabs.products') },
          tools: {
            converter: { title: t('tools.converter.title') },
            fishSeason: { title: t('tools.fishSeason.title') },
            ingredientAnalyzer: { title: t('tools.ingredientAnalyzer.title') },
            ingredientsCatalog: { title: t('ingredients.catalog.title') },
            lab: { title: t('tools.lab.title') },
            recipeAnalyzer: { title: t('tools.recipeAnalyzer.title') },
            flavorPairing: { title: t('tools.flavorPairing.title') },
            nutrition: { title: t('nutrition.title') },
          },
        }}
      />

      <div className="mb-8 sm:mb-12 border-t border-primary/20 pt-6 sm:pt-10">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          <Link href="/chef-tools" className="hover:text-foreground transition-colors shrink-0">Chef Tools</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href="/chef-tools/ingredients" className="hover:text-foreground transition-colors shrink-0">{t('ingredients.catalog.title')}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground truncate">{name}</span>
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-10">
          {item.image_url ? (
            <div className="relative w-32 h-32 sm:w-56 sm:h-auto sm:aspect-square mx-auto sm:mx-0 rounded-2xl overflow-hidden border border-border/50 bg-muted shrink-0">
              <Image src={item.image_url} alt={name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-32 h-32 sm:w-56 sm:h-auto sm:aspect-square mx-auto sm:mx-0 rounded-2xl border border-border/50 bg-muted flex items-center justify-center shrink-0">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic mb-1 sm:mb-2">
              {name}<span className="text-primary">.</span>
            </h1>
            {seoH1 && seoH1 !== name && (
              <p className="text-[11px] sm:text-sm font-semibold text-muted-foreground/80 mb-1 sm:mb-2">{seoH1}</p>
            )}
            {item.category && (
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">{item.category}</p>
            )}
            {item.product_type && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2 sm:mb-3">
                {item.product_type}
              </span>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 sm:pl-4 text-left">{description}</p>
            )}

            {/* Diet flags as badges */}
            {dietFlags && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                {(Object.entries(dietFlags) as [string, boolean | undefined][])
                  .filter(([, v]) => v === true)
                  .map(([k]) => (
                    <span key={k} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                      ✓ {flagLabels[k] ?? k}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ── State Switcher ── */}
        {statesList.length > 0 && (
          <IngredientStateClient
            slug={item.slug ?? slug}
            locale={locale}
            availableStates={statesList}
            initialState={initialState}
          />
        )}

        {/* ── Macros ── */}
        <Section
          title={t4(locale, 'Nutrition per 100g', 'Пищевая ценность на 100г', 'Wartości odżywcze na 100g', 'Харчова цінність на 100г')}
          icon={<Flame className="h-4 w-4 text-primary" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50 border-b border-border/50">
            <Stat label={t4(locale, 'Calories', 'Калории', 'Kalorie', 'Калорії')} value={fmt(macros?.calories_kcal ?? item.calories)} unit="kcal" />
            <Stat label={t4(locale, 'Protein', 'Белки', 'Białko', 'Білки')} value={fmt(macros?.protein_g ?? item.protein)} unit="g" />
            <Stat label={t4(locale, 'Fat', 'Жиры', 'Tłuszcz', 'Жири')} value={fmt(macros?.fat_g ?? item.fat)} unit="g" />
            <Stat label={t4(locale, 'Carbs', 'Углеводы', 'Węglowodany', 'Вуглеводи')} value={fmt(macros?.carbs_g ?? item.carbs)} unit="g" />
          </div>
          {/* Extended macros row */}
          {macros && (macros.fiber_g != null || macros.sugar_g != null || macros.water_g != null) && (
            <div className="grid grid-cols-3 divide-x divide-border/50">
              {macros.fiber_g != null && <Stat label={t4(locale, 'Fiber', 'Клетчатка', 'Błonnik', 'Клітковина')} value={fmt(macros.fiber_g)} unit="g" />}
              {macros.sugar_g != null && <Stat label={t4(locale, 'Sugar', 'Сахар', 'Cukier', 'Цукор')} value={fmt(macros.sugar_g)} unit="g" />}
              {macros.water_g != null && <Stat label={t4(locale, 'Water', 'Вода', 'Woda', 'Вода')} value={fmt(macros.water_g)} unit="g" />}
            </div>
          )}
        </Section>

        {/* ── Minerals ── */}
        {minerals && Object.values(minerals).some((v) => v != null) && (
          <Section
            title={t4(locale, 'Minerals per 100g', 'Минералы на 100г', 'Minerały na 100g', 'Мінерали на 100г')}
            icon={<FlaskConical className="h-4 w-4 text-primary" />}
          >
            <div className="divide-y divide-border/30">
              <MiniRow label={t4(locale, 'Calcium', 'Кальций', 'Wapń', 'Кальцій')} value={minerals.calcium} unit="mg" />
              <MiniRow label={t4(locale, 'Iron', 'Железо', 'Żelazo', 'Залізо')} value={minerals.iron} unit="mg" />
              <MiniRow label={t4(locale, 'Magnesium', 'Магний', 'Magnez', 'Магній')} value={minerals.magnesium} unit="mg" />
              <MiniRow label={t4(locale, 'Phosphorus', 'Фосфор', 'Fosfor', 'Фосфор')} value={minerals.phosphorus} unit="mg" />
              <MiniRow label={t4(locale, 'Potassium', 'Калий', 'Potas', 'Калій')} value={minerals.potassium} unit="mg" />
              <MiniRow label={t4(locale, 'Sodium', 'Натрий', 'Sód', 'Натрій')} value={minerals.sodium} unit="mg" />
              <MiniRow label={t4(locale, 'Zinc', 'Цинк', 'Cynk', 'Цинк')} value={minerals.zinc} unit="mg" />
              <MiniRow label={t4(locale, 'Copper', 'Медь', 'Miedź', 'Мідь')} value={minerals.copper} unit="mg" />
              <MiniRow label={t4(locale, 'Manganese', 'Марганец', 'Mangan', 'Марганець')} value={minerals.manganese} unit="mg" />
              <MiniRow label={t4(locale, 'Selenium', 'Селен', 'Selen', 'Селен')} value={minerals.selenium} unit="µg" />
            </div>
          </Section>
        )}

        {/* ── Vitamins ── */}
        {vitamins && Object.values(vitamins).some((v) => v != null) && (
          <Section
            title={t4(locale, 'Vitamins per 100g', 'Витамины на 100г', 'Witaminy na 100g', 'Вітаміни на 100г')}
            icon={<Apple className="h-4 w-4 text-primary" />}
          >
            <div className="divide-y divide-border/30">
              <MiniRow label={t4(locale, 'Vitamin A', 'Витамин A', 'Witamina A', 'Вітамін A')} value={vitamins.vitamin_a} unit="µg" />
              <MiniRow label={t4(locale, 'Vitamin C', 'Витамин C', 'Witamina C', 'Вітамін C')} value={vitamins.vitamin_c} unit="mg" />
              <MiniRow label={t4(locale, 'Vitamin D', 'Витамин D', 'Witamina D', 'Вітамін D')} value={vitamins.vitamin_d} unit="µg" />
              <MiniRow label={t4(locale, 'Vitamin E', 'Витамин E', 'Witamina E', 'Вітамін E')} value={vitamins.vitamin_e} unit="mg" />
              <MiniRow label={t4(locale, 'Vitamin K', 'Витамин K', 'Witamina K', 'Вітамін K')} value={vitamins.vitamin_k} unit="µg" />
              <MiniRow label={t4(locale, 'Vitamin B1', 'Витамин B1', 'Witamina B1', 'Вітамін B1')} value={vitamins.vitamin_b1} unit="mg" />
              <MiniRow label={t4(locale, 'Vitamin B2', 'Витамин B2', 'Witamina B2', 'Вітамін B2')} value={vitamins.vitamin_b2} unit="mg" />
              <MiniRow label={t4(locale, 'Vitamin B3 (Niacin)', 'Витамин B3 (Ниацин)', 'Witamina B3 (Niacyna)', 'Вітамін B3 (Ніацин)')} value={vitamins.vitamin_b3} unit="mg" />
              <MiniRow label={t4(locale, 'Vitamin B5', 'Витамин B5', 'Witamina B5', 'Вітамін B5')} value={vitamins.vitamin_b5} unit="mg" />
              <MiniRow label={t4(locale, 'Vitamin B6', 'Витамин B6', 'Witamina B6', 'Вітамін B6')} value={vitamins.vitamin_b6} unit="mg" />
              <MiniRow label={t4(locale, 'Vitamin B9 (Folate)', 'Витамин B9 (Фолат)', 'Witamina B9 (Kwas foliowy)', 'Вітамін B9 (Фолат)')} value={vitamins.vitamin_b9} unit="µg" />
              <MiniRow label={t4(locale, 'Vitamin B12', 'Витамин B12', 'Witamina B12', 'Вітамін B12')} value={vitamins.vitamin_b12} unit="µg" />
            </div>
          </Section>
        )}

        {/* ── Culinary profile ── */}
        {culinary && Object.values(culinary).some((v) => v != null) && (
          <Section
            title={t4(locale, 'Culinary Profile', 'Кулинарный профиль', 'Profil kulinarny', 'Кулінарний профіль')}
            icon={<Leaf className="h-4 w-4 text-primary" />}
          >
            <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3">
              {[
                { label: t4(locale, 'Sweetness', 'Сладость', 'Słodycz', 'Солодкість'), val: culinary.sweetness },
                { label: t4(locale, 'Acidity', 'Кислотность', 'Kwasowość', 'Кислотність'), val: culinary.acidity },
                { label: t4(locale, 'Bitterness', 'Горечь', 'Gorycz', 'Гіркота'), val: culinary.bitterness },
                { label: 'Umami', val: culinary.umami },
                { label: t4(locale, 'Aroma', 'Аромат', 'Aromat', 'Аромат'), val: culinary.aroma },
              ]
                .filter((r) => r.val != null)
                .map((r) => (
                  <div key={r.label} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[11px] sm:text-xs font-bold text-muted-foreground w-20 sm:w-24 shrink-0">{r.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 sm:h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${((r.val as number) / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black text-foreground w-7 sm:w-8 text-right">{fmt(r.val)}</span>
                  </div>
                ))}
              {culinary.texture && (
                <div className="flex items-center gap-2 sm:gap-3 pt-1">
                  <span className="text-[11px] sm:text-xs font-bold text-muted-foreground w-20 sm:w-24 shrink-0">{t4(locale, 'Texture', 'Текстура', 'Tekstura', 'Текстура')}</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground capitalize">{culinary.texture}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Food properties ── */}
        {foodProps && Object.values(foodProps).some((v) => v != null) && (
          <Section
            title={t4(locale, 'Food Properties', 'Свойства продукта', 'Właściwości', 'Властивості продукту')}
            icon={<Scale className="h-4 w-4 text-primary" />}
          >
            <div className="divide-y divide-border/30">
              {foodProps.glycemic_index != null && <MiniRow label={t4(locale, 'Glycemic Index', 'Гликемический индекс', 'Indeks glikemiczny', 'Глікемічний індекс')} value={foodProps.glycemic_index} unit="" />}
              {foodProps.glycemic_load != null && <MiniRow label={t4(locale, 'Glycemic Load', 'Гликемическая нагрузка', 'Ładunek glikemiczny', 'Глікемічне навантаження')} value={foodProps.glycemic_load} unit="" />}
              {foodProps.ph != null && <MiniRow label="pH" value={foodProps.ph} unit="" />}
              {foodProps.smoke_point != null && <MiniRow label={t4(locale, 'Smoke Point', 'Точка дымления', 'Punkt dymienia', 'Точка димлення')} value={foodProps.smoke_point} unit="°C" />}
              {foodProps.water_activity != null && <MiniRow label={t4(locale, 'Water Activity', 'Активность воды', 'Aktywność wody', 'Активність води')} value={foodProps.water_activity} unit="" />}
            </div>
          </Section>
        )}

        {/* ── Kitchen measures & density ── */}
        {(measures || item.density_g_per_ml != null) && (
          <Section
            title={t4(locale, 'Kitchen Measures', 'Кухонные меры', 'Miary kuchenne', 'Кухонні міри')}
            icon={<Droplets className="h-4 w-4 text-primary" />}
          >
            <div className="divide-y divide-border/30">
              {measures?.grams_per_cup != null && <MiniRow label={t4(locale, '1 Cup', '1 Стакан', '1 Szklanka', '1 Склянка')} value={measures.grams_per_cup} unit="g" />}
              {measures?.grams_per_tbsp != null && <MiniRow label={t4(locale, '1 Tablespoon', '1 Ст. ложка', '1 Łyżka', '1 Ст. ложка')} value={measures.grams_per_tbsp} unit="g" />}
              {measures?.grams_per_tsp != null && <MiniRow label={t4(locale, '1 Teaspoon', '1 Ч. ложка', '1 Łyżeczka', '1 Ч. ложка')} value={measures.grams_per_tsp} unit="g" />}
              {item.density_g_per_ml != null && <MiniRow label={t4(locale, 'Density', 'Плотность', 'Gęstość', 'Щільність')} value={item.density_g_per_ml} unit="g/ml" />}
            </div>
          </Section>
        )}

        {/* ── Allergens & Seasons ── */}
        {((item.allergens && item.allergens.length > 0) || (item.seasons && item.seasons.length > 0)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
            {item.allergens && item.allergens.length > 0 && (
              <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3">
                  <ShieldAlert className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {t4(locale, 'Allergens', 'Аллергены', 'Alergeny', 'Алергени')}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {item.allergens.map((a) => (
                    <span key={a} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {item.seasons && item.seasons.length > 0 && (
              <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3">
                  <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {t4(locale, 'Season', 'Сезон', 'Sezon', 'Сезон')}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {item.seasons.map((s) => (
                    <span key={s} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Best pairings ── */}
        {pairings && pairings.length > 0 && (
          <Section
            title={t4(locale, 'Best Pairings', 'Лучшие сочетания', 'Najlepsze połączenia', 'Найкращі поєднання')}
            icon={<Heart className="h-4 w-4 text-primary" />}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-4">
              {pairings.map((p) => {
                const pName = pairingName(p, locale);
                return (
                  <Link
                    key={p.slug}
                    href={`/chef-tools/ingredients/${p.slug}` as never}
                    className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-border/50 bg-background hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all"
                  >
                    <div className="relative w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-muted border border-border/30">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={pName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs font-black text-foreground group-hover:text-primary transition-colors truncate w-full text-center">
                      {pName}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] sm:text-[10px] font-bold text-primary">{t4(locale, 'Match', 'Совпадение', 'Dopasowanie', 'Збіг')}</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-foreground">{fmt(p.pair_score)}/10</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Converter CTA ── */}
        <Link
          href="/chef-tools/converter"
          className="group flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 p-3 sm:p-5 mb-4 sm:mb-6 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
            <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
              {t4(locale,
                'Kitchen Unit Converter',
                'Конвертер кухонных единиц',
                'Przelicznik jednostek kuchennych',
                'Конвертер кухонних одиниць',
              )}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {t4(locale,
                'Instantly convert grams, ounces, liters, spoons and other kitchen measures.',
                'Мгновенно переводите граммы, унции, литры, ложки и другие кухонные меры.',
                'Błyskawicznie przeliczaj gramy, uncje, litry, łyżki i inne miary kuchenne.',
                'Миттєво переводьте грами, унції, літри, ложки та інші кухонні міри.',
              )}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>

        {/* ── Nutrition deep-dive link ── */}
        <Link
          href={`/chef-tools/nutrition` as never}
          className="group flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 p-3 sm:p-5 mb-6 sm:mb-8 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors shrink-0">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
              {t4(locale,
                'Nutrition Calculator',
                'Калькулятор питания',
                'Kalkulator odżywczy',
                'Калькулятор харчування',
              )}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {t4(locale,
                'Compare nutrition data, analyze recipes and plan balanced meals.',
                'Сравнивайте данные о питании, анализируйте рецепты и планируйте сбалансированное питание.',
                'Porównaj dane odżywcze, analizuj przepisy i planuj zbilansowane posiłki.',
                'Порівнюйте дані про харчування, аналізуйте рецепти та плануйте збалансоване харчування.',
              )}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>

        {/* ── Back link ── */}
        <Link href="/chef-tools/ingredients" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline">
          ← {t4(locale, 'All ingredients', 'Все ингредиенты', 'Wszystkie składniki', 'Всі інгредієнти')}
        </Link>
      </div>
    </div>
  );
}
