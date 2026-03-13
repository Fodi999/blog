import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { fetchIngredients } from '@/lib/api';
import { locales } from '@/i18n';
import { CATEGORY_MAP } from './[locale]/chef-tools/ingredients/[slug]/category-page';
import { CONVERSION_MAP } from './[locale]/chef-tools/converter/[conversion]/page';

const BASE_URL = 'https://dima-fomin.pl';
const API_URL = 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';
const canonicalLocale = 'pl';

/** Fixed at build time — avoids marking every page as "updated today" on every deploy */
const BUILD_DATE = new Date();

/** Normalize any date string to a valid Date. Falls back to yesterday (not a fixed date). */
function toDate(raw?: string): Date {
  const d = raw ? new Date(raw) : null;
  // Yesterday as fallback — avoids a suspicious fixed date for all undated posts
  return d && !isNaN(d.getTime()) ? d : new Date(Date.now() - 86_400_000);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ─── Gallery images from API (for sitemap image entries) ─────────────
  let galleryItems: Array<{ image_url: string; title_en?: string; alt_en?: string }> = [];
  try {
    const res = await fetch(`${API_URL}/public/gallery`, { next: { revalidate: 3600 } });
    if (res.ok) galleryItems = await res.json();
  } catch { /* non-blocking */ }

  const galleryImages = galleryItems.map(item => ({
    url: item.image_url,
    title: item.title_en || item.alt_en || '',
  }));

  // ─── Static pages ────────────────────────────────────────────────────
  const staticPages: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'];
  }[] = [
      { path: '', priority: 1.0, changeFrequency: 'weekly' },
      { path: '/blog', priority: 0.9, changeFrequency: 'daily' },
      { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
      { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/restaurants', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/demos/sushi-delivery', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/demos/restaurant-ai', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/chef-tools', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/chef-tools/ingredients', priority: 0.9, changeFrequency: 'daily' },
      { path: '/chef-tools/ingredient-analyzer', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/chef-tools/fish-season', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/chef-tools/converter', priority: 0.75, changeFrequency: 'monthly' },
      // Legal / GDPR pages
      { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
      { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
      { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
      // SEO taxonomy: ingredient category hub pages
      ...Object.keys(CATEGORY_MAP).map((cat) => ({
        path: `/chef-tools/ingredients/${cat}`,
        priority: 0.85,
        changeFrequency: 'weekly' as const,
      })),
      // SEO converter pages: cup-to-grams, tablespoon-to-grams, etc.
      ...Object.keys(CONVERSION_MAP).map((conv) => ({
        path: `/chef-tools/converter/${conv}`,
        priority: 0.85,
        changeFrequency: 'monthly' as const,
      })),
    ];

  // Static pages exist in ALL locales (same Next.js route handles all).
  // List only locales you are sure have translated UI for a given page.
  // These are shared layout pages — all 4 locales are valid.
  const staticUrls: MetadataRoute.Sitemap = staticPages.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}/${canonicalLocale}${path}`,
      lastModified: BUILD_DATE,
      changeFrequency,
      priority,
      // Attach gallery images to the /about page entry for Google Images sitemap
      ...(path === '/about' && galleryImages.length > 0
        ? { images: galleryImages.map(img => img.url) }
        : {}),
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`])),
          'x-default': `${BASE_URL}/${canonicalLocale}${path}`,
        },
      },
    })
  );

  // ─── Blog posts ──────────────────────────────────────────────────────
  // Single pass: collect slugs per locale and their dates.
  // slug → { date, availableLocales }
  const slugMap = new Map<string, { date: Date; availableLocales: Set<string> }>();

  for (const locale of locales) {
    const posts = await getAllPosts(locale);

    for (const post of posts) {
      const existing = slugMap.get(post.slug);
      const postDate = toDate(post.publishedAt || post.date);

      if (!existing) {
        slugMap.set(post.slug, {
          date: postDate,
          availableLocales: new Set([locale]),
        });
      } else {
        // Keep canonical locale's date when available
        if (locale === canonicalLocale) {
          existing.date = postDate;
        }
        existing.availableLocales.add(locale);
      }
    }
  }

  const postUrls: MetadataRoute.Sitemap = Array.from(slugMap.entries())
    .filter(([, { availableLocales }]) => {
      // ✅ Only emit a URL if the canonical locale (pl) has the file.
      // If pl/ doesn't exist, skip — avoid generating a phantom canonical URL.
      return availableLocales.has(canonicalLocale);
    })
    .map(([slug, { date, availableLocales }]) => ({
      url: `${BASE_URL}/${canonicalLocale}/blog/${slug}`,
      lastModified: date,             // ✅ Real post date
      changeFrequency: 'monthly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          // ✅ Only locales where the file physically exists
          ...Object.fromEntries(
            [...availableLocales].map((l) => [l, `${BASE_URL}/${l}/blog/${slug}`])
          ),
          'x-default': `${BASE_URL}/${canonicalLocale}/blog/${slug}`,
        },
      },
    }));

  // ─── Ingredient pages ────────────────────────────────────────────────
  const ingredientList = await fetchIngredients();

  // /chef-tools/nutrition/{slug} — nutrition detail pages
  const ingredientUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .map((ing) => ({
          url: `${BASE_URL}/${canonicalLocale}/chef-tools/nutrition/${ing.slug}`,
          lastModified: BUILD_DATE,
          changeFrequency: 'monthly' as const,
          priority: 0.8,
          alternates: {
            languages: {
              ...Object.fromEntries(
                locales.map((l) => [l, `${BASE_URL}/${l}/chef-tools/nutrition/${ing.slug}`])
              ),
              'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/nutrition/${ing.slug}`,
            },
          },
        }))
    : [];

  // /chef-tools/ingredients/{slug} — ingredient profile pages (SEO cluster: catalog → profile → nutrition → conversions)
  const ingredientProfileUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .map((ing) => ({
          url: `${BASE_URL}/${canonicalLocale}/chef-tools/ingredients/${ing.slug}`,
          lastModified: BUILD_DATE,
          changeFrequency: 'monthly' as const,
          priority: 0.75,
          alternates: {
            languages: {
              ...Object.fromEntries(
                locales.map((l) => [l, `${BASE_URL}/${l}/chef-tools/ingredients/${ing.slug}`])
              ),
              'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/ingredients/${ing.slug}`,
            },
          },
        }))
    : [];

  // ─── Natural-language "how many" pages ───────────────────────────────
  // Pattern: /chef-tools/how-many/how-many-{unit}-in-a-{measure}-of-{slug}
  // Mirrors TOP_COMBINATIONS in how-many/[...query]/page.tsx — keep in sync.
  const HOW_MANY_COMBOS = [
    // → grams
    { unit: 'grams', measure: 'cup'  },
    { unit: 'grams', measure: 'tbsp' },
    { unit: 'grams', measure: 'tsp'  },
    { unit: 'grams', measure: 'oz'   },
    { unit: 'grams', measure: 'lb'   },
    // → oz
    { unit: 'oz',    measure: 'cup'  },
    { unit: 'oz',    measure: 'tbsp' },
    { unit: 'oz',    measure: 'grams'},
    // → cups / ml
    { unit: 'cups',  measure: 'grams'},
    { unit: 'ml',    measure: 'cup'  },
    { unit: 'ml',    measure: 'tbsp' },
    { unit: 'ml',    measure: 'tsp'  },
    // → lbs / kg
    { unit: 'lbs',   measure: 'kg'   },
    { unit: 'kg',    measure: 'lbs'  },
  ];

  const howManyUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .flatMap((ing) =>
          HOW_MANY_COMBOS.map(({ unit, measure }) => ({
            url: `${BASE_URL}/${canonicalLocale}/chef-tools/how-many/how-many-${unit}-in-a-${measure}-of-${ing.slug}`,
            lastModified: BUILD_DATE,
            changeFrequency: 'monthly' as const,
            priority: 0.8,   // higher priority — matches exact user queries
            alternates: {
              languages: {
                ...Object.fromEntries(
                  locales.map((l) => [
                    l,
                    `${BASE_URL}/${l}/chef-tools/how-many/how-many-${unit}-in-a-${measure}-of-${ing.slug}`,
                  ])
                ),
                'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/how-many/how-many-${unit}-in-a-${measure}-of-${ing.slug}`,
              },
            },
          }))
        )
    : [];

  return [...staticUrls, ...postUrls, ...ingredientUrls, ...ingredientProfileUrls, ...howManyUrls];
}
