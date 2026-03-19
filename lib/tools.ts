/**
 * Culinary Intelligence — unified API client
 * All endpoints: /public/tools/*
 *
 * Two layers:
 *  1. Direct typed functions (fetchNutrition, searchProducts, …)
 *  2. Generic runTool / getToolCatalog for dynamic usage
 */

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

/* ─── Generic Tool Layer ─────────────────────────────────────── */

export type ToolParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type ToolDef = {
  id: string;
  engine: string;
  method: string;
  path: string;
  full_path: string;
  description: string;
  cache_ttl: number;
  parameters: ToolParam[];
};

export type EngineDef = {
  engine: string;
  description: string;
  tool_count: number;
};

export type CatalogResponse = {
  engines: EngineDef[];
  tools: ToolDef[];
  total: number;
};

/** Fetch the full tool catalog from backend */
export async function getToolCatalog(lang?: string): Promise<CatalogResponse | null> {
  const url = new URL(`${BASE}/public/tools/catalog`);
  if (lang) url.searchParams.set('lang', lang);
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Run any tool by ID. Resolves method (GET/POST) automatically.
 * For GET tools, params become query-string.
 * For POST tools, params become JSON body.
 */
export async function runTool<T = unknown>(
  toolId: string,
  params: Record<string, unknown> = {},
  catalog?: CatalogResponse | null,
): Promise<T | null> {
  try {
    // find tool definition in catalog (optionally provided to avoid re-fetch)
    let tool: ToolDef | undefined;
    if (catalog) {
      tool = catalog.tools.find((t) => t.id === toolId);
    } else {
      const cat = await getToolCatalog();
      tool = cat?.tools.find((t) => t.id === toolId);
    }
    if (!tool) return null;

    if (tool.method === 'POST') {
      const res = await fetch(`${BASE}${tool.full_path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      return res.json();
    }

    // GET
    const url = new URL(`${BASE}${tool.full_path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString(), { next: { revalidate: tool.cache_ttl || 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── Types ──────────────────────────────────────────────────── */

export type SeasonItem = {
  slug: string;
  name: string;
  image_url: string | null;
  status: 'peak' | 'good' | 'off' | 'avoid';
  water_type: string | null;
  wild_farmed: string | null;
  sushi_grade: boolean;
};

export type BestInSeasonResponse = {
  product_type: string;
  month: number;
  lang: string;
  region: string;
  items: SeasonItem[];
};

export type NutritionResult = {
  slug: string;
  name: string;
  product_type: string;
  image_url: string | null;
  water_type: string | null;
  sushi_grade: boolean;
  per_100g: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  };
  macros_ratio: {
    protein_pct: number;
    fat_pct: number;
    carbs_pct: number;
  };
  nutrition_score: number;
  vitamins: Record<string, number | null>;
};

export type SearchResult = {
  slug: string;
  name: string;
  name_en: string;
  product_type: string;
  image_url: string | null;
};

export type ConvertResult = {
  value: number;
  from: string;
  to: string;
  result: number;
  from_label: string;
  to_label: string;
  supported: boolean;
};

export type SeasonMonth = {
  month: number;
  month_name: string;
  status: string;
  available: boolean;
  note: string | null;
};

export type ProductSeasonality = {
  slug: string;
  name: string;
  product_type: string;
  image_url: string | null;
  season: SeasonMonth[];
};

export type IngredientListItem = {
  slug: string;
  name: string;
  name_en: string;
  product_type: string;
  image_url: string | null;
  per_100g: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  };
  nutrition_score: number;
};

export type IngredientsResponse = {
  total: number;
  limit: number;
  offset: number;
  items: IngredientListItem[];
};

/* ─── Fetch helpers ──────────────────────────────────────────── */

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const url = new URL(`${BASE}/public/tools${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/public/tools${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── Public API ─────────────────────────────────────────────── */

export async function fetchBestInSeason(lang: string): Promise<BestInSeasonResponse | null> {
  return get('/best-in-season', { lang });
}

export async function fetchNutrition(slug: string, lang: string): Promise<NutritionResult | null> {
  return get('/nutrition', { slug, lang });
}

export async function searchProducts(q: string, lang: string, limit = 8): Promise<SearchResult[]> {
  const data = await get<{ results: SearchResult[] }>('/product-search', { q, lang, limit });
  return data?.results ?? [];
}

export async function fetchSeasonality(slug: string, lang: string): Promise<ProductSeasonality | null> {
  return get('/product-seasonality', { slug, lang });
}

export async function convertUnits(
  value: number, from: string, to: string, lang: string, slug?: string,
): Promise<ConvertResult | null> {
  const params: Record<string, string | number> = { value, from, to, lang };
  if (slug) params.slug = slug;
  return get('/convert', params);
}

export async function fetchIngredientsList(
  lang: string, limit = 12, offset = 0, search?: string, productType?: string,
): Promise<IngredientsResponse | null> {
  const params: Record<string, string | number> = { lang, limit, offset };
  if (search) params.q = search;
  if (productType) params.product_type = productType;
  return get('/ingredients', params);
}

export async function analyzeRecipe(
  ingredients: { slug: string; grams: number }[],
  portions: number,
  lang: string,
): Promise<any | null> {
  return post('/recipe-analyze', { ingredients, portions, lang });
}

/* ─── New endpoints (Catalog-driven) ────────────────────────── */

export type CompareResult = {
  a: NutritionResult;
  b: NutritionResult;
  winner: {
    calories: string;
    protein: string;
    fat: string;
    carbs: string;
  };
};

export type EquivalentRow = {
  unit: string;
  label: string;
  value: number;
};

export type EquivalentsResult = {
  slug: string;
  name: string;
  equivalents: EquivalentRow[];
};

/** Compare nutrition of two ingredients side-by-side */
export async function compareNutrition(a: string, b: string, lang: string): Promise<CompareResult | null> {
  return get('/compare', { a, b, lang });
}

/** All unit equivalents for an ingredient via density */
export async function fetchEquivalents(slug: string, lang: string): Promise<EquivalentsResult | null> {
  return get('/ingredient-equivalents', { ingredient: slug, lang });
}

/** Best products in season right now (SEO powerhouse) */
export async function fetchBestRightNow(
  lang: string, type?: string, limit = 12,
): Promise<BestInSeasonResponse | null> {
  const params: Record<string, string | number> = { lang, limit };
  if (type) params.type = type;
  return get('/best-right-now', params);
}

/* ─── Recipe Analyze types (for inline pairing + lab) ───────── */

export type FlavorProfile = {
  sweetness: number;
  acidity: number;
  bitterness: number;
  umami: number;
  fat: number;
  aroma: number;
  balance_score: number;
  weak: string[];
  strong: string[];
};

export type PairingSuggestion = {
  slug: string;
  name: string;
  name_en: string;
  name_ru?: string;
  name_pl?: string;
  name_uk?: string;
  image_url: string | null;
  score: number;
  reasons: string[];
  fills: string[];
};

export type RecipeAnalysisResult = {
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sugar: number;
  };
  per_portion: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sugar: number;
  };
  portions: number;
  macros: { protein_pct: number; fat_pct: number; carbs_pct: number };
  score: number;
  flavor: FlavorProfile;
  diet: Record<string, boolean>;
  suggestions: PairingSuggestion[];
  ingredients: Array<{ slug: string; name: string; grams: number; found: boolean }>;
  diagnosis: { score: number; issues: Array<{ title_key: string; description_key: string; severity: string }> };
};

/**
 * Analyze a single ingredient (or recipe) for flavor + pairings.
 * Uses recipe-analyze POST with a single ingredient at 100g.
 */
export async function analyzeForPairing(
  slug: string,
  lang: string,
  grams = 100,
  cookingState?: string,
): Promise<RecipeAnalysisResult | null> {
  const ingredient: Record<string, unknown> = { slug, grams };
  if (cookingState && cookingState !== 'raw') ingredient.state = cookingState;
  return post('/recipe-analyze', {
    ingredients: [ingredient],
    portions: 1,
    lang,
  });
}
