import { setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { fetchRankingPage, type RankingProduct } from '@/lib/api';
import { generateRankingSEO } from '@/lib/seo-ingredients';
import { Link } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronRight, TrendingUp, Medal } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 86400; // ISR: 1 day

// ── Static definitions ───────────────────────────────────────────────────────

const RANKING_METRICS = [
  'calories', 'protein', 'fat', 'carbs', 'fiber', 'sugar',
  'vitamin-c', 'vitamin-d', 'vitamin-b12',
  'iron', 'calcium', 'potassium', 'magnesium', 'zinc', 'sodium',
] as const;

const LOCALES = ['pl', 'en', 'ru', 'uk'] as const;

function t4(locale: string, en: string, ru: string, pl: string, uk: string): string {
  if (locale === 'ru') return ru;
  if (locale === 'pl') return pl;
  if (locale === 'uk') return uk;
  return en;
}

function localName(p: RankingProduct, locale: string): string {
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
    RANKING_METRICS.map((metric) => ({ locale, metric }))
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; metric: string }>;
}): Promise<Metadata> {
  const { locale, metric } = await params;
  setRequestLocale(locale);

  const data = await fetchRankingPage(metric, locale, 50);
  if (!data) return {};

  const seo = generateRankingSEO(metric, data.unit, data.total, locale);

  return genMeta({
    title: seo.title,
    description: seo.description,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/ranking/${metric}`,
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function RankingPage({
  params,
}: {
  params: Promise<{ locale: string; metric: string }>;
}) {
  const { locale, metric } = await params;
  setRequestLocale(locale);

  const data = await fetchRankingPage(metric, locale, 50);
  if (!data || data.products.length === 0) notFound();

  const seo = generateRankingSEO(metric, data.unit, data.total, locale);

  // JSON-LD for ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seo.title,
    description: seo.description,
    numberOfItems: data.total,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: data.products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${p.slug}`,
      name: localName(p, locale),
    })),
  };

  // Medal colors for top 3
  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

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
        <span className="text-foreground">{t4(locale, 'Ranking', 'Рейтинг', 'Ranking', 'Рейтинг')}</span>
      </div>

      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/10">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic">
              {seo.title.split('—')[0].split(':')[0].trim()}<span className="text-primary">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-bold">
              {data.total} {t4(locale, 'products ranked', 'продуктов в рейтинге', 'produktów w rankingu', 'продуктів у рейтингу')}
              {' · '}{data.metric_label_en} ({data.unit})
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {seo.description}
        </p>
      </div>

      {/* Ranking Table */}
      <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden mb-8">
        {/* Header row */}
        <div className="bg-muted/30 px-3 sm:px-5 py-2.5 border-b border-border/50 grid grid-cols-[auto_1fr_auto] gap-3 items-center">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground w-8 text-center">#</span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {t4(locale, 'Product', 'Продукт', 'Produkt', 'Продукт')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">
            {data.metric_label_en} ({data.unit})
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/30">
          {data.products.map((p, i) => {
            const name = localName(p, locale);
            const rank = p.rank ?? i + 1;
            const isTop3 = rank <= 3;

            return (
              <Link
                key={p.slug}
                href={`/chef-tools/ingredients/${p.slug}` as never}
                className="group grid grid-cols-[auto_1fr_auto] gap-3 items-center px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-muted/30 transition-colors"
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {isTop3 ? (
                    <Medal className={`h-4 w-4 sm:h-5 sm:w-5 ${medalColors[rank - 1]}`} />
                  ) : (
                    <span className="text-xs sm:text-sm font-black text-muted-foreground">{rank}</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {p.image_url ? (
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/30">
                      <Image src={p.image_url} alt={name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted border border-border/30 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">
                      {name}
                    </p>
                    {p.product_type && (
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.product_type}</p>
                    )}
                  </div>
                </div>

                {/* Metric value */}
                <div className="text-right">
                  <span className={`text-sm sm:text-base font-black ${isTop3 ? 'text-primary' : 'text-foreground'}`}>
                    {fmt(p.metric_value)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground ml-0.5">{data.unit}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Cross-links to other rankings */}
      <div className="mt-10 sm:mt-14">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
          {t4(locale, 'Other Rankings', 'Другие рейтинги', 'Inne rankingi', 'Інші рейтинги')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {RANKING_METRICS.filter((m) => m !== metric).map((m) => (
            <Link
              key={m}
              href={`/chef-tools/ranking/${m}` as never}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors capitalize"
            >
              {m.replace(/-/g, ' ')}
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
