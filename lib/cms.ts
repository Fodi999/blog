const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

export type Article = {
  slug: string;
  category: string;
  title_pl: string;
  title_en: string;
  content_pl: string;
  content_en: string;
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
  short_description_pl: string;
  short_description_en: string;
  description_pl: string;
  description_en: string;
  seo_title_pl: string;
  seo_title_en: string;
  seo_description_pl: string;
  seo_description_en: string;
  selling_points: string[];
  image_urls: string[];
  price_cents?: number | null;
  currency: string;
  stock_quantity: number;
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

export function articleTitle(article: Article): string {
  return article.title_pl || article.title_en;
}

export function articleContent(article: Article): string {
  return article.content_pl || article.content_en;
}

export function productName(product: Product): string {
  return product.name_pl || product.name_en;
}

export function productShortDescription(product: Product): string {
  return product.short_description_pl || product.short_description_en;
}

export function productDescription(product: Product): string {
  return product.description_pl || product.description_en;
}

export function productPrice(product: Product): string {
  if (product.price_cents == null) return 'Cena na zapytanie';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: product.currency || 'PLN',
  }).format(product.price_cents / 100);
}
