import type { MetadataRoute } from 'next';
import { cateringSlugs } from '@/lib/catering';
import { getBlogArticles, getIngredients, getProducts } from '@/lib/cms';
import { locales } from '@/lib/i18n';
import { articleLocales, ingredientLocales, languageAlternates, productLocales, safeDate, SITE_URL } from '@/lib/seo';

export const revalidate = 300;

// Static routes are fully localized via the i18n dictionaries, so every
// locale is a real translation. They carry no CMS timestamp, so
// lastModified is omitted instead of faking it with the current date.
const staticPaths = ['', '/blog', '/sklep', '/skladniki', '/o-mnie', '/kontakt', '/polityka-prywatnosci', ...cateringSlugs.map((slug) => `/${slug}`)];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, ingredients, products] = await Promise.all([getBlogArticles(), getIngredients(), getProducts()]);

  const entries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      alternates: { languages: languageAlternates(path) },
    })),
  );

  for (const article of articles) {
    const available = articleLocales(article);
    const path = `/blog/${article.slug}`;
    const lastModified = safeDate(article.updated_at);
    for (const locale of available) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        ...(lastModified ? { lastModified } : {}),
        alternates: { languages: languageAlternates(path, available) },
      });
    }
  }

  for (const ingredient of ingredients) {
    const available = ingredientLocales(ingredient);
    const path = `/skladniki/${ingredient.slug}`;
    const lastModified = safeDate(ingredient.updated_at);
    for (const locale of available) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        ...(lastModified ? { lastModified } : {}),
        alternates: { languages: languageAlternates(path, available) },
      });
    }
  }

  for (const product of products) {
    const available = productLocales(product);
    const path = `/sklep/${product.slug}`;
    const lastModified = safeDate(product.updated_at);
    for (const locale of available) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        ...(lastModified ? { lastModified } : {}),
        alternates: { languages: languageAlternates(path, available) },
      });
    }
  }

  return entries;
}
