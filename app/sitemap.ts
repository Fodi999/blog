import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { locales } from '@/i18n';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dima-fomin.pl';
  
  const staticPages = [
    '',
    '/blog',
    '/about',
    '/contact',
    '/restaurants',
  ];

  const staticUrls: MetadataRoute.Sitemap = [];
  
  for (const locale of locales) {
    for (const page of staticPages) {
      staticUrls.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '/blog' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${page}`])
          ),
        },
      });
    }
  }

  const postUrls: MetadataRoute.Sitemap = [];
  
  for (const locale of locales) {
    const posts = await getAllPosts(locale);
    for (const post of posts) {
      postUrls.push({
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}/blog/${post.slug}`])
          ),
        },
      });
    }
  }

  return [...staticUrls, ...postUrls];
}
