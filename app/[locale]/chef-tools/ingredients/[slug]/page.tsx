import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { fetchIngredient as apiFetchIngredient, fetchIngredientsMeta, fetchIngredientStates, fetchIngredientIntentPages } from '@/lib/api';
import type { ApiIngredient } from '@/lib/api';
import { ChefToolsNav } from '../../ChefToolsNav';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ChevronRight, Package, Leaf, Flame, Droplets, FlaskConical, Apple, Scale, Heart, CalendarDays, ShieldAlert, ArrowRight, ExternalLink, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import CategoryPage, { CATEGORY_MAP } from './category-page';
import IngredientStateClient from './IngredientStateClient';
import { JsonLd } from '@/components/JsonLd';
import { generateIngredientSEO } from '@/lib/seo-ingredients';

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

/** Static map: category → related ingredient slugs for cross-linking */
const CATEGORY_RELATED: Record<string, { slug: string; nameEn: string; names: Record<string, string> }[]> = {
  vegetables: [
    { slug: 'broccoli',    nameEn: 'Broccoli',    names: { en: 'Broccoli',    ru: '\u0411\u0440\u043e\u043a\u043a\u043e\u043b\u0438',   pl: 'Broku\u0142y',    uk: '\u0411\u0440\u043e\u043a\u043e\u043b\u0456'    } },
    { slug: 'cauliflower', nameEn: 'Cauliflower', names: { en: 'Cauliflower', ru: '\u0426\u0432\u0435\u0442\u043d\u0430\u044f \u043a\u0430\u043f\u0443\u0441\u0442\u0430', pl: 'Kalafior',  uk: '\u0426\u0432\u0456\u0442\u043d\u0430 \u043a\u0430\u043f\u0443\u0441\u0442\u0430' } },
    { slug: 'spinach',     nameEn: 'Spinach',     names: { en: 'Spinach',     ru: '\u0428\u043f\u0438\u043d\u0430\u0442',     pl: 'Szpinak',    uk: '\u0428\u043f\u0438\u043d\u0430\u0442'     } },
    { slug: 'zucchini',    nameEn: 'Zucchini',    names: { en: 'Zucchini',    ru: '\u041a\u0430\u0431\u0430\u0447\u043e\u043a',    pl: 'Cukinia',    uk: '\u041a\u0430\u0431\u0430\u0447\u043e\u043a'    } },
  ],
  fruits: [
    { slug: 'apple',       nameEn: 'Apple',       names: { en: 'Apple',       ru: '\u042f\u0431\u043b\u043e\u043a\u043e',     pl: 'Jab\u0142ko',     uk: '\u042f\u0431\u043b\u0443\u043a\u043e'     } },
    { slug: 'banana',      nameEn: 'Banana',      names: { en: 'Banana',      ru: '\u0411\u0430\u043d\u0430\u043d',      pl: 'Banan',      uk: '\u0411\u0430\u043d\u0430\u043d'      } },
    { slug: 'orange',      nameEn: 'Orange',      names: { en: 'Orange',      ru: '\u0410\u043f\u0435\u043b\u044c\u0441\u0438\u043d',   pl: 'Pomara\u0144cza', uk: '\u0410\u043f\u0435\u043b\u044c\u0441\u0438\u043d'   } },
    { slug: 'strawberry',  nameEn: 'Strawberry',  names: { en: 'Strawberry',  ru: '\u041a\u043b\u0443\u0431\u043d\u0438\u043a\u0430',   pl: 'Truskawka',  uk: '\u041f\u043e\u043b\u0443\u043d\u0438\u0446\u044f'   } },
  ],
  meat: [
    { slug: 'beef',           nameEn: 'Beef',         names: { en: 'Beef',         ru: '\u0413\u043e\u0432\u044f\u0434\u0438\u043d\u0430',   pl: 'Wo\u0142owina',   uk: '\u042f\u043b\u043e\u0432\u0438\u0447\u0438\u043d\u0430'  } },
    { slug: 'chicken-breast', nameEn: 'Chicken',      names: { en: 'Chicken',      ru: '\u041a\u0443\u0440\u0438\u0446\u0430',     pl: 'Kurczak',    uk: '\u041a\u0443\u0440\u043a\u0430'      } },
    { slug: 'pork',           nameEn: 'Pork',         names: { en: 'Pork',         ru: '\u0421\u0432\u0438\u043d\u0438\u043d\u0430',    pl: 'Wieprzowina', uk: '\u0421\u0432\u0438\u043d\u0438\u043d\u0430'    } },
    { slug: 'turkey',         nameEn: 'Turkey',       names: { en: 'Turkey',       ru: '\u0418\u043d\u0434\u0435\u0439\u043a\u0430',    pl: 'Indyk',      uk: '\u0406\u043d\u0434\u0438\u043a'      } },
  ],
  fish: [
    { slug: 'salmon',   nameEn: 'Salmon',   names: { en: 'Salmon',   ru: '\u041b\u043e\u0441\u043e\u0441\u044c',    pl: '\u0141oso\u015b',      uk: '\u041b\u043e\u0441\u043e\u0441\u044c'    } },
    { slug: 'tuna',     nameEn: 'Tuna',     names: { en: 'Tuna',     ru: '\u0422\u0443\u043d\u0435\u0446',     pl: 'Tu\u0144czyk',    uk: '\u0422\u0443\u043d\u0435\u0446\u044c'    } },
    { slug: 'cod',      nameEn: 'Cod',      names: { en: 'Cod',      ru: '\u0422\u0440\u0435\u0441\u043a\u0430',    pl: 'Dorsz',      uk: '\u0422\u0440\u0456\u0441\u043a\u0430'    } },
    { slug: 'mackerel', nameEn: 'Mackerel', names: { en: 'Mackerel', ru: '\u0421\u043a\u0443\u043c\u0431\u0440\u0438\u044f',  pl: 'Makrela',    uk: '\u0421\u043a\u0443\u043c\u0431\u0440\u0456\u044f'  } },
  ],
  dairy: [
    { slug: 'milk',         nameEn: 'Milk',         names: { en: 'Milk',         ru: '\u041c\u043e\u043b\u043e\u043a\u043e',     pl: 'Mleko',      uk: '\u041c\u043e\u043b\u043e\u043a\u043e'     } },
    { slug: 'butter',       nameEn: 'Butter',       names: { en: 'Butter',       ru: '\u041c\u0430\u0441\u043b\u043e',      pl: 'Mas\u0142o',      uk: '\u041c\u0430\u0441\u043b\u043e'      } },
    { slug: 'cheese',       nameEn: 'Cheese',       names: { en: 'Cheese',       ru: '\u0421\u044b\u0440',        pl: 'Ser',        uk: '\u0421\u0438\u0440'        } },
    { slug: 'greek-yogurt', nameEn: 'Greek Yogurt', names: { en: 'Greek Yogurt', ru: '\u0413\u0440\u0435\u0447\u0435\u0441\u043a\u0438\u0439 \u0439\u043e\u0433\u0443\u0440\u0442', pl: 'Jogurt grecki', uk: '\u0413\u0440\u0435\u0446\u044c\u043a\u0438\u0439 \u0439\u043e\u0433\u0443\u0440\u0442' } },
  ],
  grains: [
    { slug: 'rice',        nameEn: 'Rice',       names: { en: 'Rice',       ru: '\u0420\u0438\u0441',        pl: 'Ry\u017c',        uk: '\u0420\u0438\u0441'        } },
    { slug: 'oats',        nameEn: 'Oats',       names: { en: 'Oats',       ru: '\u041e\u0432\u0451\u0441',       pl: 'Owies',      uk: '\u041e\u0432\u0435\u0441'       } },
    { slug: 'wheat-flour', nameEn: 'Wheat Flour',names: { en: 'Wheat Flour',ru: '\u041c\u0443\u043a\u0430',       pl: 'M\u0105ka',       uk: '\u0411\u043e\u0440\u043e\u0448\u043d\u043e'    } },
    { slug: 'barley',      nameEn: 'Barley',     names: { en: 'Barley',     ru: '\u042f\u0447\u043c\u0435\u043d\u044c',     pl: 'J\u0119czmie\u0144',   uk: '\u042f\u0447\u043c\u0456\u043d\u044c'    } },
  ],
  nuts: [
    { slug: 'almonds',  nameEn: 'Almonds',  names: { en: 'Almonds',  ru: '\u041c\u0438\u043d\u0434\u0430\u043b\u044c',    pl: 'Migda\u0142y',    uk: '\u041c\u0438\u0433\u0434\u0430\u043b\u044c'   } },
    { slug: 'walnuts',  nameEn: 'Walnuts',  names: { en: 'Walnuts',  ru: '\u0413\u0440\u0435\u0446\u043a\u0438\u0439 \u043e\u0440\u0435\u0445', pl: 'Orzechy w\u0142oskie', uk: '\u0413\u0440\u0435\u0446\u044c\u043a\u0438\u0439 \u0433\u043e\u0440\u0456\u0445' } },
    { slug: 'cashews',  nameEn: 'Cashews',  names: { en: 'Cashews',  ru: '\u041a\u0435\u0448\u044c\u044e',      pl: 'Nerkowce',   uk: '\u041a\u0435\u0448\u044c\u044e'     } },
    { slug: 'peanuts',  nameEn: 'Peanuts',  names: { en: 'Peanuts',  ru: '\u0410\u0440\u0430\u0445\u0438\u0441',     pl: 'Orzeszki ziemne', uk: '\u0410\u0440\u0430\u0445\u0456\u0441' } },
  ],
  legumes: [
    { slug: 'lentils',      nameEn: 'Lentils',      names: { en: 'Lentils',      ru: '\u0427\u0435\u0447\u0435\u0432\u0438\u0446\u0430',   pl: 'Soczewica',  uk: '\u0421\u043e\u0447\u0435\u0432\u0438\u0446\u044f'  } },
    { slug: 'chickpeas',    nameEn: 'Chickpeas',    names: { en: 'Chickpeas',    ru: '\u041d\u0443\u0442',        pl: 'Ciecierzyca', uk: '\u041d\u0443\u0442'       } },
    { slug: 'black-beans',  nameEn: 'Black Beans',  names: { en: 'Black Beans',  ru: '\u0427\u0451\u0440\u043d\u0430\u044f \u0444\u0430\u0441\u043e\u043b\u044c', pl: 'Czarna fasola', uk: '\u0427\u043e\u0440\u043d\u0430 \u043a\u0432\u0430\u0441\u043e\u043b\u044f' } },
    { slug: 'kidney-beans', nameEn: 'Kidney Beans', names: { en: 'Kidney Beans', ru: '\u041a\u0440\u0430\u0441\u043d\u0430\u044f \u0444\u0430\u0441\u043e\u043b\u044c', pl: 'Fasola czerwona', uk: '\u0427\u0435\u0440\u0432\u043e\u043d\u0430 \u043a\u0432\u0430\u0441\u043e\u043b\u044f' } },
  ],
  spices: [
    { slug: 'cinnamon', nameEn: 'Cinnamon', names: { en: 'Cinnamon', ru: '\u041a\u043e\u0440\u0438\u0446\u0430',     pl: 'Cynamon',    uk: '\u041a\u043e\u0440\u0438\u0446\u044f'    } },
    { slug: 'turmeric', nameEn: 'Turmeric', names: { en: 'Turmeric', ru: '\u041a\u0443\u0440\u043a\u0443\u043c\u0430',    pl: 'Kurkuma',    uk: '\u041a\u0443\u0440\u043a\u0443\u043c\u0430'   } },
    { slug: 'ginger',   nameEn: 'Ginger',   names: { en: 'Ginger',   ru: '\u0418\u043c\u0431\u0438\u0440\u044c',    pl: 'Imbir',      uk: '\u0406\u043c\u0431\u0438\u0440'     } },
    { slug: 'garlic',   nameEn: 'Garlic',   names: { en: 'Garlic',   ru: '\u0427\u0435\u0441\u043d\u043e\u043a',    pl: 'Czosnek',    uk: '\u0427\u0430\u0441\u043d\u0438\u043a'    } },
  ],
  oils: [
    { slug: 'olive-oil',     nameEn: 'Olive Oil',     names: { en: 'Olive Oil',     ru: '\u041e\u043b\u0438\u0432\u043a\u043e\u0432\u043e\u0435 \u043c\u0430\u0441\u043b\u043e', pl: 'Oliwa z oliwek', uk: '\u041e\u043b\u0438\u0432\u043a\u043e\u0432\u0430 \u043e\u043b\u0456\u044f' } },
    { slug: 'coconut-oil',   nameEn: 'Coconut Oil',   names: { en: 'Coconut Oil',   ru: '\u041a\u043e\u043a\u043e\u0441\u043e\u0432\u043e\u0435 \u043c\u0430\u0441\u043b\u043e', pl: 'Olej kokosowy', uk: '\u041a\u043e\u043a\u043e\u0441\u043e\u0432\u0430 \u043e\u043b\u0456\u044f' } },
    { slug: 'sunflower-oil', nameEn: 'Sunflower Oil', names: { en: 'Sunflower Oil', ru: '\u041f\u043e\u0434\u0441\u043e\u043b\u043d\u0435\u0447\u043d\u043e\u0435 \u043c\u0430\u0441\u043b\u043e', pl: 'Olej s\u0142onecznikowy', uk: '\u0421\u043e\u043d\u044f\u0448\u043d\u0438\u043a\u043e\u0432\u0430 \u043e\u043b\u0456\u044f' } },
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

  // SEO engine: locale-specific formulas (PL/RU/UK), EN uses backend seo_title
  const seo = generateIngredientSEO(item, locale);

  const meta = genMeta({
    title: seo.title,
    description: seo.description,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/ingredients/${slug}`,
    image: item.og_image ?? item.image_url ?? undefined,
  });

  // OG override: backend og_title/og_description are English-only.
  // For PL/RU/UK, use locale SEO title/desc to avoid EN leaking into hreflang variants.
  if (locale === 'en' && (item.og_title || item.og_description)) {
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

  /* ── Build Food + NutritionInformation JSON-LD ── */
  const SITE = 'https://dima-fomin.pl';
  const pageUrl = `${locale}/chef-tools/ingredients/${slug}`;
  const absImage = item.image_url
    ? item.image_url.startsWith('http') ? item.image_url : `https://dima-fomin.pl${item.image_url}`
    : undefined;

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
      ...(absImage && {
        image: {
          '@type': 'ImageObject',
          contentUrl: absImage,
          url: absImage,
          caption: `${name} — ${t4(locale, 'nutrition facts per 100g', 'пищевая ценность на 100г', 'wartości odżywcze na 100g', 'харчова цінність на 100г')}`,
          width: 800,
          height: 800,
        },
      }),
      ...(description && { description }),
      ...(item.category && { category: item.category }),
      nutrition: nutritionLd,
      additionalProperty: [
        ...(calories != null ? [{ '@type': 'PropertyValue', name: 'Calories', value: `${fmt(calories)} kcal per 100g` }] : []),
        ...(proteinG != null ? [{ '@type': 'PropertyValue', name: 'Protein', value: `${fmt(proteinG)} g per 100g` }] : []),
      ],
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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-16">
      <JsonLd data={foodLd} />
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
            <div className="w-32 h-32 sm:w-56 sm:aspect-square mx-auto sm:mx-0 rounded-2xl overflow-hidden border border-border/50 bg-muted shrink-0">
              <Image src={item.image_url} alt={name} width={800} height={800} className="object-cover w-full h-full" unoptimized />
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

        {/* ── Kitchen measures & density (with converter deep-links) ── */}
        {(measures || item.density_g_per_ml != null) && (
          <Section
            title={t4(locale, 'Kitchen Measures', 'Кухонные меры', 'Miary kuchenne', 'Кухонні міри')}
            icon={<Droplets className="h-4 w-4 text-primary" />}
          >
            <div className="divide-y divide-border/30">
              {measures?.grams_per_cup != null && (
                <div className="flex items-center justify-between py-2 px-3 sm:px-4">
                  <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">{t4(locale, '1 Cup', '1 Стакан', '1 Szklanka', '1 Склянка')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-foreground">{fmt(measures.grams_per_cup)} <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">g</span></span>
                    <Link href="/chef-tools/converter/cup-to-grams" className="text-[9px] font-bold text-primary hover:underline border border-primary/20 rounded-full px-1.5 py-0.5 shrink-0">
                      {t4(locale, '1 cup to grams', 'стакан → г', 'szklanka → g', 'склянка → г')}
                    </Link>
                  </div>
                </div>
              )}
              {measures?.grams_per_tbsp != null && (
                <div className="flex items-center justify-between py-2 px-3 sm:px-4 bg-muted/20">
                  <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">{t4(locale, '1 Tablespoon', '1 Ст. ложка', '1 Łyżka', '1 Ст. ложка')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-foreground">{fmt(measures.grams_per_tbsp)} <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">g</span></span>
                    <Link href="/chef-tools/converter/tablespoon-to-grams" className="text-[9px] font-bold text-primary hover:underline border border-primary/20 rounded-full px-1.5 py-0.5 shrink-0">
                      {t4(locale, 'tablespoon to grams', 'ложка → г', 'łyżka → g', 'ложка → г')}
                    </Link>
                  </div>
                </div>
              )}
              {measures?.grams_per_tsp != null && (
                <div className="flex items-center justify-between py-2 px-3 sm:px-4">
                  <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">{t4(locale, '1 Teaspoon', '1 Ч. ложка', '1 Łyżeczka', '1 Ч. ложка')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-foreground">{fmt(measures.grams_per_tsp)} <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">g</span></span>
                    <Link href="/chef-tools/converter/teaspoon-to-grams" className="text-[9px] font-bold text-primary hover:underline border border-primary/20 rounded-full px-1.5 py-0.5 shrink-0">
                      {t4(locale, 'teaspoon to grams', 'ложка → г', 'łyżeczka → g', 'ложка → г')}
                    </Link>
                  </div>
                </div>
              )}
              {item.density_g_per_ml != null && <MiniRow label={t4(locale, 'Density', 'Плотность', 'Gęstość', 'Щільність')} value={item.density_g_per_ml} unit="g/ml" />}
            </div>
          </Section>
        )}

        {/* ── Used in Cooking — semantic SEO block ── */}
        <Section
          title={t4(locale, 'Used in Cooking', 'Применение в кулинарии', 'Zastosowanie w kuchni', 'Використання у кулінарії')}
          icon={<ExternalLink className="h-4 w-4 text-primary" />}
        >
          <div className="divide-y divide-border/30">
            <Link href="/chef-tools/converter/cup-to-grams" className="flex items-center justify-between py-2.5 px-3 sm:px-4 hover:bg-muted/30 transition-colors group">
              <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {t4(locale, `How many grams in 1 cup of ${name}?`, `Сколько граммов в 1 стакане ${name}?`, `Ile gramów w 1 szklance ${name}?`, `Скільки грамів у 1 склянці ${name}?`)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
            <Link href={`/chef-tools/nutrition/${slug}` as never} className="flex items-center justify-between py-2.5 px-3 sm:px-4 bg-muted/20 hover:bg-muted/40 transition-colors group">
              <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {t4(locale, `${name} — calories per 100g`, `${name} — калории на 100г`, `${name} — kalorie na 100g`, `${name} — калорії на 100г`)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
            <Link href="/chef-tools/converter/tablespoon-to-grams" className="flex items-center justify-between py-2.5 px-3 sm:px-4 hover:bg-muted/30 transition-colors group">
              <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {t4(locale, `${name} — tablespoon to grams`, `${name} — столовая ложка в граммы`, `${name} — łyżka stołowa na gramy`, `${name} — столова ложка в грами`)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
            <Link href={`/chef-tools/converter?ingredient=${slug}&from=cup&to=g` as never} className="flex items-center justify-between py-2.5 px-3 sm:px-4 bg-muted/20 hover:bg-muted/40 transition-colors group">
              <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {t4(locale, `Convert ${name}: grams, cups, oz`, `Конвертер ${name}: граммы, стаканы, унции`, `Przelicz ${name}: gramy, szklanki, oz`, `Конвертер ${name}: грами, склянки, унції`)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          </div>
        </Section>

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

        {/* ── Quick conversions pill bar ── */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
          <p className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t4(locale, 'Quick conversions', 'Быстрые конвертации', 'Szybkie przeliczenia', 'Швидкі конвертації')}
          </p>
          <Link href="/chef-tools/converter/cup-to-grams" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
            {t4(locale, '1 cup to grams converter', 'Стакан в граммы', 'Szklanka na gramy', '1 склянка в грами')}
          </Link>
          <Link href="/chef-tools/converter/tablespoon-to-grams" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
            {t4(locale, 'tablespoon to grams', 'Столовая ложка в граммы', 'Łyżka na gramy', 'Столова ложка в грами')}
          </Link>
          <Link href="/chef-tools/converter/teaspoon-to-grams" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
            {t4(locale, 'teaspoon to grams', 'Чайная ложка в граммы', 'Łyżeczka na gramy', 'Чайна ложка в грами')}
          </Link>
          <Link href="/chef-tools/converter/grams-to-oz" className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
            {t4(locale, 'grams to ounces (oz)', 'Граммы в унции', 'Gramy na uncje', 'Грами в унції')}
          </Link>
        </div>

        {/* ── Nutrition deep-dive: direct to this ingredient ── */}
        <Link
          href={`/chef-tools/nutrition/${slug}` as never}
          className="group flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 p-3 sm:p-5 mb-6 sm:mb-8 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors shrink-0">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
              {t4(locale,
                `${name} — nutrition facts & calories`,
                `${name} — пищевая ценность и калории`,
                `${name} — wartości odżywcze i kalorie`,
                `${name} — харчова цінність і калорії`,
              )}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {t4(locale,
                'Protein, fat, carbs, vitamins & minerals — full profile.',
                'Белки, жиры, углеводы, витамины и минералы — полный профиль.',
                'Białko, tłuszcze, węglowodany, witaminy i minerały — pełny profil.',
                'Білки, жири, вуглеводи, вітаміни та мінерали — повний профіль.',
              )}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </Link>

        {/* ── Similar ingredients (category-based SEO cross-links) ── */}
        {(() => {
          const related = getRelated(item.category, slug);
          if (related.length === 0) return null;
          return (
            <Section
              title={t4(locale, `Similar ${item.category ?? 'ingredients'}`, `Похожие: ${item.category ?? 'продукты'}`, `Podobne: ${item.category ?? 'składniki'}`, `Схожі: ${item.category ?? 'інгредієнти'}`)}
              icon={<Leaf className="h-4 w-4 text-primary" />}
            >
              <div className="divide-y divide-border/30">
                {related.map((r) => {
                  const rName = r.names[locale] ?? r.nameEn;
                  return (
                    <Link
                      key={r.slug}
                      href={`/chef-tools/ingredients/${r.slug}` as never}
                      className="flex items-center justify-between py-2.5 px-3 sm:px-4 hover:bg-muted/30 transition-colors group"
                    >
                      <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {t4(locale,
                          `${rName} — calories & nutrition`,
                          `${rName} — калории и питание`,
                          `${rName} — kalorie i odżywczość`,
                          `${rName} — калорії та харчування`,
                        )}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </Section>
          );
        })()}

        {/* ── Ingredient Article Hub (intent pages) ── */}
        {intentPages.length > 0 && (
          <Section
            title={t4(
              locale,
              `Articles about ${name}`,
              `Статьи о ${name}`,
              `Artykuły o ${name}`,
              `Статті про ${name}`,
            )}
            icon={<BookOpen className="h-4 w-4 text-primary" />}
          >
            <div className="divide-y divide-border/30">
              {intentPages.map((p) => (
                <Link
                  key={p.slug}
                  href={`/chef-tools/seo/${p.slug}` as never}
                  className="flex items-center justify-between py-3 px-3 sm:px-4 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                      {p.title}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {p.intent_type}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* ── Back link ── */}
        <Link href="/chef-tools/ingredients" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline">
          ← {t4(locale, 'All ingredients', 'Все ингредиенты', 'Wszystkie składniki', 'Всі інгредієнти')}
        </Link>
      </div>
    </div>
  );
}
