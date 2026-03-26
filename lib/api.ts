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
export type ApiIngredientVitamins = {
  vitamin_a?: number | null; vitamin_c?: number | null; vitamin_d?: number | null;
  vitamin_e?: number | null; vitamin_k?: number | null; vitamin_b1?: number | null;
  vitamin_b2?: number | null; vitamin_b3?: number | null; vitamin_b5?: number | null;
  vitamin_b6?: number | null; vitamin_b7?: number | null; vitamin_b9?: number | null;
  vitamin_b12?: number | null;
};
export type ApiIngredientMinerals = {
  calcium?: number | null; iron?: number | null; magnesium?: number | null;
  phosphorus?: number | null; potassium?: number | null; sodium?: number | null;
  zinc?: number | null; copper?: number | null; manganese?: number | null; selenium?: number | null;
};
export type ApiIngredientDietFlags = {
  vegan?: boolean; vegetarian?: boolean; gluten_free?: boolean;
  keto?: boolean; paleo?: boolean; mediterranean?: boolean; low_carb?: boolean;
};
export type ApiIngredientPairing = {
  slug: string; name_en: string; name_ru?: string; name_pl?: string; name_uk?: string;
  image_url?: string | null; pair_score: number; flavor_score: number;
  culinary_score: number; nutrition_score: number;
};
export type ApiIngredientFoodProperties = {
  glycemic_index?: number | null; glycemic_load?: number | null;
  ph?: number | null; smoke_point?: number | null; water_activity?: number | null;
};
export type ApiIngredientMacrosFull = {
  calories_kcal?: number | null; protein_g?: number | null; fat_g?: number | null;
  carbs_g?: number | null; fiber_g?: number | null; sugar_g?: number | null;
  starch_g?: number | null; water_g?: number | null; alcohol_g?: number | null;
};
export type ApiIngredientCulinary = {
  sweetness?: number | null; acidity?: number | null; bitterness?: number | null;
  umami?: number | null; aroma?: number | null; texture?: string | null;
};

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
  product_type?: string | null;
  // Basic macros (from /public/ingredients)
  calories: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  per?: string;
  allergens?: string[];
  seasons?: string[];
  description?: string | null;
  description_pl?: string | null;
  description_ru?: string | null;
  description_uk?: string | null;
  density_g_per_ml?: number | null;
  measures?: {
    grams_per_cup?: number | null;
    grams_per_tbsp?: number | null;
    grams_per_tsp?: number | null;
  } | null;
  // Extended nutrition (from /public/nutrition/:slug)
  macros_full?: ApiIngredientMacrosFull | null;
  vitamins?: ApiIngredientVitamins | null;
  minerals?: ApiIngredientMinerals | null;
  diet_flags?: ApiIngredientDietFlags | null;
  food_properties?: ApiIngredientFoodProperties | null;
  culinary?: ApiIngredientCulinary | null;
  pairings?: ApiIngredientPairing[];
  availability_months?: boolean[] | null;
  // SEO fields
  seo_title?: string | null;
  seo_description?: string | null;
  seo_h1?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  // Timestamp for sitemap lastModified
  updated_at?: string | null;
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
  smart_result: { value: number; unit: string; label: string } | null;
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

/** GET /public/tools/fish-season-table response */
export type FishSeasonStatus = 'peak' | 'good' | 'limited' | 'off';

export type FishSeasonTableItem = {
  slug: string;
  name: string;
  name_en?: string;
  image_url: string | null;
  status: FishSeasonStatus;
  water_type: 'sea' | 'freshwater' | 'both' | null;
  wild_farmed: 'wild' | 'farmed' | 'both' | null;
  sushi_grade: boolean | null;
  season: { month: number; month_name: string; available: boolean; status: FishSeasonStatus }[];
};

export type FishSeasonTableResponse = {
  fish: FishSeasonTableItem[];
  all_year: { slug: string; name: string; image_url: string | null }[];
  note_all_year: string;
  lang: string;
  region: string;
};

/** GET /public/tools/best-right-now response */
export type BestRightNowItem = {
  slug: string;
  name: string;
  image_url: string | null;
  status: FishSeasonStatus;
  water_type: string | null;
  wild_farmed: string | null;
  sushi_grade: boolean | null;
};

export type BestRightNowResponse = {
  headline: string;
  month: number;
  month_name: string;
  peak: BestRightNowItem[];
  also_good: BestRightNowItem[];
};

/** GET /public/tools/nutrition response */
export type ApiNutritionResult = {
  name: string;
  localized_name: string;
  slug: string | null;
  image_url: string | null;
  amount_g: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  unit_label: string;
};

/** GET /public/tools/ingredient-suggestions response */
export type ApiSuggestion = {
  name: string;
  name_en: string;
  slug: string | null;
  image_url: string | null;
  density_g_per_ml: number;
  equivalent_g: number;
};

export type ApiSuggestionsResult = {
  unit: string;
  ml_per_unit: number | null;
  suggestions: ApiSuggestion[];
};

/** GET /public/tools/ingredient-equivalents response */
export type ApiEquivalent = {
  unit: string;
  label: string;
  value: number;
};

export type ApiEquivalentsResult = {
  name: string;
  input_value: number;
  input_unit: string;
  equivalents: ApiEquivalent[];
};

// ─── Core fetch helpers ───────────────────────────────────────────────────────

type FetchOpts = {
  revalidate?: number;
  tags?: string[];
};

async function apiFetch<T>(path: string, opts: FetchOpts | number = 86400): Promise<T | null> {
  const { revalidate, tags } =
    typeof opts === 'number' ? { revalidate: opts, tags: undefined } : opts;
  try {
    const res = await fetch(`${BASE}${path}`, {
      next: { revalidate, tags },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/** Fetch without Next.js cache — used for bulk parallel calls where the
 *  page-level ISR (export const revalidate) controls caching instead. */
async function apiFetchFresh<T>(path: string, tags?: string[]): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...(tags ? { next: { tags } } : { cache: 'no-store' as const }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ─── Ingredients ──────────────────────────────────────────────────────────────

/** Localized name + image for a single ingredient (lightweight) */
export type ApiIngredientMeta = {
  slug: string;
  name_en: string;
  name_pl?: string;
  name_ru?: string;
  name_uk?: string;
  image_url?: string | null;
};

/**
 * Fetch localized names + images for a list of slugs in parallel.
 * Uses the detail endpoint which has CDN images and all name_* fields.
 */
export async function fetchIngredientsMeta(
  slugs: string[],
): Promise<Record<string, ApiIngredientMeta>> {
  type Raw = {
    slug: string;
    name_en: string;
    name_pl?: string;
    name_ru?: string;
    name_uk?: string;
    image_url?: string | null;
  };

  const results = await Promise.all(
    slugs.map((slug) =>
      apiFetchFresh<Raw>(`/public/ingredients/${encodeURIComponent(slug)}`, [`ingredient-${slug}`]),
    ),
  );

  const map: Record<string, ApiIngredientMeta> = {};
  results.forEach((raw, i) => {
    if (raw) {
      map[slugs[i]] = {
        slug: raw.slug,
        name_en: raw.name_en,
        name_pl: raw.name_pl,
        name_ru: raw.name_ru,
        name_uk: raw.name_uk,
        image_url: raw.image_url,
      };
    }
  });
  return map;
}

// ─── Sitemap-specific lightweight endpoint ────────────────────────────────────

/**
 * Lightweight payload returned by GET /public/ingredients-sitemap-data.
 * Contains only the fields needed to build a quality-filtered sitemap:
 *  - has_conversions  → emit how-many pages only when true
 *  - states           → emit state pages only for states present in DB
 *  - updated_at       → real lastModified instead of BUILD_DATE
 */
export type SitemapIngredient = {
  slug: string;
  updated_at: string | null;
  image_url?: string | null;
  has_conversions: boolean;
  has_nutrition: boolean;
  states: string[];
};

/**
 * GET /public/ingredients-sitemap-data
 * Single request — returns all published ingredients with sitemap metadata only.
 * Two requests total for the whole sitemap (this + gallery).
 */
export async function fetchIngredientsSitemapData(): Promise<SitemapIngredient[]> {
  try {
    const res = await fetch(`${BASE}/public/ingredients-sitemap-data`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as SitemapIngredient[];
  } catch {
    return [];
  }
}

/** GET /public/ingredients — returns normalized list with full macros */
export async function fetchIngredients(): Promise<ApiIngredient[] | null> {
  type FullItem = {
    slug: string;
    name_en: string;
    name_ru?: string;
    name_pl?: string;
    name_uk?: string;
    image_url?: string | null;
    category_id?: string;
    category_name_en?: string;
    calories_per_100g: number | null;
    protein_per_100g: number | null;
    fat_per_100g: number | null;
    carbs_per_100g: number | null;
    seasons?: string[];
    updated_at?: string;
  };
  type FullResponse = { items: FullItem[]; total: number };

  // Single bulk query — no N+1. Returns all published ingredients with macros.
  const data = await apiFetchFresh<FullResponse>('/public/ingredients-full', ['ingredients']);
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
      category_id: item.category_id,
      category: item.category_name_en,
      calories: item.calories_per_100g!,
      protein: item.protein_per_100g ?? null,
      fat: item.fat_per_100g ?? null,
      carbs: item.carbs_per_100g ?? null,
      per: '100g',
      seasons: item.seasons,
      updated_at: item.updated_at ?? null,
    }));
}

/** GET /public/ingredients/:slug — with extended nutrition from /public/nutrition/:slug */
export async function fetchIngredient(slug: string): Promise<ApiIngredient | null> {
  type Raw = {
    slug: string;
    name_en: string;
    name_ru?: string;
    name_pl?: string;
    name_uk?: string;
    image_url?: string | null;
    description?: string | null;
    description_en?: string | null;
    description_pl?: string | null;
    description_ru?: string | null;
    description_uk?: string | null;
    allergens?: string[];
    localized_allergens?: string[];
    seasons?: string[];
    localized_seasons?: string[];
    density_g_per_ml?: number | null;
    measures?: {
      grams_per_cup?: number | null;
      grams_per_tbsp?: number | null;
      grams_per_tsp?: number | null;
    } | null;
    nutrition?: {
      calories_per_100g: number;
      protein_per_100g: number;
      fat_per_100g: number;
      carbs_per_100g: number;
    } | null;
    seo_title?: string | null;
    seo_description?: string | null;
    seo_h1?: string | null;
    canonical_url?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: string | null;
  };
  type NutritionRaw = {
    slug: string;
    basic?: { product_type?: string | null; typical_portion_g?: number | null; wild_farmed?: string | null; water_type?: string | null; sushi_grade?: boolean | null } | null;
    macros?: ApiIngredientMacrosFull | null;
    vitamins?: ApiIngredientVitamins | null;
    minerals?: ApiIngredientMinerals | null;
    diet_flags?: ApiIngredientDietFlags | null;
    food_properties?: ApiIngredientFoodProperties | null;
    culinary?: ApiIngredientCulinary | null;
    pairings?: ApiIngredientPairing[];
    availability_months?: boolean[] | null;
  };

  const [raw, nutr] = await Promise.all([
    apiFetchFresh<Raw>(`/public/ingredients/${encodeURIComponent(slug)}`, [`ingredient-${slug}`]),
    apiFetchFresh<NutritionRaw>(`/public/nutrition/${encodeURIComponent(slug)}`, [`ingredient-${slug}`]).catch(() => null),
  ]);
  if (!raw) return null;
  return {
    slug: raw.slug,
    name: raw.name_en,
    name_en: raw.name_en,
    name_ru: raw.name_ru,
    name_pl: raw.name_pl,
    name_uk: raw.name_uk,
    image_url: raw.image_url,
    product_type: nutr?.basic?.product_type ?? null,
    calories: raw.nutrition?.calories_per_100g ?? 0,
    protein: raw.nutrition?.protein_per_100g ?? null,
    fat: raw.nutrition?.fat_per_100g ?? null,
    carbs: raw.nutrition?.carbs_per_100g ?? null,
    per: '100g',
    allergens: raw.localized_allergens ?? raw.allergens,
    seasons: raw.localized_seasons ?? raw.seasons,
    description: raw.description_en ?? raw.description,
    description_pl: raw.description_pl,
    description_ru: raw.description_ru,
    description_uk: raw.description_uk,
    density_g_per_ml: raw.density_g_per_ml,
    measures: raw.measures,
    // Extended nutrition
    macros_full: nutr?.macros ?? null,
    vitamins: nutr?.vitamins ?? null,
    minerals: nutr?.minerals ?? null,
    diet_flags: nutr?.diet_flags ?? null,
    food_properties: nutr?.food_properties ?? null,
    culinary: nutr?.culinary ?? null,
    pairings: nutr?.pairings ?? [],
    availability_months: nutr?.availability_months ?? null,
    // SEO
    seo_title: raw.seo_title ?? null,
    seo_description: raw.seo_description ?? null,
    seo_h1: raw.seo_h1 ?? null,
    canonical_url: raw.canonical_url ?? null,
    og_title: raw.og_title ?? null,
    og_description: raw.og_description ?? null,
    og_image: raw.og_image ?? null,
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
 * GET /public/tools/fish-season-table?lang=en&region=PL
 * Returns full season table with status, water_type, wild_farmed, sushi_grade per fish.
 */
export async function fetchFishSeasonTable(
  lang = 'en',
  region = 'PL',
): Promise<FishSeasonTableResponse | null> {
  return apiFetchFresh<FishSeasonTableResponse>(
    `/public/tools/fish-season-table?lang=${encodeURIComponent(lang)}&region=${encodeURIComponent(region)}`,
  );
}

/**
 * GET /public/tools/best-right-now?type=seafood&lang=en&region=PL
 * Returns the best fish/seafood to eat right now this month.
 */
export async function fetchBestRightNow(
  type = 'seafood',
  lang = 'en',
  region = 'PL',
): Promise<BestRightNowResponse | null> {
  return apiFetchFresh<BestRightNowResponse>(
    `/public/tools/best-right-now?type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}&region=${encodeURIComponent(region)}`,
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
  unit = 'g',
): Promise<ApiNutritionResult | null> {
  const params = `name=${encodeURIComponent(name)}&amount=${amount}&unit=${encodeURIComponent(unit)}&lang=${lang}`;
  return apiFetch<ApiNutritionResult>(`/public/tools/nutrition?${params}`);
}

// ─── Popular Conversions ──────────────────────────────────────────────────────

export type ApiPopularConversion = {
  value: number;
  from_unit: string;
  from_label: string;
  to_unit: string;
  to_label: string;
  result: number;
  ingredient: string | null;
  localized_name: string | null;
  slug: string | null;
  image_url: string | null;
};

export type ApiPopularConversionsResult = {
  conversions: ApiPopularConversion[];
};

/**
 * GET /public/tools/popular-conversions?lang=en
 * Returns curated popular cooking conversions for SEO pages.
 */
export async function fetchPopularConversions(
  lang = 'en',
): Promise<ApiPopularConversionsResult | null> {
  return apiFetch<ApiPopularConversionsResult>(
    `/public/tools/popular-conversions?lang=${lang}`,
    3600, // ISR 1 hour
  );
}

// ─── Ingredient Scale ─────────────────────────────────────────────────────────

export type ApiIngredientScaleResult = {
  ingredient: string | null;
  original_value: number;
  unit: string;
  from_portions: number;
  to_portions: number;
  scaled_value: number;
  smart_result: { value: number; unit: string; label: string } | null;
};

/**
 * GET /public/tools/ingredient-scale
 * Scales an ingredient between portion sizes.
 */
export async function fetchIngredientScale(params: {
  ingredient: string;
  value: number;
  unit: string;
  from_portions: number;
  to_portions: number;
  lang: string;
}): Promise<ApiIngredientScaleResult | null> {
  const qs = new URLSearchParams({
    ingredient: params.ingredient,
    value: String(params.value),
    unit: params.unit,
    from_portions: String(params.from_portions),
    to_portions: String(params.to_portions),
    lang: params.lang,
  }).toString();
  return apiFetch<ApiIngredientScaleResult>(
    `/public/tools/ingredient-scale?${qs}`,
    0, // no cache — dynamic
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────

// ─── Ingredient Suggestions ───────────────────────────────────────────────────

/**
 * GET /public/tools/ingredient-suggestions?unit=cup&lang=en
 * Returns ingredients with density-based gram equivalents for a given unit.
 */
export async function fetchSuggestions(
  unit: string,
  lang = 'en',
): Promise<ApiSuggestionsResult | null> {
  return apiFetch<ApiSuggestionsResult>(
    `/public/tools/ingredient-suggestions?unit=${encodeURIComponent(unit)}&lang=${lang}`,
    3600,
  );
}

// ─── Ingredient Equivalents ───────────────────────────────────────────────────

/**
 * GET /public/tools/ingredient-equivalents?name=flour&value=1&unit=cup&lang=en
 * Converts an ingredient to all supported units via density.
 */
export async function fetchEquivalents(
  name: string,
  value: number,
  unit: string,
  lang = 'en',
): Promise<ApiEquivalentsResult | null> {
  const params = `name=${encodeURIComponent(name)}&value=${value}&unit=${encodeURIComponent(unit)}&lang=${lang}`;
  return apiFetch<ApiEquivalentsResult>(
    `/public/tools/ingredient-equivalents?${params}`,
    0,
  );
}

// ─── Scale (simple number scaling) ────────────────────────────────────────────

export type ApiScaleResult = {
  original: number;
  from_portions: number;
  to_portions: number;
  result: number;
};

/**
 * GET /public/tools/scale?value=100&from_portions=2&to_portions=4
 * Simple proportional scaling without ingredient context.
 */
export async function fetchScale(
  value: number,
  fromPortions: number,
  toPortions: number,
): Promise<ApiScaleResult | null> {
  const qs = `value=${value}&from_portions=${fromPortions}&to_portions=${toPortions}`;
  return apiFetch<ApiScaleResult>(`/public/tools/scale?${qs}`, 0);
}

// ─── Yield ────────────────────────────────────────────────────────────────────

export type ApiYieldResult = {
  raw: number;
  usable: number;
  yield_percent: number;
  waste_percent: number;
};

/**
 * GET /public/tools/yield?ingredient=potato&raw_weight=1000&lang=en
 * Calculates usable weight after peeling / trimming.
 */
export async function fetchYield(
  ingredient: string,
  rawWeight: number,
  lang = 'en',
): Promise<ApiYieldResult | null> {
  const qs = `ingredient=${encodeURIComponent(ingredient)}&raw_weight=${rawWeight}&lang=${lang}`;
  return apiFetch<ApiYieldResult>(`/public/tools/yield?${qs}`, 0);
}

// ─── Food Cost ────────────────────────────────────────────────────────────────

export type ApiFoodCostResult = {
  price: number;
  price_unit: string;
  amount: number;
  unit: string;
  total_cost: number;
  cost_per_portion: number | null;
  sell_price: number | null;
  margin_percent: number | null;
  markup_percent: number | null;
};

/**
 * GET /public/tools/food-cost?price=10&price_unit=kg&amount=500&unit=g&portions=4&sell_price=25
 * Calculates food cost, per-portion cost, margin and markup.
 */
export async function fetchFoodCost(params: {
  price: number;
  price_unit: string;
  amount: number;
  unit: string;
  portions?: number;
  sell_price?: number;
}): Promise<ApiFoodCostResult | null> {
  const qs = new URLSearchParams({
    price: String(params.price),
    price_unit: params.price_unit,
    amount: String(params.amount),
    unit: params.unit,
    ...(params.portions != null && { portions: String(params.portions) }),
    ...(params.sell_price != null && { sell_price: String(params.sell_price) }),
  }).toString();
  return apiFetch<ApiFoodCostResult>(`/public/tools/food-cost?${qs}`, 0);
}

// ─── Categories (original) ────────────────────────────────────────────────────

export type ApiCategory = {
  id: string;
  path: string;
  description: string;
};

export type ApiCategoriesResult = {
  tools: ApiCategory[];
};

/**
 * GET /public/tools/categories
 * Returns the list of all available tool endpoints.
 */
export async function fetchCategories(): Promise<ApiCategoriesResult | null> {
  return apiFetch<ApiCategoriesResult>('/public/tools/categories', 86400);
}

// ─── Ingredient Analyzer ──────────────────────────────────────────────────────

/** Full ingredient data from /public/tools/ingredients?search= */
export type AnalyzerIngredient = {
  slug: string;
  name: string;
  product_type: string;
  image_url: string | null;
  water_type: string | null;
  wild_farmed: string | null;
  sushi_grade: boolean | null;
  typical_portion_g: number | null;
  per_100g: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    salt_g: number;
    sodium_mg: number;
  };
  macros_ratio: {
    protein_pct: number;
    fat_pct: number;
    carbs_pct: number;
  };
  nutrition_score: number | null;
  vitamins: {
    vitamin_b12_mcg?: number | null;
    vitamin_d_mcg?: number | null;
    iron_mg?: number | null;
    magnesium_mg?: number | null;
  } | null;
};

export type AnalyzerSearchResponse = {
  total: number;
  items: AnalyzerIngredient[];
};

/** Full nutrition response from /public/tools/nutrition (richer than ApiNutritionResult) */
export type AnalyzerNutrition = {
  slug: string;
  name: string;
  product_type: string;
  image_url: string | null;
  water_type: string | null;
  wild_farmed: string | null;
  sushi_grade: boolean | null;
  amount_g: number;
  typical_portion_g: number | null;
  per_100g: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    salt_g: number;
    sodium_mg: number;
  };
  for_amount: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    salt_g: number;
    sodium_mg: number;
  };
  macros_ratio: {
    protein_pct: number;
    fat_pct: number;
    carbs_pct: number;
  };
  nutrition_score: number | null;
  vitamins: {
    vitamin_b12_mcg?: number | null;
    vitamin_d_mcg?: number | null;
    iron_mg?: number | null;
    magnesium_mg?: number | null;
  } | null;
  found_in_db: boolean;
};

export type CompareWinner = {
  calories_lower: 'food1' | 'food2' | 'tie';
  protein_higher: 'food1' | 'food2' | 'tie';
  fat_lower: 'food1' | 'food2' | 'tie';
  carbs_lower: 'food1' | 'food2' | 'tie';
  fiber_higher: 'food1' | 'food2' | 'tie';
  nutrition_score: 'food1' | 'food2' | 'tie';
};

export type AnalyzerCompareResponse = {
  food1: AnalyzerNutrition & { query: string };
  food2: AnalyzerNutrition & { query: string };
  winner: CompareWinner;
};

/**
 * GET /public/tools/ingredients?search=&lang=en
 * Full-featured ingredient search with nutrition, macros, vitamins.
 */
export async function fetchIngredientSearch(
  search: string,
  lang = 'en',
): Promise<AnalyzerSearchResponse | null> {
  return apiFetchFresh<AnalyzerSearchResponse>(
    `/public/tools/ingredients?search=${encodeURIComponent(search)}&lang=${encodeURIComponent(lang)}`,
  );
}

/**
 * GET /public/tools/nutrition?name=salmon&amount=150&lang=en
 * Full nutrition for a given amount (richer response than ApiNutritionResult).
 */
export async function fetchAnalyzerNutrition(
  name: string,
  amount = 100,
  lang = 'en',
): Promise<AnalyzerNutrition | null> {
  return apiFetchFresh<AnalyzerNutrition>(
    `/public/tools/nutrition?name=${encodeURIComponent(name)}&amount=${amount}&lang=${encodeURIComponent(lang)}`,
  );
}

/**
 * GET /public/tools/compare?food1=salmon&food2=tuna&lang=en
 */
export async function fetchCompare(
  food1: string,
  food2: string,
  lang = 'en',
): Promise<AnalyzerCompareResponse | null> {
  return apiFetchFresh<AnalyzerCompareResponse>(
    `/public/tools/compare?food1=${encodeURIComponent(food1)}&food2=${encodeURIComponent(food2)}&lang=${encodeURIComponent(lang)}`,
  );
}

/**
 * GET /public/tools/product-seasonality?slug=salmon&lang=en&region=PL
 */
export async function fetchProductSeasonality(
  slug: string,
  lang = 'en',
  region = 'PL',
): Promise<Record<string, unknown> | null> {
  return apiFetchFresh<Record<string, unknown>>(
    `/public/tools/product-seasonality?slug=${encodeURIComponent(slug)}&lang=${encodeURIComponent(lang)}&region=${encodeURIComponent(region)}`,
  );
}


// ─── Ingredient States ─────────────────────────────────────────────────────

export type ApiIngredientStateNutrition = {
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  carbs_per_100g: number | null;
  fiber_per_100g: number | null;
  water_percent: number | null;
};

export type ApiIngredientStateCooking = {
  weight_change_percent: number | null;
  water_loss_percent: number | null;
  oil_absorption_g: number | null;
};

export type ApiIngredientStateStorage = {
  shelf_life_hours: number | null;
  storage_temp_c: number | null;
  texture: string | null;
};

/** Single state from GET /public/ingredients/:slug/states/:state */
export type ApiIngredientStateSingle = {
  slug: string;
  ingredient_id: string;
  state: string;
  state_type: string;
  cooking_method: string | null;
  glycemic_index: number | null;
  data_score: number | null;
  name_en: string;
  name_ru?: string;
  name_pl?: string;
  name_uk?: string;
  name_suffix_en: string;
  name_suffix_ru?: string;
  name_suffix_pl?: string;
  name_suffix_uk?: string;
  image_url: string | null;
  nutrition: ApiIngredientStateNutrition;
  cooking: ApiIngredientStateCooking;
  storage: ApiIngredientStateStorage;
  notes_en?: string | null;
  notes_ru?: string | null;
  notes_pl?: string | null;
  notes_uk?: string | null;
};

/** Summary state from the list endpoint */
export type ApiIngredientStateListItem = {
  state: string;
  state_type: string;
  cooking_method: string | null;
  glycemic_index: number | null;
  name_suffix_en: string;
  name_suffix_ru?: string;
  name_suffix_pl?: string;
  name_suffix_uk?: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  carbs_per_100g: number | null;
  fiber_per_100g: number | null;
  water_percent: number | null;
  texture: string | null;
  weight_change_percent: number | null;
  water_loss_percent: number | null;
  oil_absorption_g: number | null;
  shelf_life_hours: number | null;
  storage_temp_c: number | null;
  data_score: number | null;
  notes_en?: string | null;
  notes_ru?: string | null;
  notes_pl?: string | null;
  notes_uk?: string | null;
};

export type ApiIngredientStatesResponse = {
  slug: string;
  ingredient_id: string;
  name_en: string;
  name_ru?: string;
  name_pl?: string;
  name_uk?: string;
  image_url: string | null;
  states: ApiIngredientStateListItem[];
};

/** GET /public/ingredients/:slug/states — list all states */
export async function fetchIngredientStates(slug: string): Promise<ApiIngredientStatesResponse | null> {
  return apiFetchFresh<ApiIngredientStatesResponse>(
    "/public/ingredients/" + encodeURIComponent(slug) + "/states",
    [`ingredient-${slug}`],
  );
}

/** GET /public/ingredients/:slug/states/:state — single state detail */
export async function fetchIngredientStateSingle(slug: string, state: string): Promise<ApiIngredientStateSingle | null> {
  return apiFetchFresh<ApiIngredientStateSingle>(
    "/public/ingredients/" + encodeURIComponent(slug) + "/states/" + encodeURIComponent(state),
    [`ingredient-${slug}`],
  );
}

/**
 * GET /public/ingredients-states-map
 *
 * Returns { slug: [state, ...] } for all active ingredients that have states in DB.
 * Used by sitemap.ts to emit ONLY state URLs that actually exist — avoids 404s
 * for ingredients where states haven't been generated yet.
 * Single round-trip instead of N+1 per ingredient.
 */
export async function fetchIngredientsStatesMap(): Promise<Record<string, string[]> | null> {
  return apiFetchFresh<Record<string, string[]>>(
    "/public/ingredients-states-map",
    ["ingredients-states-map"],
  );
}

// ─── Recipe Analysis (POST) ──────────────────────────────────────────────

export type RecipeAnalysisNutrition = {
  calories: number; protein: number; fat: number;
  carbs: number; fiber: number; sugar: number;
};

export type RecipeAnalysisFlavor = {
  sweetness: number; acidity: number; bitterness: number;
  umami: number; fat: number; aroma: number;
  balance_score: number; weak: string[]; strong: string[];
};

export type RecipeAnalysisSuggestion = {
  slug: string; name: string; name_en?: string; name_ru?: string;
  name_pl?: string; name_uk?: string; image_url?: string;
  score: number; reasons: string[]; fills: string[];
};

export type RecipeAnalysisIngredient = {
  slug: string; name: string; name_en?: string; name_ru?: string;
  name_pl?: string; name_uk?: string; image_url?: string;
  grams: number; calories: number; protein: number; fat: number;
  carbs: number; fiber: number; sugar: number;
  product_type?: string; found: boolean;
};

export type RecipeAnalysisFlavorContribution = {
  slug: string;
  sweetness: number; acidity: number; bitterness: number;
  umami: number; fat: number; aroma: number;
  pct_sweetness: number; pct_acidity: number; pct_bitterness: number;
  pct_umami: number; pct_fat: number; pct_aroma: number;
};

export type RecipeAnalysisIssue = {
  category: string; severity: string; rule: string;
  title_key: string; description_key: string;
  fix_slugs: string[]; fix_keys: string[];
  value?: number; threshold?: number; impact?: number;
};

export type RecipeAnalysisCategoryScores = {
  flavor: number; nutrition: number;
  dominance: number; structure: number;
};

export type RecipeAnalysisDiagnosis = {
  health_score: number;
  issues: RecipeAnalysisIssue[];
  category_scores: RecipeAnalysisCategoryScores;
  critical_count: number; warning_count: number; info_count: number;
};

export type RecipeAnalysisResponse = {
  nutrition: RecipeAnalysisNutrition;
  per_portion?: RecipeAnalysisNutrition;
  portions: number;
  macros: { protein_pct: number; fat_pct: number; carbs_pct: number };
  score: number;
  flavor: RecipeAnalysisFlavor;
  diet: string[];
  suggestions: RecipeAnalysisSuggestion[];
  ingredients: RecipeAnalysisIngredient[];
  flavor_contributions?: RecipeAnalysisFlavorContribution[];
  diagnosis?: RecipeAnalysisDiagnosis;
};

/** POST /public/tools/recipe-analyze — full recipe analysis */
export async function fetchRecipeAnalysis(
  ingredients: { slug: string; grams: number }[],
  portions: number,
  lang = 'en',
): Promise<RecipeAnalysisResponse | null> {
  try {
    const res = await fetch(`${BASE}/public/tools/recipe-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, portions, lang }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Diet Pages ───────────────────────────────────────────────────────────────

export type DietProduct = {
  slug: string;
  name_en: string | null;
  name_ru: string | null;
  name_pl: string | null;
  name_uk: string | null;
  product_type: string | null;
  image_url: string | null;
  calories_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
};

export type DietPageResponse = {
  lang: string;
  flag: string;
  total: number;
  products: DietProduct[];
};

/**
 * GET /public/diet/:flag?lang=en&limit=200
 * Returns all products matching a diet flag.
 */
export async function fetchDietPage(
  flag: string,
  lang = 'en',
  limit = 200,
): Promise<DietPageResponse | null> {
  return apiFetchFresh<DietPageResponse>(
    `/public/diet/${encodeURIComponent(flag)}?lang=${encodeURIComponent(lang)}&limit=${limit}`,
    ['ingredients'],
  );
}

// ─── Ranking Pages ────────────────────────────────────────────────────────────

export type RankingProduct = {
  rank: number | null;
  slug: string;
  name_en: string | null;
  name_ru: string | null;
  name_pl: string | null;
  name_uk: string | null;
  product_type: string | null;
  image_url: string | null;
  metric_value: number | null;
};

export type RankingPageResponse = {
  lang: string;
  metric: string;
  metric_label_en: string;
  unit: string;
  order: string;
  total: number;
  products: RankingProduct[];
};

/**
 * GET /public/ranking/:metric?lang=en&limit=50
 * Returns ranked products by a nutritional metric.
 */
export async function fetchRankingPage(
  metric: string,
  lang = 'en',
  limit = 50,
): Promise<RankingPageResponse | null> {
  return apiFetchFresh<RankingPageResponse>(
    `/public/ranking/${encodeURIComponent(metric)}?lang=${encodeURIComponent(lang)}&limit=${limit}`,
    ['ingredients'],
  );
}

// ─── Intent Pages Sitemap ─────────────────────────────────────────────────────

/** Lightweight sitemap entry from GET /public/intent-pages/sitemap */
export type IntentPageSitemapEntry = {
  slug: string;
  locale: string;
  published_at: string | null;
  intent_type: string;
};

/**
 * GET /public/intent-pages/sitemap
 * Single lightweight request — returns all published intent pages for sitemap.
 */
export async function fetchIntentPagesSitemap(): Promise<IntentPageSitemapEntry[]> {
  try {
    const res = await fetch(`${BASE}/public/intent-pages/sitemap`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as IntentPageSitemapEntry[];
  } catch {
    return [];
  }
}

// ─── Intent Pages (pSEO) ─────────────────────────────────────────────────────

export type IntentPageFaq = { question: string; answer: string };

export type ContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'text'; content: string }
  | { type: 'image'; key: string; alt: string; src?: string };

export type IntentPage = {
  id: string;
  intent_type: string;
  entity_a: string;
  entity_b: string | null;
  locale: string;
  title: string;
  description: string;
  answer: string;
  faq: IntentPageFaq[];
  content_blocks: ContentBlock[];
  slug: string;
  status: string;
  published_at: string | null;
  updated_at: string;
};

/**
 * GET /public/intent-pages/:slug?locale=en
 * Returns a single published intent page by slug.
 */
export async function fetchIntentPage(
  slug: string,
  locale: string,
): Promise<IntentPage | null> {
  // API returns faq as [{q, a}], but our type expects [{question, answer}]
  type RawFaq = { q?: string; a?: string; question?: string; answer?: string };
  type RawPage = Omit<IntentPage, 'faq'> & { faq: RawFaq[] };
  const raw = await apiFetchFresh<RawPage>(
    `/public/intent-pages/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
    ['intent-pages'],
  );
  if (!raw) return null;
  return {
    ...raw,
    faq: (raw.faq || []).map((f) => ({
      question: f.question || f.q || '',
      answer: f.answer || f.a || '',
    })),
  };
}

// ─── Related Intent Pages (internal linking) ────────────────────────────────

export type RelatedIntentPage = {
  title: string;
  slug: string;
  intent_type: string;
  entity_a: string;
};

/**
 * GET /public/ingredients/:slug/intent-pages?locale=en
 * Returns all published intent pages for an ingredient (hub page).
 */
export async function fetchIngredientIntentPages(
  ingredientSlug: string,
  locale: string,
): Promise<RelatedIntentPage[]> {
  const pages = await apiFetchFresh<RelatedIntentPage[]>(
    `/public/ingredients/${encodeURIComponent(ingredientSlug)}/intent-pages?locale=${encodeURIComponent(locale)}`,
    ['intent-pages-hub'],
  );
  return pages ?? [];
}

/**
 * GET /public/intent-pages/:slug/related?locale=en
 * Returns up to 8 related published intent pages for internal linking.
 */
export async function fetchRelatedPages(
  slug: string,
  locale: string,
): Promise<RelatedIntentPage[]> {
  const pages = await apiFetchFresh<RelatedIntentPage[]>(
    `/public/intent-pages/${encodeURIComponent(slug)}/related?locale=${encodeURIComponent(locale)}`,
    ['intent-pages-related'],
  );
  return pages ?? [];
}

// ─── Lab Combo SEO Pages ──────────────────────────────────────────────────────

/** Full lab combo page from GET /public/lab-combos/:slug */
export type LabComboPage = {
  id: string;
  slug: string;
  locale: string;
  ingredients: string[];
  goal: string | null;
  meal_type: string | null;
  diet: string | null;
  cooking_time: string | null;
  budget: string | null;
  cuisine: string | null;
  title: string;
  description: string;
  h1: string;
  intro: string;
  smart_response: Record<string, unknown>;
  faq: { question: string; answer: string }[];
  status: string;
  quality_score: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Lightweight sitemap entry from GET /public/lab-combos/sitemap */
export type LabComboSitemapEntry = {
  slug: string;
  locale: string;
  updated_at: string;
  ingredients: string[];
  goal: string | null;
  meal_type: string | null;
};

/**
 * GET /public/lab-combos/sitemap
 * Lightweight list of all published combo pages for sitemap generation.
 */
export async function fetchLabCombosSitemap(): Promise<LabComboSitemapEntry[]> {
  try {
    const res = await fetch(`${BASE}/public/lab-combos/sitemap`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as LabComboSitemapEntry[];
  } catch {
    return [];
  }
}

/**
 * GET /public/lab-combos/:slug?locale=en
 * Full published combo page with SmartResponse + SEO metadata.
 */
export async function fetchLabCombo(
  slug: string,
  locale: string,
): Promise<LabComboPage | null> {
  try {
    const res = await fetch(
      `${BASE}/public/lab-combos/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 86400 } }, // 24h ISR
    );
    if (!res.ok) return null;
    return (await res.json()) as LabComboPage;
  } catch {
    return null;
  }
}