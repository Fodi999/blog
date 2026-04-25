/**
 * ChefOS shared API types — shape mirrors backend Rust DTOs.
 *
 *   MeResponse       ← GET /api/me                  ({user, tenant})
 *   InventoryView    ← GET /api/inventory/products  (items[])
 *   Dish             ← GET /api/dishes              (items[])
 *   InventoryDashboard ← GET /api/inventory/dashboard
 *
 * Field names match Rust serde output; do not rename casually.
 */

// ── Identity ────────────────────────────────────────────────────────────────

export type ChefOSLanguage = 'pl' | 'en' | 'uk' | 'ru';

export interface ChefOSUser {
  id: string;
  tenant_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  language: string;
  created_at: string;
}

export interface ChefOSTenant {
  id: string;
  name: string;
  created_at: string;
}

export interface MeResponse {
  user: ChefOSUser;
  tenant: ChefOSTenant;
}

// ── User preferences ────────────────────────────────────────────────────────
// Mirrors `domain::user_preferences::UserPreferences` (snake_case JSON).

export type FitnessGoal =
  | 'lose_fat'
  | 'gain_muscle'
  | 'maintain_weight'
  | 'eat_healthier'
  | 'medical_diet';

export type DietType =
  | 'no_restrictions'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'paleo'
  | 'gluten_free'
  | 'dairy_free';

export type CuisineType =
  | 'any'
  | 'asian'
  | 'mediterranean'
  | 'american'
  | 'mexican'
  | 'italian'
  | 'middle_eastern';

export type CookingLevel = 'beginner' | 'home_cook' | 'advanced' | 'chef';

export type CookingTimePref = 'quick' | 'medium' | 'long' | 'any';

export interface UserPreferences {
  language?: string | null;
  age?: number | null;
  weight?: number | null;
  target_weight?: number | null;

  goal: string; // FitnessGoal slug
  calorie_target: number;
  protein_target: number;
  meals_per_day: number;

  diet: string;
  preferred_cuisine: string;

  cooking_level: string;
  cooking_time: string;

  likes: string[];
  dislikes: string[];
  allergies: string[];
  intolerances: string[];
  medical_conditions: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: null,
  age: null,
  weight: null,
  target_weight: null,
  goal: 'eat_healthier',
  calorie_target: 2200,
  protein_target: 120,
  meals_per_day: 3,
  diet: 'no_restrictions',
  preferred_cuisine: 'any',
  cooking_level: 'home_cook',
  cooking_time: 'medium',
  likes: [],
  dislikes: [],
  allergies: [],
  intolerances: [],
  medical_conditions: [],
};

export type ExpirationSeverity =
  | 'expired'
  | 'critical'
  | 'warning'
  | 'ok'
  | 'noexpiration';

export type ProductInfo = {
  id: string;
  name: string;
  category: string;
  base_unit: string;
  image_url: string | null;
  min_stock_threshold: number;
};

export type InventoryItem = {
  id: string;
  product: ProductInfo;
  quantity: number;
  remaining_quantity: number;
  price_per_unit_cents: number;
  severity: ExpirationSeverity;
  received_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type InventoryListResponse = {
  items: InventoryItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export type Dish = {
  id: string;
  name: string;
  recipe_id: string;
  selling_price_cents: number;
  active: boolean;
  image_url: string | null;
  recipe_cost_cents: number | null;
  food_cost_percent: number | null;
  profit_margin_percent: number | null;
  cost_calculated_at: string | null;
};

export type DishListResponse = {
  items: Dish[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export type InventoryDashboardResponse = {
  total_stock_value_cents: number;
  waste_30d_cents: number;
  waste_percentage: number;
  health_score: number;
  stockout_risks: Array<{
    ingredient_id: string;
    name: string;
    current_quantity: number;
    avg_daily_consumption: number;
    days_until_stockout: number;
  }>;
  expired_risks: Array<{
    ingredient_id: string;
    name: string;
    status: string;
    batch_id: string;
    remaining_quantity: number;
  }>;
};

// ── Catalog (public, anonymous) ─────────────────────────────────────────────

export type CatalogCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type CatalogIngredient = {
  id: string;
  category_id: string;
  name: string;
  default_unit: string;
  default_shelf_life_days: number | null;
  allergens: string[];
  calories_per_100g: number | null;
  seasons: string[];
  image_url: string | null;
};

export type AddInventoryRequest = {
  catalog_ingredient_id: string;
  price_per_unit_cents: number;
  quantity: number;
  received_at: string; // ISO
  expires_at: string; // ISO
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Items the user can rescue today by cooking them. */
export const AT_RISK_SEVERITIES: ReadonlySet<ExpirationSeverity> = new Set([
  'critical',
  'warning',
]);

/** Items that count toward the "at risk" headline (incl. already expired). */
export const AT_RISK_HEADLINE: ReadonlySet<ExpirationSeverity> = new Set([
  'expired',
  'critical',
  'warning',
]);
