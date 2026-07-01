import type { MetadataRoute } from 'next';
import { getArticles } from '@/lib/cms';
import { locales } from '@/lib/i18n';

export const revalidate = 300;
const base = 'https://dima-fomin.pl';

function safeDate(value?: string): Date {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function languageAlternates(path: string) {
  return {
    languages: {
      ...Object.fromEntries(locales.map((locale) => [locale, `${base}/${locale}${path}`])),
      'x-default': `${base}/pl${path}`
    }
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  return [
    ...locales.flatMap((locale) => ['', '/blog', '/o-mnie', '/kontakt'].map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date(), alternates: languageAlternates(path) }))),
    ...locales.flatMap((locale) => articles.map((article) => {
      const path = `/blog/${article.slug}`;
      return { url: `${base}/${locale}${path}`, lastModified: safeDate(article.updated_at), alternates: languageAlternates(path) };
    })),
  ];
}
