import type { MetadataRoute } from 'next';
import { getArticles, getIngredients, getProducts } from '@/lib/cms';
import { locales } from '@/lib/i18n';

export const revalidate = 300;

function safeDate(value?: string): Date {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, products, ingredients] = await Promise.all([getArticles(), getProducts(), getIngredients()]);
  const base = 'https://dima-fomin.pl';
  return [
    ...locales.flatMap((locale) => ['', '/blog', '/sklep', '/skladniki', '/o-mnie', '/kontakt'].map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date() }))),
    ...locales.flatMap((locale) => articles.map((article) => ({ url: `${base}/${locale}/blog/${article.slug}`, lastModified: safeDate(article.updated_at) }))),
    ...locales.flatMap((locale) => products.map((product) => ({ url: `${base}/${locale}/sklep/${product.slug}`, lastModified: safeDate(product.updated_at), images: product.image_urls }))),
    ...locales.flatMap((locale) => ingredients.map((ingredient) => ({ url: `${base}/${locale}/skladniki/${ingredient.slug}`, lastModified: safeDate(ingredient.updated_at), images: ingredient.image_url ? [ingredient.image_url] : undefined }))),
  ];
}
