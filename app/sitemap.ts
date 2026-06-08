import type { MetadataRoute } from 'next';
import { getArticles, getProducts } from '@/lib/cms';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, products] = await Promise.all([getArticles(), getProducts()]);
  const base = 'https://dima-fomin.pl';
  return [
    ...['', '/blog', '/sklep', '/o-mnie', '/kontakt'].map((path) => ({ url: `${base}${path}`, lastModified: new Date() })),
    ...articles.map((article) => ({ url: `${base}/blog/${article.slug}`, lastModified: new Date(article.updated_at) })),
    ...products.map((product) => ({ url: `${base}/sklep/${product.slug}`, lastModified: new Date(product.updated_at), images: product.image_urls })),
  ];
}
