import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { locales } from '@/i18n';

const BASE_URL = 'https://dima-fomin.pl';
const canonicalLocale = 'pl';

/** Normalize any date string to a valid Date. Falls back to yesterday (not a fixed date). */
function toDate(raw?: string): Date {
  const d = raw ? new Date(raw) : null;
  // Yesterday as fallback — avoids a suspicious fixed date for all undated posts
  return d && !isNaN(d.getTime()) ? d : new Date(Date.now() - 86_400_000);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

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
    ];

  // Static pages exist in ALL locales (same Next.js route handles all).
  // List only locales you are sure have translated UI for a given page.
  // These are shared layout pages — all 4 locales are valid.
  const staticUrls: MetadataRoute.Sitemap = staticPages.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}/${canonicalLocale}${path}`,
      lastModified: new Date(), // Static pages: today is fine
      changeFrequency,
      priority,
      alternates: {
        languages: {
          // All static pages exist in all locales (next-intl handles routing)
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

  return [...staticUrls, ...postUrls];
}
