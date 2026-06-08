import type { Locale } from '@/lib/i18n';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

export type Article = {
  slug: string;
  category: string;
  title_pl: string;
  title_en: string;
  title_ru: string;
  title_uk: string;
  content_pl: string;
  content_en: string;
  content_ru: string;
  content_uk: string;
  image_url?: string | null;
  seo_description: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  slug: string;
  sku?: string | null;
  category: string;
  name_pl: string;
  name_en: string;
  name_ru: string;
  name_uk: string;
  short_description_pl: string;
  short_description_en: string;
  short_description_ru: string;
  short_description_uk: string;
  description_pl: string;
  description_en: string;
  description_ru: string;
  description_uk: string;
  seo_title_pl: string;
  seo_title_en: string;
  seo_title_ru: string;
  seo_title_uk: string;
  seo_description_pl: string;
  seo_description_en: string;
  seo_description_ru: string;
  seo_description_uk: string;
  selling_points: string[];
  image_urls: string[];
  price_cents?: number | null;
  currency: string;
  stock_quantity: number;
  updated_at: string;
};

export type Ingredient = {
  slug: string;
  name_pl: string;
  name_en: string;
  name_ru: string;
  name_uk: string;
  description_pl?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_uk?: string | null;
  image_url?: string | null;
  category_name_pl?: string | null;
  category_name_en?: string | null;
  category_name_ru?: string | null;
  category_name_uk?: string | null;
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  fat_per_100g?: number | null;
  carbs_per_100g?: number | null;
  seasons: string[];
  updated_at: string;
};

export async function getArticles(): Promise<Article[]> {
  try {
    const response = await fetch(`${API_URL}/public/articles?limit=100`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = await response.json() as { data?: Article[] };
    return payload.data ?? [];
  } catch {
    return [];
  }
}

export async function getArticle(slug: string): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/public/articles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    return response.ok ? await response.json() as Article : null;
  } catch {
    return null;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/public/shop-products`, {
      next: { revalidate: 300 },
    });
    return response.ok ? await response.json() as Product[] : [];
  } catch {
    return [];
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/public/shop-products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    return response.ok ? await response.json() as Product : null;
  } catch {
    return null;
  }
}

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const response = await fetch(`${API_URL}/public/ingredients-full`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload = await response.json() as { items?: Ingredient[] };
    return payload.items ?? [];
  } catch {
    return [];
  }
}

export async function getIngredient(slug: string): Promise<Ingredient | null> {
  const ingredients = await getIngredients();
  return ingredients.find((ingredient) => ingredient.slug === slug) ?? null;
}

function localized(values: Partial<Record<Locale, string | null | undefined>>, locale: Locale): string {
  return values[locale] || values.pl || values.en || values.ru || values.uk || '';
}

export function ingredientName(ingredient: Ingredient, locale: Locale): string {
  return localized({ pl: ingredient.name_pl, en: ingredient.name_en, ru: ingredient.name_ru, uk: ingredient.name_uk }, locale);
}

export function ingredientDescription(ingredient: Ingredient, locale: Locale): string {
  return localized({ pl: ingredient.description_pl, en: ingredient.description_en, ru: ingredient.description_ru, uk: ingredient.description_uk }, locale);
}

export function ingredientCategory(ingredient: Ingredient, locale: Locale): string {
  return localized({ pl: ingredient.category_name_pl, en: ingredient.category_name_en, ru: ingredient.category_name_ru, uk: ingredient.category_name_uk }, locale);
}

export function articleTitle(article: Article, locale: Locale): string {
  return localized({ pl: article.title_pl, en: article.title_en, ru: article.title_ru, uk: article.title_uk }, locale);
}

export function articleContent(article: Article, locale: Locale): string {
  return localized({ pl: article.content_pl, en: article.content_en, ru: article.content_ru, uk: article.content_uk }, locale);
}

export function articleDescription(article: Article, locale: Locale): string {
  if (locale === 'en' && article.seo_description) return article.seo_description;
  const content = articleContent(article, locale)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!content) return article.seo_description;
  return `${content.slice(0, 180).trim()}${content.length > 180 ? '…' : ''}`;
}

export function productName(product: Product, locale: Locale): string {
  return localized({ pl: product.name_pl, en: product.name_en, ru: product.name_ru, uk: product.name_uk }, locale);
}

export function productShortDescription(product: Product, locale: Locale): string {
  return localized({ pl: product.short_description_pl, en: product.short_description_en, ru: product.short_description_ru, uk: product.short_description_uk }, locale);
}

export function productDescription(product: Product, locale: Locale): string {
  return localized({ pl: product.description_pl, en: product.description_en, ru: product.description_ru, uk: product.description_uk }, locale);
}

export function productSeoTitle(product: Product, locale: Locale): string {
  return localized({ pl: product.seo_title_pl, en: product.seo_title_en, ru: product.seo_title_ru, uk: product.seo_title_uk }, locale);
}

export function productSeoDescription(product: Product, locale: Locale): string {
  return localized({ pl: product.seo_description_pl, en: product.seo_description_en, ru: product.seo_description_ru, uk: product.seo_description_uk }, locale);
}

export function productPrice(product: Product, locale: Locale, emptyLabel: string): string {
  if (product.price_cents == null) return emptyLabel;
  const numberLocale = { pl: 'pl-PL', en: 'en-US', ru: 'ru-RU', uk: 'uk-UA' }[locale];
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: product.currency || 'PLN',
  }).format(product.price_cents / 100);
}
