import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { fetchIngredient as apiFetchIngredient, fetchIngredientsMeta, fetchIngredientStates, fetchIngredientIntentPages } from '@/lib/api';
import type { ApiIngredient } from '@/lib/api';
import { ChefToolsNav } from '../../ChefToolsNav';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { 
  ChevronRight, Package, Leaf, Flame, Droplets, FlaskConical, 
  Apple, Scale, Heart, CalendarDays, ShieldAlert, ArrowRight, 
  ExternalLink, BookOpen, ChevronLeft, Info
} from 'lucide-react';
import type { Metadata } from 'next';
import CategoryPage, { CATEGORY_MAP } from './category-page';
import IngredientStateClient from './IngredientStateClient';
import { JsonLd } from '@/components/JsonLd';
import { generateIngredientSEO } from '@/lib/seo-ingredients';
import { cn } from '@/lib/utils';

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

const CATEGORY_RELATED: Record<string, { slug: string; nameEn: string; names: Record<string, string> }[]> = {
  vegetables: [
    { slug: 'broccoli',    nameEn: 'Broccoli',    names: { en: 'Broccoli',    ru: 'Брокколи',   pl: 'Brokuły',    uk: 'Брокколі'    } },
    { slug: 'cauliflower', nameEn: 'Cauliflower', names: { en: 'Cauliflower', ru: 'Цветная капуста', pl: 'Kalafior',  uk: 'Цвітна капуста' } },
    { slug: 'spinach',     nameEn: 'Spinach',     names: { en: 'Spinach',     ru: 'Шпинат',     pl: 'Szpinak',    uk: 'Шпинат'     } },
    { slug: 'zucchini',    nameEn: 'Zucchini',    names: { en: 'Zucchini',    ru: 'Кабачок',    pl: 'Cukinia',    uk: 'Кабачок'    } },
  ],
  fruits: [
    { slug: 'apple',       nameEn: 'Apple',       names: { en: 'Apple',       ru: 'Яблоко',     pl: 'Jabłko',     uk: 'Яблуко'     } },
    { slug: 'banana',      nameEn: 'Banana',      names: { en: 'Banana',      ru: 'Банан',      pl: 'Banan',      uk: 'Банан'      } },
    { slug: 'orange',      nameEn: 'Orange',      names: { en: 'Orange',      ru: 'Апельсин',   pl: 'Pomarańcza', uk: 'Апельсин'   } },
    { slug: 'strawberry',  nameEn: 'Strawberry',  names: { en: 'Strawberry',  ru: 'Клубника',   pl: 'Truskawka',  uk: 'Полуниця'   } },
  ],
  meat: [
    { slug: 'beef',           nameEn: 'Beef',         names: { en: 'Beef',         ru: 'Говядина',   pl: 'Wołowina',   uk: 'Яловичина'  } },
    { slug: 'chicken-breast', nameEn: 'Chicken',      names: { en: 'Chicken',      ru: 'Курица',     pl: 'Kurczak',    uk: 'Курка'      } },
    { slug: 'pork',           nameEn: 'Pork',         names: { en: 'Pork',         ru: 'Свинина',    pl: 'Wieprzowina', uk: 'Свинина'    } },
    { slug: 'turkey',         nameEn: 'Turkey',       names: { en: 'Turkey',       ru: 'Индейка',    pl: 'Indyk',      uk: 'Індичка'      } },
  ],
  fish: [
    { slug: 'salmon',   nameEn: 'Salmon',   names: { en: 'Salmon',   ru: 'Лосось',    pl: 'Łosoś',      uk: 'Лосось'    } },
    { slug: 'tuna',     nameEn: 'Tuna',     names: { en: 'Tuna',     ru: 'Тунец',     pl: 'Tuńczyk',    uk: 'Тунець'    } },
    { slug: 'cod',      nameEn: 'Cod',      names: { en: 'Cod',      ru: 'Треска',    pl: 'Dorsz',      uk: 'Тріска'    } },
    { slug: 'mackerel', nameEn: 'Mackerel', names: { en: 'Mackerel', ru: 'Скумбрия',  pl: 'Makrela',    uk: 'Скумбрія'  } },
  ],
  dairy: [
    { slug: 'milk',         nameEn: 'Milk',         names: { en: 'Milk',         ru: 'Молоко',     pl: 'Mleko',      uk: 'Молоко'     } },
    { slug: 'butter',       nameEn: 'Butter',       names: { en: 'Butter',       ru: 'Масло',      pl: 'Masło',      uk: 'Масло'      } },
    { slug: 'cheese',       nameEn: 'Cheese',       names: { en: 'Cheese',       ru: 'Сыр',        pl: 'Ser',        uk: 'Сир'        } },
    { slug: 'greek-yogurt', nameEn: 'Greek Yogurt', names: { en: 'Greek Yogurt', ru: 'Греческий йогурт', pl: 'Jogurt grecki', uk: 'Грецький йогурт' } },
  ],
  grains: [
    { slug: 'rice',        nameEn: 'Rice',       names: { en: 'Rice',       ru: 'Рис',        pl: 'Ryż',        uk: 'Рис'        } },
    { slug: 'oats',        nameEn: 'Oats',       names: { en: 'Oats',       ru: 'Овёс',       pl: 'Owies',      uk: 'Овес'       } },
    { slug: 'wheat-flour', nameEn: 'Wheat Flour',names: { en: 'Wheat Flour',ru: 'Мука',       pl: 'Mąka',       uk: 'Борошно'    } },
    { slug: 'barley',      nameEn: 'Barley',     names: { en: 'Barley',     ru: 'Ячмень',     pl: 'Jęczmień',   uk: 'Ячмінь'    } },
  ],
  nuts: [
    { slug: 'almonds',  nameEn: 'Almonds',  names: { en: 'Almonds',  ru: 'Миндаль',    pl: 'Migdały',    uk: 'Мигдаль'   } },
    { slug: 'walnuts',  nameEn: 'Walnuts',  names: { en: 'Walnuts',  ru: 'Грецкий орех', pl: 'Orzechy włoskie', uk: 'Грецький горіх' } },
    { slug: 'cashews',  nameEn: 'Cashews',  names: { en: 'Cashews',  ru: 'Кешью',      pl: 'Nerkowce',   uk: 'Кешью'     } },
    { slug: 'peanuts',  nameEn: 'Peanuts',  names: { en: 'Peanuts',  ru: 'Арахис',     pl: 'Orzeszki ziemne', uk: 'Арахіс' } },
  ],
  legumes: [
    { slug: 'lentils',      nameEn: 'Lentils',      names: { en: 'Lentils',      ru: 'Чечевица',   pl: 'Soczewica',  uk: 'Сочевиця'  } },
    { slug: 'chickpeas',    nameEn: 'Chickpeas',    names: { en: 'Chickpeas',    ru: 'Нут',        pl: 'Ciecierzyca', uk: 'Нут'       } },
    { slug: 'black-beans',  nameEn: 'Black Beans',  names: { en: 'Black Beans',  ru: 'Чёрная фасоль', pl: 'Czarna fasola', uk: 'Чорна квасоля' } },
    { slug: 'kidney-beans', nameEn: 'Kidney Beans', names: { en: 'Kidney Beans', ru: 'Красная фасоль', pl: 'Fasola czerwona', uk: 'Червона квасоля' } },
  ],
  spices: [
    { slug: 'cinnamon', nameEn: 'Cinnamon', names: { en: 'Cinnamon', ru: 'Корица',     pl: 'Cynamon',    uk: 'Кориця'    } },
    { slug: 'turmeric', nameEn: 'Turmeric', names: { en: 'Turmeric', ru: 'Куркума',    pl: 'Kurkuma',    uk: 'Куркума'   } },
    { slug: 'ginger',   nameEn: 'Ginger',   names: { en: 'Ginger',   ru: 'Имбирь',    pl: 'Imbir',      uk: 'Імбир'     } },
    { slug: 'garlic',   nameEn: 'Garlic',   names: { en: 'Garlic',   ru: 'Чеснок',    pl: 'Czosnek',    uk: 'Часник'    } },
  ],
  oils: [
    { slug: 'olive-oil',     nameEn: 'Olive Oil',     names: { en: 'Olive Oil',     ru: 'Оливковое масло', pl: 'Oliwa z oliwek', uk: 'Оливкова олія' } },
    { slug: 'coconut-oil',   nameEn: 'Coconut Oil',   names: { en: 'Coconut Oil',   ru: 'Кокосовое масло', pl: 'Olej kokosowy', uk: 'Кокосова олія' } },
    { slug: 'sunflower-oil', nameEn: 'Sunflower Oil', names: { en: 'Sunflower Oil', ru: 'Подсолнечное масло', pl: 'Olej słonecznikowy', uk: 'Соняшникова олія' } },
  ],
};

function getRelated(category: string | undefined | null, currentSlug: string) {
  if (!category) return [];
  const key = category.toLowerCase();
  const list = CATEGORY_RELATED[key] ?? [];
  return list.filter((r) => r.slug !== currentSlug).slice(0, 4);
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

  const generatedSEO = generateIngredientSEO(item, locale);
  const seoTitle = (item as Record<string, unknown>)[`seo_title_${locale}`] as string | undefined || generatedSEO.title;
  const seoDesc = (item as Record<string, unknown>)[`seo_description_${locale}`] as string | undefined || generatedSEO.description;

  const meta = genMeta({
    title: seoTitle,
    description: seoDesc,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/ingredients/${slug}`,
    image: item.og_image ?? item.image_url ?? undefined,
  });

  meta.openGraph = {
    ...meta.openGraph,
    title: locale === 'en' && item.og_title ? item.og_title : seoTitle,
    description: locale === 'en' && item.og_description ? item.og_description : seoDesc,
  };
  meta.twitter = {
    ...meta.twitter,
    title: locale === 'en' && item.og_title ? item.og_title : seoTitle,
    description: locale === 'en' && item.og_description ? item.og_description : seoDesc,
  };

  return meta;
}

/* ─── Reusable section card ─────────────────────────────────────────────── */

function Section({ title, icon, children, className }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[2.5rem] bg-card/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-border dark:border-white/5 overflow-hidden mb-6 shadow-2xl", className)}>
      <div className="bg-muted/50 dark:bg-white/5 px-6 py-4 border-b border-border dark:border-white/5 flex items-center gap-3">
        {icon}
        <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-slate-400 italic">{title}</h2>
      </div>
      <div className="p-1 sm:p-2">{children}</div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="p-4 sm:p-6 text-center group">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-slate-500 mb-2 italic group-hover:text-primary transition-colors">{label}</p>
      <div className="flex flex-col items-center">
        <p className="text-3xl sm:text-5xl font-black text-foreground italic tracking-tighter leading-none">{value}</p>
        <span className="text-[10px] text-muted-foreground/40 dark:text-slate-600 font-bold uppercase tracking-widest mt-2">{unit}</span>
      </div>
    </div>
  );
}

function MiniRow({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between py-3 px-5 hover:bg-white/[0.03] transition-colors rounded-2xl group">
      <span className="text-xs font-bold text-muted-foreground/60 dark:text-slate-400 group-hover:text-foreground transition-colors uppercase tracking-tight italic">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm sm:text-base font-black text-foreground italic">{fmt(value)}</span>
        <span className="text-[10px] font-black text-muted-foreground/30 dark:text-slate-600 italic uppercase">{unit}</span>
      </div>
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

  if (isCategory(slug)) {
    return <CategoryPage params={Promise.resolve({ locale, category: slug })} />;
  }

  const [item, statesResp, intentPages] = await Promise.all([
    apiFetchIngredient(slug),
    fetchIngredientStates(slug).catch(() => null),
    fetchIngredientIntentPages(slug, locale).catch(() => []),
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

  if (pairings && pairings.length > 0) {
    const slugsNeedingImages = pairings.filter((p) => !p.image_url).map((p) => p.slug);
    if (slugsNeedingImages.length > 0) {
      const meta = await fetchIngredientsMeta(slugsNeedingImages);
      for (const p of pairings) {
        if (!p.image_url && meta[p.slug]?.image_url) p.image_url = meta[p.slug].image_url!;
      }
    }
  }

  const flagLabels: Record<string, string> = {
    vegan: t4(locale, 'Vegan', 'Веган', 'Wegański', 'Веган'),
    vegetarian: t4(locale, 'Vegetarian', 'Вегетарианский', 'Wegetariański', 'Вегетаріанський'),
    gluten_free: t4(locale, 'Gluten-free', 'Без глютена', 'Bezglutenowy', 'Без глютену'),
    keto: 'Keto',
    paleo: 'Paleo',
    mediterranean: t4(locale, 'Mediterranean', 'Средиземноморская', 'Śródziemnomorski', 'Середземноморська'),
    low_carb: 'Low-carb',
  };

  const calories = macros?.calories_kcal ?? item.calories;
  const proteinG = macros?.protein_g ?? item.protein;
  const fatG     = macros?.fat_g ?? item.fat;
  const carbsG   = macros?.carbs_g ?? item.carbs;
  const fiberG   = macros?.fiber_g;
  const sugarG   = macros?.sugar_g;
  const sodiumMg = minerals?.sodium;

  const nutritionLd: Record<string, unknown> = {
    '@type': 'NutritionInformation',
    servingSize: '100 g',
    ...(calories != null && { calories: `${fmt(calories)} kcal` }),
    ...(proteinG != null && { proteinContent: `${fmt(proteinG)} g` }),
    ...(fatG != null && { fatContent: `${fmt(fatG)} g` }),
    ...(carbsG != null && { carbohydrateContent: `${fmt(carbsG)} g` }),
    ...(fiberG != null && { fiberContent: `${fmt(fiberG)} g` }),
    ...(sugarG != null && { sugarContent: `${fmt(sugarG)} g` }),
    ...(sodiumMg != null && { sodiumContent: `${fmt(sodiumMg)} mg` }),
  };

  const foodLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${slug}`,
    url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${slug}`,
    name: `${name} — Nutrition Facts`,
    ...(description && { description }),
    mainEntity: {
      '@type': 'Thing',
      additionalType: 'https://schema.org/Food',
      name,
      ...(item.image_url && {
        image: {
          '@type': 'ImageObject',
          contentUrl: item.image_url.startsWith('http') ? item.image_url : `https://dima-fomin.pl${item.image_url}`,
          url: item.image_url.startsWith('http') ? item.image_url : `https://dima-fomin.pl${item.image_url}`,
          width: 800, height: 800,
        },
      }),
      nutrition: nutritionLd,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Chef Tools', item: `https://dima-fomin.pl/${locale}/chef-tools` },
        { '@type': 'ListItem', position: 2, name: t('ingredients.catalog.title'), item: `https://dima-fomin.pl/${locale}/chef-tools/ingredients` },
        { '@type': 'ListItem', position: 3, name },
      ],
    },
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden pt-12 pb-24">
      {/* ── Background Mesh ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[140px] animate-pulse-slow dark:opacity-100 opacity-30" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse-slow delay-1000 dark:opacity-100 opacity-20" />
      </div>

      <JsonLd data={foodLd} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
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

        <div className="mt-8 sm:mt-12 mb-8 sm:mb-12 border-t border-border/50 dark:border-white/5 pt-8 sm:pt-12">
          {/* ── Breadcrumb ── */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 italic overflow-x-auto scrollbar-hide">
            <Link href="/chef-tools" className="hover:text-primary transition-colors shrink-0">Chef Tools</Link>
            <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
            <Link href="/chef-tools/ingredients" className="hover:text-primary transition-colors shrink-0">{t('ingredients.catalog.title')}</Link>
            <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
            <span className="text-foreground shrink-0">{name}</span>
          </div>

          {/* ── Header ── */}
          <div className="ingredient-header-stack flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-10 sm:mb-16">
            <div className="relative w-32 h-32 sm:w-64 sm:h-64 shrink-0">
               <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-20 animate-pulse-slow" />
               <div className="relative w-full h-full rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] backdrop-blur-3xl shadow-2xl p-3 sm:p-4 group">
                 {item.image_url ? (
                   <div className="relative w-full h-full rounded-[1.8rem] sm:rounded-[2.5rem] overflow-hidden shadow-inner bg-muted dark:bg-slate-900 border border-border/50 dark:border-white/5">
                      <Image src={item.image_url} alt={name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-95 dark:brightness-90 group-hover:brightness-100" priority unoptimized />
                   </div>
                 ) : (
                   <div className="w-full h-full rounded-[1.8rem] sm:rounded-[2.5rem] bg-muted flex items-center justify-center opacity-30 border border-border dark:border-white/5">
                     <Package className="h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground" />
                   </div>
                 )}
               </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0 py-1 sm:py-2">
              <h1 className="text-3xl sm:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none mb-3 sm:mb-4">
                {name}<span className="text-primary italic">.</span>
              </h1>
              {seoH1 && seoH1 !== name && (
                <p className="text-[10px] sm:text-sm font-black text-primary/80 uppercase tracking-[0.2em] italic mb-3 sm:mb-4">{seoH1}</p>
              )}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                {item.category && (
                  <span className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] bg-muted/50 dark:bg-white/[0.03] border border-border/50 dark:border-white/5 text-muted-foreground italic">
                    {item.category}
                  </span>
                )}
                {item.product_type && (
                  <span className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 border border-primary/20 text-primary italic">
                    {item.product_type}
                  </span>
                )}
              </div>

              {description && (
                <p className="text-[11px] sm:text-[13px] text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4 sm:pl-6 text-left max-w-2xl py-1 italic">
                  {description}
                </p>
              )}

              {dietFlags && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mt-6 sm:mt-8">
                  {(Object.entries(dietFlags) as [string, boolean | undefined][])
                    .filter(([, v]) => v === true)
                    .map(([k]) => (
                      <span key={k} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/20 italic flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        {flagLabels[k] ?? k}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* ── State Switcher — Glass Container ── */}
          {statesList.length > 0 && (
            <div className="mb-8 sm:mb-12 bg-muted/30 dark:bg-white/[0.01] border border-border dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] p-3 sm:p-6 backdrop-blur-md transition-colors">
              <IngredientStateClient
                slug={item.slug ?? slug}
                locale={locale}
                availableStates={statesList}
                initialState={initialState}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* ── Nutrition Section ── */}
            <Section
              title={t4(locale, 'Nutrition per 100g', 'Пищевая ценность на 100г', 'Wartości odżywcze na 100g', 'Харчова цінність на 100г')}
              icon={<Flame className="h-4 w-4 text-primary" />}
              className="md:col-span-2"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border/50 dark:border-white/5">
                <Stat label={t4(locale, 'Calories', 'Калории', 'Kalorie', 'Калорії')} value={fmt(macros?.calories_kcal ?? item.calories)} unit="kcal" />
                <Stat label={t4(locale, 'Protein', 'Белки', 'Białko', 'Білки')} value={fmt(macros?.protein_g ?? item.protein)} unit="g" />
                <Stat label={t4(locale, 'Fat', 'Жиры', 'Tłuszcz', 'Жири')} value={fmt(macros?.fat_g ?? item.fat)} unit="g" />
                <Stat label={t4(locale, 'Carbs', 'Углеводы', 'Węglowodany', 'Вуглеводи')} value={fmt(macros?.carbs_g ?? item.carbs)} unit="g" />
              </div>
              {macros && (macros.fiber_g != null || macros.sugar_g != null || macros.water_g != null) && (
                <div className="grid grid-cols-3">
                  {macros.fiber_g != null && <Stat label={t4(locale, 'Fiber', 'Клетчатка', 'Błonnik', 'Клітковина')} value={fmt(macros.fiber_g)} unit="g" />}
                  {macros.sugar_g != null && <Stat label={t4(locale, 'Sugar', 'Сахар', 'Cukier', 'Цукор')} value={fmt(macros.sugar_g)} unit="g" />}
                  {macros.water_g != null && <Stat label={t4(locale, 'Water', 'Вода', 'Woda', 'Вода')} value={fmt(macros.water_g)} unit="g" />}
                </div>
              )}
            </Section>

            {/* ── Minerals Section ── */}
            {minerals && Object.values(minerals).some((v) => v != null) && (
              <Section
                title={t4(locale, 'Minerals', 'Минералы', 'Minerały', 'Мінерали')}
                icon={<FlaskConical className="h-4 w-4 text-primary" />}
              >
                <div className="p-2 sm:p-4 space-y-1">
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

            {/* ── Vitamins Section ── */}
            {vitamins && Object.values(vitamins).some((v) => v != null) && (
              <Section
                title={t4(locale, 'Vitamins', 'Витамины', 'Witaminy', 'Вітаміни')}
                icon={<Apple className="h-4 w-4 text-primary" />}
              >
                <div className="p-2 sm:p-4 space-y-1">
                  <MiniRow label="Vitamin A" value={vitamins.vitamin_a} unit="µg" />
                  <MiniRow label="Vitamin C" value={vitamins.vitamin_c} unit="mg" />
                  <MiniRow label="Vitamin D" value={vitamins.vitamin_d} unit="µg" />
                  <MiniRow label="Vitamin E" value={vitamins.vitamin_e} unit="mg" />
                  <MiniRow label="Vitamin K" value={vitamins.vitamin_k} unit="µg" />
                  <MiniRow label="Vitamin B1" value={vitamins.vitamin_b1} unit="mg" />
                  <MiniRow label="Vitamin B2" value={vitamins.vitamin_b2} unit="mg" />
                  <MiniRow label="B3 (Niacin)" value={vitamins.vitamin_b3} unit="mg" />
                  <MiniRow label="Vitamin B5" value={vitamins.vitamin_b5} unit="mg" />
                  <MiniRow label="Vitamin B6" value={vitamins.vitamin_b6} unit="mg" />
                  <MiniRow label="B9 (Folate)" value={vitamins.vitamin_b9} unit="µg" />
                  <MiniRow label="Vitamin B12" value={vitamins.vitamin_b12} unit="µg" />
                </div>
              </Section>
            )}

            {/* ── Culinary Section ── */}
            {culinary && Object.values(culinary).some((v) => v != null) && (
              <Section
                title={t4(locale, 'Culinary Profile', 'Кулинарный профиль', 'Profil kulinarny', 'Кулінарний профіль')}
                icon={<Leaf className="h-4 w-4 text-primary" />}
              >
                <div className="p-6 space-y-5">
                  {[
                    { label: t4(locale, 'Sweetness', 'Сладость', 'Słodycz', 'Солодкість'), val: culinary.sweetness },
                    { label: t4(locale, 'Acidity', 'Кислотность', 'Kwasowość', 'Кислотність'), val: culinary.acidity },
                    { label: t4(locale, 'Bitterness', 'Горечь', 'Gorycz', 'Гіркота'), val: culinary.bitterness },
                    { label: 'Umami', val: culinary.umami },
                    { label: t4(locale, 'Aroma', 'Аромат', 'Aromat', 'Аромат'), val: culinary.aroma },
                  ].filter((r) => r.val != null).map((r) => (
                    <div key={r.label} className="flex flex-col gap-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{r.label}</span>
                         <span className="text-xs font-black text-foreground italic">{fmt(r.val)}/10</span>
                       </div>
                       <div className="w-full bg-muted dark:bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)]" style={{ width: `${((r.val as number) / 10) * 100}%` }} />
                       </div>
                    </div>
                  ))}
                  {culinary.texture && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{t4(locale, 'Texture', 'Текстура', 'Tekstura', 'Текстура')}</span>
                      <span className="text-xs font-black text-foreground italic capitalize tracking-wide">{culinary.texture}</span>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ── Food properties section ── */}
            {foodProps && Object.values(foodProps).some((v) => v != null) && (
              <Section title="Properties" icon={<Scale className="h-4 w-4 text-primary" />}>
                 <div className="p-2 sm:p-4 space-y-1">
                    <MiniRow label="Glycemic Index" value={foodProps.glycemic_index} unit="" />
                    <MiniRow label="Glycemic Load" value={foodProps.glycemic_load} unit="" />
                    <MiniRow label="pH Level" value={foodProps.ph} unit="" />
                    <MiniRow label="Smoke Point" value={foodProps.smoke_point} unit="°C" />
                    <MiniRow label="Water Activity" value={foodProps.water_activity} unit="" />
                 </div>
              </Section>
            )}
          </div>

          {/* ── Measures ── */}
          {(measures || item.density_g_per_ml != null) && (
             <Section title="Kitchen Measures" icon={<Droplets className="h-4 w-4 text-primary" />} className="mt-8">
               <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {measures?.grams_per_cup != null && (
                   <div className="p-5 rounded-3xl bg-muted/50 dark:bg-white/[0.02] border border-border/50 dark:border-white/5 flex flex-col items-center gap-3 group/m transition-all hover:bg-muted dark:hover:bg-white/[0.05]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">1 Cup</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground italic">{fmt(measures.grams_per_cup)}</span>
                        <span className="text-xs font-black text-muted-foreground italic uppercase">G</span>
                      </div>
                      <Link href="/chef-tools/converter/cup-to-grams" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-primary hover:text-foreground transition-colors">
                        Converter <ArrowRight className="h-3 w-3" />
                      </Link>
                   </div>
                 )}
                 {measures?.grams_per_tbsp != null && (
                   <div className="p-5 rounded-3xl bg-muted/50 dark:bg-white/[0.02] border border-border/50 dark:border-white/5 flex flex-col items-center gap-3 group/m transition-all hover:bg-muted dark:hover:bg-white/[0.05]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">1 Tablespoon</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground italic">{fmt(measures.grams_per_tbsp)}</span>
                        <span className="text-xs font-black text-muted-foreground italic uppercase">G</span>
                      </div>
                      <Link href="/chef-tools/converter/tablespoon-to-grams" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-primary hover:text-foreground transition-colors">
                        Converter <ArrowRight className="h-3 w-3" />
                      </Link>
                   </div>
                 )}
                 {item.density_g_per_ml != null && (
                   <div className="p-5 rounded-3xl bg-muted/50 dark:bg-white/[0.02] border border-border/50 dark:border-white/5 flex flex-col items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Density</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground italic">{fmt(item.density_g_per_ml)}</span>
                        <span className="text-xs font-black text-muted-foreground italic uppercase">G/ML</span>
                      </div>
                      <Info className="h-3 w-3 text-muted-foreground/50" />
                   </div>
                 )}
               </div>
             </Section>
          )}

          {/* ── Best pairings — Wide Row ── */}
          {pairings && pairings.length > 0 && (
            <Section
              title={t4(locale, 'Culinary Affinities', 'Гастрономические пары', 'Afinicje kulinarne', 'Кулінарні спорідненості')}
              icon={<Heart className="h-4 w-4 text-primary" />}
              className="mt-8 overflow-visible"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 p-4 sm:p-6">
                {pairings.map((p) => {
                  const pName = pairingName(p, locale);
                  return (
                    <Link
                      key={p.slug}
                      href={`/chef-tools/ingredients/${p.slug}` as never}
                      className="group/p flex flex-col items-center gap-3 p-4 rounded-[2.5rem] bg-card dark:bg-white/[0.02] border border-border/50 dark:border-white/5 hover:border-primary/30 transition-all duration-700 hover-lift hover-glow shadow-2xl"
                    >
                      <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden bg-muted dark:bg-slate-900 border border-border/50 dark:border-white/5">
                        {p.image_url ? (
                          <Image src={p.image_url} alt={pName} fill className="object-cover group-hover/p:scale-110 transition-transform duration-700 brightness-95 dark:brightness-90 group-hover/p:brightness-100" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-black text-foreground group-hover/p:text-primary transition-colors italic uppercase tracking-tight text-center truncate w-full">
                        {pName}
                      </p>
                      <div className="px-3 py-1 rounded-full bg-muted dark:bg-white/5 text-[8px] font-black uppercase tracking-widest text-muted-foreground italic">
                        Score {fmt(p.pair_score)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── SEO Footer ── */}
          <div className="mt-24 p-12 rounded-[4rem] bg-muted/30 dark:bg-white/[0.02] backdrop-blur-3xl border border-border dark:border-white/5 relative overflow-hidden group/seo">
             <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
             <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                   <h3 className="text-3xl sm:text-5xl font-black text-foreground italic tracking-tighter leading-none mb-6">
                      Knowledge Hub<span className="text-primary italic">.</span>
                   </h3>
                   <p className="text-muted-foreground text-sm leading-relaxed max-w-md italic">
                      Explore deep culinary insights, nutrition profiles, and intelligent unit conversions for high-end professional kitchens.
                   </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <Link href="/chef-tools/converter" className="p-6 rounded-3xl bg-card dark:bg-white/5 border border-border dark:border-white/5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all italic text-center">
                      Converter
                   </Link>
                   <Link href="/chef-tools/ingredients" className="p-6 rounded-3xl bg-card dark:bg-white/5 border border-border dark:border-white/5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all italic text-center">
                      Catalog
                   </Link>
                   <Link href="/chef-tools/lab" className="p-6 rounded-3xl bg-card dark:bg-white/5 border border-border dark:border-white/5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all italic text-center">
                      AI Lab
                   </Link>
                   <Link href="/chef-tools/nutrition" className="p-6 rounded-3xl bg-card dark:bg-white/5 border border-border dark:border-white/5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all italic text-center">
                      Analysis
                   </Link>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
