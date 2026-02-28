import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { locales } from '@/i18n';

const BASE_URL = 'https://dima-fomin.pl';
const canonicalLocale = 'pl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static pages ────────────────────────────────────────────────────
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/blog', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/restaurants', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/demos/sushi-delivery', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/demos/restaurant-ai', priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  const staticUrls: MetadataRoute.Sitemap = staticPages.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}/${canonicalLocale}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`])),
        'x-default': `${BASE_URL}/${canonicalLocale}${path}`,
      },
    },
  }));

  // ─── Blog posts ──────────────────────────────────────────────────────
  // One URL per unique slug (canonical = pl/), not 4× per locale.
  const slugSet = new Set<string>();
  const slugToDate = new Map<string, string>();

  for (const locale of locales) {
    const posts = await getAllPosts(locale);
    for (const post of posts) {
      slugSet.add(post.slug);
      // Prefer canonical locale's date; keep first occurrence otherwise
      if (locale === canonicalLocale || !slugToDate.has(post.slug)) {
        slugToDate.set(post.slug, post.publishedAt || post.date);
      }
    }
  }

  const postUrls: MetadataRoute.Sitemap = Array.from(slugSet).map((slug) => ({
    url: `${BASE_URL}/${canonicalLocale}/blog/${slug}`,
    // Use today so Google re-crawls after the recent content update
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    alternates: {
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/blog/${slug}`])),
        'x-default': `${BASE_URL}/${canonicalLocale}/blog/${slug}`,
      },
    },
  }));

  return [...staticUrls, ...postUrls];
}
