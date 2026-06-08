import { API_URL } from './api';

export type ShopProduct = {
  id: string;
  slug: string;
  sku?: string | null;
  category: string;
  name_en: string;
  name_ru: string;
  name_pl: string;
  name_uk: string;
  short_description_en: string;
  short_description_ru: string;
  short_description_pl: string;
  short_description_uk: string;
  description_en: string;
  description_ru: string;
  description_pl: string;
  description_uk: string;
  seo_title_en: string;
  seo_title_ru: string;
  seo_title_pl: string;
  seo_title_uk: string;
  seo_description_en: string;
  seo_description_ru: string;
  seo_description_pl: string;
  seo_description_uk: string;
  selling_points: string[];
  image_urls: string[];
  price_cents?: number | null;
  currency: string;
  stock_quantity: number;
  updated_at: string;
};

export function localizeProduct(
  product: ShopProduct,
  field: 'name' | 'short_description' | 'description' | 'seo_title' | 'seo_description',
  locale: string,
): string {
  const key = `${field}_${locale}` as keyof ShopProduct;
  const fallback = `${field}_en` as keyof ShopProduct;
  return String(product[key] || product[fallback] || '');
}

export function formatProductPrice(product: ShopProduct, locale: string): string {
  if (product.price_cents == null) return locale === 'pl' ? 'Cena na zapytanie' : locale === 'ru' ? 'Цена по запросу' : locale === 'uk' ? 'Ціна за запитом' : 'Price on request';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: product.currency || 'PLN',
  }).format(product.price_cents / 100);
}

export async function getShopProducts(): Promise<ShopProduct[]> {
  try {
    const response = await fetch(`${API_URL}/public/shop-products`, { next: { revalidate: 300 } });
    return response.ok ? await response.json() as ShopProduct[] : [];
  } catch {
    return [];
  }
}

export async function getShopProduct(slug: string): Promise<ShopProduct | null> {
  try {
    const response = await fetch(`${API_URL}/public/shop-products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    return response.ok ? await response.json() as ShopProduct : null;
  } catch {
    return null;
  }
}
