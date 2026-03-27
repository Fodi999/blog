import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchIntentPage, fetchRelatedPages } from '@/lib/api';
import type { ContentBlock } from '@/lib/api';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ChefToolsNav } from '../../ChefToolsNav';
import { JsonLd } from '@/components/JsonLd';

export const revalidate = 86400; // 24h ISR

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render a text string with inline [text](url) markdown links.
 * Returns an array of React nodes (strings and <a> elements).
 */
function renderInlineLinks(
  text: string,
  locale: string,
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    // Text before link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, linkText, href] = match;
    // Resolve relative links to include locale prefix
    const resolvedHref =
      href.startsWith('http') || href.startsWith('//')
        ? href
        : href.startsWith('/')
          ? `/${locale}${href}`
          : href;
    parts.push(
      <Link
        key={match.index}
        href={resolvedHref as never}
        className="text-primary underline underline-offset-2 hover:no-underline"
      >
        {linkText}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
function extractNutrition(blocks: ContentBlock[]): {
  calories?: string;
  protein?: string;
  fat?: string;
  carbs?: string;
  fiber?: string;
} | null {
  const nutritionTexts = blocks
    .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
    .map((b) => b.content)
    .join(' ');

  const kcal = nutritionTexts.match(/(\d+[\.,]?\d*)\s*(?:ккал|kcal|калори)/i);
  const protein = nutritionTexts.match(/(\d+[\.,]?\d*)\s*(?:г|g)\s*(?:белк|protein)/i)
    || nutritionTexts.match(/(?:белк|protein)[а-яa-z]*\s*[—–:-]\s*(\d+[\.,]?\d*)/i);
  const fat = nutritionTexts.match(/(\d+[\.,]?\d*)\s*(?:г|g)\s*(?:жир|fat)/i)
    || nutritionTexts.match(/(?:жир|fat)[а-яa-z]*\s*[—–:-]\s*(\d+[\.,]?\d*)/i);
  const carbs = nutritionTexts.match(/(\d+[\.,]?\d*)\s*(?:г|g)\s*(?:углевод|carb)/i)
    || nutritionTexts.match(/(?:углевод|carb)[а-яa-z]*\s*[—–:-]\s*(\d+[\.,]?\d*)/i);
  const fiber = nutritionTexts.match(/(\d+[\.,]?\d*)\s*(?:г|g)\s*(?:клетчатк|fiber)/i)
    || nutritionTexts.match(/(?:клетчатк|fiber)[а-яa-z]*\s*[—–:-]\s*(\d+[\.,]?\d*)/i);

  if (!kcal && !protein) return null;

  return {
    ...(kcal ? { calories: `${kcal[1]} kcal` } : {}),
    ...(protein ? { protein: `${protein[1]}g` } : {}),
    ...(fat ? { fat: `${fat[1]}g` } : {}),
    ...(carbs ? { carbs: `${carbs[1]}g` } : {}),
    ...(fiber ? { fiber: `${fiber[1]}g` } : {}),
  };
}



const LOCALE_LABELS: Record<string, {
  home: string;
  tools: string;
  articles: string;
  faq: string;
  related: string;
  readMore: string;
  backTo: string;
  topics: string;
}> = {
  ru: {
    home: 'Главная',
    tools: 'Инструменты шефа',
    articles: 'Статьи',
    faq: 'Частые вопросы',
    related: 'Читайте также',
    readMore: 'Подробнее об',
    backTo: '← Вернуться к',
    topics: 'Популярные темы',
  },
  pl: {
    home: 'Strona główna',
    tools: 'Narzędzia szefa',
    articles: 'Artykuły',
    faq: 'Często zadawane pytania',
    related: 'Przeczytaj również',
    readMore: 'Więcej o',
    backTo: '← Powrót do',
    topics: 'Popularne tematy',
  },
  uk: {
    home: 'Головна',
    tools: 'Інструменти шефа',
    articles: 'Статті',
    faq: 'Часті запитання',
    related: 'Читайте також',
    readMore: 'Детальніше про',
    backTo: '← Повернутися до',
    topics: 'Популярні теми',
  },
  en: {
    home: 'Home',
    tools: 'Chef Tools',
    articles: 'Articles',
    faq: 'Frequently Asked Questions',
    related: 'Related Articles',
    readMore: 'More about',
    backTo: '← Back to',
    topics: 'Popular Topics',
  },
};

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await fetchIntentPage(slug, locale);
  if (!page) return { title: 'Not Found' };

  const url = `https://dima-fomin.pl/${locale}/chef-tools/seo/${slug}`;

  // Find hero image
  const heroBlock = page.content_blocks?.find(
    (b): b is Extract<ContentBlock, { type: 'image' }> =>
      b.type === 'image' && b.key === 'hero' && !!b.src,
  );

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: 'article',
      ...(heroBlock?.src
        ? {
            images: [
              {
                url: heroBlock.src,
                width: 1200,
                height: 630,
                alt: heroBlock.alt,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: heroBlock?.src ? 'summary_large_image' : 'summary',
      title: page.title,
      description: page.description,
      ...(heroBlock?.src ? { images: [heroBlock.src] } : {}),
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

  const labels = LOCALE_LABELS[locale] || LOCALE_LABELS.en;
  const entityName = page.entity_a.replace(/-/g, ' ');
  const url = `https://dima-fomin.pl/${locale}/chef-tools/seo/${slug}`;

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

  // ── Content analysis ─────────────────────────────────────────────────────
  const hasBlocks = page.content_blocks && page.content_blocks.length > 0;
  const blocks = page.content_blocks || [];

  // Find all images with src
  const imageBlocks = blocks.filter(
    (b): b is Extract<ContentBlock, { type: 'image' }> =>
      b.type === 'image' && !!b.src,
  );
  const heroBlock = imageBlocks.find((b) => b.key === 'hero');

  // Cluster links
  const clusterLinks = related.filter((r) => r.entity_a === page.entity_a);
  const crossLinks = related.filter((r) => r.entity_a !== page.entity_a);

  /** Normalize any date string to strict ISO 8601 UTC: "2026-03-22T22:41:54Z" */
  function toISO(raw: string | undefined | null): string | undefined {
    if (!raw) return undefined;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString(); // always "YYYY-MM-DDTHH:mm:ss.sssZ"
    } catch {
      return undefined;
    }
  }

  const datePublished = toISO(page.published_at ?? page.updated_at);
  const dateModified  = toISO(page.updated_at);

  // ── 1. Article (core) ───────────────────────────────────────────────────
  const articleNode: Record<string, unknown> = {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: page.title,
    description: page.description,
    url,
    inLanguage: locale,
    ...(datePublished && { datePublished }),
    ...(dateModified  && { dateModified }),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: {
      '@type': 'Person',
      '@id': 'https://dima-fomin.pl/#person',
      name: 'Dima Fomin',
      url: 'https://dima-fomin.pl',
    },
    publisher: {
      '@type': 'Organization',
      name: 'dima-fomin.pl',
      url: 'https://dima-fomin.pl',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dima-fomin.pl/logo.png',
      },
    },
  };

  // Article.image — массив всех изображений страницы (рекомендация Google)
  const allImageObjects = imageBlocks.map((img) => ({
    '@type': 'ImageObject',
    url: img.src,
    ...(img.key === 'hero' ? { width: 1200, height: 630 } : {}),
    description: img.alt,
  }));
  if (allImageObjects.length === 1) {
    articleNode.image = allImageObjects[0];
  } else if (allImageObjects.length > 1) {
    articleNode.image = allImageObjects;
  }
  if (heroBlock?.src) {
    articleNode.thumbnailUrl = heroBlock.src;
  }

  // ── 2. Nutrition → Food → inside Article.about ───────────────────────────
  const nutrition = hasBlocks ? extractNutrition(blocks) : null;
  if (nutrition) {
    const nutritionNode: Record<string, unknown> = {
      '@type': 'NutritionInformation',
      servingSize: '100g',
      ...(nutrition.calories && { calories: nutrition.calories }),
      ...(nutrition.protein && { proteinContent: nutrition.protein }),
      ...(nutrition.fat && { fatContent: nutrition.fat }),
      ...(nutrition.carbs && { carbohydrateContent: nutrition.carbs }),
      ...(nutrition.fiber && { fiberContent: nutrition.fiber }),
    };
    articleNode.about = {
      '@type': 'Food',
      name: entityName,
      nutrition: nutritionNode,
    };
  }

  // ── 3. BreadcrumbList ────────────────────────────────────────────────────
  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: labels.home,  item: `https://dima-fomin.pl/${locale}` },
      { '@type': 'ListItem', position: 2, name: labels.tools, item: `https://dima-fomin.pl/${locale}/chef-tools` },
      { '@type': 'ListItem', position: 3, name: entityName,   item: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${page.entity_a}` },
      { '@type': 'ListItem', position: 4, name: page.title,   item: url },
    ],
  };

  // ── 4. FAQ ───────────────────────────────────────────────────────────────
  const faqNode = page.faq?.length > 0
    ? {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: page.faq.map((f: { question: string; answer: string }) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  // ── 5. ItemList for topic cluster ────────────────────────────────────────
  const clusterListNode = clusterLinks.length > 0
    ? {
        '@type': 'ItemList',
        '@id': `${url}#cluster`,
        name: `${entityName} — articles`,
        url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${page.entity_a}`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, url, name: page.title },
          ...clusterLinks.map((r: { slug: string; title: string }, idx: number) => ({
            '@type': 'ListItem',
            position: idx + 2,
            url: `https://dima-fomin.pl/${locale}/chef-tools/seo/${r.slug}`,
            name: r.title,
          })),
        ],
      }
    : null;

  // ── Единый @graph — один <script type="application/ld+json"> ─────────────
  const graphNodes: unknown[] = [articleNode, breadcrumbNode];
  if (faqNode) graphNodes.push(faqNode);
  if (clusterListNode) graphNodes.push(clusterListNode);
  // ImageObject-ы убраны из @graph — они уже внутри Article.image

  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': graphNodes,
  };

  return (
    <>
      {/* Единый JSON-LD @graph — один <script> на страницу */}
      <JsonLd data={combinedSchema} />

      <div className="min-h-screen bg-background">
        {nav}

        <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          {/* ── Breadcrumbs (visible + semantic) ── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link href={`/${locale}`} className="hover:underline">
              {labels.home}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link href={`/${locale}/chef-tools`} className="hover:underline">
              {labels.tools}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link
              href={`/${locale}/chef-tools/ingredients/${page.entity_a}`}
              className="hover:underline capitalize"
            >
              {entityName}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {page.title}
            </span>
          </nav>

          {/* ── Structured article (content_blocks) OR legacy answer ── */}
          {hasBlocks ? (
            <article className="space-y-8">
              {blocks.map((block, i) => {
                switch (block.type) {
                  case 'heading':
                    return block.level === 1 ? (
                      <h1
                        key={i}
                        className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight"
                      >
                        {block.text}
                      </h1>
                    ) : (
                      <h2 key={i} className="text-xl sm:text-2xl font-semibold mt-2">
                        {block.text}
                      </h2>
                    );
                  case 'text':
                    return (
                      <div
                        key={i}
                        className="prose prose-neutral dark:prose-invert max-w-none"
                      >
                        <p className="text-base leading-relaxed whitespace-pre-line">
                          {renderInlineLinks(block.content, locale)}
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
                          height={block.key === 'hero' ? 450 : 500}
                          className="rounded-xl w-full h-auto object-cover"
                          loading={block.key === 'hero' ? 'eager' : 'lazy'}
                          priority={block.key === 'hero'}
                          sizes="(max-width: 768px) 100vw, 800px"
                        />
                        <figcaption className="text-xs text-muted-foreground mt-2 text-center">
                          {block.alt}
                        </figcaption>
                      </figure>
                    ) : null;
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
                <p className="text-base leading-relaxed whitespace-pre-line">
                  {page.answer}
                </p>
              </section>
            </>
          )}

          {/* ── FAQ ── */}
          {page.faq && page.faq.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">{labels.faq}</h2>
              <div className="space-y-4">
                {page.faq.map((f, i) => (
                  <details
                    key={i}
                    className="border rounded-xl bg-muted/20 group"
                    {...(i === 0 ? { open: true } : {})}
                  >
                    <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-base select-none">
                      {f.question}
                      <svg
                        className="w-5 h-5 text-muted-foreground shrink-0 transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed">
                      {f.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ── Cluster Links (same ingredient — topical authority) ── */}
          {clusterLinks.length > 0 && (
            <section className="space-y-4">
              {/* Hub link — ingredient page gets a strong inbound link */}
              <Link
                href={`/${locale}/chef-tools/ingredients/${page.entity_a}`}
                className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-colors group"
              >
                <span className="text-lg">📖</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    {labels.readMore}
                  </p>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors capitalize">
                    {entityName} — {labels.articles}
                  </p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <h2 className="text-xl font-semibold">
                {labels.topics}: <span className="capitalize">{entityName}</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {clusterLinks.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/${locale}/chef-tools/seo/${r.slug}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full border text-sm hover:bg-muted/60 transition-colors"
                  >
                    {r.title.length > 50 ? r.title.slice(0, 47) + '...' : r.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Related articles (cross-ingredient — internal linking) ── */}
          {crossLinks.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">{labels.related}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {crossLinks.map((r) => (
                  <Link
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
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* If no cluster but has related, show all in cards */}
          {clusterLinks.length === 0 && related.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">{labels.related}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
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
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Back link (Ingredient Hub) ── */}
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <Link
              href={`/${locale}/chef-tools/ingredients/${page.entity_a}`}
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
            >
              ← {labels.backTo} <span className="capitalize">{entityName}</span>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
