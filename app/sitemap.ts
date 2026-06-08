import type { MetadataRoute } from 'next';
import { getArticles, getIngredients, getProducts } from '@/lib/cms';

export const revalidate = 300;

function safeDate(value?: string): Date {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, products, ingredients] = await Promise.all([getArticles(), getProducts(), getIngredients()]);
  const base = 'https://dima-fomin.pl';
  return [
    ...['', '/blog', '/sklep', '/skladniki', '/o-mnie', '/kontakt'].map((path) => ({ url: `${base}${path}`, lastModified: new Date() })),
    ...articles.map((article) => ({ url: `${base}/blog/${article.slug}`, lastModified: safeDate(article.updated_at) })),
    ...products.map((product) => ({ url: `${base}/sklep/${product.slug}`, lastModified: safeDate(product.updated_at), images: product.image_urls })),
    ...ingredients.map((ingredient) => ({ url: `${base}/skladniki/${ingredient.slug}`, lastModified: safeDate(ingredient.updated_at), images: ingredient.image_url ? [ingredient.image_url] : undefined })),
  ];
}
