import type { MetadataRoute } from 'next';
import { cateringSlugs } from '@/lib/catering';
import { getBlogArticles, getIngredients } from '@/lib/cms';
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
  const [articles, ingredients] = await Promise.all([getBlogArticles(), getIngredients()]);
  return [
    ...locales.flatMap((locale) => ['', '/blog', '/sklep', '/skladniki', '/o-mnie', '/kontakt', ...cateringSlugs.map((slug) => `/${slug}`)].map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date(), alternates: languageAlternates(path) }))),
    ...locales.flatMap((locale) => articles.map((article) => {
      const path = `/blog/${article.slug}`;
      return { url: `${base}/${locale}${path}`, lastModified: safeDate(article.updated_at), alternates: languageAlternates(path) };
    })),
    ...locales.flatMap((locale) => ingredients.map((ingredient) => {
      const path = `/skladniki/${ingredient.slug}`;
      return { url: `${base}/${locale}${path}`, lastModified: safeDate(ingredient.updated_at), alternates: languageAlternates(path) };
    })),
  ];
}
