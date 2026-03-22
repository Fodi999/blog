import { setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { fetchDietPage, type DietProduct } from '@/lib/api';
import { generateDietSEO } from '@/lib/seo-ingredients';
import { Link } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronRight, Leaf, Flame } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 86400; // ISR: 1 day

// ── Static definitions ───────────────────────────────────────────────────────

const DIET_FLAGS = ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free', 'mediterranean', 'low-carb'] as const;
const LOCALES = ['pl', 'en', 'ru', 'uk'] as const;

function t4(locale: string, en: string, ru: string, pl: string, uk: string): string {
  if (locale === 'ru') return ru;
  if (locale === 'pl') return pl;
  if (locale === 'uk') return uk;
  return en;
}

function localName(p: DietProduct, locale: string): string {
  if (locale === 'pl' && p.name_pl) return p.name_pl;
  if (locale === 'ru' && p.name_ru) return p.name_ru;
  if (locale === 'uk' && p.name_uk) return p.name_uk;
  return p.name_en ?? '';
}

function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  const r = Math.round(v * 10) / 10;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

// ── SSG ──────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    DIET_FLAGS.map((flag) => ({ locale, flag }))
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; flag: string }>;
}): Promise<Metadata> {
  const { locale, flag } = await params;
  setRequestLocale(locale);

  const data = await fetchDietPage(flag, locale);
  if (!data) return {};

  const seo = generateDietSEO(flag, data.total, locale);

  return genMeta({
    title: seo.title,
    description: seo.description,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/diet/${flag}`,
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DietPage({
  params,
}: {
  params: Promise<{ locale: string; flag: string }>;
}) {
  const { locale, flag } = await params;
  setRequestLocale(locale);

  const data = await fetchDietPage(flag, locale, 200);
  if (!data || data.products.length === 0) notFound();

  const seo = generateDietSEO(flag, data.total, locale);

  // JSON-LD for ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seo.title,
    description: seo.description,
    numberOfItems: data.total,
    itemListElement: data.products.slice(0, 50).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${p.slug}`,
      name: localName(p, locale),
    })),
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-16">
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-6 overflow-x-auto scrollbar-hide">
        <Link href="/chef-tools" className="hover:text-foreground transition-colors shrink-0">Chef Tools</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/chef-tools/ingredients" className="hover:text-foreground transition-colors shrink-0">
          {t4(locale, 'Ingredients', 'Ингредиенты', 'Składniki', 'Інгредієнти')}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground">{seo.title.split('—')[0].trim()}</span>
      </div>

      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/10">
            <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic">
              {seo.title.split('—')[0].trim()}<span className="text-primary">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-bold">
              {data.total} {t4(locale, 'products', 'продуктов', 'produktów', 'продуктів')}
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {seo.description}
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {data.products.map((p) => {
          const name = localName(p, locale);
          return (
            <Link
              key={p.slug}
              href={`/chef-tools/ingredients/${p.slug}` as never}
              className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border/50 bg-background hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all"
            >
              {p.image_url ? (
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/30">
                  <Image src={p.image_url} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted border border-border/30 flex items-center justify-center shrink-0">
                  <Leaf className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">
                  {name}
                </p>
                {p.product_type && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.product_type}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">
                    <Flame className="inline h-3 w-3 mr-0.5" />{fmt(p.calories_kcal)} kcal
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">
                    P {fmt(p.protein_g)}g
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">
                    F {fmt(p.fat_g)}g
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">
                    C {fmt(p.carbs_g)}g
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Cross-links to other diets */}
      <div className="mt-10 sm:mt-14">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
          {t4(locale, 'Other Diets', 'Другие диеты', 'Inne diety', 'Інші дієти')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {DIET_FLAGS.filter((f) => f !== flag).map((f) => (
            <Link
              key={f}
              href={`/chef-tools/diet/${f}` as never}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors capitalize"
            >
              {f}
            </Link>
          ))}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link href="/chef-tools/ingredients" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline">
          ← {t4(locale, 'All ingredients', 'Все ингредиенты', 'Wszystkie składniki', 'Всі інгредієнти')}
        </Link>
      </div>
    </div>
  );
}
