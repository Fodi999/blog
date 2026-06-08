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

export type IngredientNutrition = {
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  fat_per_100g?: number | null;
  carbs_per_100g?: number | null;
};

export type IngredientReference = Ingredient & {
  description?: string | null;
  nutrition?: IngredientNutrition;
  density_g_per_ml?: number | null;
  measures?: {
    grams_per_cup?: number | null;
    grams_per_tbsp?: number | null;
    grams_per_tsp?: number | null;
  };
  localized_seasons?: string[];
  allergens?: string[];
  localized_allergens?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_h1?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
};

export type IngredientState = {
  state: string;
  name_suffix_en?: string | null;
  name_suffix_pl?: string | null;
  name_suffix_ru?: string | null;
  name_suffix_uk?: string | null;
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  fat_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fiber_per_100g?: number | null;
  water_percent?: number | null;
  shelf_life_hours?: number | null;
  storage_temp_c?: number | null;
  texture?: string | null;
  notes_en?: string | null;
  notes_pl?: string | null;
  notes_ru?: string | null;
  notes_uk?: string | null;
  data_score?: number | null;
};

export type RichIngredient = {
  reference: IngredientReference;
  states: IngredientState[];
  catalog?: {
    product_type?: string | null;
    unit?: string | null;
    typical_portion_g?: number | null;
    edible_yield_percent?: number | null;
    shelf_life_days?: number | null;
    macros?: Record<string, number | null> | null;
    vitamins?: Record<string, number | null> | null;
    minerals?: Record<string, number | null> | null;
    diet_flags?: Record<string, boolean | null> | null;
    food_properties?: Record<string, number | null> | null;
    culinary?: Record<string, number | string | null> | null;
    pairings?: Array<{
      slug: string;
      name_en?: string | null;
      name_pl?: string | null;
      name_ru?: string | null;
      name_uk?: string | null;
      pair_score?: number | null;
      image_url?: string | null;
    }>;
  } | null;
};

export type AboutPage = {
  title_en: string;
  title_pl: string;
  title_ru: string;
  title_uk: string;
  content_en: string;
  content_pl: string;
  content_ru: string;
  content_uk: string;
  image_url?: string | null;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  slug: string;
  order_index: number;
  title_en: string;
  title_pl: string;
  title_ru: string;
  title_uk: string;
  description_en: string;
  description_pl: string;
  description_ru: string;
  description_uk: string;
  alt_en: string;
  alt_pl: string;
  alt_ru: string;
  alt_uk: string;
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

export async function getAboutPage(): Promise<AboutPage | null> {
  try {
    const response = await fetch(`${API_URL}/public/about`, { next: { revalidate: 300 } });
    return response.ok ? await response.json() as AboutPage : null;
  } catch {
    return null;
  }
}

export async function getGallery(): Promise<GalleryItem[]> {
  try {
    const response = await fetch(`${API_URL}/public/gallery`, { next: { revalidate: 300 } });
    return response.ok ? await response.json() as GalleryItem[] : [];
  } catch {
    return [];
  }
}

export async function getIngredient(slug: string): Promise<Ingredient | null> {
  const ingredients = await getIngredients();
  return ingredients.find((ingredient) => ingredient.slug === slug) ?? null;
}

export async function getRichIngredient(slug: string, locale: Locale): Promise<RichIngredient | null> {
  try {
    const lang = encodeURIComponent(locale);
    const safeSlug = encodeURIComponent(slug);
    const [referenceResponse, statesResponse, catalogResponse, nutritionResponse] = await Promise.all([
      fetch(`${API_URL}/public/ingredients/${safeSlug}?lang=${lang}`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/public/ingredients/${safeSlug}/states?lang=${lang}`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/public/catalog/ingredients/${safeSlug}`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/public/nutrition/${safeSlug}?lang=${lang}`, { next: { revalidate: 300 } }),
    ]);

    if (!referenceResponse.ok) return null;
    const reference = await referenceResponse.json() as IngredientReference;
    const statesPayload = statesResponse.ok ? await statesResponse.json() as { states?: IngredientState[] } : {};
    const catalog = catalogResponse.ok ? await catalogResponse.json() as RichIngredient['catalog'] : null;
    const nutrition = nutritionResponse.ok ? await nutritionResponse.json() as { pairings?: NonNullable<RichIngredient['catalog']>['pairings'] } : {};
    if (catalog && nutrition.pairings) catalog.pairings = nutrition.pairings;
    return { reference, states: statesPayload.states ?? [], catalog };
  } catch {
    return null;
  }
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

export function localizedName(row: { name_pl?: string | null; name_en?: string | null; name_ru?: string | null; name_uk?: string | null }, locale: Locale): string {
  return localized({ pl: row.name_pl, en: row.name_en, ru: row.name_ru, uk: row.name_uk }, locale);
}

export function localizedText(row: { notes_pl?: string | null; notes_en?: string | null; notes_ru?: string | null; notes_uk?: string | null }, locale: Locale): string {
  return localized({ pl: row.notes_pl, en: row.notes_en, ru: row.notes_ru, uk: row.notes_uk }, locale);
}

export function aboutTitle(about: AboutPage, locale: Locale): string {
  return localized({ pl: about.title_pl, en: about.title_en, ru: about.title_ru, uk: about.title_uk }, locale);
}

export function aboutContent(about: AboutPage, locale: Locale): string {
  return localized({ pl: about.content_pl, en: about.content_en, ru: about.content_ru, uk: about.content_uk }, locale);
}

export function galleryTitle(item: GalleryItem, locale: Locale): string {
  return localized({ pl: item.title_pl, en: item.title_en, ru: item.title_ru, uk: item.title_uk }, locale);
}

export function galleryDescription(item: GalleryItem, locale: Locale): string {
  return localized({ pl: item.description_pl, en: item.description_en, ru: item.description_ru, uk: item.description_uk }, locale);
}

export function galleryAlt(item: GalleryItem, locale: Locale): string {
  return localized({ pl: item.alt_pl, en: item.alt_en, ru: item.alt_ru, uk: item.alt_uk }, locale) || galleryTitle(item, locale) || 'Dima Fomin';
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
