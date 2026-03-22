import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchIntentPage, fetchRelatedPages } from '@/lib/api';
import type { ContentBlock } from '@/lib/api';
import type { Metadata } from 'next';
import Image from 'next/image';
import { ChefToolsNav } from '../../ChefToolsNav';
import { JsonLd } from '@/components/JsonLd';

export const revalidate = 86400; // 24h ISR

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await fetchIntentPage(slug, locale);
  if (!page) return { title: 'Not Found' };

  const url = `https://dima-fomin.pl/${locale}/chef-tools/seo/${slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: 'article',
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function IntentPageRoute({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [page, related, t] = await Promise.all([
    fetchIntentPage(slug, locale),
    fetchRelatedPages(slug, locale),
    getTranslations({ locale, namespace: 'chefTools' }),
  ]);
  if (!page) notFound();

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
        },
      }}
    />
  );

  const url = `https://dima-fomin.pl/${locale}/chef-tools/seo/${slug}`;

  // ── FAQ JSON-LD ──────────────────────────────────────────────────────────
  const faqSchema = page.faq?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  // ── Article JSON-LD ──────────────────────────────────────────────────────
  // Check if we have structured content_blocks
  const hasBlocks = page.content_blocks && page.content_blocks.length > 0;

  // Find hero image for OpenGraph
  const heroBlock = hasBlocks
    ? page.content_blocks.find(
        (b): b is Extract<ContentBlock, { type: 'image' }> =>
          b.type === 'image' && b.key === 'hero' && !!b.src,
      )
    : undefined;

  // ── Article JSON-LD (with image if available) ────────────────────────────
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.description,
    url,
    inLanguage: locale,
    datePublished: page.published_at ?? page.updated_at,
    dateModified: page.updated_at,
    ...(heroBlock?.src ? { image: heroBlock.src } : {}),
    author: { '@type': 'Person', name: 'Dima Fomin' },
    publisher: {
      '@type': 'Organization',
      name: 'dima-fomin.pl',
      url: 'https://dima-fomin.pl',
    },
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="min-h-screen bg-background">
        {nav}

        <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
            <span>{page.intent_type}</span>
            <span>·</span>
            <span>{page.entity_a.replace(/-/g, ' ')}</span>
            {page.entity_b && <><span>·</span><span>{page.entity_b.replace(/-/g, ' ')}</span></>}
          </div>

          {/* Structured article (content_blocks) OR legacy answer */}
          {hasBlocks ? (
            <article className="space-y-8">
              {page.content_blocks.map((block, i) => {
                switch (block.type) {
                  case 'heading':
                    return block.level === 1 ? (
                      <h1 key={i} className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                        {block.text}
                      </h1>
                    ) : (
                      <h2 key={i} className="text-xl sm:text-2xl font-semibold mt-2">
                        {block.text}
                      </h2>
                    );
                  case 'text':
                    return (
                      <div key={i} className="prose prose-neutral dark:prose-invert max-w-none">
                        <p className="text-base leading-relaxed whitespace-pre-line">
                          {block.content}
                        </p>
                      </div>
                    );
                  case 'image':
                    return block.src ? (
                      <figure key={i} className="my-6">
                        <Image
                          src={block.src}
                          alt={block.alt}
                          width={800}
                          height={500}
                          className="rounded-xl w-full h-auto object-cover"
                          loading={block.key === 'hero' ? 'eager' : 'lazy'}
                        />
                        <figcaption className="text-xs text-muted-foreground mt-2 text-center">
                          {block.alt}
                        </figcaption>
                      </figure>
                    ) : null; // No src yet — image not uploaded, skip rendering
                  default:
                    return null;
                }
              })}
            </article>
          ) : (
            /* Legacy: title + description + answer only */
            <>
              <header className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                  {page.title}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {page.description}
                </p>
              </header>
              <section className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-line">{page.answer}</p>
              </section>
            </>
          )}

          {/* FAQ */}
          {page.faq && page.faq.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                {locale === 'ru' ? 'Частые вопросы' :
                 locale === 'pl' ? 'Często zadawane pytania' :
                 locale === 'uk' ? 'Часті запитання' :
                 'Frequently Asked Questions'}
              </h2>
              <div className="space-y-4">
                {page.faq.map((f, i) => (
                  <div key={i} className="border rounded-xl p-5 space-y-2 bg-muted/20">
                    <h3 className="font-semibold text-base">{f.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related pages — internal linking */}
          {related.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                {locale === 'ru' ? 'Читайте также' :
                 locale === 'pl' ? 'Przeczytaj również' :
                 locale === 'uk' ? 'Читайте також' :
                 'Related Articles'}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <a
                    key={r.slug}
                    href={`/${locale}/chef-tools/seo/${r.slug}`}
                    className="block border rounded-xl p-4 hover:bg-muted/40 transition-colors group"
                  >
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {r.intent_type} · {r.entity_a.replace(/-/g, ' ')}
                    </span>
                    <h3 className="font-medium mt-1 group-hover:underline leading-snug">
                      {r.title}
                    </h3>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Back link */}
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <a href={`/${locale}/chef-tools/ingredients/${page.entity_a}`} className="hover:underline">
              ← {locale === 'ru' ? `Подробнее об ${page.entity_a.replace(/-/g, ' ')}` :
                 locale === 'pl' ? `Więcej o ${page.entity_a.replace(/-/g, ' ')}` :
                 locale === 'uk' ? `Детальніше про ${page.entity_a.replace(/-/g, ' ')}` :
                 `More about ${page.entity_a.replace(/-/g, ' ')}`}
            </a>
          </div>
        </main>
      </div>
    </>
  );
}
