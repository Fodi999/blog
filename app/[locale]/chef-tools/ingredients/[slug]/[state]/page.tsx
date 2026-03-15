import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import {
  fetchIngredient as apiFetchIngredient,
  fetchIngredientStates,
  fetchIngredientStateSingle,
} from '@/lib/api';
import type { ApiIngredient } from '@/lib/api';
import { ChefToolsNav } from '../../../ChefToolsNav';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ChevronRight, Package, Flame } from 'lucide-react';
import type { Metadata } from 'next';
import IngredientStateClient from '../IngredientStateClient';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

/* ─── valid states ─────────────────────────────────────────────────────── */

const VALID_STATES = [
  'raw', 'boiled', 'steamed', 'baked', 'grilled',
  'fried', 'smoked', 'frozen', 'dried', 'pickled',
] as const;

type ProcessingState = (typeof VALID_STATES)[number];

function isValidState(s: string): s is ProcessingState {
  return (VALID_STATES as readonly string[]).includes(s);
}

/* ─── helpers ──────────────────────────────────────────────────────────── */

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

function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  const r = Math.round(v * 10) / 10;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

const STATE_LABELS: Record<string, Record<string, string>> = {
  raw:     { en: 'Raw', ru: 'Сырой', pl: 'Surowy', uk: 'Сирий' },
  boiled:  { en: 'Boiled', ru: 'Варёный', pl: 'Gotowany', uk: 'Варений' },
  steamed: { en: 'Steamed', ru: 'На пару', pl: 'Na parze', uk: 'На парі' },
  baked:   { en: 'Baked', ru: 'Запечённый', pl: 'Pieczony', uk: 'Запечений' },
  grilled: { en: 'Grilled', ru: 'На гриле', pl: 'Grillowany', uk: 'На грилі' },
  fried:   { en: 'Fried', ru: 'Жареный', pl: 'Smażony', uk: 'Смажений' },
  smoked:  { en: 'Smoked', ru: 'Копчёный', pl: 'Wędzony', uk: 'Копчений' },
  frozen:  { en: 'Frozen', ru: 'Замороженный', pl: 'Mrożony', uk: 'Заморожений' },
  dried:   { en: 'Dried', ru: 'Сушёный', pl: 'Suszony', uk: 'Сушений' },
  pickled: { en: 'Pickled', ru: 'Маринованный', pl: 'Marynowany', uk: 'Маринований' },
};

function stateLabel(state: string, locale: string): string {
  return STATE_LABELS[state]?.[locale] ?? STATE_LABELS[state]?.en ?? state;
}

/* ─── static params for ISR ────────────────────────────────────────────── */

export async function generateStaticParams() {
  // Pre-generate top states for all ingredients at build
  // Others will be generated on-demand via ISR
  return [];
}

/* ─── metadata ─────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; state: string }>;
}): Promise<Metadata> {
  const { locale, slug, state } = await params;
  setRequestLocale(locale);

  if (!isValidState(state)) return {};

  const item = await apiFetchIngredient(slug);
  if (!item) return {};

  const name = localName(item, locale);
  const sl = stateLabel(state, locale);

  const title = t4(locale,
    `${name} ${sl} — Nutrition, Calories, GI`,
    `${name} ${sl} — Калории, БЖУ, ГИ`,
    `${name} ${sl} — Kalorie, Wartości odżywcze, IG`,
    `${name} ${sl} — Калорії, БЖУ, ГІ`,
  );

  const description = t4(locale,
    `${name} ${sl.toLowerCase()} nutrition facts per 100g: calories, protein, fat, carbs, glycemic index, cooking transformation, water loss, oil absorption.`,
    `${name} ${sl.toLowerCase()}: калории, белки, жиры, углеводы на 100г, гликемический индекс, потеря воды и масла при готовке.`,
    `${name} ${sl.toLowerCase()} wartości odżywcze na 100g: kalorie, białko, tłuszcz, węglowodany, indeks glikemiczny, transformacja gotowania.`,
    `${name} ${sl.toLowerCase()}: калорії, білки, жири, вуглеводи на 100г, глікемічний індекс, втрата води та олії при готуванні.`,
  );

  return genMeta({
    title,
    description,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/ingredients/${slug}/${state}`,
    image: item.og_image ?? item.image_url ?? undefined,
  });
}

/* ─── page ─────────────────────────────────────────────────────────────── */

export default async function IngredientStatePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; state: string }>;
}) {
  const { locale, slug, state } = await params;
  setRequestLocale(locale);

  if (!isValidState(state)) notFound();

  const [item, statesResp, stateDetail] = await Promise.all([
    apiFetchIngredient(slug),
    fetchIngredientStates(slug).catch(() => null),
    fetchIngredientStateSingle(slug, state).catch(() => null),
  ]);

  if (!item) notFound();
  if (!stateDetail) notFound();

  const t = await getTranslations({ locale, namespace: 'chefTools' });
  const name = localName(item, locale);
  const sl = stateLabel(state, locale);
  const statesList = statesResp?.states ?? [];

  /* ── JSON-LD ── */
  const n = stateDetail.nutrition;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${name} (${sl})`,
    ...(item.image_url && { image: item.image_url }),
    description: `${name} ${sl.toLowerCase()} — nutrition facts per 100g`,
    brand: { '@type': 'Brand', name: 'Chef Tools by Dima Fomin' },
    nutrition: {
      '@type': 'NutritionInformation',
      servingSize: '100g',
      ...(n?.calories_per_100g != null && { calories: `${fmt(n.calories_per_100g)} kcal` }),
      ...(n?.protein_per_100g != null && { proteinContent: `${fmt(n.protein_per_100g)} g` }),
      ...(n?.fat_per_100g != null && { fatContent: `${fmt(n.fat_per_100g)} g` }),
      ...(n?.carbs_per_100g != null && { carbohydrateContent: `${fmt(n.carbs_per_100g)} g` }),
      ...(n?.fiber_per_100g != null && { fiberContent: `${fmt(n.fiber_per_100g)} g` }),
    },
    additionalProperty: [
      ...(n?.calories_per_100g != null ? [{ '@type': 'PropertyValue', name: 'Calories', value: `${fmt(n.calories_per_100g)} kcal per 100g` }] : []),
      ...(stateDetail.glycemic_index != null ? [{ '@type': 'PropertyValue', name: 'Glycemic Index', value: String(stateDetail.glycemic_index) }] : []),
      ...(stateDetail.cooking_method ? [{ '@type': 'PropertyValue', name: 'Cooking Method', value: stateDetail.cooking_method }] : []),
    ],
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
          <Link href={`/chef-tools/ingredients/${slug}` as never} className="hover:text-foreground transition-colors shrink-0">{name}</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground">{sl}</span>
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-10">
          {item.image_url ? (
            <div className="relative w-32 h-32 sm:w-48 sm:h-auto sm:aspect-square mx-auto sm:mx-0 rounded-2xl overflow-hidden border border-border/50 bg-muted shrink-0">
              <Image src={item.image_url} alt={`${name} ${sl}`} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-32 h-32 sm:w-48 sm:h-auto sm:aspect-square mx-auto sm:mx-0 rounded-2xl border border-border/50 bg-muted flex items-center justify-center shrink-0">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic mb-1 sm:mb-2">
              {name} — {sl}<span className="text-primary">.</span>
            </h1>
            {item.category && (
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">{item.category}</p>
            )}
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 sm:pl-4 text-left">
              {t4(locale,
                `Nutrition facts, calories, glycemic index and cooking transformation for ${name.toLowerCase()} ${sl.toLowerCase()} per 100g.`,
                `Пищевая ценность, калории, гликемический индекс и кулинарная трансформация для продукта ${name.toLowerCase()} ${sl.toLowerCase()} на 100г.`,
                `Wartości odżywcze, kalorie, indeks glikemiczny i transformacja gotowania dla ${name.toLowerCase()} ${sl.toLowerCase()} na 100g.`,
                `Харчова цінність, калорії, глікемічний індекс і кулінарна трансформація для ${name.toLowerCase()} ${sl.toLowerCase()} на 100г.`,
              )}
            </p>
          </div>
        </div>

        {/* ── State Switcher (reuses existing client component) ── */}
        {statesList.length > 0 && (
          <IngredientStateClient
            slug={item.slug ?? slug}
            locale={locale}
            availableStates={statesList}
            initialState={state}
          />
        )}

        {/* ── Quick nutrition summary (static, SSR-rendered for SEO) ── */}
        <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden mb-4 sm:mb-6">
          <div className="bg-muted/30 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
              {t4(locale,
                `${name} ${sl} — Nutrition per 100g`,
                `${name} ${sl} — Пищевая ценность на 100г`,
                `${name} ${sl} — Wartości odżywcze na 100g`,
                `${name} ${sl} — Харчова цінність на 100г`,
              )}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-border/50">
            {[
              { label: t4(locale, 'Calories', 'Калории', 'Kalorie', 'Калорії'), val: n?.calories_per_100g, unit: 'kcal' },
              { label: t4(locale, 'Protein', 'Белки', 'Białko', 'Білки'), val: n?.protein_per_100g, unit: 'g' },
              { label: t4(locale, 'Fat', 'Жиры', 'Tłuszcz', 'Жири'), val: n?.fat_per_100g, unit: 'g' },
              { label: t4(locale, 'Carbs', 'Углеводы', 'Węglowodany', 'Вуглеводи'), val: n?.carbs_per_100g, unit: 'g' },
              { label: t4(locale, 'Fiber', 'Клетчатка', 'Błonnik', 'Клітковина'), val: n?.fiber_per_100g, unit: 'g' },
              { label: t4(locale, 'Water', 'Вода', 'Woda', 'Вода'), val: n?.water_percent, unit: '%' },
            ].map(({ label, val, unit }) => (
              <div key={label} className="p-2.5 sm:p-4 text-center">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">{label}</p>
                <p className="text-lg sm:text-2xl font-black text-foreground">{fmt(val)}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold">{unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Glycemic Index (static SEO) ── */}
        {stateDetail.glycemic_index != null && (
          <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden mb-4 sm:mb-6">
            <div className="bg-muted/30 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 flex items-center gap-2">
              <span>📊</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                {t4(locale, 'Glycemic Index', 'Гликемический индекс', 'Indeks glikemiczny', 'Глікемічний індекс')}
              </h2>
            </div>
            <div className="p-4 sm:p-6 flex items-center gap-4">
              <div className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border ${
                stateDetail.glycemic_index <= 55 ? 'bg-green-500/10 border-green-500/20' :
                stateDetail.glycemic_index <= 69 ? 'bg-yellow-500/10 border-yellow-500/20' :
                'bg-red-500/10 border-red-500/20'
              }`}>
                <span className={`text-2xl sm:text-3xl font-black ${
                  stateDetail.glycemic_index <= 55 ? 'text-green-600' :
                  stateDetail.glycemic_index <= 69 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {stateDetail.glycemic_index}
                </span>
              </div>
              <div>
                <p className={`text-sm sm:text-base font-black ${
                  stateDetail.glycemic_index <= 55 ? 'text-green-600' :
                  stateDetail.glycemic_index <= 69 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {stateDetail.glycemic_index <= 55
                    ? t4(locale, 'Low GI', 'Низкий ГИ', 'Niski IG', 'Низький ГІ')
                    : stateDetail.glycemic_index <= 69
                      ? t4(locale, 'Medium GI', 'Средний ГИ', 'Średni IG', 'Середній ГІ')
                      : t4(locale, 'High GI', 'Высокий ГИ', 'Wysoki IG', 'Високий ГІ')}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {t4(locale,
                    `Glycemic index for ${name.toLowerCase()} ${sl.toLowerCase()}`,
                    `Гликемический индекс для ${name.toLowerCase()} ${sl.toLowerCase()}`,
                    `Indeks glikemiczny dla ${name.toLowerCase()} ${sl.toLowerCase()}`,
                    `Глікемічний індекс для ${name.toLowerCase()} ${sl.toLowerCase()}`,
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Cooking Transformation (static SEO) ── */}
        {state !== 'raw' && stateDetail.cooking && (
          stateDetail.cooking.weight_change_percent != null ||
          stateDetail.cooking.water_loss_percent != null ||
          stateDetail.cooking.oil_absorption_g != null
        ) && (
          <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden mb-4 sm:mb-6">
            <div className="bg-muted/30 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 flex items-center gap-2">
              <span>🔄</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                {t4(locale, 'Cooking Transformation', 'Кулинарная трансформация', 'Transformacja gotowania', 'Кулінарна трансформація')}
              </h2>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border/50">
              {stateDetail.cooking.weight_change_percent != null && (
                <div className="p-3 sm:p-5 text-center">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t4(locale, 'Weight Change', 'Изменение массы', 'Zmiana masy', 'Зміна маси')}
                  </p>
                  <p className={`text-xl sm:text-2xl font-black ${stateDetail.cooking.weight_change_percent < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {stateDetail.cooking.weight_change_percent > 0 ? '+' : ''}{stateDetail.cooking.weight_change_percent}%
                  </p>
                </div>
              )}
              {stateDetail.cooking.water_loss_percent != null && stateDetail.cooking.water_loss_percent > 0 && (
                <div className="p-3 sm:p-5 text-center">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t4(locale, 'Water Loss', 'Потеря воды', 'Utrata wody', 'Втрата води')}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-blue-500">-{stateDetail.cooking.water_loss_percent}%</p>
                </div>
              )}
              {stateDetail.cooking.oil_absorption_g != null && stateDetail.cooking.oil_absorption_g > 0 && (
                <div className="p-3 sm:p-5 text-center">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t4(locale, 'Oil Absorbed', 'Впитано масла', 'Wchłonięty olej', 'Вбрано олії')}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-yellow-600">+{stateDetail.cooking.oil_absorption_g}g</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Storage info ── */}
        {stateDetail.storage && (stateDetail.storage.texture || stateDetail.storage.shelf_life_hours != null) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {stateDetail.storage.texture && (
              <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5 text-center">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {t4(locale, 'Texture', 'Текстура', 'Tekstura', 'Текстура')}
                </p>
                <p className="text-base sm:text-lg font-black text-foreground capitalize">{stateDetail.storage.texture}</p>
              </div>
            )}
            {stateDetail.storage.shelf_life_hours != null && (
              <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5 text-center">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {t4(locale, 'Shelf Life', 'Срок хранения', 'Trwałość', 'Термін зберігання')}
                </p>
                <p className="text-base sm:text-lg font-black text-foreground">
                  🕐 {stateDetail.storage.shelf_life_hours >= 24
                    ? `${Math.round(stateDetail.storage.shelf_life_hours / 24)} ${t4(locale, 'days', 'дней', 'dni', 'днів')}`
                    : `${stateDetail.storage.shelf_life_hours} ${t4(locale, 'hours', 'часов', 'godzin', 'годин')}`}
                </p>
              </div>
            )}
            {stateDetail.storage.storage_temp_c != null && (
              <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5 text-center">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {t4(locale, 'Storage Temp', 'Температура', 'Temperatura', 'Температура')}
                </p>
                <p className="text-base sm:text-lg font-black text-foreground">🌡️ {stateDetail.storage.storage_temp_c}°C</p>
              </div>
            )}
          </div>
        )}

        {/* ── Back to ingredient + other states ── */}
        <div className="flex flex-wrap items-center gap-3 pt-4">
          <Link href={`/chef-tools/ingredients/${slug}` as never} className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline">
            ← {name}
          </Link>
          <span className="text-muted-foreground/30">|</span>
          <Link href="/chef-tools/ingredients" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline">
            {t4(locale, 'All ingredients', 'Все ингредиенты', 'Wszystkie składniki', 'Всі інгредієнти')}
          </Link>
        </div>

      </div>
    </div>
  );
}
