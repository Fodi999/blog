import type { MetadataRoute } from 'next';
import { getArticles, getIngredients, getProducts } from '@/lib/cms';
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
  const [articles, products, ingredients] = await Promise.all([getArticles(), getProducts(), getIngredients()]);
  return [
    ...locales.flatMap((locale) => ['', '/blog', '/sklep', '/skladniki', '/o-mnie', '/kontakt'].map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date(), alternates: languageAlternates(path) }))),
    ...locales.flatMap((locale) => articles.map((article) => {
      const path = `/blog/${article.slug}`;
      return { url: `${base}/${locale}${path}`, lastModified: safeDate(article.updated_at), alternates: languageAlternates(path) };
    })),
    ...locales.flatMap((locale) => products.map((product) => {
      const path = `/sklep/${product.slug}`;
      return { url: `${base}/${locale}${path}`, lastModified: safeDate(product.updated_at), images: product.image_urls, alternates: languageAlternates(path) };
    })),
    ...locales.flatMap((locale) => ingredients.map((ingredient) => {
      const path = `/skladniki/${ingredient.slug}`;
      return { url: `${base}/${locale}${path}`, lastModified: safeDate(ingredient.updated_at), images: ingredient.image_url ? [ingredient.image_url] : undefined, alternates: languageAlternates(path) };
    })),
  ];
}
