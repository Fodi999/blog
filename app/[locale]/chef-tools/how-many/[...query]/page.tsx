import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import {
  ChevronLeft, ChevronRight,
  Flame, Beef, Droplets, Wheat, ArrowRight,
} from 'lucide-react';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { fetchEquivalents, fetchIngredients, fetchIngredient } from '@/lib/api';
import type { Metadata } from 'next';
import { ChefToolsNav } from '../../ChefToolsNav';

export const revalidate = 86400;

// ─── Segment → API unit mapping ──────────────────────────────────────────────
const UNIT_SEGMENT_TO_API: Record<string, string> = {
  grams: 'g',
  oz:    'oz',
  cups:  'cup',
  cup:   'cup',
  ml:    'ml',
  lbs:   'lb',
  kg:    'kg',
};

const MEASURE_SEGMENT_TO_API: Record<string, string> = {
  cup:      'cup',
  tbsp:     'tbsp',
  tsp:      'tsp',
  oz:       'oz',
  gram:     'g',
  grams:    'g',
  kg:       'kg',
  lb:       'lb',
  lbs:      'lb',
  ml:       'ml',
};

// ─── Localised labels ─────────────────────────────────────────────────────────
const UNIT_LABELS: Record<string, Record<string, string>> = {
  en: { cup:'cup', tbsp:'tbsp', tsp:'tsp', g:'gram', kg:'kg', oz:'oz', lb:'lb', ml:'ml' },
  pl: { cup:'szklanka', tbsp:'łyżka', tsp:'łyżeczka', g:'gram', kg:'kg', oz:'uncja', lb:'funt', ml:'ml' },
  ru: { cup:'стакан', tbsp:'ст.л.', tsp:'ч.л.', g:'грамм', kg:'кг', oz:'унция', lb:'фунт', ml:'мл' },
  uk: { cup:'склянка', tbsp:'ст.л.', tsp:'ч.л.', g:'грам', kg:'кг', oz:'унція', lb:'фунт', ml:'мл' },
};

const ARTICLE: Record<string, string> = {
  cup: 'a', tbsp: 'a', tsp: 'a', oz: 'an', g: 'a', kg: 'a', lb: 'a', ml: 'a',
};

function lbl(unit: string, locale: string) {
  return UNIT_LABELS[locale]?.[unit] ?? UNIT_LABELS.en[unit] ?? unit;
}

const CONVERSION_SLUG: Record<string, string> = {
  'cup→g':    'cup-to-grams',
  'cup→oz':   'cup-to-oz',
  'cup→ml':   'cup-to-ml',
  'cup→tbsp': 'cup-to-tbsp',
  'cup→tsp':  'cup-to-tsp',
  'tbsp→g':   'tbsp-to-grams',
  'tbsp→oz':  'tbsp-to-oz',
  'tbsp→tsp': 'tbsp-to-tsp',
  'tsp→g':    'tsp-to-grams',
  'tsp→tbsp': 'tsp-to-tbsp',
  'oz→g':     'oz-to-grams',
  'g→oz':     'grams-to-oz',
  'g→cup':    'grams-to-cups',
  'g→ml':     'grams-to-ml',
  'kg→oz':    'kg-to-oz',
  'kg→lb':    'kg-to-lbs',
  'lb→g':     'lbs-to-grams',
  'ml→g':     'ml-to-grams',
};

function canonicalConvSlug(fromApi: string, toApi: string) {
  return CONVERSION_SLUG[`${fromApi}→${toApi}`] ?? null;
}

function buildH1(fromApi: string, toApi: string, name: string, locale: string): string {
  const fl = lbl(fromApi, locale);
  const tl = lbl(toApi, locale);
  const art = ARTICLE[fromApi] ?? 'a';
  switch (locale) {
    case 'pl': return `Ile ${tl} w 1 ${fl} ${name}?`;
    case 'ru': return `Сколько ${tl} в 1 ${fl} ${name}?`;
    case 'uk': return `Скільки ${tl} в 1 ${fl} ${name}?`;
    default:   return `How many ${tl} in ${art} ${fl} of ${name}?`;
  }
}

function buildAnswer(fromApi: string, toApi: string, name: string, result: number, locale: string): string {
  const fl = lbl(fromApi, locale);
  const tl = lbl(toApi, locale);
  const r  = result % 1 === 0 ? result.toFixed(0) : result.toFixed(1);
  switch (locale) {
    case 'pl': return `1 ${fl} ${name} = ${r} ${tl}. Przeliczenie oparte na rzeczywistej gęstości produktu.`;
    case 'ru': return `1 ${fl} ${name} = ${r} ${tl}. Конвертация основана на реальной плотности продукта.`;
    case 'uk': return `1 ${fl} ${name} = ${r} ${tl}. Конвертація базується на реальній щільності продукту.`;
    default:   return `1 ${fl} of ${name} = ${r} ${tl}. This conversion uses the actual density of ${name}.`;
  }
}

// All high-value search query combinations.
// Pattern: how-many-{unit}-in-a-{measure}-of-{slug}
// e.g. /how-many-grams-in-a-cup-of-rice
const TOP_COMBINATIONS = [
  // → grams (highest search volume globally)
  { unit: 'grams', measure: 'cup'  },
  { unit: 'grams', measure: 'tbsp' },
  { unit: 'grams', measure: 'tsp'  },
  { unit: 'grams', measure: 'oz'   },
  { unit: 'grams', measure: 'lb'   },
  // → oz
  { unit: 'oz',    measure: 'cup'  },
  { unit: 'oz',    measure: 'tbsp' },
  { unit: 'oz',    measure: 'grams'},
  // → cups / volume
  { unit: 'cups',  measure: 'grams'},
  { unit: 'ml',    measure: 'cup'  },
  { unit: 'ml',    measure: 'tbsp' },
  { unit: 'ml',    measure: 'tsp'  },
  // → lbs / kg
  { unit: 'lbs',   measure: 'kg'   },
  { unit: 'kg',    measure: 'lbs'  },
];

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const res = await fetch(
      'https://ministerial-yetta-fodi999-c58d8823.koyeb.app/public/ingredients?limit=200',
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { items: { slug: string }[] };
    const slugs = data.items.map((i) => i.slug).filter(Boolean);
    const locales = ['en', 'pl', 'ru', 'uk'];
    const params: { locale: string; query: string[] }[] = [];
    
    for (const locale of locales) {
      for (const { unit, measure } of TOP_COMBINATIONS) {
        for (const slug of slugs) {
          params.push({ locale, query: [`how-many-${unit}-in-a-${measure}-of-${slug}`] });
        }
      }
    }
    return params;
  } catch {
    return [];
  }
}

function parseQuery(query: string) {
  const match = query.match(/^how-many-(.*)-in-a-(.*)-of-(.*)$/);
  if (!match) return null;
  return {
    unit: match[1],
    measure: match[2],
    slug: match[3]
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; query: string[] }>;
}): Promise<Metadata> {
  const { locale, query } = await params;
  setRequestLocale(locale);
  const parsed = parseQuery(query[0]);
  if (!parsed) return {};

  const fromApi = MEASURE_SEGMENT_TO_API[parsed.measure];
  const toApi   = UNIT_SEGMENT_TO_API[parsed.unit];
  if (!fromApi || !toApi) return {};

  const data = await fetchEquivalents(parsed.slug, 1, fromApi, locale);
  if (!data) return {};

  const toEq = data.equivalents.find((e) => e.unit === toApi);
  if (!toEq) return {};

  return genMeta({
    title:       buildH1(fromApi, toApi, data.name, locale),
    description: buildAnswer(fromApi, toApi, data.name, toEq.value, locale),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/how-many/${query[0]}`,
  });
}

export default async function HowManyCatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; query: string[] }>;
}) {
  const { locale, query } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  // Slug from the query
  const rawQuery = query[0];
  const parsed = parseQuery(rawQuery);

  if (!parsed) notFound();

  const fromApi = MEASURE_SEGMENT_TO_API[parsed.measure];
  const toApi   = UNIT_SEGMENT_TO_API[parsed.unit];

  if (!fromApi || !toApi) notFound();

  const data = await fetchEquivalents(parsed.slug, 1, fromApi, locale);
  if (!data) notFound();

  const toEq = data.equivalents.find((e) => e.unit === toApi);
  if (!toEq) notFound();

  // Fetch full ingredient for nutrition
  const ingredientDetail = await fetchIngredient(parsed.slug);

  const name = data.name;
  const h1 = buildH1(fromApi, toApi, name, locale);
  const answer = buildAnswer(fromApi, toApi, name, toEq.value, locale);
  const fromLbl = lbl(fromApi, locale);
  const toLbl = lbl(toApi, locale);
  const result = toEq.value;
  const fmt = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));
  const convSlug = canonicalConvSlug(fromApi, toApi);
  
  const nutrition = ingredientDetail ? {
    calories: ingredientDetail.calories,
    protein: ingredientDetail.protein,
    fat: ingredientDetail.fat,
    carbs: ingredientDetail.carbs
  } : null;

  /* ── FAQPage JSON-LD ── */
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: h1,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      },
      ...(nutrition ? [{
        '@type': 'Question',
        name: locale === 'pl' ? `Ile kalorii ma ${name}?`
            : locale === 'ru' ? `Сколько калорий в ${name}?`
            : locale === 'uk' ? `Скільки калорій у ${name}?`
            : `How many calories does ${name} have?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: locale === 'pl' ? `${name} zawiera ${nutrition.calories} kcal, ${nutrition.protein ?? 0}g białka, ${nutrition.fat ?? 0}g tłuszczu i ${nutrition.carbs ?? 0}g węglowodanów na 100g.`
              : locale === 'ru' ? `${name} содержит ${nutrition.calories} kcal, ${nutrition.protein ?? 0}г белка, ${nutrition.fat ?? 0}г жиров и ${nutrition.carbs ?? 0}г углеводов на 100г.`
              : locale === 'uk' ? `${name} містить ${nutrition.calories} kcal, ${nutrition.protein ?? 0}г білка, ${nutrition.fat ?? 0}г жирів та ${nutrition.carbs ?? 0}г вуглеводів на 100г.`
              : `${name} contains ${nutrition.calories} kcal, ${nutrition.protein ?? 0}g protein, ${nutrition.fat ?? 0}g fat, and ${nutrition.carbs ?? 0}g carbs per 100g.`,
        },
      }] : []),
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <JsonLd data={faqLd} />
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
      {/* Search and Header */}
      <div className="mb-12 border-t border-primary/20 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
            {t('title')}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground/60 mb-6">
          <Link href="/chef-tools">{t('title')}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/chef-tools/converter">{t('tools.converter.title')}</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{name}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">{h1}</h1>

        <div className="border-2 border-primary/30 rounded-3xl p-8 bg-primary/5 mb-6 text-center">
          <div className="text-5xl font-black text-foreground mb-2 tabular-nums">1 {fromLbl} = {fmt(result)} {toLbl}</div>
          <p className="text-sm text-muted-foreground">{answer}</p>
        </div>

        {nutrition && (
           <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                <div className="font-black">{nutrition.calories}</div>
                <div className="text-[10px] uppercase opacity-60">kcal</div>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <div className="font-black">{nutrition.protein}g</div>
                <div className="text-[10px] uppercase opacity-60">Białko</div>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                <div className="font-black">{nutrition.fat}g</div>
                <div className="text-[10px] uppercase opacity-60">Tłuszcz</div>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <div className="font-black">{nutrition.carbs}g</div>
                <div className="text-[10px] uppercase opacity-60">Węglowodany</div>
              </div>
           </div>
        )}

        {convSlug && (
          <Link href={`/chef-tools/${convSlug}/${parsed.slug}` as never} className="block p-4 border rounded-2xl text-center font-bold hover:bg-muted/30">
             Pełna tabela: {name} ({fromLbl} → {toLbl})
          </Link>
        )}

        {/* Internal links to ingredient profile & converter */}
        <div className="mt-6 space-y-2">
          <Link
            href={`/chef-tools/ingredients/${parsed.slug}` as never}
            className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {locale === 'pl' ? `📊 Profil odżywczy: ${name}`
                : locale === 'ru' ? `📊 Пищевой профиль: ${name}`
                : locale === 'uk' ? `📊 Харчовий профіль: ${name}`
                : `📊 Nutrition profile: ${name}`}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
          <Link
            href="/chef-tools/converter"
            className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {locale === 'pl' ? '⚖️ Przelicznik jednostek kuchennych'
                : locale === 'ru' ? '⚖️ Конвертер кухонных единиц'
                : locale === 'uk' ? '⚖️ Конвертер кухонних одиниць'
                : '⚖️ Kitchen Unit Converter'}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
