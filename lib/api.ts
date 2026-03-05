/**
 * Centralized API client for dima-fomin.pl
 * Base URL: NEXT_PUBLIC_API_URL env var
 * Production: api.dima-fomin.pl → Koyeb via CNAME
 */

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

export const API_URL = BASE;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Normalized ingredient for display */
export type ApiIngredient = {
  slug?: string;
  name: string;
  name_en?: string;
  name_ru?: string;
  name_pl?: string;
  name_uk?: string;
  image_url?: string | null;
  category?: string;
  category_id?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  per?: string;
  allergens?: string[];
  seasons?: string[];
  description?: string | null;
};

/** GET /public/tools/convert response */
export type ApiConvertResult = {
  value: number;
  from: string;
  to: string;
  result: number;
  from_label: string;
  to_label: string;
  supported: boolean;
};

/** GET /public/tools/units response */
export type ApiUnit = {
  code: string;
  label: string;
};
export type ApiUnitsResult = {
  mass: ApiUnit[];
  volume: ApiUnit[];
  kitchen: ApiUnit[];
};

/** GET /public/tools/fish-season response */
export type ApiFishSeasonMonth = {
  month: number;
  month_name: string;
  available: boolean;
};
export type ApiFishSeasonResult = {
  fish: string;
  season: ApiFishSeasonMonth[];
};

/** GET /public/tools/nutrition response */
export type ApiNutritionResult = {
  name: string;
  amount_g: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
};

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, revalidate = 86400): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ─── Ingredients ──────────────────────────────────────────────────────────────

/** GET /public/ingredients — returns normalized list */
export async function fetchIngredients(): Promise<ApiIngredient[] | null> {
  type RawItem = {
    slug: string;
    name_en: string;
    name_ru?: string;
    name_pl?: string;
    name_uk?: string;
    image_url?: string | null;
    category_id?: string;
    calories_per_100g: number | null;
    seasons?: string[];
  };
  type RawResponse = { items: RawItem[]; total: number };

  const data = await apiFetch<RawResponse>('/public/ingredients');
  if (!data) return null;

  return data.items
    .filter((item) => item.calories_per_100g !== null)
    .map((item) => ({
      slug: item.slug,
      name: item.name_en,
      name_en: item.name_en,
      name_ru: item.name_ru,
      name_pl: item.name_pl,
      name_uk: item.name_uk,
      image_url: item.image_url,
      calories: item.calories_per_100g!,
      protein: 0, // list endpoint doesn't return macro breakdown
      fat: 0,
      carbs: 0,
      per: '100g',
      seasons: item.seasons,
    }));
}

/** GET /public/ingredients/:slug */
export async function fetchIngredient(slug: string): Promise<ApiIngredient | null> {
  type Raw = {
    slug: string;
    name_en: string;
    name_ru?: string;
    name_pl?: string;
    name_uk?: string;
    image_url?: string | null;
    calories_per_100g: number;
    allergens?: string[];
    seasons?: string[];
    description?: string | null;
  };
  const raw = await apiFetch<Raw>(`/public/ingredients/${encodeURIComponent(slug)}`);
  if (!raw) return null;
  return {
    slug: raw.slug,
    name: raw.name_en,
    name_en: raw.name_en,
    name_ru: raw.name_ru,
    name_pl: raw.name_pl,
    name_uk: raw.name_uk,
    image_url: raw.image_url,
    calories: raw.calories_per_100g,
    protein: 0,
    fat: 0,
    carbs: 0,
    per: '100g',
    allergens: raw.allergens,
    seasons: raw.seasons,
    description: raw.description,
  };
}

// ─── Tools ────────────────────────────────────────────────────────────────────

/**
 * GET /public/tools/convert
 * Supported pairs: g↔oz, kg↔lb, kg↔g, g↔mg, l↔ml, l↔fl_oz,
 *                  tsp↔ml, tbsp↔ml, cup↔ml, tbsp↔tsp, cup↔tbsp
 */
export async function fetchConvert(
  value: number,
  from: string,
  to: string,
  lang = 'en',
): Promise<ApiConvertResult | null> {
  const params = `value=${value}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&lang=${lang}`;
  return apiFetch<ApiConvertResult>(`/public/tools/convert?${params}`, 0);
}

/**
 * GET /public/tools/units?lang=en
 * Returns grouped units with localized labels: mass, volume, kitchen
 */
export async function fetchUnits(lang = 'en'): Promise<ApiUnitsResult | null> {
  return apiFetch<ApiUnitsResult>(`/public/tools/units?lang=${lang}`);
}

/**
 * GET /public/tools/fish-season?fish=salmon&lang=en
 * Known fish: salmon, tuna, cod
 * month_name is localized when lang is provided
 */
export async function fetchFishSeason(
  fish: string,
  lang = 'en',
): Promise<ApiFishSeasonResult | null> {
  return apiFetch<ApiFishSeasonResult>(
    `/public/tools/fish-season?fish=${encodeURIComponent(fish)}&lang=${lang}`,
  );
}

/**
 * GET /public/tools/nutrition?name=salmon&amount=100&lang=en
 * Response: { name, amount_g, calories, protein_g, fat_g, carbs_g }
 */
export async function fetchNutrition(
  name: string,
  amount = 100,
  lang = 'en',
): Promise<ApiNutritionResult | null> {
  const params = `name=${encodeURIComponent(name)}&amount=${amount}&lang=${lang}`;
  return apiFetch<ApiNutritionResult>(`/public/tools/nutrition?${params}`);
}
