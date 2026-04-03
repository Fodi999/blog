import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { Link } from '@/i18n/routing';
import { fetchSitemapCombos, fetchLabCombo } from '@/lib/api';
import { ArrowRight, Sparkles, FlaskConical } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const revalidate = 300; // ISR: 5 min

export function generateStaticParams() {
  return [{ locale: 'pl' }, { locale: 'en' }, { locale: 'ru' }, { locale: 'uk' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'recipesPage' });
  return genMeta({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/recipes',
  });
}

export default async function RecipesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'recipesPage' });

  // Fetch sitemap entries to get all published recipe slugs for this locale
  const allEntries = await fetchSitemapCombos();

  // Group by slug → only keep entries matching current locale
  const localeSlugs = allEntries
    .filter((e) => e.locale === locale)
    .map((e) => e.slug);

  // Deduplicate
  const uniqueSlugs = [...new Set(localeSlugs)];

  // Fetch full pages (up to 50 for performance)
  const pages = (
    await Promise.all(
      uniqueSlugs.slice(0, 50).map((slug) => fetchLabCombo(slug, locale))
    )
  ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof fetchLabCombo>>>[];

  // Sort by published_at desc
  pages.sort((a, b) => {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0;
    const db = b.published_at ? new Date(b.published_at).getTime() : 0;
    return db - da;
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('title'),
    description: t('subtitle'),
    url: `https://dima-fomin.pl/${locale}/recipes`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Dima Fomin',
      url: 'https://dima-fomin.pl',
    },
    ...(pages.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: pages.length,
        itemListElement: pages.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://dima-fomin.pl/${locale}/recipes/${p.slug}`,
          name: p.title,
        })),
      },
    }),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <JsonLd data={jsonLd} />

      {/* ═══ Hero ═══ */}
      <section className="py-16 lg:py-24">
        <ScrollReveal direction="up" delay={0} duration={800}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.15em] mb-6 border border-primary/20">
            <FlaskConical className="h-3 w-3" />
            {t('allRecipes')}
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={200} duration={900}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase italic mb-4">
            {t('title')}<span className="text-primary not-italic">.</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={400} duration={800}>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl">
            {t('subtitle')}
          </p>
        </ScrollReveal>
      </section>

      {/* ═══ Recipe Grid ═══ */}
      <section className="pb-20 lg:pb-32">
        {pages.length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">{t('noRecipes')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page, i) => (
              <ScrollReveal key={page.slug} delay={i * 80} duration={700}>
                <Link href={`/recipes/${page.slug}`} locale={locale}>
                  <article className="group border-2 border-border/60 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 bg-background hover-lift h-full flex flex-col">
                    {/* Image */}
                    {page.image_url ? (
                      <div className="aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={page.image_url}
                          alt={page.h1 || page.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                        <FlaskConical className="h-10 w-10 text-primary/30" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="text-base font-black tracking-tight uppercase text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {page.h1 || page.title}
                      </h2>

                      {page.intro && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                          {page.intro}
                        </p>
                      )}

                      {/* Nutrition badges */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/40">
                        <span className="font-bold text-orange-600">
                          {Math.round(page.calories_per_serving)} {t('kcal')}
                        </span>
                        <span className="font-bold text-blue-600">
                          {page.protein_per_serving.toFixed(0)}g {t('protein')}
                        </span>
                        {page.how_to_cook && page.how_to_cook.length > 0 && (
                          <span>
                            {page.how_to_cook.length} {t('steps')}
                          </span>
                        )}
                        {page.goal && (
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                            {page.goal.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* CTA to Lab */}
        <ScrollReveal delay={300}>
          <div className="mt-16 text-center">
            <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-base font-black uppercase tracking-wider group border-2 hover:bg-primary hover:text-white hover:border-primary transition-all hover-lift">
              <Link href="/chef-tools/lab" locale={locale}>
                <Sparkles className="mr-2 h-5 w-5" />
                {t('title')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
